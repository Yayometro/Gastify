import { describe, it, expect } from "vitest";
import {
  buildYearProjectionTable,
  buildProjectionAccuracyReport,
  buildProjectionComparisonForMonth,
  estimateHistoricalBalances,
  getMonthBucketBreakdown,
  getMonthCurrencyBreakdown,
} from "./projectionsChange";
import { majorToMinor } from "@/lib/money/currencies";

// Builds a ProjectionBaseline fixture with independent income/expense
// timelines from a shorthand list of {effectiveFrom, effectiveTo, income,
// expense}. Entries are additive - two overlapping ones (no effectiveTo, or
// ranges that intersect) both count toward the same month.
function makeBaseline(entries, currency = "MXN") {
  return {
    incomeHistory: entries
      .filter((e) => e.income !== undefined)
      .map(({ effectiveFrom, effectiveTo, income }) => ({
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        incomeMoney: { amountMinor: majorToMinor(income, currency), currency },
      })),
    expenseHistory: entries
      .filter((e) => e.expense !== undefined)
      .map(({ effectiveFrom, effectiveTo, expense }) => ({
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        expenseMoney: { amountMinor: majorToMinor(expense, currency), currency },
      })),
  };
}

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

describe("buildYearProjectionTable — buffer resolved as of month-end", () => {
  it("uses the buffer revision active AT MONTH-END for a closed month, not a later edit made after it closed", () => {
    const monthlyBuffers = [
      {
        month: 2, // march
        unexpectedBuffer: 500, // latest flat value, kept in sync with the last revision
        unexpectedIncomeBuffer: 0,
        revisions: [
          { unexpectedBuffer: 100, unexpectedIncomeBuffer: 0, updatedAt: new Date(2020, 2, 15) }, // set while March was still open
          { unexpectedBuffer: 500, unexpectedIncomeBuffer: 0, updatedAt: new Date(2026, 0, 1) }, // edited long after March closed
        ],
      },
    ];

    const table = buildYearProjectionTable({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers },
      year: 2020,
      today: new Date(2026, 0, 2),
    });

    const march = table.find((row) => row.monthName === "march");
    expect(march.type).toBe("actual");
    // Should reflect the 100 that was live when March ended, not the 500 set later.
    expect(march.historicalExpense).toBe(100);
  });

  it("reports zero (not the flat value) when every recorded revision happened AFTER the month closed", () => {
    // A closed month whose buffer entry only got its FIRST revision after
    // the month already ended (e.g. a user backfilling a past month for the
    // first time post-launch). Falling back to the flat field here would
    // just return that too-late edit, reintroducing the exact bug this
    // resolver exists to fix.
    const monthlyBuffers = [
      {
        month: 2,
        unexpectedBuffer: 9000, // flat field mirrors the late revision below
        unexpectedIncomeBuffer: 0,
        revisions: [{ unexpectedBuffer: 9000, unexpectedIncomeBuffer: 0, updatedAt: new Date(2026, 8, 1) }],
      },
    ];
    const table = buildYearProjectionTable({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers },
      year: 2020,
      today: new Date(2026, 8, 2),
    });
    const march = table.find((row) => row.monthName === "march");
    expect(march.historicalExpense).toBe(0);
  });

  it("falls back to the entry's flat value when it has no revisions[] (pre-feature data)", () => {
    const monthlyBuffers = [{ month: 2, unexpectedBuffer: 250, unexpectedIncomeBuffer: 0 }];
    const table = buildYearProjectionTable({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers },
      year: 2020,
      today: new Date(2026, 0, 1),
    });
    const march = table.find((row) => row.monthName === "march");
    expect(march.historicalExpense).toBe(250);
  });
});

describe("buildProjectionAccuracyReport", () => {
  function usdTransaction2({ amount, isBill, isIncome, date }) {
    return { amount, isBill, isIncome, date };
  }

  it("skips closed months with no recorded projection entry", () => {
    const rows = buildProjectionAccuracyReport({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      year: 2020,
      today: new Date(2026, 0, 1),
    });
    expect(rows).toHaveLength(0);
  });

  it("includes a closed month with a recorded buffer entry, with correct projected/actual/variance", () => {
    const marchDate = new Date(2020, 2, 15);
    const transactions = [
      usdTransaction2({ amount: 1000, isIncome: true, isBill: false, date: marchDate }),
      usdTransaction2({ amount: 300, isIncome: false, isBill: true, date: marchDate }),
    ];
    const monthlyBuffers = [{ month: 2, unexpectedBuffer: 200, unexpectedIncomeBuffer: 50 }];

    const rows = buildProjectionAccuracyReport({
      transactions,
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers },
      year: 2020,
      today: new Date(2026, 0, 1),
    });

    const march = rows.find((r) => r.monthName === "march");
    expect(march).toBeDefined();
    expect(march.projectedIncome).toBe(50);
    expect(march.projectedExpense).toBe(200);
    expect(march.actualIncome).toBe(1000);
    expect(march.actualExpense).toBe(300);
    expect(march.varianceIncome).toBe(950);
    expect(march.varianceExpense).toBe(100);
  });

  it("includes a closed month with no buffer entry, using a ProjectionBaseline entry instead", () => {
    const projectionBaseline = makeBaseline([{ effectiveFrom: new Date(2019, 0, 1), income: 150000, expense: 100000 }]);
    const rows = buildProjectionAccuracyReport({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline,
      year: 2020,
      today: new Date(2026, 0, 1),
    });
    const march = rows.find((r) => r.monthName === "march");
    expect(march).toBeDefined();
    expect(march.projectedIncome).toBe(150000);
    expect(march.projectedExpense).toBe(100000);
  });
});

describe("buildProjectionComparisonForMonth", () => {
  it("returns the closed-month comparison for a month with a buffer entry", () => {
    const marchDate = new Date(2020, 2, 15);
    const transactions = [
      { amount: 1000, isIncome: true, isBill: false, date: marchDate },
      { amount: 300, isIncome: false, isBill: true, date: marchDate },
    ];
    const monthlyBuffers = [{ month: 2, unexpectedBuffer: 200, unexpectedIncomeBuffer: 50 }];
    const comparison = buildProjectionComparisonForMonth({
      transactions,
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers },
      projectionBaseline: null,
      referenceDate: new Date(2020, 2, 1),
      today: new Date(2026, 0, 1),
    });
    expect(comparison).toEqual({
      type: "closed",
      projectedIncome: 50,
      actualIncome: 1000,
      projectedExpense: 200,
      actualExpense: 300,
    });
  });

  it("returns the closed-month comparison using a ProjectionBaseline entry when there's no buffer", () => {
    const projectionBaseline = makeBaseline([{ effectiveFrom: new Date(2019, 0, 1), income: 150000, expense: 100000 }]);
    const comparison = buildProjectionComparisonForMonth({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline,
      referenceDate: new Date(2020, 2, 1),
      today: new Date(2026, 0, 1),
    });
    expect(comparison.type).toBe("closed");
    expect(comparison.projectedIncome).toBe(150000);
    expect(comparison.projectedExpense).toBe(100000);
  });

  it("returns null for a closed month with neither a buffer nor a baseline entry", () => {
    const comparison = buildProjectionComparisonForMonth({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline: null,
      referenceDate: new Date(2020, 2, 1),
      today: new Date(2026, 0, 1),
    });
    expect(comparison).toBeNull();
  });

  it("returns the in-progress comparison (shadow vs actual-so-far) for the current month", () => {
    const today = new Date(2026, 2, 15);
    const marchTx = new Date(2026, 2, 5);
    const transactions = [{ amount: 500, isIncome: false, isBill: true, date: marchTx }];
    const budgets = [{ goalAmount: 1000, archived: false, category: { name: "x" } }];
    const comparison = buildProjectionComparisonForMonth({
      transactions,
      budgets,
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline: null,
      referenceDate: today,
      today,
    });
    expect(comparison.type).toBe("in-progress");
    expect(comparison.projectedExpense).toBe(1000); // shadowExpense: active budget goal
    expect(comparison.actualExpense).toBe(500);
  });

  it("returns null for a future month", () => {
    const comparison = buildProjectionComparisonForMonth({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline: null,
      referenceDate: new Date(2027, 5, 1),
      today: new Date(2026, 0, 1),
    });
    expect(comparison).toBeNull();
  });
});

describe("buildYearProjectionTable — ProjectionBaseline fallback", () => {
  it("sums two overlapping (concurrent) baseline entries active in the same month", () => {
    // Two simultaneous jobs, both still ongoing (no effectiveTo) - the
    // second starting later must ADD to the first, not replace it.
    const projectionBaseline = makeBaseline([
      { effectiveFrom: new Date(2022, 10, 1), income: 49000 },
      { effectiveFrom: new Date(2025, 4, 1), income: 81500 },
    ]);
    const table = buildYearProjectionTable({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline,
      year: 2025,
      today: new Date(2026, 0, 1),
    });
    // Before May: only the first job.
    expect(table.find((r) => r.monthName === "february").historicalIncome).toBe(49000);
    // May onward: both jobs summed.
    expect(table.find((r) => r.monthName === "june").historicalIncome).toBe(130500);
  });

  it("stops counting an entry once its effectiveTo passes (a job that ended, not a concurrent one)", () => {
    const projectionBaseline = makeBaseline([
      { effectiveFrom: new Date(2022, 10, 1), effectiveTo: new Date(2025, 4, 1), income: 49000 },
      { effectiveFrom: new Date(2025, 4, 1), income: 81500 },
    ]);
    const table = buildYearProjectionTable({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline,
      year: 2025,
      today: new Date(2026, 0, 1),
    });
    expect(table.find((r) => r.monthName === "february").historicalIncome).toBe(49000);
    // May onward: first entry has already ended, only the second counts.
    expect(table.find((r) => r.monthName === "june").historicalIncome).toBe(81500);
  });

  it("prefers real Budget/IncomeSource history over the baseline when both exist", () => {
    const projectionBaseline = makeBaseline([{ effectiveFrom: new Date(2020, 0, 1), income: 999999, expense: 999999 }]);
    const budgets = [{ goalAmount: 500, history: [{ goalAmount: 500, effectiveFrom: new Date(2020, 0, 1), effectiveTo: null }], category: { name: "x" } }];
    const table = buildYearProjectionTable({
      transactions: [],
      budgets,
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline,
      year: 2020,
      today: new Date(2026, 0, 1),
    });
    expect(table.find((r) => r.monthName === "march").historicalExpense).toBe(500);
  });
});

describe("estimateHistoricalBalances", () => {
  function actualRow(monthName, { income = 0, expense = 0, hasTransactions = false } = {}) {
    return { monthName, type: "actual", income, expense, hasTransactions, balance: null };
  }

  it("seeds January at $0 and accumulates forward when the year has no anchor anywhere", () => {
    const rows = [
      actualRow("january"),
      actualRow("february"),
      actualRow("march"),
    ];
    const monthStarts = [new Date(2023, 0, 1), new Date(2023, 1, 1), new Date(2023, 2, 1)];
    const projectionBaseline = makeBaseline([{ effectiveFrom: new Date(2022, 0, 1), income: 1000, expense: 400 }]);
    const result = estimateHistoricalBalances(rows, monthStarts, projectionBaseline);
    expect(result[0].estimatedBalance).toBe(600); // 0 + (1000-400)
    expect(result[1].estimatedBalance).toBe(1200);
    expect(result[2].estimatedBalance).toBe(1800);
  });

  it("chains from a manual anchor mid-year in both directions", () => {
    const rows = [
      actualRow("january"),
      actualRow("february"),
      { ...actualRow("march"), balance: 5000 }, // manual anchor
      actualRow("april"),
    ];
    const monthStarts = [new Date(2023, 0, 1), new Date(2023, 1, 1), new Date(2023, 2, 1), new Date(2023, 3, 1)];
    const projectionBaseline = makeBaseline([{ effectiveFrom: new Date(2022, 0, 1), income: 1000, expense: 400 }]);
    const result = estimateHistoricalBalances(rows, monthStarts, projectionBaseline);
    // April: forward from March's anchor.
    expect(result[3].estimatedBalance).toBe(5600);
    // February: backward from March's anchor (5000 - net(march) = 5000 - 600).
    expect(result[1].estimatedBalance).toBe(4400);
    // January: backward one more step.
    expect(result[0].estimatedBalance).toBe(3800);
    // The anchor month itself is untouched (real balance already displays it).
    expect(result[2].estimatedBalance).toBeUndefined();
  });

  it("leaves estimatedBalance unset when there's neither an anchor nor any baseline configured (keeps the original dash)", () => {
    const rows = [actualRow("january"), actualRow("february")];
    const monthStarts = [new Date(2023, 0, 1), new Date(2023, 1, 1)];
    const result = estimateHistoricalBalances(rows, monthStarts, null);
    expect(result[0].estimatedBalance).toBeUndefined();
    expect(result[1].estimatedBalance).toBeUndefined();
  });

  it("uses a month's real transactions instead of the baseline when it has any", () => {
    const rows = [
      { ...actualRow("january"), balance: 1000 }, // anchor
      actualRow("february", { income: 5000, expense: 1000, hasTransactions: true }),
    ];
    const monthStarts = [new Date(2023, 0, 1), new Date(2023, 1, 1)];
    const projectionBaseline = makeBaseline([{ effectiveFrom: new Date(2022, 0, 1), income: 1, expense: 1 }]);
    const result = estimateHistoricalBalances(rows, monthStarts, projectionBaseline);
    expect(result[1].estimatedBalance).toBe(5000); // 1000 + (5000-1000), not the ~0 baseline net
  });

  it("resolves income and expense on independent timelines (a raise doesn't imply an expense change)", () => {
    // Income changes in May (job change - the first entry ends when the
    // second begins); expense changes in a completely different month
    // (August) - each timeline should resolve on its own, not be forced to
    // move together.
    const projectionBaseline = {
      incomeHistory: [
        { effectiveFrom: new Date(2025, 0, 1), effectiveTo: new Date(2025, 4, 1), incomeMoney: { amountMinor: majorToMinor(50000, "MXN"), currency: "MXN" } },
        { effectiveFrom: new Date(2025, 4, 1), effectiveTo: null, incomeMoney: { amountMinor: majorToMinor(133000, "MXN"), currency: "MXN" } },
      ],
      expenseHistory: [
        { effectiveFrom: new Date(2025, 0, 1), effectiveTo: new Date(2025, 7, 1), expenseMoney: { amountMinor: majorToMinor(30000, "MXN"), currency: "MXN" } },
        { effectiveFrom: new Date(2025, 7, 1), effectiveTo: null, expenseMoney: { amountMinor: majorToMinor(45000, "MXN"), currency: "MXN" } },
      ],
    };
    const table = buildYearProjectionTable({
      transactions: [],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline,
      year: 2025,
      today: new Date(2026, 0, 1),
    });
    // June: income already jumped (May), expense hasn't yet (still January's).
    const june = table.find((r) => r.monthName === "june");
    expect(june.historicalIncome).toBe(133000);
    expect(june.historicalExpense).toBe(30000);
    // September: both have jumped by now.
    const september = table.find((r) => r.monthName === "september");
    expect(september.historicalIncome).toBe(133000);
    expect(september.historicalExpense).toBe(45000);
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
