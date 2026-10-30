import { describe, expect, it } from "vitest";

import { analyzeCategory, monthKeys, NO_SUBCATEGORY, type CategoryAnalysisMovement } from "./categoryAnalysis";

const today = new Date(2026, 9, 30, 12);
const at = (monthsBack: number, day = 10) => new Date(2026, 9 - monthsBack, day, 12).toISOString();
const cat = { _id: "c1", name: "Food" };
const food = { _id: "s1", name: "Restaurants" };
const tagA = { _id: "t1", name: "work" };
const spend = (amount: number, monthsBack: number, extra: Partial<CategoryAnalysisMovement> = {}): CategoryAnalysisMovement => ({ _id: `${amount}-${monthsBack}`, name: `m${amount}`, amount, isBill: true, kind: "expense", category: cat, date: at(monthsBack), ...extra });

describe("monthKeys", () => {
  it("lists continuous months ending in today's, across a year change", () => {
    expect(monthKeys(4, new Date(2026, 1, 15))).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("analyzeCategory", () => {
  const movements: CategoryAnalysisMovement[] = [
    spend(100, 0, { subCategory: food, tags: [tagA] }),
    spend(50, 0),
    spend(300, 2, { subCategory: food, tags: [tagA] }),
    spend(10, 9),
    spend(999, 0, { category: { _id: "other", name: "Other" } }),
    { ...spend(700, 0), isBill: false, kind: "income" },
    { ...spend(40, 0), kind: "transfer" },
  ];
  const result = analyzeCategory({ categoryId: "c1", movements, months: 3, today });

  it("totals each month, keeping months with nothing at 0", () => {
    expect(result.months.map((month) => month.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(result.months.map((month) => month.total)).toEqual([300, 0, 150]);
    expect(result.stats.total).toBe(450);
    expect(result.stats.count).toBe(3);
    expect(result.stats.avgMonthly).toBe(150);
    expect(result.stats.max).toEqual({ month: "2026-08", total: 300 });
    expect(result.stats.min).toEqual({ month: "2026-10", total: 150 });
  });

  it("leaves out other categories, income and transfers", () => {
    expect(result.movements.map((row) => row.amount)).toEqual([100, 50, 300]);
  });

  it("splits by sub-category, with the ones without as their own row", () => {
    expect(result.subs.map((sub) => [sub.id, sub.total])).toEqual([["s1", 400], [NO_SUBCATEGORY, 50]]);
    expect(result.subs[0].name).toBe("Restaurants");
    expect(result.subs[0].share).toBeCloseTo(400 / 450);
    expect(result.subs[0].monthly).toEqual([300, 0, 100]);
    expect(result.months[2].bySub).toEqual({ s1: 100, [NO_SUBCATEGORY]: 50 });
  });

  it("counts tags and ranks the biggest movements", () => {
    expect(result.tags).toEqual([{ id: "t1", name: "work", total: 400, count: 2 }]);
    expect(result.top.map((row) => row.amount)).toEqual([300, 100, 50]);
  });

  it("compares with the same number of months before", () => {
    const withPrevious = analyzeCategory({ categoryId: "c1", movements: [...movements, spend(225, 4)], months: 3, today });
    expect(withPrevious.stats.previousTotal).toBe(225);
    expect(withPrevious.stats.deltaPct).toBeCloseTo(100);
    expect(result.stats.deltaPct).toBeNull();
  });

  it("handles a category with no movements and income mode", () => {
    const empty = analyzeCategory({ categoryId: "nope", movements, months: 3, today });
    expect(empty.stats.total).toBe(0);
    expect(empty.stats.max).toBeNull();
    expect(empty.subs).toEqual([]);
    const income = analyzeCategory({ categoryId: "c1", movements, kind: "income", months: 3, today });
    expect(income.stats.total).toBe(700);
  });
});
