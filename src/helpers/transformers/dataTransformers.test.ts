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
