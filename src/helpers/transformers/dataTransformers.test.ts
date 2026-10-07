import { describe, it, expect } from "vitest";
import {
  orderByHighestValue,
  sortBasedOnValueProperty,
  sortByIndex,
  reduceAndTransforToCategories,
  transformTransactionsToMonthsChartObject,
  reduceTransToTransMonths,
} from "./transactionsChange";
import { organizedCategoriesAndSubCategories } from "./categoriesTransformers";
import { sortItemsByName } from "../orderFunctions/orderFunctions";

describe("sorting does not touch its input (bugs 92, 119)", () => {
  it("works on a frozen array and returns a sorted copy", () => {
    const frozen = Object.freeze([{ value: 1 }, { value: 3 }, { value: 2 }]) as unknown as { value: number }[];
    expect(orderByHighestValue(frozen).map((x) => x.value)).toEqual([3, 2, 1]);
    expect(sortBasedOnValueProperty(2, frozen).map((x) => x.value)).toEqual([1, 2]);
    expect(frozen.map((x) => x.value)).toEqual([1, 3, 2]);
    const byIndex = Object.freeze([{ index: 2 }, { index: 1 }]) as unknown as { index: number }[];
    expect(sortByIndex(byIndex).map((x) => x.index)).toEqual([1, 2]);
    const named = Object.freeze([{ name: "b" }, { name: "a" }]) as unknown as { name: string }[];
    expect(sortItemsByName(named).map((x) => x.name)).toEqual(["a", "b"]);
  });
});

describe("orderByHighestValue (bug 93)", () => {
  it("a value of exactly 0 is a value, not a missing one", () => {
    const out = orderByHighestValue([
      { value: 0, amount: 999 },
      { value: 5, amount: 1 },
    ]);
    expect(out.map((x) => x.value)).toEqual([5, 0]);
  });
  it("falls back to amount only when value is missing", () => {
    const out = orderByHighestValue([{ amount: 2 }, { value: 7 }] as { value?: number; amount?: number }[]);
    expect(out[0]).toEqual({ value: 7 });
  });
});

describe("reduceAndTransforToCategories (bug 94)", () => {
  const mk = (id: string, name: string, amount: number) => ({
    category: { _id: id, name },
    amount,
    isBill: true,
    date: "2026-08-20",
  });
  it("two different categories with the same name stay two rows", () => {
    const { array } = reduceAndTransforToCategories([mk("c1", "Food", 10), mk("c2", "Food", 20), mk("c1", "Food", 5)] as never);
    expect(array).toHaveLength(2);
    expect(array.map((r) => r.value).sort()).toEqual([15, 20]);
  });
  it("movements without category share one 'No category' row", () => {
    const { array } = reduceAndTransforToCategories([
      { category: null, amount: 1, isBill: true },
      { category: null, amount: 2, isBill: true },
    ] as never);
    expect(array).toHaveLength(1);
    expect(array[0].name).toBe("No category");
    expect(array[0].value).toBe(3);
  });
});

describe("month objects (bug 96)", () => {
  it("transformTransactionsToMonthsChartObject works for any year and falls back to createdAt", () => {
    const out = transformTransactionsToMonthsChartObject([
      { date: "2019-03-15", amount: 10, isBill: true },
      { createdAt: "2024-11-02", amount: 20, isBill: true },
      { date: "nope", amount: 5, isBill: true },
    ] as never);
    expect(out[0]?.type).toBe("march");
    expect(out[1]?.type).toBe("november");
    expect(out[2]).toBeNull();
  });
  it("reduceTransToTransMonths uses createdAt when there is no date", () => {
    const out = reduceTransToTransMonths([{ createdAt: "2026-08-20", amount: 10, isBill: true }] as never);
    expect(Object.keys(out)).toEqual(["august"]);
  });
});

describe("organizedCategoriesAndSubCategories (bugs 117, 118)", () => {
  it("roots with neither id nor name do not overwrite each other", () => {
    const out = organizedCategoriesAndSubCategories([{ icon: "a" }, { icon: "b" }] as never);
    expect(out).toHaveLength(2);
  });
  it("a sub-category whose father is an unknown id is kept under a placeholder father", () => {
    const out = organizedCategoriesAndSubCategories([
      { _id: "c1", name: "Food" },
      { _id: "s1", name: "Coffee", fatherCategory: "missing-father" },
    ] as never);
    const placeholder = out.find((c) => c.name === "Unknown category");
    expect(placeholder?.children.map((s) => s.name)).toEqual(["Coffee"]);
    expect(out.find((c) => c.name === "Food")?.children).toEqual([]);
  });
  it("still attaches normal sub-categories to their father", () => {
    const out = organizedCategoriesAndSubCategories([
      { _id: "c1", name: "Food" },
      { _id: "s1", name: "Coffee", fatherCategory: "c1" },
    ] as never);
    expect(out).toHaveLength(1);
    expect(out[0].children.map((s) => s.name)).toEqual(["Coffee"]);
  });
});

import { getBudgetActualSpend } from "./projectionsChange";

describe("getBudgetActualSpend (bugs 102, 103)", () => {
  const budget = { _id: "b1", goalAmount: 100, period: "monthly", category: "c1" } as never;
  const bill = (overrides: Record<string, unknown>) => ({
    isBill: true,
    category: { _id: "c1" },
    date: "2026-08-10",
    amount: 10,
    ...overrides,
  });
  const start = new Date(2026, 7, 1);
  const end = new Date(2026, 7, 31, 23, 59, 59);

  it("sums the wallet-currency amount, not the legacy amount of a foreign-currency movement", () => {
    const usd = bill({ amount: 10, displayMoney: { primary: { amountMinor: 17000, currency: "MXN" } } });
    expect(getBudgetActualSpend(budget, [usd] as never, start, end)).toBe(170);
  });

  it("ignores movements with an invalid date", () => {
    const good = bill({ amount: 10 });
    const bad = bill({ amount: 999, date: "not a date" });
    expect(getBudgetActualSpend(budget, [good, bad] as never, start, end)).toBe(10);
  });
});

import { areDuplicates } from "./transactionDuplicates";

describe("areDuplicates (bugs 110, 111, 112)", () => {
  const tx = (overrides: Record<string, unknown>) => ({ name: "Coffee", amount: 5, date: "2026-08-10", ...overrides });

  it("compares Date objects by their real calendar day (not as the year 2001)", () => {
    const a = tx({ date: new Date(2026, 7, 10, 9, 0) });
    const b = tx({ date: new Date(2026, 7, 10, 18, 30) });
    const c = tx({ date: new Date(2026, 8, 20) });
    expect(areDuplicates(a as never, b as never, { date: true }, 0)).toBe(true);
    expect(areDuplicates(a as never, c as never, { date: true }, 0)).toBe(false);
  });

  it("with no tolerance given the date must be the same day", () => {
    expect(areDuplicates(tx({ date: "2026-08-10" }) as never, tx({ date: "2026-08-12" }) as never, { date: true })).toBe(false);
    expect(areDuplicates(tx({ date: "2026-08-10" }) as never, tx({ date: "2026-08-10" }) as never, { date: true })).toBe(true);
    expect(areDuplicates(tx({ date: "2026-08-10" }) as never, tx({ date: "2026-08-12" }) as never, { date: true }, 3)).toBe(true);
  });

  it("a movement with no valid date is never a date duplicate", () => {
    expect(areDuplicates(tx({ date: "nope" }) as never, tx({ date: "2026-08-10" }) as never, { date: true }, 5)).toBe(false);
  });

  it("falls back to the legacy amount when the native money has no amountMinor", () => {
    const a = tx({ amount: 5, displayMoney: { native: { currency: "MXN" } } });
    const b = tx({ amount: 5 });
    expect(areDuplicates(a as never, b as never, { amount: true }, 0, 0)).toBe(true);
  });
});
