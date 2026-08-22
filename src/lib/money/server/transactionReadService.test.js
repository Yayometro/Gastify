import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./fxRateService", () => ({ convert: vi.fn() }));

import { convert } from "./fxRateService";
import { attachDisplayMoney, attachDisplayMoneyToList } from "./transactionReadService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("attachDisplayMoney - migrated documents", () => {
  it("reuses the stored reporting snapshot exactly when it already matches the Wallet's primary currency", async () => {
    const transaction = {
      _id: "t1",
      amount: 33,
      date: new Date("2026-08-20"),
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        merchant: null,
        reporting: { amountMinor: 55763, currency: "MXN", rate: "16.898", source: "ecb_reference", effectiveDate: new Date("2026-08-20"), estimated: true },
      },
    };

    const result = await attachDisplayMoney(transaction, "MXN");

    expect(convert).not.toHaveBeenCalled();
    expect(result.displayMoney.native).toEqual({ amountMinor: 3300, currency: "USD" });
    expect(result.displayMoney.primary).toEqual({
      amountMinor: 55763,
      currency: "MXN",
      rate: "16.898",
      source: "ecb_reference",
      effectiveDate: new Date("2026-08-20"),
      estimated: true,
      stale: false,
    });
    expect(result.displayMoney.historicalReporting).toBe(transaction.money.reporting);
  });

  it("re-derives primary via a live FX quote when the Wallet's primary currency has since changed", async () => {
    const transaction = {
      _id: "t1",
      amount: 33,
      date: new Date("2026-08-20"),
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        merchant: null,
        reporting: { amountMinor: 55763, currency: "MXN", rate: "16.898", source: "ecb_reference", effectiveDate: new Date("2026-08-20"), estimated: true },
      },
    };
    convert.mockResolvedValue({
      available: true, amountMinor: 3050, currency: "EUR", rate: "0.9242", effectiveDate: new Date("2026-08-20"), source: "ecb_reference", estimated: true, stale: false,
    });

    const result = await attachDisplayMoney(transaction, "EUR");

    expect(convert).toHaveBeenCalledWith({ amountMinor: 3300, fromCurrency: "USD", toCurrency: "EUR", date: transaction.date });
    expect(result.displayMoney.primary.currency).toBe("EUR");
    expect(result.displayMoney.primary.amountMinor).toBe(3050);
    // The original exact snapshot stays visible for audit, unrelabeled.
    expect(result.displayMoney.historicalReporting.currency).toBe("MXN");
  });

  it("never fakes a rate - primary is null when the FX service is unavailable", async () => {
    const transaction = {
      _id: "t1",
      amount: 33,
      date: new Date("2026-08-20"),
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        merchant: null,
        reporting: { amountMinor: 55763, currency: "MXN", rate: "16.898", source: "ecb_reference", effectiveDate: new Date("2026-08-20"), estimated: true },
      },
    };
    convert.mockResolvedValue({ available: false });

    const result = await attachDisplayMoney(transaction, "EUR");

    expect(result.displayMoney.primary).toBeNull();
  });

  it("passes through merchant money when present", async () => {
    const transaction = {
      _id: "t1",
      amount: 33,
      date: new Date("2026-08-20"),
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        merchant: { amountMinor: 4500, currency: "JPY" },
        reporting: { amountMinor: 3300, currency: "USD", rate: "1", source: "same_currency", effectiveDate: new Date("2026-08-20"), estimated: false },
      },
    };

    const result = await attachDisplayMoney(transaction, "USD");

    expect(result.displayMoney.merchant).toEqual({ amountMinor: 4500, currency: "JPY" });
  });
});

describe("attachDisplayMoney - legacy documents (never re-saved since Phase 3)", () => {
  it("falls back to the MXN-rate-1 legacy shape when .money was never persisted", async () => {
    // A .lean() read of a document written before money-aware writes existed -
    // no money field in the stored BSON at all, exactly like Transaction
    // model's own pre-validate hook assumes for legacy docs.
    const transaction = { _id: "t1", amount: 199.5, date: new Date("2025-01-01") };

    const result = await attachDisplayMoney(transaction, "MXN");

    expect(convert).not.toHaveBeenCalled();
    expect(result.displayMoney.native).toEqual({ amountMinor: 19950, currency: "MXN" });
    expect(result.displayMoney.primary.source).toBe("legacy_migration");
    expect(result.displayMoney.primary.rate).toBe("1");
  });

  it("derives a live FX estimate for a legacy document when the Wallet primary currency is not MXN", async () => {
    const transaction = { _id: "t1", amount: 100, date: new Date("2025-01-01") };
    convert.mockResolvedValue({ available: true, amountMinor: 592, currency: "USD", rate: "0.0592", effectiveDate: new Date("2025-01-01"), source: "ecb_reference", estimated: true, stale: false });

    const result = await attachDisplayMoney(transaction, "USD");

    expect(convert).toHaveBeenCalledWith({ amountMinor: 10000, fromCurrency: "MXN", toCurrency: "USD", date: transaction.date });
    expect(result.displayMoney.primary.currency).toBe("USD");
  });
});

describe("attachDisplayMoneyToList", () => {
  it("attaches displayMoney to every transaction in the list", async () => {
    const transactions = [
      { _id: "t1", amount: 10, date: new Date("2026-01-01") },
      { _id: "t2", amount: 20, date: new Date("2026-01-02") },
    ];

    const result = await attachDisplayMoneyToList(transactions, "MXN");

    expect(result).toHaveLength(2);
    expect(result[0]._id).toBe("t1");
    expect(result[0].displayMoney).toBeDefined();
    expect(result[1].displayMoney).toBeDefined();
  });
});
