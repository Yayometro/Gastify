import { describe, it, expect } from "vitest";
import { buildYearProjectionTable, getMonthBucketBreakdown, getMonthCurrencyBreakdown } from "./projectionsChange";

// A foreign-currency transaction: 100 USD native, but its real Wallet-primary
// (MXN) equivalent is 1690 - very different from the raw `amount` number.
// Before the Phase 9 fix, buildYearProjectionTable summed `tx.amount`
// directly (100), which is meaningless once mixed with real MXN
// transactions; it must use the converted displayMoney.primary value (1690).
function usdTransaction({ amount, isBill, isIncome, date, primaryAmountMinor }) {
  return {
    amount,
    isBill,
    isIncome,
    date,
    displayMoney: {
      native: { amountMinor: amount * 100, currency: "USD" },
      primary: { amountMinor: primaryAmountMinor, currency: "MXN" },
    },
  };
}

describe("buildYearProjectionTable — currency correctness", () => {
  it("sums a past month's actual income/expense using the converted (primary) amount, not the raw native amount", () => {
    const pastDate = new Date(2020, 2, 15); // March 2020 - safely in the past
    const transactions = [
      usdTransaction({ amount: 100, isIncome: true, isBill: false, date: pastDate, primaryAmountMinor: 169000 }), // 100 USD -> 1690 MXN
      usdTransaction({ amount: 50, isIncome: false, isBill: true, date: pastDate, primaryAmountMinor: 84500 }), // 50 USD -> 845 MXN
    ];

    const table = buildYearProjectionTable({
      transactions,
      budgets: [],
      incomeSources: [],
      projectionSettings: {},
      year: 2020,
      today: new Date(2026, 0, 1),
    });

    const march = table.find((row) => row.monthName === "march");
    expect(march.type).toBe("actual");
    expect(march.income).toBe(1690);
    expect(march.expense).toBe(845);
  });

  it("falls back to the raw amount for a legacy transaction with no displayMoney at all", () => {
    const pastDate = new Date(2020, 4, 10);
    const transactions = [
      { amount: 500, isIncome: true, isBill: false, date: pastDate },
    ];
    const table = buildYearProjectionTable({
      transactions,
      budgets: [],
      incomeSources: [],
      projectionSettings: {},
      year: 2020,
      today: new Date(2026, 0, 1),
    });
    const may = table.find((row) => row.monthName === "may");
    expect(may.income).toBe(500);
  });
});

describe("getMonthBucketBreakdown — currency correctness", () => {
  it("sums matched/unmatched bills using the converted amount", () => {
    const bill = usdTransaction({ amount: 20, isIncome: false, isBill: true, date: new Date(), primaryAmountMinor: 33800 }); // 20 USD -> 338 MXN
    const rows = getMonthBucketBreakdown([bill], [], 0);
    const unexpectedRow = rows.find((r) => r.label === "Unexpected/Other");
    expect(unexpectedRow.actual).toBe(338);
  });
});

describe("getMonthCurrencyBreakdown", () => {
  function tx({ nativeAmountMinor, nativeCurrency, primaryAmountMinor, rate, effectiveDate }) {
    return {
      displayMoney: {
        native: { amountMinor: nativeAmountMinor, currency: nativeCurrency },
        primary: { amountMinor: primaryAmountMinor, currency: "MXN", rate, effectiveDate },
      },
    };
  }

  it("reports isMultiCurrency=false when everything is already in the wallet's own currency", () => {
    const transactions = [tx({ nativeAmountMinor: 10000, nativeCurrency: "MXN", primaryAmountMinor: 10000, rate: 1, effectiveDate: "2026-08-01" })];
    const { breakdown, isMultiCurrency } = getMonthCurrencyBreakdown(transactions, "MXN");
    expect(isMultiCurrency).toBe(false);
    expect(breakdown).toHaveLength(1);
  });

  it("groups by native currency and sums both native and converted amounts, keeping the latest rate", () => {
    const transactions = [
      tx({ nativeAmountMinor: 5000, nativeCurrency: "MXN", primaryAmountMinor: 5000, rate: 1, effectiveDate: "2026-08-01" }),
      tx({ nativeAmountMinor: 10000, nativeCurrency: "USD", primaryAmountMinor: 168980, rate: 16.898, effectiveDate: "2026-08-10" }),
      tx({ nativeAmountMinor: 5000, nativeCurrency: "USD", primaryAmountMinor: 85000, rate: 17.0, effectiveDate: "2026-08-20" }),
    ];
    const { breakdown, isMultiCurrency } = getMonthCurrencyBreakdown(transactions, "MXN");
    expect(isMultiCurrency).toBe(true);
    const mxn = breakdown.find((b) => b.currency === "MXN");
    const usd = breakdown.find((b) => b.currency === "USD");
    expect(mxn.nativeAmountMinor).toBe(5000);
    expect(usd.nativeAmountMinor).toBe(15000);
    expect(usd.primaryAmountMinor).toBe(253980);
    // Latest effectiveDate (Aug 20) wins as the representative rate.
    expect(usd.rate).toBe(17.0);
  });

  it("skips transactions with no displayMoney rather than throwing", () => {
    const { breakdown } = getMonthCurrencyBreakdown([{ amount: 100 }, null], "MXN");
    expect(breakdown).toHaveLength(0);
  });
});
