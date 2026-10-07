import { describe, it, expect } from "vitest";
import {
  buildCategoryHierarchy,
  reduceTransToTransMonths,
  reduceTransactionsToMonthSpentObjects,
} from "./transactionsChange";

// Guards for data that is incomplete or invalid (bugs 95, 97, 98): these used
// to throw a TypeError and take the whole chart down.

describe("buildCategoryHierarchy", () => {
  it("does not throw for a movement that has a sub-category but no category (bug 95)", () => {
    const orphanSub = {
      category: null,
      subCategory: { _id: "s1", name: "Coffee" },
      amount: 50,
      isBill: true,
      date: "2026-08-20",
    };
    expect(() => buildCategoryHierarchy([orphanSub as never], true)).not.toThrow();
  });
});

describe("reduceTransToTransMonths", () => {
  it("skips a movement with an invalid date instead of throwing (bug 97)", () => {
    const good = { date: "2026-08-20", amount: 10, isBill: true };
    const bad = { date: "not a date", amount: 99, isBill: true };
    let result: Record<string, { value: number }> = {};
    expect(() => {
      result = reduceTransToTransMonths([good, bad] as never) as never;
    }).not.toThrow();
    const total = Object.values(result).reduce((sum, bucket) => sum + bucket.value, 0);
    expect(total).toBe(10);
  });
});

describe("reduceTransactionsToMonthSpentObjects", () => {
  it("ignores null entries and still adds the rest (bug 98)", () => {
    const out = reduceTransactionsToMonthSpentObjects([
      { type: "august", value: 5 },
      null as never,
      { type: "august", value: 7 },
    ]);
    expect(out.august.value).toBe(12);
  });
});
