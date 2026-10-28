import { describe, expect, it } from "vitest";
import {
  activation,
  activeWithin,
  bucketCounts,
  dailySeries,
  histogramIndex,
  histogramPercentile,
  maskEmail,
  parseRange,
  percentile,
  stickiness,
  topCounts,
  weekStart,
  weeklyActive,
  weeklyCohorts,
} from "./statsMath";

const NOW = new Date("2026-10-28T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * DAY);

describe("parseRange", () => {
  it("accepts 7, 30 and 90 and falls back to 30", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange("15")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
    expect(parseRange(["7", "30"])).toBe(7);
  });
});

describe("bucketCounts", () => {
  it("puts every value in exactly one bucket", () => {
    const result = bucketCounts([0, 0, 1, 9, 10, 49, 50, 199, 200, 5000]);
    expect(result.map((bucket) => bucket.users)).toEqual([2, 2, 2, 2, 2]);
  });
});

describe("percentile", () => {
  it("uses nearest rank and does not change its input", () => {
    const values = [9, 1, 5, 2, 8, 3, 7, 4, 6, 10];
    expect(percentile(values, 50)).toBe(5);
    expect(percentile(values, 90)).toBe(9);
    expect(percentile(values, 100)).toBe(10);
    expect(values[0]).toBe(9);
    expect(percentile([], 50)).toBe(0);
  });
});

describe("dailySeries", () => {
  it("fills empty days with zero and ends today", () => {
    expect(dailySeries([daysAgo(0), daysAgo(0), daysAgo(2)], 3, NOW)).toEqual([
      { day: "2026-10-26", count: 1 },
      { day: "2026-10-27", count: 0 },
      { day: "2026-10-28", count: 2 },
    ]);
  });
});

describe("activeWithin", () => {
  it("counts people whose last activity is inside the window", () => {
    expect(activeWithin([daysAgo(0), daysAgo(3), daysAgo(10), null], 7, NOW)).toBe(2);
  });
});

describe("weekStart", () => {
  it("returns the Monday at 00:00 UTC, including on a Sunday", () => {
    expect(weekStart(new Date("2026-10-28T12:00:00Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(weekStart(new Date("2026-10-26T00:00:00Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(weekStart(new Date("2026-10-25T23:59:00Z")).toISOString()).toBe("2026-10-19T00:00:00.000Z");
  });
});

describe("activation", () => {
  it("counts first transactions made within the window of signing up", () => {
    const rows = [
      { createdAt: daysAgo(20), firstTransactionAt: daysAgo(19) },
      { createdAt: daysAgo(20), firstTransactionAt: daysAgo(5) },
      { createdAt: daysAgo(10), firstTransactionAt: null },
      { createdAt: daysAgo(90), firstTransactionAt: daysAgo(89) },
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

describe("weeklyCohorts", () => {
  const thisWeek = weekStart(NOW);
  const weeksAgo = (weeks: number, extraDays = 0): Date => new Date(thisWeek.getTime() - weeks * 7 * DAY + extraDays * DAY);

  it("groups signups by their Monday and returns one row per week, oldest first", () => {
    const rows = weeklyCohorts([{ createdAt: weeksAgo(1, 2), transactionDates: [] }], NOW, 3);
    expect(rows.map((row) => row.signups)).toEqual([0, 1, 0]);
    expect(rows[2].week).toBe("2026-10-26");
  });

  it("measures retention only once the window of a signup has ended", () => {
    // Signed up 3 weeks ago: week 1 and week 2 windows are over, week 4 is not.
    const user = { createdAt: weeksAgo(3, 1), transactionDates: [new Date(weeksAgo(3, 1).getTime() + 8 * DAY)] };
    const rows = weeklyCohorts([user], NOW, 4);
    const cohort = rows[0];
    expect(cohort.signups).toBe(1);
    expect(cohort.retention[0]).toEqual({ weeks: 1, rate: 1, eligible: 1 });
    expect(cohort.retention[1]).toEqual({ weeks: 2, rate: 0, eligible: 1 });
    expect(cohort.retention[2]).toEqual({ weeks: 4, rate: null, eligible: 0 });
  });

  it("returns null when nobody in the week has finished the window", () => {
    const rows = weeklyCohorts([{ createdAt: daysAgo(1), transactionDates: [] }], NOW, 1);
    expect(rows[0].retention.every((entry) => entry.rate === null)).toBe(true);
  });
});

describe("weeklyActive and stickiness", () => {
  it("counts distinct people per week", () => {
    const thisWeek = weekStart(NOW).getTime();
    const series = weeklyActive(
      [[new Date(thisWeek + DAY), new Date(thisWeek + 2 * DAY)], [new Date(thisWeek - 3 * DAY)]],
      NOW,
      2
    );
    expect(series.map((week) => week.users)).toEqual([1, 1]);
  });

  it("divides weekly by monthly and is zero without a monthly base", () => {
    expect(stickiness(5, 20)).toBe(0.25);
    expect(stickiness(0, 0)).toBe(0);
  });
});

describe("histograms", () => {
  const edges = [50, 100, 200, 400];
  it("places a value in the first edge it does not exceed, and the overflow bucket takes the rest", () => {
    expect(histogramIndex(10, edges)).toBe(0);
    expect(histogramIndex(150, edges)).toBe(2);
    expect(histogramIndex(400, edges)).toBe(3);
    expect(histogramIndex(9999, edges)).toBe(4);
  });

  it("reads percentiles as the upper edge of the bucket that reaches them", () => {
    const counts = [5, 3, 1, 1, 0];
    expect(histogramPercentile(counts, edges, 50)).toBe(50);
    expect(histogramPercentile(counts, edges, 95)).toBe(400);
    expect(histogramPercentile([0, 0, 0, 0, 0], edges, 50)).toBeNull();
    expect(histogramPercentile([0, 0, 0, 0, 2], edges, 50)).toBe(400);
  });
});

describe("maskEmail", () => {
  it("keeps two letters and the domain", () => {
    expect(maskEmail("gsfrido10@gmail.com")).toBe("gs***@gmail.com");
  });

  it("copes with short names and missing values", () => {
    expect(maskEmail("a@x.com")).toBe("a***@x.com");
    expect(maskEmail(undefined)).toBe("—");
    expect(maskEmail("not-an-email")).toBe("—");
  });
});

describe("topCounts", () => {
  it("sorts, names the empty ones and folds the rest into Otros", () => {
    expect(topCounts(["MX", "MX", "US", "US", "US", "CO", "AR", null, ""], 2)).toEqual([
      { label: "US", count: 3 },
      { label: "MX", count: 2 },
      { label: "Otros", count: 4 },
    ]);
  });
});
