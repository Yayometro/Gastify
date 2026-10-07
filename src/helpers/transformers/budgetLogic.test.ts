import { describe, it, expect } from "vitest";
import { getBudgetType } from "./budgetTypes";
import { buildBudgetHistoricalComparative } from "./budgetHistoricalComparative";
import { getBudgetCoverage } from "./budgetCoverage";
import { suggestCategory } from "./categoryRuleMatcher";
import { getExpectedOccurrencesInMonth, getMonthBucketBreakdown, buildYearProjectionTable } from "./projectionsChange";

describe("getBudgetType (bug 29)", () => {
  it("an explicit budgetType of saving is a saving budget even without isSaving", () => {
    expect(getBudgetType({ budgetType: "saving" } as never)).toBe("saving");
    expect(getBudgetType({ isSaving: true } as never)).toBe("saving");
    expect(getBudgetType({ budgetType: "project" } as never)).toBe("project");
    expect(getBudgetType({} as never)).toBe("spending");
  });
});

describe("buildBudgetHistoricalComparative (bugs 30, 32)", () => {
  const range = { startDate: new Date(2026, 5, 1), endDate: new Date(2026, 7, 31), today: new Date(2026, 8, 15) };
  const budget = (overrides: Record<string, unknown>) => ({
    _id: overrides.name,
    name: overrides.name,
    goalAmount: 100,
    period: "monthly",
    category: "c1",
    createdAt: new Date(2026, 0, 1),
    ...overrides,
  });
  const bill = { isBill: true, category: { _id: "c1" }, date: new Date(2026, 6, 10), amount: 50 };

  it("a budget with no history and no createdAt marks every month as estimated (bug 31)", () => {
    const legacy = { _id: "old", name: "Old", goalAmount: 100, period: "monthly", category: "c1" };
    const [row] = buildBudgetHistoricalComparative({ budgets: [legacy as never], transactions: [bill as never], ...range });
    expect(row.monthlySeries.every((m: { estimated: boolean }) => m.estimated)).toBe(true);
    const [dated] = buildBudgetHistoricalComparative({
      budgets: [{ ...legacy, createdAt: new Date(2026, 0, 1) } as never],
      transactions: [bill as never],
      ...range,
    });
    expect(dated.monthlySeries.every((m: { estimated: boolean }) => !m.estimated)).toBe(true);
  });

  it("budgets with the same compliance keep a fixed order by name", () => {
    const rows = buildBudgetHistoricalComparative({
      budgets: [budget({ name: "Zeta" }), budget({ name: "Alpha" }), budget({ name: "Mid" })] as never,
      transactions: [bill] as never,
      ...range,
    });
    expect(rows.map((r) => r.budget.name)).toEqual(["Alpha", "Mid", "Zeta"]);
  });

  it("a history entry with an invalid effectiveFrom does not break the earliest-goal lookup", () => {
    const rows = buildBudgetHistoricalComparative({
      budgets: [
        budget({
          name: "Odd",
          history: [{ goalAmount: 70, effectiveFrom: "not a date" }, { goalAmount: 90, effectiveFrom: new Date(2026, 0, 1) }],
        }),
      ] as never,
      transactions: [bill] as never,
      ...range,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].monthlySeries.every((m) => Number.isFinite(m.goal))).toBe(true);
  });
});

describe("getBudgetCoverage (bugs 113, 114)", () => {
  const spending = { _id: "b1", name: "Food", budgetType: "spending", category: "c1" };
  const bill = (overrides: Record<string, unknown>) => ({ _id: "t1", isBill: true, category: { _id: "c1" }, date: "2026-08-10", amount: 10, ...overrides });

  it("filters by a start/end that arrive as strings", () => {
    const result = getBudgetCoverage({
      transactions: [bill({ _id: "in" }), bill({ _id: "out", date: "2026-05-01" })] as never,
      budgets: [spending] as never,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });
    expect(result.bills.map((t) => String(t._id))).toEqual(["in"]);
  });

  it("a movement whose explicit budget is archived is still covered by a matching category budget", () => {
    const archived = { _id: "old", name: "Old", budgetType: "project", archived: true };
    const result = getBudgetCoverage({
      transactions: [bill({ budget: "old" })] as never,
      budgets: [archived, spending] as never,
    });
    expect(result.covered).toHaveLength(1);
    expect(result.uncovered).toHaveLength(0);
  });
});

describe("suggestCategory (bug 115)", () => {
  const rule = { _id: "r1", pattern: "uber", minAmountMinor: 10000, amountCurrency: "MXN", category: { _id: "c1" } };
  it("a movement without a usable amount is treated like one without money", () => {
    const withoutMoney = suggestCategory("Uber trip", null, [rule] as never);
    const nullAmount = suggestCategory("Uber trip", { amountMinor: null, currency: "MXN" } as never, [rule] as never);
    const undefinedAmount = suggestCategory("Uber trip", { currency: "MXN" } as never, [rule] as never);
    expect(nullAmount).toEqual(withoutMoney);
    expect(undefinedAmount).toEqual(withoutMoney);
  });
  it("still applies the threshold when there is an amount", () => {
    expect(suggestCategory("Uber trip", { amountMinor: 500, currency: "MXN" }, [rule] as never)).toBeNull();
    expect(suggestCategory("Uber trip", { amountMinor: 20000, currency: "MXN" }, [rule] as never)).not.toBeNull();
  });
});

describe("getExpectedOccurrencesInMonth (bug 108)", () => {
  const source = { recurrence: "biweekly", anchorDate: new Date(2026, 7, 1, 12, 0) };
  const month = (m: number) => [new Date(2026, m, 1), new Date(2026, m + 1, 0, 23, 59, 59)] as const;
  it("counts the 14-day sequence by calendar day", () => {
    expect(getExpectedOccurrencesInMonth(source as never, ...month(7))).toBe(3); // Aug 1, 15, 29
    expect(getExpectedOccurrencesInMonth(source as never, ...month(8))).toBe(2); // Sep 12, 26
    expect(getExpectedOccurrencesInMonth(source as never, ...month(5))).toBe(2); // before the anchor: Jun 6, 20
  });
  it("weekly and the fixed defaults still work", () => {
    expect(getExpectedOccurrencesInMonth({ recurrence: "weekly", anchorDate: new Date(2026, 7, 3) } as never, ...month(7))).toBe(5);
    expect(getExpectedOccurrencesInMonth({ recurrence: "weekly" } as never, ...month(7))).toBe(4);
    expect(getExpectedOccurrencesInMonth({ recurrence: "monthly" } as never, ...month(7))).toBe(1);
  });
});

describe("a bill claimed by several budgets counts once (bug 104)", () => {
  const food = { name: "Food", goalAmount: 100, category: "c1" };
  const groceries = { name: "Groceries", goalAmount: 50, category: "c1", subCategory: "s1" };
  const groceriesBill = { _id: "t1", isBill: true, category: { _id: "c1" }, subCategory: { _id: "s1" }, amount: 80 };
  const restaurantBill = { _id: "t2", isBill: true, category: { _id: "c1" }, subCategory: { _id: "s2" }, amount: 30 };

  it("goes to the most specific budget, whatever the list order", () => {
    for (const budgets of [[food, groceries], [groceries, food]]) {
      const rows = getMonthBucketBreakdown([groceriesBill as never, restaurantBill as never], budgets as never, 0);
      const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.actual]));
      expect(byLabel.Groceries).toBe(80);
      expect(byLabel.Food).toBe(30);
      expect(byLabel["Unexpected/Other"]).toBe(0);
    }
  });

  it("on a tie the first budget in the list keeps it, and the total is not doubled", () => {
    const foodTwo = { name: "Food 2", goalAmount: 100, category: "c1" };
    const rows = getMonthBucketBreakdown([restaurantBill as never], [food, foodTwo] as never, 0);
    expect(rows.map((r) => r.actual)).toEqual([30, 0, 0]);
  });

  it("the projected expense of a month counts the bill once", () => {
    const rows = buildYearProjectionTable({
      transactions: [{ ...groceriesBill, isReadable: true, date: new Date(2026, 5, 10) }] as never,
      budgets: [food, groceries] as never,
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline: null,
      year: 2026,
      today: new Date(2026, 5, 15), // June is the month in progress: MAX(goal, real) per budget
    } as never) as unknown as { monthName: string; projectedExpense: number }[];
    const june = rows.find((r) => r.monthName === "Jun" || r.monthName === "June") || rows[5];
    // groceries: max(50, 80) = 80, food: max(100, 0) = 100 (not max(100, 80))
    expect(june.projectedExpense).toBe(180);
  });
});
