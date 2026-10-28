// The arithmetic behind the admin panel, kept apart from the database reads so it can be tested without one.

const DAY_MS = 24 * 60 * 60 * 1000;

// Buckets for "how many transactions does a person have": none, one, a few, some, many, a lot.
const BUCKETS = [
  { label: "0", min: 0, max: 0 },
  { label: "1–9", min: 1, max: 9 },
  { label: "10–49", min: 10, max: 49 },
  { label: "50–199", min: 50, max: 199 },
  { label: "200+", min: 200, max: Infinity },
] as const;

export interface BucketCount {
  label: string;
  users: number;
}

export function bucketCounts(values: number[]): BucketCount[] {
  return BUCKETS.map((bucket) => ({
    label: bucket.label,
    users: values.filter((value) => value >= bucket.min && value <= bucket.max).length,
  }));
}

// The value at the p-th percentile (0-100) of a list, by nearest rank. 0 for an empty list.
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

export interface DayCount {
  // UTC day, YYYY-MM-DD.
  day: string;
  count: number;
}

const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

// One entry per day for the `days` days that end today (UTC), with the days that have nothing at zero.
export function dailySeries(dates: Date[], days: number, now: Date): DayCount[] {
  const counts = new Map<string, number>();
  for (const date of dates) counts.set(dayKey(date), (counts.get(dayKey(date)) ?? 0) + 1);
  const series: DayCount[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const day = dayKey(new Date(now.getTime() - back * DAY_MS));
    series.push({ day, count: counts.get(day) ?? 0 });
  }
  return series;
}

// How many distinct people were active in the last `days` days, given each person's last activity (null = never).
export function activeWithin(lastActivity: (Date | null)[], days: number, now: Date): number {
  const since = now.getTime() - days * DAY_MS;
  return lastActivity.filter((at) => at !== null && at.getTime() >= since).length;
}

export interface ActivationRow {
  createdAt: Date;
  firstTransactionAt: Date | null;
}

export interface Activation {
  // People who signed up in the cohort window.
  cohort: number;
  // Of those, the ones who added a transaction within `withinDays` of signing up.
  activated: number;
  // activated / cohort, as a number between 0 and 1 (0 for an empty cohort).
  rate: number;
}

// Activation: of the people who signed up in the last `cohortDays` days, the share that added their first transaction within
// `withinDays` of signing up. People who signed up less than `withinDays` ago and have not added one yet are still counted in
// the cohort (their window may be open), which makes the rate a floor for the youngest signups.
export function activation(rows: ActivationRow[], now: Date, cohortDays = 30, withinDays = 7): Activation {
  const since = now.getTime() - cohortDays * DAY_MS;
  const cohort = rows.filter((row) => row.createdAt.getTime() >= since);
  const activated = cohort.filter(
    (row) => row.firstTransactionAt !== null && row.firstTransactionAt.getTime() - row.createdAt.getTime() <= withinDays * DAY_MS
  ).length;
  return { cohort: cohort.length, activated, rate: cohort.length === 0 ? 0 : activated / cohort.length };
}

// "lu***@gmail.com": enough to tell accounts apart without printing the whole address.
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "—";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

// Counts of a list of labels, biggest first, keeping the `top` biggest and folding the rest into "Otros".
export function topCounts(labels: (string | null | undefined)[], top: number, emptyLabel = "Sin dato"): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const raw of labels) {
    const label = raw && raw.length > 0 ? raw : emptyLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  if (sorted.length <= top) return sorted;
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((sum, entry) => sum + entry.count, 0);
  return [...head, { label: "Otros", count: rest }];
}
