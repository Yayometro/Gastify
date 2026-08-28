import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Budget", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn() }));

const { TransactionMock } = vi.hoisted(() => {
  const savedDoc = {
    _id: "t1",
    name: "Coffee",
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };
  const TransactionMock = vi.fn().mockImplementation(function (doc) {
    Object.assign(this, doc, savedDoc);
    this.save = savedDoc.save;
  });
  TransactionMock.findById = vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnThis(),
    then: undefined,
  });
  return { TransactionMock };
});
vi.mock("@/model/Transaction", () => ({ default: TransactionMock }));

import Account from "@/model/Account";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Wallet from "@/model/Wallet";
import Transaction from "@/model/Transaction";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
}

function chainablePopulate(result) {
  const chain = {
    populate: vi.fn(() => chain),
    lean: vi.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  buildTransactionMoney.mockResolvedValue({
    account: { amountMinor: 10000, currency: "USD" },
    merchant: null,
    reporting: { amountMinor: 169000, currency: "MXN", rate: "16.9", source: "ecb_reference", effectiveDate: new Date(), estimated: true },
  });
  Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "MXN" }) });
  Transaction.findById.mockReturnValue(chainablePopulate({ _id: "t1", name: "Coffee" }));
});

describe("new-transaction currency resolution", () => {
  it("resolves the Account's own currency when an Account is selected", async () => {
    Account.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ currency: "USD", user: "u1", wallet: "w1" }),
    });

    await POST(mockRequest({ user: "u1", wallet: "w1", name: "Coffee", amount: 100, isBill: true, account: "acc1" }));

    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountAmount: 100, accountCurrency: "USD", walletPrimaryCurrency: "MXN" })
    );
  });

  it("defaults to the Wallet's primary currency when no Account is selected", async () => {
    await POST(mockRequest({ user: "u1", wallet: "w1", name: "Cash tip", amount: 50, isBill: true }));

    expect(Account.findById).not.toHaveBeenCalled();
    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountCurrency: "MXN", walletPrimaryCurrency: "MXN" })
    );
  });

  it("sets kind/direction explicitly from isIncome rather than relying on the model's fallback hook", async () => {
    await POST(mockRequest({ user: "u1", wallet: "w1", name: "Salary", amount: 5000, isIncome: true }));

    const constructedDoc = Transaction.mock.calls[0][0];
    expect(constructedDoc.kind).toBe("income");
    expect(constructedDoc.direction).toBe("credit");
    expect(constructedDoc.money).toBeDefined();
  });

  // Regression: a real Wallet document that predates the multi-currency
  // migration has no primaryCurrency field in its stored BSON at all -
  // .lean() never applies the schema default, so this reads back as
  // `undefined`, not "MXN". Creating a transaction against a real,
  // unmigrated Wallet crashed before this defaulted explicitly.
  it("defaults to MXN when the Wallet has no primaryCurrency field (unmigrated document)", async () => {
    Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "w1" }) });

    await POST(mockRequest({ user: "u1", wallet: "w1", name: "Cash tip", amount: 50, isBill: true }));

    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountCurrency: "MXN", walletPrimaryCurrency: "MXN" })
    );
  });
});

// Regression: an id that resolves to a real document belonging to a
// *different* user must be rejected exactly like a non-existent id - an
// external caller (the MCP connector's create_transaction/create_transactions
// tools take agent-supplied ids) must not be able to attach another user's
// account/category/subCategory to its own transaction just by guessing or
// leaking an id.
describe("new-transaction ownership validation", () => {
  it("rejects an accountId that exists but belongs to another user's wallet", async () => {
    Account.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ currency: "USD", user: "someone-else", wallet: "w1" }),
    });

    await expect(
      POST(
        mockRequest({ user: "u1", wallet: "w1", name: "Coffee", amount: 100, isBill: true, account: "acc1" })
      )
    ).rejects.toThrow(/Account not found for this user/);
  });

  it("rejects a categoryId that exists but belongs to another user's wallet", async () => {
    Category.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ name: "Food", user: "u1", wallet: "someone-elses-wallet" }),
    });

    await expect(
      POST(
        mockRequest({ user: "u1", wallet: "w1", name: "Lunch", amount: 100, isBill: true, category: "cat1" })
      )
    ).rejects.toThrow(/Category not found for this user/);
  });

  it("rejects a subCategoryId that exists but belongs to another user's wallet", async () => {
    SubCategory.findById.mockReturnValue({
      lean: vi
        .fn()
        .mockResolvedValue({ name: "Uber", fatherCategory: "cat1", user: "someone-else", wallet: "w1" }),
    });

    await expect(
      POST(
        mockRequest({
          user: "u1",
          wallet: "w1",
          name: "Ride",
          amount: 100,
          isBill: true,
          subCategory: "sub1",
        })
      )
    ).rejects.toThrow(/No SUB-CATEGORY found at NEW TRANSACTION/);
  });
});
