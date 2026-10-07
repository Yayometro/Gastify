import { describe, it, expect, vi, beforeEach } from "vitest";

const created = vi.hoisted(() => ({ last: null as null | Record<string, unknown> }));

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Transaction", () => {
  function TransactionMock(this: Record<string, unknown>, args: Record<string, unknown>) {
    Object.assign(this, args);
    this.tags = [];
    this._id = "t1";
    this.save = async () => {
      created.last = { ...this };
      return this;
    };
  }
  const chain = { populate: () => chain, lean: async () => ({ _id: "t1", name: "x" }) };
  (TransactionMock as unknown as { findById: () => typeof chain }).findById = () => chain;
  return { default: TransactionMock };
});
const tagCalls = vi.hoisted(() => ({ created: [] as string[] }));
vi.mock("@/model/Tag", () => ({
  default: Object.assign(
    function TagMock(this: Record<string, unknown>, args: { name: string }) {
      this._id = `tag-${args.name}`;
      tagCalls.created.push(args.name);
      this.save = async () => this;
    },
    { findOne: async () => null }
  ),
}));
vi.mock("@/model/SubCategory", () => ({ default: {} }));
vi.mock("@/model/Category", () => ({ default: {} }));
vi.mock("@/model/Account", () => ({ default: {} }));
vi.mock("@/model/Budget", () => ({ default: {} }));
vi.mock("@/model/Wallet", () => ({ default: { findById: () => ({ lean: async () => ({ _id: "w1", primaryCurrency: "MXN" }) }) } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn(async () => ({})) }));
vi.mock("@/lib/money/server/transactionReadService", () => ({
  attachDisplayMoneyToList: vi.fn(async (list: unknown[]) => list),
}));

import { createTransaction } from "./createTransaction";

const base = { user: "u1", wallet: "w1", name: "Coffee", isBill: true };

beforeEach(() => {
  created.last = null;
  tagCalls.created = [];
});

describe("createTransaction", () => {
  it("accepts an amount of exactly 0 (bug 88)", async () => {
    await expect(createTransaction({ ...base, amount: 0 } as never)).resolves.toBeTruthy();
    expect(created.last?.amount).toBe(0);
  });

  it("still rejects a missing amount", async () => {
    await expect(createTransaction({ ...base } as never)).rejects.toThrow("No Amount found");
    await expect(createTransaction({ ...base, amount: null } as never)).rejects.toThrow("No Amount found");
    await expect(createTransaction({ ...base, amount: "" } as never)).rejects.toThrow("No Amount found");
  });

  it("keeps an explicit isReadable: false (bug 89)", async () => {
    await createTransaction({ ...base, amount: 5, isReadable: false } as never);
    expect(created.last?.isReadable).toBe(false);
  });

  it("defaults isReadable to true only when it is missing", async () => {
    await createTransaction({ ...base, amount: 5 } as never);
    expect(created.last?.isReadable).toBe(true);
    await createTransaction({ ...base, amount: 5, isReadable: null } as never);
    expect(created.last?.isReadable).toBe(true);
  });

  it("uses the found-wording in its errors (bug 90)", async () => {
    await expect(createTransaction({ amount: 1 } as never)).rejects.toThrow("No User ID found");
  });
});

describe("tags (bug 86)", () => {
  it("a comma-separated string makes one tag per name, not one per letter", async () => {
    await createTransaction({ ...base, amount: 5, tags: "food, trip" } as never);
    expect(tagCalls.created).toEqual(["food", "trip"]);
  });
  it("an array still works and blanks are ignored", async () => {
    await createTransaction({ ...base, amount: 5, tags: ["a", "", "b"] } as never);
    expect(tagCalls.created).toEqual(["a", "b"]);
  });
});
