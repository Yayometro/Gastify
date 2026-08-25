import { describe, it, expect } from "vitest";
import { buildYearProjectionTable, getMonthBucketBreakdown } from "./projectionsChange";

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
