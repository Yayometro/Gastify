import { describe, expect, it } from "vitest";
import { accuracyTone, monthAccuracy, rangeAccuracy, summarizeAccuracy, valueAccuracy } from "./projectionAccuracy";

describe("valueAccuracy", () => {
  it("is 100 when the projection equals the real amount", () => {
    expect(valueAccuracy(500, 500)).toBe(100);
  });

  it("is 100 when both are zero", () => {
    expect(valueAccuracy(0, 0)).toBe(100);
  });

  it("is 0 when only one side is zero", () => {
    expect(valueAccuracy(0, 300)).toBe(0);
    expect(valueAccuracy(300, 0)).toBe(0);
  });

  it("reads the owner's examples: 90% for a 10% miss, 45% for a 55% miss", () => {
    expect(valueAccuracy(900, 1000)).toBeCloseTo(90, 10);
    expect(valueAccuracy(45, 100)).toBeCloseTo(45, 10);
  });

  it("scores a projection above the real amount the same as one below it", () => {
    // Projected 1000, real 800: off by 200 relative to the larger figure (1000) => 80%.
    expect(valueAccuracy(1000, 800)).toBeCloseTo(80, 10);
    // Projected 800, real 1000: off by 200 relative to the larger figure (1000) => 80%.
    expect(valueAccuracy(800, 1000)).toBeCloseTo(80, 10);
  });

  it("clamps to 0 when the miss is larger than the figures themselves", () => {
    // Projected 100, real -100: |200| / 100 = 2 => 1 - 2 = -1, clamped to 0.
    expect(valueAccuracy(100, -100)).toBe(0);
  });

  it("handles negatives and refunds: equal negatives are exact, a refund against a spend is 0", () => {
    expect(valueAccuracy(-50, -50)).toBe(100);
    // Projected a 200 spend, real is a 50 refund: the gap (250) exceeds the projection (200) => 0.
    expect(valueAccuracy(200, -50)).toBe(0);
  });
});

describe("rangeAccuracy", () => {
  it("weights each pair by its size, so a large miss in a big month moves the result most", () => {
    // Pairs: (100 vs 100) and (1000 vs 800). Error 200, scale 100 + 1000 = 1100 => 81.82%.
    expect(rangeAccuracy([{ projected: 100, actual: 100 }, { projected: 1000, actual: 800 }])).toBeCloseTo(81.8181818, 4);
  });

  it("gives the same number as valueAccuracy for a single month", () => {
    expect(rangeAccuracy([{ projected: 1000, actual: 800 }])).toBeCloseTo(valueAccuracy(1000, 800), 10);
    expect(rangeAccuracy([{ projected: 45, actual: 100 }])).toBeCloseTo(valueAccuracy(45, 100), 10);
  });

  it("returns null when there is nothing to measure", () => {
    expect(rangeAccuracy([])).toBeNull();
  });

  it("is 100 when every pair is zero against zero", () => {
    expect(rangeAccuracy([{ projected: 0, actual: 0 }, { projected: 0, actual: 0 }])).toBe(100);
  });
});

describe("monthAccuracy", () => {
  it("returns income, expense and the pooled global value for one month", () => {
    const result = monthAccuracy({ projectedIncome: 1000, actualIncome: 800, projectedExpense: 100, actualExpense: 100 });
    expect(result.income).toBeCloseTo(80, 10);
    expect(result.expense).toBe(100);
    // Pooled: error 200, scale 1000 + 100 = 1100 => 81.82%.
    expect(result.global).toBeCloseTo(81.8181818, 4);
  });
});

describe("summarizeAccuracy", () => {
  const months = [
    { monthName: "enero", year: 2026, projectedIncome: 1000, actualIncome: 800, projectedExpense: 500, actualExpense: 500 },
    { monthName: "febrero", year: 2026, projectedIncome: 100, actualIncome: 100, projectedExpense: 300, actualExpense: 150 },
  ];

  it("computes each concept over the whole list, weighted by size", () => {
    const s = summarizeAccuracy(months);
    expect(s.months).toBe(2);
    // Income: error 200 / scale 1100 => 81.82%.
    expect(s.income).toBeCloseTo(81.8181818, 4);
    // Expense: error 150 / scale 800 => 81.25%.
    expect(s.expense).toBeCloseTo(81.25, 10);
    // Global: error 350 / scale 1900 => 81.58%.
    expect(s.global).toBeCloseTo(81.5789473, 4);
  });

  it("returns no percentages and a count of zero when no month is eligible", () => {
    expect(summarizeAccuracy([])).toEqual({ months: 0, income: null, expense: null, global: null });
  });

  it("keeps a one-month summary equal to that month's own values", () => {
    const one = summarizeAccuracy([months[0]]);
    const alone = monthAccuracy(months[0]);
    expect(one.income).toBeCloseTo(alone.income, 10);
    expect(one.expense).toBeCloseTo(alone.expense, 10);
    expect(one.global).toBeCloseTo(alone.global, 10);
  });
});

describe("accuracyTone", () => {
  it("is good from 90 up, warning from 70 to 89, poor below 70", () => {
    expect(accuracyTone(100)).toBe("good");
    expect(accuracyTone(90)).toBe("good");
    expect(accuracyTone(89)).toBe("warning");
    expect(accuracyTone(70)).toBe("warning");
    expect(accuracyTone(69)).toBe("poor");
    expect(accuracyTone(0)).toBe("poor");
  });

  it("decides on the rounded value, so a shown 90% is always green", () => {
    expect(accuracyTone(89.6)).toBe("good");
    expect(accuracyTone(69.4)).toBe("poor");
  });
});
