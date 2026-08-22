import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: {} }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn() }));
vi.mock("@/model/Transaction", () => ({ default: { findById: vi.fn() } }));

import Transaction from "@/model/Transaction";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
}

function chainablePopulate(result) {
  const chain = { populate: vi.fn(() => chain), then: (resolve) => resolve(result) };
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
  Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "MXN" }) });
  buildTransactionMoney.mockResolvedValue({
    account: { amountMinor: 10000, currency: "MXN" },
    merchant: null,
    reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date(), estimated: false },
  });
  Transaction.findById.mockReturnValue(chainablePopulate({}));
});

describe("bulk account reassignment currency safety", () => {
  it("blocks the whole batch when any selected Transaction's currency differs from the destination Account", async () => {
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });
    // First lean() lookup (validation pass) returns a MXN transaction - mismatch.
    Transaction.findById
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(makeTrans("t1", "USD")) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(makeTrans("t2", "MXN")) });

    const res = await POST(mockRequest({ transactions: ["t1", "t2"], fields: ["account"], account: "acc-usd" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Bulk account reassignment blocked/);
  });

  it("allows the batch when every selected Transaction already matches the destination currency", async () => {
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });
    const t1 = makeTrans("t1", "USD");
    const t2 = makeTrans("t2", "USD");
    Transaction.findById
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(t1) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(t2) })
      .mockReturnValueOnce(t1)
      .mockReturnValueOnce(chainablePopulate({}))
      .mockReturnValueOnce(t2)
      .mockReturnValueOnce(chainablePopulate({}));

    const res = await POST(mockRequest({ transactions: ["t1", "t2"], fields: ["account"], account: "acc-usd" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
  });
});
