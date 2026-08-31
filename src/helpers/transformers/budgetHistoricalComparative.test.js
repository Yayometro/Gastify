import { describe, it, expect } from "vitest";
import { buildBudgetHistoricalComparative } from "./budgetHistoricalComparative";

const CAT_FOOD = { _id: "cat-food", name: "Food", color: "#fff", icon: "md/MdFastfood" };

function tx({ amount, date, isBill = true, category = CAT_FOOD }) {
  return { amount, value: amount, date, isBill, category };
}

function monthlyBudget(overrides = {}) {
  return {
    _id: "b1",
    name: "Food budget",
    budgetType: "spending",
    period: "monthly",
    goalAmount: 1000,
    category: CAT_FOOD,
    createdAt: new Date(2025, 0, 1),
    history: [],
    ...overrides,
  };
}

describe("buildBudgetHistoricalComparative", () => {
  it("marks a month as met when actual spend is within the monthly goal", () => {
    const budget = monthlyBudget();
    const transactions = [tx({ amount: 500, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].monthsTracked).toBe(1);
    expect(rows[0].monthsMet).toBe(1);
    expect(rows[0].complianceRate).toBe(1);
    expect(rows[0].monthlySeries[0]).toMatchObject({ actual: 500, goal: 1000, met: true });
  });

  it("marks a month as exceeded when actual spend is over the monthly goal", () => {
    const budget = monthlyBudget();
    const transactions = [tx({ amount: 1500, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    expect(rows[0].monthsMet).toBe(0);
    expect(rows[0].monthsExceeded).toBe(1);
    expect(rows[0].monthlySeries[0].met).toBe(false);
  });

  it("divides a quarterly budget's goal by 3 for the monthly comparison", () => {
    const budget = monthlyBudget({ period: "quarterly", goalAmount: 3000 });
    // 900/month is under the 1000/month equivalent share of a 3000 quarterly goal.
    const transactions = [tx({ amount: 900, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    expect(rows[0].monthlySeries[0].goal).toBe(1000);
    expect(rows[0].monthlySeries[0].met).toBe(true);
  });

  it("extrapolates backward with the current goal for months before creation (no history), flagged estimated", () => {
    const budget = monthlyBudget({ createdAt: new Date(2026, 1, 1), goalAmount: 1000 }); // created Feb 2026
    const transactions = [
      tx({ amount: 2000, date: new Date(2026, 0, 15) }), // January - budget didn't exist yet
      tx({ amount: 500, date: new Date(2026, 1, 15) }), // February - exists, within goal
    ];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 1, 28),
    });

    // Both months now count - January's real spend is judged against the
    // current goal as an assumption, clearly marked estimated.
    expect(rows[0].monthsTracked).toBe(2);
    expect(rows[0].monthlySeries[0]).toMatchObject({ actual: 2000, goal: 1000, met: false, estimated: true });
    expect(rows[0].monthlySeries[1]).toMatchObject({ actual: 500, goal: 1000, met: true, estimated: false });
    expect(rows[0].monthsEstimated).toBe(1);
  });

  it("extrapolates backward with the earliest history entry's goal, not today's current goal", () => {
    const budget = monthlyBudget({
      goalAmount: 2000, // current goal (most recent history entry)
      history: [
        { goalAmount: 500, effectiveFrom: new Date(2026, 2, 1), effectiveTo: new Date(2026, 3, 1) },
        { goalAmount: 2000, effectiveFrom: new Date(2026, 3, 1), effectiveTo: null },
      ],
    });
    // January predates the earliest (March) history entry entirely.
    const transactions = [tx({ amount: 800, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    // Extrapolated using 500 (the earliest known goal), not 2000 (today's) -
    // 800 exceeds the 500 assumption.
    expect(rows[0].monthlySeries[0]).toMatchObject({ goal: 500, met: false, estimated: true });
  });

  it("uses the historical goalAmount active for a given month when history[] covers it", () => {
    const budget = monthlyBudget({
      goalAmount: 2000, // current goal
      history: [
        { goalAmount: 500, effectiveFrom: new Date(2026, 0, 1), effectiveTo: new Date(2026, 1, 1) },
      ],
    });
    const transactions = [tx({ amount: 800, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    // January's real goal was 500 (from history), not today's 2000 - 800 exceeds it.
    expect(rows[0].monthlySeries[0].goal).toBe(500);
    expect(rows[0].monthlySeries[0].met).toBe(false);
  });

  it("excludes months that haven't started yet, so an unfinished future doesn't inflate compliance", () => {
    const budget = monthlyBudget();
    // Only January has real spend (and it exceeds the goal). If Feb-Dec
    // were counted as "met" just because they have $0 actual, compliance
    // would misleadingly read as mostly-good instead of 0%.
    const transactions = [tx({ amount: 5000, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [budget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 11, 31),
      today: new Date(2026, 0, 20), // partway through January
    });

    expect(rows[0].monthsTracked).toBe(1);
    expect(rows[0].complianceRate).toBe(0);
  });

  it("excludes saving and project budgets entirely", () => {
    const savingBudget = monthlyBudget({ _id: "b2", budgetType: "saving", isSaving: true });
    const projectBudget = monthlyBudget({ _id: "b3", budgetType: "project" });
    const transactions = [tx({ amount: 100, date: new Date(2026, 0, 15) })];

    const rows = buildBudgetHistoricalComparative({
      budgets: [savingBudget, projectBudget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    expect(rows).toHaveLength(0);
  });

  it("sorts rows worst-compliance-first", () => {
    const goodCat = { _id: "good-cat", name: "Good" };
    const badCat = { _id: "bad-cat", name: "Bad" };
    const goodBudget = monthlyBudget({ _id: "good", goalAmount: 1000, category: goodCat });
    const badBudget = monthlyBudget({ _id: "bad", goalAmount: 100, category: badCat });
    const transactions = [
      tx({ amount: 500, date: new Date(2026, 0, 15), category: goodCat }),
      tx({ amount: 900, date: new Date(2026, 0, 16), category: badCat }),
    ];

    const rows = buildBudgetHistoricalComparative({
      budgets: [goodBudget, badBudget],
      transactions,
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 31),
    });

    expect(rows[0].budget._id).toBe("bad");
    expect(rows[1].budget._id).toBe("good");
  });
});
