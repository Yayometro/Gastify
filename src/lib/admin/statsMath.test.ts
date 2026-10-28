import { describe, expect, it } from "vitest";
import { activation, activeWithin, bucketCounts, dailySeries, maskEmail, percentile, topCounts } from "./statsMath";

const NOW = new Date("2026-10-28T12:00:00.000Z");
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("bucketCounts", () => {
  it("puts every value in exactly one bucket", () => {
    const result = bucketCounts([0, 0, 1, 9, 10, 49, 50, 199, 200, 5000]);
    expect(result.map((bucket) => bucket.users)).toEqual([2, 2, 2, 2, 2]);
    expect(result.reduce((sum, bucket) => sum + bucket.users, 0)).toBe(10);
  });

  it("is all zeros for no values", () => {
    expect(bucketCounts([]).every((bucket) => bucket.users === 0)).toBe(true);
  });
});

describe("percentile", () => {
  it("uses nearest rank", () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)).toBe(5);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 100)).toBe(10);
  });

  it("does not need a sorted list and does not change it", () => {
    const values = [9, 1, 5];
    expect(percentile(values, 50)).toBe(5);
    expect(values).toEqual([9, 1, 5]);
  });

  it("is 0 for an empty list", () => {
    expect(percentile([], 50)).toBe(0);
  });
});

describe("dailySeries", () => {
  it("fills the days without data with zero and ends today", () => {
    const series = dailySeries([daysAgo(0), daysAgo(0), daysAgo(2)], 3, NOW);
    expect(series).toEqual([
      { day: "2026-10-26", count: 1 },
      { day: "2026-10-27", count: 0 },
      { day: "2026-10-28", count: 2 },
    ]);
  });

  it("ignores dates outside the window", () => {
    const series = dailySeries([daysAgo(40)], 7, NOW);
    expect(series).toHaveLength(7);
    expect(series.every((entry) => entry.count === 0)).toBe(true);
  });
});

describe("activeWithin", () => {
  it("counts the people whose last activity is inside the window", () => {
    expect(activeWithin([daysAgo(0), daysAgo(3), daysAgo(10), null], 7, NOW)).toBe(2);
  });
});

describe("activation", () => {
  it("counts first transactions made within the window of signing up", () => {
    const rows = [
      { createdAt: daysAgo(20), firstTransactionAt: daysAgo(19) }, // day 1: activated
      { createdAt: daysAgo(20), firstTransactionAt: daysAgo(5) }, // day 15: too late
      { createdAt: daysAgo(10), firstTransactionAt: null }, // never
      { createdAt: daysAgo(90), firstTransactionAt: daysAgo(89) }, // outside the cohort
    ];
    const result = activation(rows, NOW);
    expect(result.cohort).toBe(3);
    expect(result.activated).toBe(1);
    expect(result.rate).toBeCloseTo(1 / 3);
  });

  it("is zero for an empty cohort", () => {
    expect(activation([], NOW)).toEqual({ cohort: 0, activated: 0, rate: 0 });
  });
});

describe("maskEmail", () => {
  it("keeps two letters and the domain", () => {
    expect(maskEmail("luis@gmail.com")).toBe("lu***@gmail.com");
  });

  it("copes with short names and missing values", () => {
    expect(maskEmail("a@x.com")).toBe("a***@x.com");
    expect(maskEmail(undefined)).toBe("—");
    expect(maskEmail("not-an-email")).toBe("—");
  });
});

describe("topCounts", () => {
  it("sorts, names the empty ones and folds the rest into Otros", () => {
    const result = topCounts(["MX", "MX", "US", "US", "US", "CO", "AR", null, ""], 2);
    expect(result).toEqual([
      { label: "US", count: 3 },
      { label: "MX", count: 2 },
      { label: "Otros", count: 4 },
    ]);
  });
});
