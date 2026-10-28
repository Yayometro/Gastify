// Pure reading of the daily metric documents (admin_metrics_daily): how the route timings, the Web Vitals and the usage counters
// become the numbers the panels show. The documents only hold counts and histograms, never a person or a request.
import { histogramIndex, histogramPercentile } from "./statsMath";

// Upper edges, in milliseconds, of the histogram used for every API route.
export const ROUTE_EDGES = [50, 100, 200, 400, 800, 1600, 3200, 6400] as const;

export const VITAL_NAMES = ["LCP", "INP", "CLS"] as const;
export type VitalName = (typeof VITAL_NAMES)[number];

// Thresholds from web.dev (Core Web Vitals). CLS is stored multiplied by 1000 so it fits the same integer histogram.
export const VITAL_SPECS: Record<VitalName, { edges: readonly number[]; good: number; poor: number; unit: string }> = {
  LCP: { edges: [1000, 2500, 4000, 8000], good: 2500, poor: 4000, unit: "ms" },
  INP: { edges: [100, 200, 500, 1000], good: 200, poor: 500, unit: "ms" },
  CLS: { edges: [50, 100, 250, 500], good: 100, poor: 250, unit: "" },
};

export type VitalRating = "good" | "needs" | "poor";

export function vitalRating(metric: VitalName, value: number): VitalRating {
  const spec = VITAL_SPECS[metric];
  if (value <= spec.good) return "good";
  if (value <= spec.poor) return "needs";
  return "poor";
}

// One document of admin_metrics_daily. `b` is the histogram: bucket index (as a string key) to count.
export interface MetricDoc {
  kind: "route" | "vital" | "usage";
  day: string;
  route?: string;
  metric?: string;
  name?: string;
  count?: number;
  errors?: number;
  sumMs?: number;
  maxMs?: number;
  total?: number;
  good?: number;
  needs?: number;
  poor?: number;
  b?: Record<string, number>;
}

function histogram(docs: MetricDoc[], length: number): number[] {
  const counts = new Array<number>(length).fill(0);
  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc.b ?? {})) {
      const index = Number(key);
      if (index >= 0 && index < length) counts[index] += value;
    }
  }
  return counts;
}

export interface RouteSummary {
  route: string;
  requests: number;
  errorRate: number;
  averageMs: number;
  p50: number | null;
  p95: number | null;
  maxMs: number;
  // The histogram with its labels, so a row can show how its requests spread over the time buckets.
  histogram: { label: string; count: number }[];
}

// "≤ 50 ms", ..., "> 6400 ms": the labels of the route buckets, in order.
export const ROUTE_BUCKET_LABELS: string[] = [
  ...ROUTE_EDGES.map((edge) => `≤ ${edge} ms`),
  `> ${ROUTE_EDGES[ROUTE_EDGES.length - 1]} ms`,
];

// Per route, over the given documents: request count, share of 5xx or thrown errors, average, approximate p50 and p95.
export function summarizeRoutes(docs: MetricDoc[]): RouteSummary[] {
  const byRoute = new Map<string, MetricDoc[]>();
  for (const doc of docs) {
    if (doc.kind !== "route" || !doc.route) continue;
    byRoute.set(doc.route, [...(byRoute.get(doc.route) ?? []), doc]);
  }
  return [...byRoute.entries()]
    .map(([route, list]) => {
      const requests = list.reduce((sum, doc) => sum + (doc.count ?? 0), 0);
      const errors = list.reduce((sum, doc) => sum + (doc.errors ?? 0), 0);
      const sumMs = list.reduce((sum, doc) => sum + (doc.sumMs ?? 0), 0);
      const maxMs = list.reduce((max, doc) => Math.max(max, doc.maxMs ?? 0), 0);
      const counts = histogram(list, ROUTE_EDGES.length + 1);
      return {
        route,
        requests,
        errorRate: requests === 0 ? 0 : errors / requests,
        averageMs: requests === 0 ? 0 : sumMs / requests,
        p50: histogramPercentile(counts, ROUTE_EDGES, 50),
        p95: histogramPercentile(counts, ROUTE_EDGES, 95),
        maxMs,
        histogram: counts.map((count, index) => ({ label: ROUTE_BUCKET_LABELS[index], count })),
      };
    })
    .sort((a, b) => b.requests - a.requests);
}

export interface VitalSummary {
  metric: VitalName;
  samples: number;
  goodShare: number;
  needsShare: number;
  poorShare: number;
  // Approximate 75th percentile, the value Google uses to rate a page. null without samples.
  p75: number | null;
  unit: string;
}

export function summarizeVitals(docs: MetricDoc[]): VitalSummary[] {
  return VITAL_NAMES.map((metric) => {
    const list = docs.filter((doc) => doc.kind === "vital" && doc.metric === metric);
    const samples = list.reduce((sum, doc) => sum + (doc.total ?? 0), 0);
    const good = list.reduce((sum, doc) => sum + (doc.good ?? 0), 0);
    const needs = list.reduce((sum, doc) => sum + (doc.needs ?? 0), 0);
    const poor = list.reduce((sum, doc) => sum + (doc.poor ?? 0), 0);
    const spec = VITAL_SPECS[metric];
    const p75 = histogramPercentile(histogram(list, spec.edges.length + 1), spec.edges, 75);
    return {
      metric,
      samples,
      goodShare: samples === 0 ? 0 : good / samples,
      needsShare: samples === 0 ? 0 : needs / samples,
      poorShare: samples === 0 ? 0 : poor / samples,
      p75: metric === "CLS" && p75 !== null ? p75 / 1000 : p75,
      unit: spec.unit,
    };
  });
}

// The histogram index a sample falls in, for the writer.
export function vitalBucket(metric: VitalName, value: number): number {
  return histogramIndex(value, VITAL_SPECS[metric].edges);
}

export function routeBucket(ms: number): number {
  return histogramIndex(ms, ROUTE_EDGES);
}

// Days of usage counters for one event, one entry per day, the missing ones at zero.
export function usageSeries(docs: MetricDoc[], event: string, days: number, now: Date): { day: string; count: number }[] {
  const byDay = new Map<string, number>();
  for (const doc of docs) {
    if (doc.kind === "usage" && doc.name === event) byDay.set(doc.day, (byDay.get(doc.day) ?? 0) + (doc.count ?? 0));
  }
  const series: { day: string; count: number }[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const day = new Date(now.getTime() - back * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    series.push({ day, count: byDay.get(day) ?? 0 });
  }
  return series;
}
