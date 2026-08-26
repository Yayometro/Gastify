import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: {} }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: {} }));
vi.mock("@/model/Budget", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn() }));
vi.mock("@/lib/money/server/fxRateService", () => ({ convert: vi.fn() }));

vi.mock("@/model/Transaction", () => ({ default: { findById: vi.fn() } }));

import Transaction from "@/model/Transaction";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { convert } from "@/lib/money/server/fxRateService";
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

function makeFindTrans(overrides = {}) {
  return {
    _id: "t1",
    user: "u1",
    wallet: "w1",
    name: "Original",
    amount: 100,
    isIncome: false,
    isBill: true,
    isReadable: true,
    date: new Date("2026-08-01"),
    account: "acc-mxn",
    money: {
      account: { amountMinor: 10000, currency: "MXN" },
      merchant: null,
      reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date("2026-08-01"), estimated: false },
    },
    save: vi.fn().mockImplementation(function () { return Promise.resolve(this); }),
    ...overrides,
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
});

describe("update-transaction account currency-change strategy", () => {
  it("requires an explicit currencyStrategy when the new Account's currency differs", async () => {
    const findTrans = makeFindTrans();
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });

    await expect(
      POST(mockRequest({ account: "acc-usd" }), { params: { id: "t1" } })
    ).rejects.toThrow(/requires an explicit choice/);

    expect(findTrans.save).not.toHaveBeenCalled();
  });

  it("'reinterpret' keeps the same number under the new currency", async () => {
    const findTrans = makeFindTrans();
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });

    await POST(mockRequest({ account: "acc-usd", currencyStrategy: "reinterpret" }), { params: { id: "t1" } });

    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountAmount: 100, accountCurrency: "USD" })
    );
    expect(convert).not.toHaveBeenCalled();
  });

  it("'convert' preserves economic value via a live FX quote", async () => {
    const findTrans = makeFindTrans();
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });
    convert.mockResolvedValue({ available: true, amountMinor: 592, currency: "USD", rate: "0.0592" });

    await POST(mockRequest({ account: "acc-usd", currencyStrategy: "convert" }), { params: { id: "t1" } });

    expect(convert).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: 10000, fromCurrency: "MXN", toCurrency: "USD" })
    );
    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountAmount: 5.92, accountCurrency: "USD" })
    );
  });

  it("'manual' requires an explicit amount in the new currency", async () => {
    const findTrans = makeFindTrans();
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });

    await expect(
      POST(mockRequest({ account: "acc-usd", currencyStrategy: "manual" }), { params: { id: "t1" } })
    ).rejects.toThrow(/requires an explicit amount/);
  });

  it("throws (never fakes a rate) when convert is unavailable", async () => {
    const findTrans = makeFindTrans();
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "USD" }) });
    convert.mockResolvedValue({ available: false });

    await expect(
      POST(mockRequest({ account: "acc-usd", currencyStrategy: "convert" }), { params: { id: "t1" } })
    ).rejects.toThrow(/Exchange-rate estimate unavailable/);
  });

  it("does not require a strategy when the new Account has the same currency", async () => {
    const findTrans = makeFindTrans();
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));
    Account.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ currency: "MXN" }) });

    await POST(mockRequest({ account: "acc-mxn-2" }), { params: { id: "t1" } });

    expect(findTrans.save).toHaveBeenCalledTimes(1);
  });
});

describe("update-transaction preserves exact manual reporting", () => {
  it("keeps an existing manual reporting snapshot when nothing monetary changed", async () => {
    const findTrans = makeFindTrans({
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        merchant: null,
        reporting: { amountMinor: 55763, currency: "MXN", rate: "16.898", source: "manual", effectiveDate: new Date("2026-08-01"), estimated: false },
      },
      account: "acc-usd",
    });
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));

    await POST(mockRequest({ name: "Renamed only" }), { params: { id: "t1" } });

    expect(buildTransactionMoney).not.toHaveBeenCalled();
    expect(findTrans.money.reporting.source).toBe("manual");
    expect(findTrans.money.reporting.amountMinor).toBe(55763);
  });

  it("re-derives reporting when amount actually changes, even if it was manual before", async () => {
    const findTrans = makeFindTrans({
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        merchant: null,
        reporting: { amountMinor: 55763, currency: "MXN", rate: "16.898", source: "manual", effectiveDate: new Date("2026-08-01"), estimated: false },
      },
      account: "acc-usd",
    });
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));

    await POST(mockRequest({ amount: 40 }), { params: { id: "t1" } });

    expect(buildTransactionMoney).toHaveBeenCalledWith(expect.objectContaining({ accountAmount: 40 }));
  });
});

describe("update-transaction merchant field (Charged in another currency)", () => {
  it("preserves the existing merchant when the client never sends the field at all", async () => {
    const findTrans = makeFindTrans({
      money: {
        account: { amountMinor: 10000, currency: "MXN" },
        merchant: { amountMinor: 5000, currency: "USD" },
        reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date("2026-08-01"), estimated: false },
      },
    });
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));

    await POST(mockRequest({ name: "Renamed only" }), { params: { id: "t1" } });

    expect(findTrans.money.merchant).toEqual({ amountMinor: 5000, currency: "USD" });
  });

  it("clears the merchant when the client explicitly sends null (user turned the toggle off)", async () => {
    const findTrans = makeFindTrans({
      money: {
        account: { amountMinor: 10000, currency: "MXN" },
        merchant: { amountMinor: 5000, currency: "USD" },
        reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date("2026-08-01"), estimated: false },
      },
    });
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));

    await POST(mockRequest({ merchantAmount: null, merchantCurrency: null }), { params: { id: "t1" } });

    expect(findTrans.money.merchant).toBeNull();
  });

  it("updates the merchant to a newly-provided value even when reporting is otherwise preserved", async () => {
    const findTrans = makeFindTrans({
      money: {
        account: { amountMinor: 10000, currency: "MXN" },
        merchant: null,
        reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "manual", effectiveDate: new Date("2026-08-01"), estimated: false },
      },
    });
    Transaction.findById.mockReturnValueOnce(findTrans).mockReturnValue(chainablePopulate({}));

    await POST(mockRequest({ merchantAmount: 50, merchantCurrency: "USD" }), { params: { id: "t1" } });

    expect(buildTransactionMoney).not.toHaveBeenCalled(); // reporting still preserved
    expect(findTrans.money.merchant).toEqual({ amountMinor: 5000, currency: "USD" });
  });
});
