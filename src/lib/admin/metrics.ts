// Writing and reading the daily counters of the admin panel. Writes are best effort: a failed metric must never break the request
// that produced it. Every document is a counter or a histogram keyed by (kind, name, day); no user id is ever stored here.
import { after } from "next/server";
import { adminDb, METRICS_COLLECTION } from "./adminDb";
import { routeBucket, vitalBucket, vitalRating, type MetricDoc, type VitalName } from "./metricsMath";

// The events the app counts. Adding one means adding it here and calling `countUsage` where it happens.
export const USAGE_EVENTS = ["dashboard.visit", "template.upload", "mcp.call"] as const;
export type UsageEvent = (typeof USAGE_EVENTS)[number];

const todayKey = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

async function increment(id: string, fields: Record<string, unknown>, base: { kind: string; day: string } & Record<string, unknown>, extra: object = {}): Promise<void> {
  const db = await adminDb();
  await db.collection(METRICS_COLLECTION).updateOne(
    { _id: id as never },
    { $inc: fields as never, $setOnInsert: base as never, ...extra },
    { upsert: true }
  );
}

// Counts one use of a feature for today.
export async function countUsage(event: UsageEvent): Promise<void> {
  try {
    const day = todayKey();
    await increment(`usage|${event}|${day}`, { count: 1 }, { kind: "usage", name: event, day });
  } catch {
    // A missing counter is not worth a failed request.
  }
}

// Schedules a count after the response has been sent, so the person does not wait for the database.
export function countUsageAfterResponse(event: UsageEvent): void {
  try {
    after(() => countUsage(event));
  } catch {
    // Outside a request (tests, scripts) `after` is not available; the count is simply skipped.
  }
}

// One finished API request: how long it took and whether it failed (a 5xx or a thrown error).
export async function recordRouteTiming(route: string, ms: number, failed: boolean, now: Date = new Date()): Promise<void> {
  try {
    const day = todayKey(now);
    const bucket = routeBucket(ms);
    await increment(
      `route|${route}|${day}`,
      { count: 1, errors: failed ? 1 : 0, sumMs: ms, [`b.${bucket}`]: 1 },
      { kind: "route", route, day },
      { $max: { maxMs: ms } }
    );
  } catch {
    // Timing is observation only.
  }
}

// One Web Vitals sample reported by a browser. `value` is in milliseconds (CLS arrives multiplied by 1000).
export async function recordVital(metric: VitalName, value: number, now: Date = new Date()): Promise<void> {
  try {
    const day = todayKey(now);
    const rating = vitalRating(metric, value);
    const bucket = vitalBucket(metric, value);
    await increment(
      `vital|${metric}|${day}`,
      { total: 1, [rating]: 1, [`b.${bucket}`]: 1 },
      { kind: "vital", metric, day }
    );
  } catch {
    // Observation only.
  }
}

// Every metric document from `from` (a YYYY-MM-DD day) on. The collection is small: one document per route, event or vital and day.
export async function readMetricDocs(fromDay: string): Promise<MetricDoc[]> {
  const db = await adminDb();
  const docs = await db
    .collection(METRICS_COLLECTION)
    .find({ day: { $gte: fromDay } }, { projection: { _id: 0 } })
    .toArray();
  return docs as unknown as MetricDoc[];
}

// The first day (YYYY-MM-DD, UTC) of a window that ends today and is `days` long.
export function firstDayOf(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
