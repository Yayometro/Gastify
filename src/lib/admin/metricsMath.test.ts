import { describe, expect, it } from "vitest";
import { routeBucket, summarizeRoutes, summarizeVitals, usageSeries, vitalBucket, vitalRating, type MetricDoc } from "./metricsMath";

const NOW = new Date("2026-10-28T12:00:00.000Z");

describe("vitalRating", () => {
  it("rates with the web.dev thresholds", () => {
    expect(vitalRating("LCP", 2500)).toBe("good");
    expect(vitalRating("LCP", 2501)).toBe("needs");
    expect(vitalRating("LCP", 4001)).toBe("poor");
    expect(vitalRating("INP", 200)).toBe("good");
    expect(vitalRating("CLS", 250)).toBe("needs");
    expect(vitalRating("CLS", 300)).toBe("poor");
  });
});

describe("summarizeRoutes", () => {
  const docs: MetricDoc[] = [
    { kind: "route", day: "2026-10-27", route: "wallet", count: 3, errors: 1, sumMs: 300, maxMs: 200, b: { "1": 2, "2": 1 } },
    { kind: "route", day: "2026-10-28", route: "wallet", count: 1, errors: 0, sumMs: 1000, maxMs: 1000, b: { "5": 1 } },
    { kind: "route", day: "2026-10-28", route: "session", count: 2, errors: 0, sumMs: 60, maxMs: 40, b: { "0": 2 } },
    { kind: "usage", day: "2026-10-28", name: "mcp.call", count: 9 },
  ];

  it("adds the days of each route, and ignores the other kinds", () => {
    const [wallet, session] = summarizeRoutes(docs);
    expect(wallet.route).toBe("wallet");
    expect(wallet.requests).toBe(4);
    expect(wallet.errorRate).toBeCloseTo(0.25);
    expect(wallet.averageMs).toBeCloseTo(325);
    expect(wallet.maxMs).toBe(1000);
    expect(session.requests).toBe(2);
  });

  it("reads p50 and p95 from the histogram", () => {
    const [wallet] = summarizeRoutes(docs);
    // Buckets: 2 samples in <=100ms, 1 in <=200ms, 1 in <=1600ms. The median (2nd of 4) is reached at 100ms, p95 at 1600ms.
    expect(wallet.p50).toBe(100);
    expect(wallet.p95).toBe(1600);
  });

  it("returns no percentiles for a route with no samples in its histogram", () => {
    expect(summarizeRoutes([{ kind: "route", day: "2026-10-28", route: "x", count: 0 }])[0].p50).toBeNull();
  });

  it("maps durations to buckets", () => {
    expect(routeBucket(30)).toBe(0);
    expect(routeBucket(150)).toBe(2);
    expect(routeBucket(60000)).toBe(8);
  });
});

describe("summarizeVitals", () => {
  it("shares by rating and a p75 in the metric's unit", () => {
    const bucket = vitalBucket("LCP", 2000);
    const docs: MetricDoc[] = [
      { kind: "vital", day: "2026-10-28", metric: "LCP", total: 4, good: 2, needs: 1, poor: 1, b: { [String(bucket)]: 4 } },
    ];
    const lcp = summarizeVitals(docs).find((entry) => entry.metric === "LCP")!;
    expect(lcp.samples).toBe(4);
    expect(lcp.goodShare).toBe(0.5);
    expect(lcp.poorShare).toBe(0.25);
    expect(lcp.p75).toBe(2500);
  });

  it("reports CLS back in its own units (the stored value is multiplied by 1000)", () => {
    const docs: MetricDoc[] = [{ kind: "vital", day: "2026-10-28", metric: "CLS", total: 1, good: 1, b: { "0": 1 } }];
    const cls = summarizeVitals(docs).find((entry) => entry.metric === "CLS")!;
    expect(cls.p75).toBeCloseTo(0.05);
  });

  it("is empty with no samples", () => {
    const inp = summarizeVitals([]).find((entry) => entry.metric === "INP")!;
    expect(inp.samples).toBe(0);
    expect(inp.p75).toBeNull();
  });
});

describe("usageSeries", () => {
  it("returns one entry per day for the named event, the missing days at zero", () => {
    const docs: MetricDoc[] = [
      { kind: "usage", day: "2026-10-28", name: "mcp.call", count: 3 },
      { kind: "usage", day: "2026-10-26", name: "mcp.call", count: 1 },
      { kind: "usage", day: "2026-10-26", name: "statement.upload", count: 9 },
    ];
    expect(usageSeries(docs, "mcp.call", 3, NOW)).toEqual([
      { day: "2026-10-26", count: 1 },
      { day: "2026-10-27", count: 0 },
      { day: "2026-10-28", count: 3 },
    ]);
  });
});
