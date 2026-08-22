import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: {} }));
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
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });

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
});
