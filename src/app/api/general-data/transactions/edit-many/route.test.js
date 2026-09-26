import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: {} }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn(), findOne: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn() }));
vi.mock("@/model/Transaction", () => ({ default: { findById: vi.fn(), findOne: vi.fn() } }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import Transaction from "@/model/Transaction";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { POST } from "./route";

function mockRequest(body, headers = {}) {
  return { json: vi.fn().mockResolvedValue(body), headers: new Headers(headers) };
}

function chainablePopulate(result) {
  const chain = {
    populate: vi.fn(() => chain),
    lean: vi.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return chain;
}

function makeTrans(id, currency) {
  return {
    _id: id,
    wallet: "w1",
    amount: 100,
    isBill: true,
    money: { account: { amountMinor: 10000, currency }, merchant: null, reporting: { amountMinor: 10000, currency, rate: "1", source: "same_currency", effectiveDate: new Date(), estimated: false } },
    save: vi.fn().mockImplementation(function () { return Promise.resolve(this); }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.api.getSession.mockResolvedValue({ user: { email: "u1@example.com" } });
  User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "u1", wallet: "w1" }) });
  Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "MXN" }) });
  buildTransactionMoney.mockResolvedValue({
    account: { amountMinor: 10000, currency: "MXN" },
    merchant: null,
    reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date(), estimated: false },
  });
  Transaction.findById.mockReturnValue(chainablePopulate({}));
  Transaction.findOne.mockReturnValue(chainablePopulate({}));
});

describe("edit-many authentication and scoping", () => {
  it("fails when no session exists", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);

    const res = await POST(mockRequest({ transactions: ["t1"], fields: ["name"], name: "test" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/No session/);
    expect(Transaction.findOne).not.toHaveBeenCalled();
  });

  it("scopes transaction lookups to the session user's wallet", async () => {
    const t1 = makeTrans("t1", "MXN");
    Transaction.findOne.mockResolvedValue(t1);

    const res = await POST(mockRequest({ transactions: ["t1"], fields: ["name"], name: "Updated" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(Transaction.findOne).toHaveBeenCalledWith({
      _id: "t1",
      wallet: "w1",
    });
  });
});

describe("bulk account reassignment currency safety", () => {
  it("blocks the whole batch when any selected Transaction's currency differs from the destination Account", async () => {
    Account.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });
    // First lean() lookup (validation pass) returns a MXN transaction - mismatch.
    Transaction.findOne
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(makeTrans("t1", "USD")) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(makeTrans("t2", "MXN")) });

    const res = await POST(mockRequest({ transactions: ["t1", "t2"], fields: ["account"], account: "acc-usd" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Bulk account reassignment blocked/);
  });

  it("allows the batch when every selected Transaction already matches the destination currency", async () => {
    Account.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });
    const t1 = makeTrans("t1", "USD");
    const t2 = makeTrans("t2", "USD");
    Transaction.findOne
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(t1) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(t2) })
      .mockReturnValueOnce(t1)
      .mockReturnValueOnce(t2);
    Transaction.findById
      .mockReturnValueOnce(chainablePopulate({}))
      .mockReturnValueOnce(chainablePopulate({}));

    const res = await POST(mockRequest({ transactions: ["t1", "t2"], fields: ["account"], account: "acc-usd" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
  });
});
