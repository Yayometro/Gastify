import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: {} }));
vi.mock("@/model/Account", () => ({ default: {} }));
vi.mock("@/model/Transaction", () => ({ default: { findOne: vi.fn(), find: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";

const m = (x: unknown) => x as { [k: string]: ReturnType<typeof vi.fn> };
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;
const lean = (value: unknown) => ({ lean: async () => value });

const owned = (extra: Record<string, unknown> = {}) => ({ user: "u1", wallet: "w1", ...extra });
const makeTx = (id: string) => ({ _id: id, category: null as unknown, subCategory: null as unknown, save: vi.fn(async () => undefined) });

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  m(auth.api).getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  m(User).findOne.mockReturnValue(lean({ _id: "u1", wallet: "w1" }));
  m(Transaction).find.mockReturnValue({ populate: () => ({ populate: () => ({ populate: () => ({ populate: () => ({ lean: async () => [] }) }) }) }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST category-rules/apply-suggestions (bug 125)", () => {
  it("saves nothing when a later application in the batch is invalid", async () => {
    const t1 = makeTx("t1");
    const t2 = makeTx("t2");
    m(Transaction).findOne.mockResolvedValueOnce(t1).mockResolvedValueOnce(t2);
    m(Category).findById.mockImplementation((id: string) => lean(id === "c1" ? owned() : null));
    await expect(
      POST(req({ applications: [{ transactionId: "t1", category: "c1" }, { transactionId: "t2", category: "bad" }] }))
    ).rejects.toThrow();
    expect(t1.save).not.toHaveBeenCalled();
    expect(t2.save).not.toHaveBeenCalled();
  });

  it("rejects a sub-category that does not belong to the given category", async () => {
    m(Transaction).findOne.mockResolvedValue(makeTx("t1"));
    m(Category).findById.mockReturnValue(lean(owned()));
    m(SubCategory).findById.mockReturnValue(lean(owned({ fatherCategory: "other" })));
    await expect(POST(req({ applications: [{ transactionId: "t1", category: "c1", subCategory: "s1" }] }))).rejects.toThrow(
      "does not belong"
    );
  });

  it("applies a valid batch", async () => {
    const t1 = makeTx("t1");
    m(Transaction).findOne.mockResolvedValue(t1);
    m(Category).findById.mockReturnValue(lean(owned()));
    m(SubCategory).findById.mockReturnValue(lean(owned({ fatherCategory: "c1" })));
    await POST(req({ applications: [{ transactionId: "t1", category: "c1", subCategory: "s1" }] }));
    expect(t1.save).toHaveBeenCalledTimes(1);
    expect(t1.category).toBe("c1");
    expect(t1.subCategory).toBe("s1");
  });
});
