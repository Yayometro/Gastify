import { describe, it, expect } from "vitest";
import {
  getMonthRange,
  getPreviousMonthRange,
  getMonthTotals,
  compareCategoriesAcrossMonths,
  rankCategoriesForRange,
  getCategoryTransactions,
  computeCategoryHistoryAverage,
  compareTransactionsAcrossMonths,
  computeTrend,
  computeMonthlyAverages,
  computeBudgetStreaks,
  detectSubscriptions,
  computeSpendingPace,
  findBiggestSpendPatterns,
  computeMonthlyChampions,
  computeMonthlyChampionsForRange,
  findPeakMonth,
  computeQuarterTotals,
  findPeakQuarter,
  computeSpendingByWeekday,
  generateInsights,
  buildWalletAnalyzerSnapshot,
  getSnapshotLookbackStart,
  buildCuratedWalletSummary,
  buildMonthComparison,
  buildPeriodComparison,
  buildBudgetPeriodChanges,
  getPrecedingPeriods,
  computeTrendForRange,
  computeSpendingPaceForRange,
  findBiggestSpendPatternsForRange,
  computeCategoryHistoryAverageForRange,
  computeSpendingByWeekdayForRange,
  buildPeriodSnapshot,
} from "./walletAnalyzer";

const CAT_FOOD = { _id: "cat-food", name: "Food", color: "#f00", icon: "md/MdFastfood" };
const CAT_HEALTH = { _id: "cat-health", name: "Health", color: "#0f0", icon: "md/MdHealth" };
const ACCOUNT_A = { _id: "acc-1", name: "Checking" };

function tx({ amount, date, isBill = true, category = null, subCategory = null, tags = null, name = "Transaction", account = null }) {
  return { amount, value: amount, date, isBill, isIncome: !isBill, category, subCategory, tags, name, account };
}

describe("getMonthRange / getPreviousMonthRange", () => {
  it("builds a full-day-precision range for the given month", () => {
    const { start, end } = getMonthRange(new Date(2026, 7, 15)); // August 2026
    expect(start).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
  });

  it("rolls back across a year boundary for January", () => {
    const { start, end } = getPreviousMonthRange(new Date(2026, 0, 10));
    expect(start).toEqual(new Date(2025, 11, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
  });
});

describe("getMonthTotals", () => {
  it("computes income, expense, balance and savings rate", () => {
    const transactions = [
      tx({ amount: 1000, date: new Date(2026, 7, 5), isBill: false }),
      tx({ amount: 400, date: new Date(2026, 7, 10), isBill: true, category: CAT_FOOD }),
    ];
    const { start, end } = getMonthRange(new Date(2026, 7, 20));
    const totals = getMonthTotals(transactions, start, end);
    expect(totals).toEqual({ income: 1000, expense: 400, balance: 600, savingsRate: 0.6, transactionCount: 1 });
  });

  it("returns a 0 savings rate when there's no income", () => {
    const transactions = [tx({ amount: 400, date: new Date(2026, 7, 10), isBill: true, category: CAT_FOOD })];
    const { start, end } = getMonthRange(new Date(2026, 7, 20));
    expect(getMonthTotals(transactions, start, end).savingsRate).toBe(0);
  });
});

describe("compareCategoriesAcrossMonths", () => {
  it("sums per category for both months and computes changePct", () => {
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 5), category: CAT_FOOD }),
      tx({ amount: 50, date: new Date(2026, 6, 5), category: CAT_FOOD }),
    ];
    const [row] = compareCategoriesAcrossMonths(
      transactions,
      true,
      getMonthRange(new Date(2026, 7, 1)),
      getMonthRange(new Date(2026, 6, 1))
    );
    expect(row).toMatchObject({ name: "Food", current: 100, previous: 50, changePct: 100, isNew: false });
  });

  it("marks a category isNew when the previous month has nothing", () => {
    const transactions = [tx({ amount: 100, date: new Date(2026, 7, 5), category: CAT_FOOD })];
    const [row] = compareCategoriesAcrossMonths(
      transactions,
      true,
      getMonthRange(new Date(2026, 7, 1)),
      getMonthRange(new Date(2026, 6, 1))
    );
    expect(row).toMatchObject({ current: 100, previous: 0, changePct: null, isNew: true });
  });

  it("sorts by current spend descending and respects topN", () => {
    const transactions = [
      tx({ amount: 50, date: new Date(2026, 7, 5), category: CAT_FOOD }),
      tx({ amount: 200, date: new Date(2026, 7, 5), category: CAT_HEALTH }),
    ];
    const rows = compareCategoriesAcrossMonths(
      transactions,
      true,
      getMonthRange(new Date(2026, 7, 1)),
      getMonthRange(new Date(2026, 6, 1)),
      1
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Health");
  });
});

describe("computeCategoryHistoryAverage", () => {
  it("averages the trailing months, excluding the reference month itself", () => {
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 5), category: CAT_FOOD }), // reference month - excluded
      tx({ amount: 60, date: new Date(2026, 6, 5), category: CAT_FOOD }),
      tx({ amount: 40, date: new Date(2026, 5, 5), category: CAT_FOOD }),
    ];
    const { average, monthsOfHistory, monthlyTotals } = computeCategoryHistoryAverage(
      transactions,
      "Food",
      true,
      new Date(2026, 7, 15),
      6
    );
    expect(monthsOfHistory).toBe(2);
    expect(average).toBeCloseTo((60 + 40) / 6, 5);
    expect(monthlyTotals).toHaveLength(6);
    expect(monthlyTotals[monthlyTotals.length - 1]).toMatchObject({ label: "July 2026", amount: 60 });
  });
});

describe("rankCategoriesForRange", () => {
  it("sums per category for a single range, sorted descending and sliced to topN", () => {
    const transactions = [
      tx({ amount: 50, date: new Date(2026, 7, 5), category: CAT_FOOD }),
      tx({ amount: 200, date: new Date(2026, 7, 5), category: CAT_HEALTH }),
    ];
    const rows = rankCategoriesForRange(transactions, true, getMonthRange(new Date(2026, 7, 1)), 1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Health", amount: 200 });
  });
});

describe("getCategoryTransactions", () => {
  it("returns the raw transactions for one category within a range", () => {
    const foodTx = tx({ amount: 50, date: new Date(2026, 7, 5), category: CAT_FOOD });
    const transactions = [
      foodTx,
      tx({ amount: 200, date: new Date(2026, 7, 5), category: CAT_HEALTH }),
      tx({ amount: 30, date: new Date(2026, 6, 5), category: CAT_FOOD }), // outside range
    ];
    const result = getCategoryTransactions(transactions, "Food", true, getMonthRange(new Date(2026, 7, 1)));
    expect(result).toEqual([foodTx]);
  });
});

describe("compareTransactionsAcrossMonths", () => {
  it("returns independently-ranked top lists for current and previous month", () => {
    const transactions = [
      tx({ amount: 300, date: new Date(2026, 7, 5), category: CAT_FOOD, name: "Big August" }),
      tx({ amount: 100, date: new Date(2026, 7, 6), category: CAT_FOOD, name: "Small August" }),
      tx({ amount: 500, date: new Date(2026, 6, 5), category: CAT_HEALTH, name: "Big July" }),
    ];
    const { current, previous } = compareTransactionsAcrossMonths(
      transactions,
      true,
      getMonthRange(new Date(2026, 7, 1)),
      getMonthRange(new Date(2026, 6, 1))
    );
    expect(current.map((t) => t.name)).toEqual(["Big August", "Small August"]);
    expect(previous.map((t) => t.name)).toEqual(["Big July"]);
  });

  it("carries the transaction's _id so the view can look up the raw doc for a detail modal", () => {
    const transactions = [tx({ amount: 300, date: new Date(2026, 7, 5), category: CAT_FOOD, name: "Big August" })];
    transactions[0]._id = "tx-1";
    const { current } = compareTransactionsAcrossMonths(
      transactions,
      true,
      getMonthRange(new Date(2026, 7, 1)),
      getMonthRange(new Date(2026, 6, 1))
    );
    expect(current[0]._id).toBe("tx-1");
  });
});

describe("computeTrend", () => {
  it("aligns income/expense by relative month across the lookback window", () => {
    const transactions = [
      tx({ amount: 1000, date: new Date(2026, 7, 5), isBill: false }),
      tx({ amount: 400, date: new Date(2026, 7, 5), category: CAT_FOOD }),
      tx({ amount: 200, date: new Date(2026, 3, 5), category: CAT_FOOD }),
    ];
    const trend = computeTrend(transactions, new Date(2026, 7, 20), 6);
    expect(trend).toHaveLength(6);
    expect(trend[0].label).toBe("March 2026");
    expect(trend[5]).toMatchObject({ label: "August 2026", income: 1000, expense: 400, transactionCount: 1 });
    expect(trend[1]).toMatchObject({ label: "April 2026", income: 0, expense: 200, transactionCount: 1 });
    expect(trend[2]).toMatchObject({ transactionCount: 0 });
  });
});

describe("computeMonthlyAverages", () => {
  it("averages income, expense and transaction count across the trend window", () => {
    const trend = [
      { label: "March 2026", income: 1000, expense: 400, transactionCount: 3 },
      { label: "April 2026", income: 2000, expense: 800, transactionCount: 7 },
    ];
    expect(computeMonthlyAverages(trend)).toEqual({ avgIncome: 1500, avgExpense: 600, avgTransactionCount: 5, monthsCount: 2 });
  });

  it("returns zeroes for an empty trend window", () => {
    expect(computeMonthlyAverages([])).toEqual({ avgIncome: 0, avgExpense: 0, avgTransactionCount: 0, monthsCount: 0 });
  });
});

describe("computeBudgetStreaks", () => {
  function monthlyBudget(overrides = {}) {
    return {
      _id: "b1",
      budgetType: "spending",
      period: "monthly",
      goalAmount: 1000,
      category: CAT_FOOD,
      createdAt: new Date(2025, 0, 1),
      history: [],
      ...overrides,
    };
  }

  it("counts consecutive met months ending at the reference month", () => {
    const transactions = [
      tx({ amount: 500, date: new Date(2026, 7, 10), category: CAT_FOOD }), // Aug: met
      tx({ amount: 500, date: new Date(2026, 6, 10), category: CAT_FOOD }), // Jul: met
      tx({ amount: 1500, date: new Date(2026, 5, 10), category: CAT_FOOD }), // Jun: exceeded
    ];
    const [row] = computeBudgetStreaks([monthlyBudget()], transactions, new Date(2026, 7, 20), 3);
    expect(row.streakMonths).toBe(2);
    expect(row.status).toBe("ok");
    expect(row.monthlySeries).toHaveLength(3);
    expect(row.monthlySeries[row.monthlySeries.length - 1]).toMatchObject({ actual: 500, goal: 1000, met: true });
  });

  it("has a 0 streak and 'over' status when the reference month itself is exceeded", () => {
    const transactions = [tx({ amount: 1500, date: new Date(2026, 7, 10), category: CAT_FOOD })];
    const [row] = computeBudgetStreaks([monthlyBudget()], transactions, new Date(2026, 7, 20), 3);
    expect(row.streakMonths).toBe(0);
    expect(row.status).toBe("over");
    expect(row.pct).toBeCloseTo(150, 5);
  });

  it("flags 'warning' between 80% and 100% of the limit", () => {
    const transactions = [tx({ amount: 850, date: new Date(2026, 7, 10), category: CAT_FOOD })];
    const [row] = computeBudgetStreaks([monthlyBudget()], transactions, new Date(2026, 7, 20), 1);
    expect(row.status).toBe("warning");
  });
});

describe("detectSubscriptions", () => {
  it("flags a same-name, stable-amount bill repeating across months as a subscription", () => {
    const transactions = [
      tx({ amount: 199, date: new Date(2026, 7, 3), category: CAT_FOOD, name: "Netflix", account: ACCOUNT_A }),
      tx({ amount: 199, date: new Date(2026, 6, 3), category: CAT_FOOD, name: "Netflix", account: ACCOUNT_A }),
      tx({ amount: 199, date: new Date(2026, 5, 3), category: CAT_FOOD, name: "Netflix", account: ACCOUNT_A }),
    ];
    const [sub] = detectSubscriptions(transactions, new Date(2026, 7, 20), 3, 6);
    expect(sub).toMatchObject({ name: "Netflix", amount: 199 });
    expect(sub.occurrences).toHaveLength(3);
    expect(sub.occurrences[0]).toMatchObject({ amount: 199 });
  });

  it("does not flag a one-off transaction that only appears once", () => {
    const transactions = [tx({ amount: 199, date: new Date(2026, 7, 3), category: CAT_FOOD, name: "One-off" })];
    expect(detectSubscriptions(transactions, new Date(2026, 7, 20), 3, 6)).toHaveLength(0);
  });

  it("does not flag a repeating name whose amount varies too much", () => {
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 3), category: CAT_FOOD, name: "Variable" }),
      tx({ amount: 400, date: new Date(2026, 6, 3), category: CAT_FOOD, name: "Variable" }),
    ];
    expect(detectSubscriptions(transactions, new Date(2026, 7, 20), 3, 6)).toHaveLength(0);
  });

  it("marks isNew when the subscription has no occurrence before the lookback window", () => {
    const transactions = [
      tx({ amount: 99, date: new Date(2026, 7, 3), category: CAT_FOOD, name: "New Sub" }),
      tx({ amount: 99, date: new Date(2026, 6, 3), category: CAT_FOOD, name: "New Sub" }),
    ];
    const [sub] = detectSubscriptions(transactions, new Date(2026, 7, 20), 3, 6);
    expect(sub.isNew).toBe(true);
  });

  it("marks isNew false when it also occurred earlier in the wider history window", () => {
    const transactions = [
      tx({ amount: 99, date: new Date(2026, 7, 3), category: CAT_FOOD, name: "Old Sub" }),
      tx({ amount: 99, date: new Date(2026, 6, 3), category: CAT_FOOD, name: "Old Sub" }),
      tx({ amount: 99, date: new Date(2026, 3, 3), category: CAT_FOOD, name: "Old Sub" }),
    ];
    const [sub] = detectSubscriptions(transactions, new Date(2026, 7, 20), 3, 6);
    expect(sub.isNew).toBe(false);
  });
});

describe("findBiggestSpendPatterns", () => {
  it("returns null when there's nothing in the lookback window", () => {
    expect(findBiggestSpendPatterns([], new Date(2026, 7, 20), 12)).toBeNull();
  });

  it("measures each ratio against the right base and flags when the biggest transaction sits in a different category than the biggest category", () => {
    const transactions = [
      tx({
        amount: 5000,
        date: new Date(2026, 7, 1),
        category: CAT_FOOD,
        subCategory: { _id: "sub-restaurant", name: "Restaurant" },
        tags: [{ _id: "tag-trip", name: "Trip" }],
        name: "Big Dinner",
      }),
      tx({
        amount: 3000,
        date: new Date(2026, 6, 1),
        category: CAT_HEALTH,
        subCategory: { _id: "sub-dental", name: "Dental" },
        tags: [{ _id: "tag-insurance", name: "Insurance" }],
      }),
      tx({
        amount: 3000,
        date: new Date(2026, 5, 1),
        category: CAT_HEALTH,
        subCategory: { _id: "sub-dental", name: "Dental" },
        tags: [{ _id: "tag-insurance", name: "Insurance" }],
      }),
    ];
    const result = findBiggestSpendPatterns(transactions, new Date(2026, 7, 20), 12);

    expect(result.biggestTransaction).toMatchObject({ name: "Big Dinner", amount: 5000, categoryName: "Food", tags: ["Trip"] });
    expect(result.biggestCategory).toMatchObject({ name: "Health", total: 6000 });
    expect(result.biggestSubcategory).toMatchObject({ name: "Dental", categoryName: "Health", total: 6000 });
    expect(result.mostCommonCategoryTag).toEqual({ name: "Insurance", count: 2 });
    expect(result.analysis.transactionIsInBiggestCategory).toBe(false);
    expect(result.analysis.subcategoryBelongsToBiggestCategory).toBe(true);
    expect(result.analysis.transactionIsBiggestSubcategory).toBe(false);
    expect(result.analysis.categoryShareOfTotal).toBeCloseTo((6000 / 11000) * 100, 5);
    // Measured against Food's OWN total (5000), not the biggest category's (Health, 6000).
    expect(result.analysis.transactionShareOfCategory).toBeCloseTo(100, 5);
    expect(result.analysis.transactionSharesTopCategoryTag).toBe(false);
    expect(result.lookbackRange.start).toEqual(new Date(2025, 8, 1, 0, 0, 0, 0));
    expect(result.lookbackRange.end).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
  });

  it("flags when the biggest transaction, category, and a shared tag all line up", () => {
    const transactions = [
      tx({
        amount: 1000,
        date: new Date(2026, 7, 1),
        category: CAT_FOOD,
        subCategory: { _id: "sub-snacks", name: "Snacks" },
        tags: [{ _id: "tag-party", name: "Party" }],
        name: "Party Snacks",
      }),
      tx({
        amount: 200,
        date: new Date(2026, 6, 1),
        category: CAT_FOOD,
        subCategory: { _id: "sub-snacks", name: "Snacks" },
        tags: [{ _id: "tag-party", name: "Party" }],
      }),
    ];
    const result = findBiggestSpendPatterns(transactions, new Date(2026, 7, 20), 12);

    expect(result.analysis.transactionIsInBiggestCategory).toBe(true);
    expect(result.analysis.transactionIsBiggestSubcategory).toBe(true);
    expect(result.analysis.transactionSharesTopCategoryTag).toBe(true);
    expect(result.analysis.transactionShareOfCategory).toBeCloseTo((1000 / 1200) * 100, 5);
  });
});

describe("computeMonthlyChampions", () => {
  it("returns one chronologically-ordered entry per month, each pct measured against the whole window total", () => {
    const transactions = [
      tx({ amount: 1000, date: new Date(2026, 6, 5), category: CAT_FOOD, subCategory: { _id: "sub-snacks", name: "Snacks" }, name: "July Big" }),
      tx({ amount: 3000, date: new Date(2026, 7, 5), category: CAT_HEALTH, subCategory: { _id: "sub-dental", name: "Dental" }, name: "August Big" }),
    ];
    const result = computeMonthlyChampions(transactions, new Date(2026, 7, 20), 2);

    expect(result.windowTotal).toBe(4000);
    expect(result.months).toHaveLength(2);
    expect(result.months[0].label).toBe("July 2026");
    expect(result.months[1].label).toBe("August 2026");

    expect(result.months[0].biggestTransaction).toMatchObject({ name: "July Big", amount: 1000 });
    expect(result.months[0].biggestCategory).toMatchObject({ name: "Food", total: 1000, pctOfWindowTotal: 25 });
    expect(result.months[0].biggestSubcategory).toMatchObject({ name: "Snacks", categoryName: "Food", categoryColor: CAT_FOOD.color, categoryIcon: CAT_FOOD.icon });

    expect(result.months[1].biggestCategory).toMatchObject({ name: "Health", total: 3000, pctOfWindowTotal: 75 });
  });

  it("returns null champions for a month with no bills, without breaking other months", () => {
    const transactions = [tx({ amount: 1000, date: new Date(2026, 7, 5), category: CAT_FOOD })];
    const result = computeMonthlyChampions(transactions, new Date(2026, 7, 20), 2);
    expect(result.months[0].biggestTransaction).toBeNull();
    expect(result.months[0].total).toBe(0);
    expect(result.months[1].biggestTransaction).toMatchObject({ amount: 1000 });
    expect(result.months[1].total).toBe(1000);
  });
});

describe("computeMonthlyChampionsForRange", () => {
  it("windows exactly the selected range's calendar months, not a lookback from an unrelated anchor", () => {
    // Range is Q3 (Jul-Sep) 2026; a July transaction and one just outside
    // the range (June) confirm the window starts at range.start's month,
    // not "N months back from today."
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30, 23, 59, 59, 999) };
    const today = new Date(2027, 0, 1); // long after the range - shouldn't clamp anything here
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 5, 15), category: CAT_FOOD }), // June - outside range
      tx({ amount: 500, date: new Date(2026, 6, 10), category: CAT_FOOD }), // July - inside range
    ];
    const result = computeMonthlyChampionsForRange(transactions, range, today);
    expect(result.months).toHaveLength(3); // Jul, Aug, Sep
    expect(result.months[0].label).toBe("July 2026");
    expect(result.months[0].total).toBe(500);
    expect(result.windowTotal).toBe(500);
  });

  it("clamps the window to today when range.end is still in the future", () => {
    const range = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31, 23, 59, 59, 999) };
    const today = new Date(2026, 2, 15); // March 15 - only Jan/Feb/Mar have happened
    const transactions = [tx({ amount: 100, date: new Date(2026, 1, 5), category: CAT_FOOD })];
    const result = computeMonthlyChampionsForRange(transactions, range, today);
    expect(result.months).toHaveLength(3); // Jan, Feb, Mar - not all 12
  });

  it("returns an empty window when the range hasn't started yet", () => {
    const range = { start: new Date(2027, 0, 1), end: new Date(2027, 11, 31, 23, 59, 59, 999) };
    const today = new Date(2026, 5, 1);
    const result = computeMonthlyChampionsForRange([], range, today);
    expect(result.months).toEqual([]);
  });
});

describe("findPeakMonth", () => {
  it("picks the month with the highest total, ignoring months with no spend", () => {
    const monthlyChampions = {
      months: [
        { label: "July 2026", range: { start: new Date(2026, 6, 1) }, total: 500 },
        { label: "August 2026", range: { start: new Date(2026, 7, 1) }, total: 0 },
        { label: "September 2026", range: { start: new Date(2026, 8, 1) }, total: 1200 },
      ],
    };
    expect(findPeakMonth(monthlyChampions).label).toBe("September 2026");
  });

  it("returns null when every month has zero spend", () => {
    const monthlyChampions = { months: [{ label: "July 2026", range: { start: new Date(2026, 6, 1) }, total: 0 }] };
    expect(findPeakMonth(monthlyChampions)).toBeNull();
  });
});

describe("computeQuarterTotals / findPeakQuarter", () => {
  it("buckets months into real calendar quarters and finds the busiest one", () => {
    const monthlyChampions = {
      months: [
        { label: "January 2026", range: { start: new Date(2026, 0, 1) }, total: 100 },
        { label: "April 2026", range: { start: new Date(2026, 3, 1) }, total: 900 },
        { label: "May 2026", range: { start: new Date(2026, 4, 1) }, total: 300 },
      ],
    };
    const quarters = computeQuarterTotals(monthlyChampions);
    expect(quarters).toEqual([
      { label: "Q1 2026", year: 2026, quarter: 1, total: 100, months: [{ label: "January 2026", total: 100 }] },
      {
        label: "Q2 2026",
        year: 2026,
        quarter: 2,
        total: 1200,
        months: [
          { label: "April 2026", total: 900 },
          { label: "May 2026", total: 300 },
        ],
      },
    ]);
    expect(findPeakQuarter(quarters).label).toBe("Q2 2026");
  });
});

describe("computeSpendingPace", () => {
  it("compares spend-through-today against the same-day average of prior months", () => {
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 10), category: CAT_FOOD }), // this month, day 10
      tx({ amount: 100, date: new Date(2026, 7, 25), category: CAT_FOOD }), // this month, after "today" - excluded
      tx({ amount: 40, date: new Date(2026, 6, 10), category: CAT_FOOD }), // last month, day 10
      tx({ amount: 60, date: new Date(2026, 5, 10), category: CAT_FOOD }), // 2 months ago, day 10
    ];
    const pace = computeSpendingPace(transactions, new Date(2026, 7, 15), true, 2, new Date(2026, 7, 15));
    expect(pace.spentSoFar).toBe(100);
    expect(pace.avgPaceForSameDay).toBe(50);
    expect(pace.deltaPct).toBe(100);
    expect(pace.dayOfMonth).toBe(15);
    expect(pace.monthlyDetail).toHaveLength(2);
    expect(pace.monthlyDetail[pace.monthlyDetail.length - 1]).toMatchObject({ label: "July 2026", throughDay: 15, amount: 40 });
  });

  it("caps the comparison day for a shorter prior month", () => {
    const transactions = [tx({ amount: 30, date: new Date(2026, 1, 28), category: CAT_FOOD })]; // Feb 2026, last day
    const pace = computeSpendingPace(transactions, new Date(2026, 2, 31), true, 1, new Date(2026, 2, 31));
    expect(pace.avgPaceForSameDay).toBe(30);
  });

  it("uses the actual current day when the reference month is the real current month", () => {
    const today = new Date(2026, 7, 15);
    const transactions = [tx({ amount: 100, date: new Date(2026, 7, 10), category: CAT_FOOD })];
    const pace = computeSpendingPace(transactions, new Date(2026, 7, 1), true, 1, today);
    expect(pace.dayOfMonth).toBe(15);
  });

  it("uses the reference month's last day (a full-month comparison) when it's a past, elapsed month", () => {
    const today = new Date(2026, 7, 15); // viewing/today is August, reference is July (past)
    const transactions = [tx({ amount: 100, date: new Date(2026, 6, 20), category: CAT_FOOD })];
    const pace = computeSpendingPace(transactions, new Date(2026, 6, 1), true, 1, today);
    expect(pace.dayOfMonth).toBe(31);
    expect(pace.spentSoFar).toBe(100);
  });
});

describe("computeSpendingByWeekday", () => {
  // August 2026: Mon/Sat/Sun occur 5x, Tue/Wed/Thu/Fri occur 4x.
  it("counts how many of each weekday occurred in the month", () => {
    const result = computeSpendingByWeekday([], new Date(2026, 7, 15));
    expect(result.days[0]).toMatchObject({ dayName: "Lunes", occurrences: 5 }); // Monday
    expect(result.days[1]).toMatchObject({ dayName: "Martes", occurrences: 4 }); // Tuesday
    expect(result.days[5]).toMatchObject({ dayName: "Sábado", occurrences: 5 });
    expect(result.days[6]).toMatchObject({ dayName: "Domingo", occurrences: 5 });
  });

  it("calls out a single dominant day over the broad weekday/weekend split", () => {
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 5) }), // Wednesday
      tx({ amount: 100, date: new Date(2026, 7, 12) }), // Wednesday
      tx({ amount: 100, date: new Date(2026, 7, 19) }), // Wednesday
    ];
    const result = computeSpendingByWeekday(transactions, new Date(2026, 7, 15));
    expect(result.insight).toContain("miércoles");
  });

  it("flags a weekend pattern when weekday and weekend avgs both matter but weekends clearly win", () => {
    const transactions = [
      tx({ amount: 200, date: new Date(2026, 7, 1) }), // Saturday
      tx({ amount: 200, date: new Date(2026, 7, 2) }), // Sunday
    ];
    const result = computeSpendingByWeekday(transactions, new Date(2026, 7, 15));
    expect(result.insight).toBe("Sueles gastar más los fines de semana este mes.");
  });

  it("reports no clear pattern when spend is roughly even across the week", () => {
    const transactions = [1, 2, 3, 4, 5, 6, 7].map((d) => tx({ amount: 100, date: new Date(2026, 7, d) }));
    const result = computeSpendingByWeekday(transactions, new Date(2026, 7, 15));
    expect(result.insight).toBe("Sin un patrón claro por día de la semana este mes.");
  });

  it("reports no spend when the month is empty", () => {
    const result = computeSpendingByWeekday([], new Date(2026, 7, 15));
    expect(result.insight).toBe("Sin gastos este mes para detectar un patrón.");
  });

  it("builds a complete day-by-day breakdown and buckets it into day-range weeks", () => {
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 5) }), // Aug 5 -> week 1 (days 1-7)
      tx({ amount: 300, date: new Date(2026, 7, 20) }), // Aug 20 -> week 3 (days 15-21)
    ];
    const result = computeSpendingByWeekday(transactions, new Date(2026, 7, 15));

    expect(result.dailyBreakdown).toHaveLength(31);
    expect(result.dailyBreakdown[4]).toMatchObject({ dayOfMonth: 5, dayName: "Miércoles", total: 100, count: 1 });
    expect(result.dailyBreakdown[19]).toMatchObject({ dayOfMonth: 20, dayName: "Jueves", total: 300, count: 1 });
    expect(result.dailyBreakdown[0]).toMatchObject({ dayOfMonth: 1, total: 0, count: 0 });

    expect(result.weeks).toHaveLength(5); // 1-7, 8-14, 15-21, 22-28, 29-31
    expect(result.weeks[0]).toMatchObject({ label: "Días 1-7", total: 100, count: 1 });
    expect(result.weeks[2]).toMatchObject({ label: "Días 15-21", total: 300, count: 1 });
    expect(result.weeks[4]).toMatchObject({ label: "Días 29-31", total: 0, count: 0 });
  });
});

describe("generateInsights", () => {
  const baseFacts = {
    budgetRows: [],
    categoryAnomaly: null,
    topCategoriesBills: [],
    subscriptions: [],
    savingsHistory: [],
  };

  it("emits a warning for a budget currently over its limit, carrying the row as structured data", () => {
    const row = { category: "Gym", limit: 1000, spent: 1200, pct: 120, streakMonths: 0, status: "over" };
    const insights = generateInsights({ ...baseFacts, budgetRows: [row] });
    expect(insights[0]).toMatchObject({ tone: "warning", title: "Gym superó su presupuesto", type: "budget", data: row });
  });

  it("emits a category anomaly insight when provided, carrying structured data (not a baked string)", () => {
    const anomaly = { name: "Restaurant", current: 4586, average: 3320, changePct: 38 };
    const insights = generateInsights({ ...baseFacts, categoryAnomaly: anomaly });
    const insight = insights.find((i) => i.title.includes("Restaurant"));
    expect(insight).toMatchObject({ type: "category_anomaly", data: anomaly });
    expect(insight.detail).toBeUndefined();
  });

  it("emits a new-category insight", () => {
    const insights = generateInsights({
      ...baseFacts,
      topCategoriesBills: [{ name: "Pets", current: 850, previous: 0, changePct: null, isNew: true }],
    });
    expect(insights.some((i) => i.title.includes("Pets"))).toBe(true);
  });

  it("emits a new-subscription insight", () => {
    const insights = generateInsights({
      ...baseFacts,
      subscriptions: [{ name: "SHAPR3D", categoryName: "E-accounts", amount: 654, isNew: true }],
    });
    expect(insights.some((i) => i.title.includes("SHAPR3D"))).toBe(true);
  });

  it("emits a streak insight only at 2+ months", () => {
    const oneMonth = generateInsights({
      ...baseFacts,
      budgetRows: [{ category: "Transport", limit: 100, spent: 50, pct: 50, streakMonths: 1, status: "ok" }],
    });
    expect(oneMonth.some((i) => i.title.includes("Racha"))).toBe(false);

    const twoMonths = generateInsights({
      ...baseFacts,
      budgetRows: [{ category: "Transport", limit: 100, spent: 50, pct: 50, streakMonths: 2, status: "ok" }],
    });
    expect(twoMonths.some((i) => i.title.includes("Racha"))).toBe(true);
  });

  it("flags the best savings rate when current is the max of the history", () => {
    const insights = generateInsights({ ...baseFacts, savingsHistory: [0.8, 0.5, 0.4] });
    expect(insights.some((i) => i.title.includes("Mejor tasa"))).toBe(true);
  });

  it("flags the worst savings rate when current is the min of the history", () => {
    const insights = generateInsights({ ...baseFacts, savingsHistory: [0.1, 0.5, 0.4] });
    expect(insights.some((i) => i.title.includes("más baja"))).toBe(true);
  });

  it("caps at 5 insights, warnings first", () => {
    const insights = generateInsights({
      budgetRows: [
        { category: "Gym", limit: 100, spent: 200, pct: 200, streakMonths: 0, status: "over" },
      ],
      categoryAnomaly: { name: "Restaurant", current: 100, average: 50, changePct: 100 },
      topCategoriesBills: [{ name: "Pets", current: 10, previous: 0, changePct: null, isNew: true }],
      subscriptions: [{ name: "Sub", categoryName: "X", amount: 10, isNew: true }],
      savingsHistory: [0.8, 0.1, 0.2],
    });
    expect(insights.length).toBeLessThanOrEqual(5);
    expect(insights[0].tone).toBe("warning");
  });
});

describe("buildWalletAnalyzerSnapshot", () => {
  it("assembles every section without throwing on a realistic multi-month dataset", () => {
    const transactions = [
      tx({ amount: 5000, date: new Date(2026, 7, 1), isBill: false, name: "Salary" }),
      tx({ amount: 400, date: new Date(2026, 7, 5), category: CAT_FOOD, name: "Groceries" }),
      tx({ amount: 300, date: new Date(2026, 6, 5), category: CAT_FOOD, name: "Groceries" }),
      tx({ amount: 200, date: new Date(2026, 5, 5), category: CAT_HEALTH, name: "Doctor" }),
    ];
    const budgets = [
      {
        _id: "b1",
        budgetType: "spending",
        period: "monthly",
        goalAmount: 500,
        category: CAT_FOOD,
        createdAt: new Date(2025, 0, 1),
        history: [],
      },
    ];
    const snapshot = buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate: new Date(2026, 7, 20) });

    expect(snapshot.currentTotals.income).toBe(5000);
    expect(snapshot.topCategoriesBills[0].name).toBe("Food");
    expect(snapshot.trend).toHaveLength(6);
    expect(snapshot.budgetRows).toHaveLength(1);
    expect(Array.isArray(snapshot.insights)).toBe(true);
  });
});

describe("getSnapshotLookbackStart", () => {
  it("returns the 1st of the month 11 months before the reference date (a 12-month window inclusive of the reference month)", () => {
    const start = getSnapshotLookbackStart(new Date(2026, 7, 20)); // August 2026
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(8); // September (0-indexed) - Sep 2025..Aug 2026 = 12 months
    expect(start.getDate()).toBe(1);
  });

  it("rolls the year back correctly near a year boundary", () => {
    const start = getSnapshotLookbackStart(new Date(2026, 1, 10)); // February 2026
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(2); // March 2025
  });
});

describe("buildCuratedWalletSummary", () => {
  it("strips monthlySeries from every budget row and caps top lists at 6, while keeping every other summary section", () => {
    const transactions = [
      tx({ amount: 5000, date: new Date(2026, 7, 1), isBill: false, name: "Salary" }),
      ...Array.from({ length: 8 }, (_, i) =>
        tx({
          amount: 100 + i,
          date: new Date(2026, 7, 2),
          category: { _id: `cat-${i}`, name: `Category ${i}`, color: "#f00", icon: "md/MdFastfood" },
          name: `Expense ${i}`,
        })
      ),
    ];
    const budgets = [
      {
        _id: "b1",
        budgetType: "spending",
        period: "monthly",
        goalAmount: 500,
        category: CAT_FOOD,
        createdAt: new Date(2025, 0, 1),
        history: [],
      },
    ];
    const snapshot = buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate: new Date(2026, 7, 20) });
    const curated = buildCuratedWalletSummary(snapshot);

    expect(curated.budgetRows).toHaveLength(snapshot.budgetRows.length);
    curated.budgetRows.forEach((row) => {
      expect(row).not.toHaveProperty("monthlySeries");
      expect(row).toHaveProperty("category");
      expect(row).toHaveProperty("streakMonths");
    });
    // A "budget"-type insight card (see generateInsights) embeds a full
    // budgetRows entry as its own `data` - regression check for the bug
    // caught in real end-to-end testing: curating the top-level budgetRows
    // array alone doesn't stop monthlySeries from leaking back in through
    // an insight card that references the same uncurated row.
    curated.insights
      .filter((i) => i.type === "budget")
      .forEach((i) => expect(i.data).not.toHaveProperty("monthlySeries"));
    expect(curated.topCategoriesBills.length).toBeLessThanOrEqual(6);
    expect(curated.topTransactionsBills.current.length).toBeLessThanOrEqual(6);
    expect(curated.topTransactionsBills.previous.length).toBeLessThanOrEqual(6);
    expect(curated.currentTotals).toEqual(snapshot.currentTotals);
    // Not a deep-equal against snapshot.insights - a "budget"-type insight's
    // data is deliberately rewritten (monthlySeries stripped) above.
    // Non-budget insights (title/type/tone/icon) still pass through as-is.
    expect(curated.insights.map((i) => i.title)).toEqual(snapshot.insights.map((i) => i.title));
    // Fields deliberately dropped from the curated payload - the whole
    // point of this function - should not leak through.
    expect(curated).not.toHaveProperty("monthlyChampions");
    expect(curated).not.toHaveProperty("biggestSpendPatterns");
    expect(curated).not.toHaveProperty("topCategoriesBillsPrevious");
    expect(curated).not.toHaveProperty("trend");
  });
});

describe("buildMonthComparison", () => {
  it("compares two non-adjacent months directly, not just consecutive ones", () => {
    const transactions = [
      // January 2026
      tx({ amount: 1000, date: new Date(2026, 0, 5), category: CAT_FOOD, name: "Groceries" }),
      // March 2026 - one month skipped (February) in between
      tx({ amount: 300, date: new Date(2026, 2, 5), category: CAT_FOOD, name: "Groceries" }),
      tx({ amount: 3000, date: new Date(2026, 2, 1), isBill: false, name: "Salary" }),
    ];

    const comparison = buildMonthComparison({
      transactions,
      monthADate: new Date(2026, 0, 15), // January
      monthBDate: new Date(2026, 2, 15), // March
    });

    expect(comparison.monthA.label).toBe("January 2026");
    expect(comparison.monthB.label).toBe("March 2026");
    expect(comparison.monthA.totals.expense).toBe(1000);
    expect(comparison.monthB.totals.expense).toBe(300);
    expect(comparison.monthB.totals.income).toBe(3000);

    const food = comparison.categoriesBills.find((c) => c.name === "Food");
    expect(food.current).toBe(1000); // monthA (January)
    expect(food.previous).toBe(300); // monthB (March)
  });

  it("handles a month with zero activity on either side without throwing", () => {
    const transactions = [tx({ amount: 500, date: new Date(2026, 5, 1), category: CAT_FOOD })];
    const comparison = buildMonthComparison({
      transactions,
      monthADate: new Date(2026, 5, 1),
      monthBDate: new Date(2025, 0, 1),
    });
    expect(comparison.monthB.totals.expense).toBe(0);
    expect(comparison.categoriesBills.length).toBeGreaterThan(0);
  });
});

describe("buildBudgetPeriodChanges", () => {
  function monthlyBudget(overrides = {}) {
    return {
      _id: "b1",
      budgetType: "spending",
      period: "monthly",
      goalAmount: 1000,
      category: CAT_FOOD,
      createdAt: new Date(2025, 0, 1),
      history: [],
      ...overrides,
    };
  }

  it("sums actual/goal across each range and reports compliance per period", () => {
    const transactions = [
      // Q1 2026 - Jan/Feb/Mar, each under the 1000 monthly goal
      tx({ amount: 500, date: new Date(2026, 0, 10), category: CAT_FOOD }),
      tx({ amount: 500, date: new Date(2026, 1, 10), category: CAT_FOOD }),
      tx({ amount: 500, date: new Date(2026, 2, 10), category: CAT_FOOD }),
      // Q1 2025 (comparison period) - Feb exceeds the goal
      tx({ amount: 400, date: new Date(2025, 0, 10), category: CAT_FOOD }),
      tx({ amount: 1500, date: new Date(2025, 1, 10), category: CAT_FOOD }),
      tx({ amount: 400, date: new Date(2025, 2, 10), category: CAT_FOOD }),
    ];
    const rangeA = { start: new Date(2026, 0, 1), end: new Date(2026, 2, 31, 23, 59, 59, 999) };
    const rangeB = { start: new Date(2025, 0, 1), end: new Date(2025, 2, 31, 23, 59, 59, 999) };

    const [row] = buildBudgetPeriodChanges([monthlyBudget()], transactions, rangeA, rangeB);

    expect(row.category).toBe("Food");
    expect(row.periodA).toMatchObject({ actual: 1500, goal: 3000, monthsTracked: 3, monthsMet: 3 });
    expect(row.periodB).toMatchObject({ actual: 2300, goal: 3000, monthsTracked: 3, monthsMet: 2 });
  });

  it("still includes a budget with no tracked months in one of the two ranges", () => {
    // buildBudgetHistoricalComparative excludes months that haven't
    // started yet - a rangeB entirely in the future has nothing to track,
    // while rangeA (the past) has real data.
    const budget = monthlyBudget();
    const transactions = [tx({ amount: 200, date: new Date(2026, 5, 10), category: CAT_FOOD })];
    const rangeA = { start: new Date(2026, 5, 1), end: new Date(2026, 5, 30, 23, 59, 59, 999) };
    const rangeB = { start: new Date(2099, 0, 1), end: new Date(2099, 11, 31, 23, 59, 59, 999) };

    const [row] = buildBudgetPeriodChanges([budget], transactions, rangeA, rangeB);
    expect(row.periodA).not.toBeNull();
    expect(row.periodB).toBeNull();
  });
});

describe("buildPeriodComparison", () => {
  it("compares two arbitrary multi-month ranges (a quarter vs. the same quarter last year)", () => {
    const transactions = [
      tx({ amount: 1000, date: new Date(2026, 0, 5), category: CAT_FOOD, name: "Groceries" }),
      tx({ amount: 500, date: new Date(2026, 2, 5), category: CAT_FOOD, name: "Groceries" }),
      tx({ amount: 4000, date: new Date(2026, 1, 1), isBill: false, name: "Salary" }),
      tx({ amount: 300, date: new Date(2025, 0, 5), category: CAT_FOOD, name: "Groceries" }),
    ];
    const rangeA = { start: new Date(2026, 0, 1), end: new Date(2026, 2, 31, 23, 59, 59, 999) };
    const rangeB = { start: new Date(2025, 0, 1), end: new Date(2025, 2, 31, 23, 59, 59, 999) };

    const comparison = buildPeriodComparison({
      transactions,
      budgets: [],
      rangeA,
      rangeB,
      labelA: "Q1 2026",
      labelB: "Q1 2025",
    });

    expect(comparison.periodA.label).toBe("Q1 2026");
    expect(comparison.periodB.label).toBe("Q1 2025");
    expect(comparison.periodA.totals.expense).toBe(1500);
    expect(comparison.periodA.totals.income).toBe(4000);
    expect(comparison.periodB.totals.expense).toBe(300);

    const food = comparison.categoriesBills.find((c) => c.name === "Food");
    expect(food.current).toBe(1500);
    expect(food.previous).toBe(300);
    expect(comparison.budgetChanges).toEqual([]);
  });

  it("includes budgetChanges when budgets are passed", () => {
    const budget = {
      _id: "b1",
      budgetType: "spending",
      period: "monthly",
      goalAmount: 1000,
      category: CAT_FOOD,
      createdAt: new Date(2020, 0, 1),
      history: [],
    };
    const transactions = [tx({ amount: 500, date: new Date(2026, 0, 10), category: CAT_FOOD })];
    const rangeA = { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31, 23, 59, 59, 999) };
    const rangeB = { start: new Date(2025, 0, 1), end: new Date(2025, 0, 31, 23, 59, 59, 999) };

    const comparison = buildPeriodComparison({
      transactions,
      budgets: [budget],
      rangeA,
      rangeB,
      labelA: "January 2026",
      labelB: "January 2025",
    });

    expect(comparison.budgetChanges).toHaveLength(1);
    expect(comparison.budgetChanges[0].periodA).toMatchObject({ actual: 500, goal: 1000 });
  });
});

describe("getPrecedingPeriods", () => {
  it("builds N equal-width periods immediately before the given range, oldest first", () => {
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 31, 23, 59, 59, 999) }; // July (31 days)
    const periods = getPrecedingPeriods(range, 2);
    expect(periods).toHaveLength(2);
    // June (30 days) immediately before July - same 31-day width as `range`,
    // so it reaches back into May.
    expect(periods[1].end).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999));
    expect(periods[1].start).toEqual(new Date(2026, 4, 31, 0, 0, 0, 0));
    // No gap and no overlap between consecutive periods.
    expect(periods[0].end.getTime() + 1).toBe(periods[1].start.getTime());
    expect(periods[1].end.getTime() + 1).toBe(range.start.getTime());
  });

  it("works for a non-month-width range (a quarter)", () => {
    const q3 = { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30, 23, 59, 59, 999) }; // Q3: Jul-Sep
    const [q2] = getPrecedingPeriods(q3, 1);
    const widthDays = Math.round((q3.end - q3.start) / 86400000) + 1;
    const q2WidthDays = Math.round((q2.end - q2.start) / 86400000) + 1;
    expect(q2WidthDays).toBe(widthDays);
    expect(q2.end.getTime() + 1).toBe(q3.start.getTime());
  });
});

describe("computeTrendForRange", () => {
  it("buckets a quarter-width range into periodsBack quarters, oldest first", () => {
    const q3 = { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30, 23, 59, 59, 999) };
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 7, 15), category: CAT_FOOD }), // inside Q3
      tx({ amount: 50, date: new Date(2026, 3, 15), category: CAT_FOOD }), // ~1 quarter before Q3
    ];
    const trend = computeTrendForRange(transactions, q3, 2);
    expect(trend).toHaveLength(2);
    expect(trend[1].expense).toBe(100); // Q3 itself, last
    expect(trend[0].expense).toBeGreaterThanOrEqual(0);
  });
});

describe("computeSpendingPaceForRange", () => {
  it("compares spend-so-far against the same elapsed-day mark in preceding periods", () => {
    const range = { start: new Date(2026, 0, 1), end: new Date(2026, 2, 31, 23, 59, 59, 999) }; // Q1 2026, closed
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 0, 10), category: CAT_FOOD }),
      tx({ amount: 40, date: new Date(2025, 9, 10), category: CAT_FOOD }), // same elapsed-day mark, preceding period
    ];
    const pace = computeSpendingPaceForRange(transactions, range, true, 1, new Date(2027, 0, 1));
    expect(pace.spentSoFar).toBe(100);
    expect(pace.avgPaceForSameDay).toBe(40);
    expect(pace.periodWidthDays).toBe(90);
  });
});

describe("findBiggestSpendPatternsForRange", () => {
  it("finds the biggest transaction/category within an arbitrary range", () => {
    const range = { start: new Date(2026, 0, 1), end: new Date(2026, 2, 31, 23, 59, 59, 999) };
    const transactions = [
      tx({ amount: 5000, date: new Date(2026, 1, 5), category: CAT_HEALTH, name: "Surgery" }),
      tx({ amount: 100, date: new Date(2026, 1, 6), category: CAT_FOOD }),
    ];
    const patterns = findBiggestSpendPatternsForRange(transactions, range);
    expect(patterns.biggestTransaction.name).toBe("Surgery");
    expect(patterns.biggestCategory.name).toBe("Health");
    expect(patterns.lookbackRange).toEqual(range);
  });

  it("returns null when there are no bills in range", () => {
    expect(findBiggestSpendPatternsForRange([], { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) })).toBeNull();
  });
});

describe("computeCategoryHistoryAverageForRange", () => {
  it("averages a category's spend across periodsBack periods preceding the range", () => {
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30, 23, 59, 59, 999) }; // Q3
    const transactions = [
      tx({ amount: 300, date: new Date(2026, 3, 15), category: CAT_FOOD }), // Q2 (preceding)
      tx({ amount: 900, date: new Date(2026, 7, 15), category: CAT_FOOD }), // inside Q3 itself - excluded
    ];
    const { average, monthsOfHistory } = computeCategoryHistoryAverageForRange(transactions, "Food", true, range, 1);
    expect(average).toBe(300);
    expect(monthsOfHistory).toBe(1);
  });
});

describe("computeSpendingByWeekdayForRange", () => {
  it("spans the whole multi-month range, not just one calendar month", () => {
    const range = { start: new Date(2026, 0, 1), end: new Date(2026, 2, 31, 23, 59, 59, 999) };
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 0, 5), category: CAT_FOOD }),
      tx({ amount: 200, date: new Date(2026, 2, 20), category: CAT_FOOD }),
    ];
    const result = computeSpendingByWeekdayForRange(transactions, range);
    const totalAcrossDays = result.days.reduce((a, d) => a + d.total, 0);
    expect(totalAcrossDays).toBe(300);
    expect(result.weeks.length).toBeGreaterThan(4); // spans ~13 weeks, not ~4
  });
});

describe("buildPeriodSnapshot", () => {
  it("auto-computes the immediately preceding equal-width period, no explicit compare needed", () => {
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30, 23, 59, 59, 999) }; // Q3
    const transactions = [
      tx({ amount: 1000, date: new Date(2026, 7, 5), category: CAT_FOOD }),
      tx({ amount: 3000, date: new Date(2026, 8, 1), isBill: false, name: "Salary" }),
      tx({ amount: 400, date: new Date(2026, 4, 5), category: CAT_FOOD }), // Q2, the preceding period
    ];
    const snapshot = buildPeriodSnapshot({ transactions, budgets: [], range, periodsBack: 2 });
    expect(snapshot.currentTotals.expense).toBe(1000);
    expect(snapshot.currentTotals.income).toBe(3000);
    expect(snapshot.previousTotals.expense).toBe(400);
    expect(snapshot.currentRange).toEqual(range);
    expect(snapshot.trend).toHaveLength(2);
    expect(snapshot.insights).toBeInstanceOf(Array);
  });

  it("clamps budget/subscription/champion analysis to today when range.end is in the future", () => {
    // "All 2026" picked while today is still September - range.end (Dec
    // 31) is a future date. Real data exists Jan-Sep; anchoring at
    // range.end instead of today would ask these month-based functions
    // about months that haven't happened yet and come back empty even
    // though Sep has real, complete data.
    const range = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31, 23, 59, 59, 999) };
    const today = new Date(2026, 8, 15); // September 15, 2026 - still mid-year
    const budget = {
      _id: "b1",
      budgetType: "spending",
      period: "monthly",
      goalAmount: 1000,
      category: CAT_FOOD,
      createdAt: new Date(2025, 0, 1),
      history: [],
    };
    const transactions = [
      tx({ amount: 500, date: new Date(2026, 8, 10), category: CAT_FOOD, name: "Netflix" }),
      tx({ amount: 500, date: new Date(2026, 7, 10), category: CAT_FOOD, name: "Netflix" }),
    ];
    const snapshot = buildPeriodSnapshot({ transactions, budgets: [budget], range, periodsBack: 2, today });
    const [row] = snapshot.budgetRows;
    expect(row.spent).toBeGreaterThan(0); // not 0/0 from a future "last" month
    expect(snapshot.subscriptions.length).toBeGreaterThan(0); // Netflix detected
  });

  it("scales the default lookback down for a wide range instead of asking for 6x its width", () => {
    const yearRange = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31, 23, 59, 59, 999) };
    const transactions = [tx({ amount: 100, date: new Date(2026, 5, 15), category: CAT_FOOD })];
    // No periodsBack override - if the default still blindly used 6, this
    // would ask for 6 preceding YEARS; asserting it doesn't throw and
    // produces a small (not 6-long) trend confirms the scaled-down default.
    const snapshot = buildPeriodSnapshot({ transactions, budgets: [], range: yearRange });
    expect(snapshot.trend.length).toBeLessThan(6);
    expect(snapshot.trend.length).toBeGreaterThanOrEqual(2);
  });

  it("surfaces peak-month/peak-quarter insights for a wide range instead of coming back nearly empty", () => {
    // A full-year selection previously surfaced almost nothing in "Lo más
    // destacado del período" because generateInsights' conditions
    // (budget-over-limit, category anomaly, new category/subscription,
    // best streak, savings-rate swing) rarely fire across a long span.
    // These new period-native insights are the fix: they're derived
    // straight from monthlyChampions, which is always populated whenever
    // there's any spend in the range.
    const yearRange = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31, 23, 59, 59, 999) };
    const today = new Date(2026, 8, 15); // mid-September - year still in progress
    const transactions = [
      tx({ amount: 100, date: new Date(2026, 1, 10), category: CAT_FOOD }), // Feb
      tx({ amount: 5000, date: new Date(2026, 6, 10), category: CAT_FOOD }), // Jul - the peak
      tx({ amount: 200, date: new Date(2026, 7, 10), category: CAT_FOOD }), // Aug
    ];
    const snapshot = buildPeriodSnapshot({ transactions, budgets: [], range: yearRange, today });
    expect(snapshot.monthlyChampions.months).toHaveLength(9); // Jan-Sep, clamped to today
    expect(findPeakMonth(snapshot.monthlyChampions).label).toBe("July 2026");
    const types = snapshot.insights.map((i) => i.type);
    expect(types).toContain("peak_month");
    expect(types).toContain("peak_quarter");
  });
});
