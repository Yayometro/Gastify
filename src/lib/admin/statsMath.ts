// The arithmetic behind the admin panel, kept apart from the database reads so it can be tested without one.
// Every day and week here is a UTC day or a Monday-to-Sunday UTC week.

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export const RANGE_DAYS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_DAYS)[number];

// The period the panel shows, from the URL (?range=7|30|90). Anything else means 30 days.
export function parseRange(value: string | string[] | undefined): RangeDays {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return (RANGE_DAYS as readonly number[]).includes(days) ? (days as RangeDays) : 30;
}

const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

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

// Monday 00:00 UTC of the week that contains `date`.
export function weekStart(date: Date): Date {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday));
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
  // activated / cohort, between 0 and 1 (0 for an empty cohort).
  rate: number;
}

// Activation: of the people who signed up in the last `cohortDays` days, the share that added their first transaction within
// `withinDays` of signing up. The youngest signups may still have their window open, so their rate is a floor.
export function activation(rows: ActivationRow[], now: Date, cohortDays = 30, withinDays = 7): Activation {
  const since = now.getTime() - cohortDays * DAY_MS;
  const cohort = rows.filter((row) => row.createdAt.getTime() >= since);
  const activated = cohort.filter(
    (row) => row.firstTransactionAt !== null && row.firstTransactionAt.getTime() - row.createdAt.getTime() <= withinDays * DAY_MS
  ).length;
  return { cohort: cohort.length, activated, rate: cohort.length === 0 ? 0 : activated / cohort.length };
}

export interface CohortUser {
  createdAt: Date;
  // Every transaction date of this person (createdAt of each transaction).
  transactionDates: Date[];
}

export interface CohortRow {
  // Monday of the signup week, YYYY-MM-DD.
  week: string;
  signups: number;
  // Retention for each horizon in weeks after signup (1, 2 and 4): the share of the week's signups who added a transaction in
  // their k-th week after signing up. null while none of the week's signups has finished that window yet.
  retention: { weeks: number; rate: number | null; eligible: number }[];
}

export const RETENTION_HORIZONS = [1, 2, 4] as const;

// Signup cohorts by week, the last `weeks` weeks ending with the current one.
export function weeklyCohorts(users: CohortUser[], now: Date, weeks = 12): CohortRow[] {
  const currentWeek = weekStart(now).getTime();
  const rows: CohortRow[] = [];
  for (let back = weeks - 1; back >= 0; back--) {
    const start = currentWeek - back * WEEK_MS;
    const members = users.filter((user) => weekStart(user.createdAt).getTime() === start);
    const retention = RETENTION_HORIZONS.map((horizon) => {
      // A signup counts only once its window for this horizon has ended.
      const eligible = members.filter((user) => user.createdAt.getTime() + (horizon + 1) * WEEK_MS <= now.getTime());
      if (eligible.length === 0) return { weeks: horizon, rate: null, eligible: 0 };
      const retained = eligible.filter((user) => {
        const from = user.createdAt.getTime() + horizon * WEEK_MS;
        return user.transactionDates.some((date) => date.getTime() >= from && date.getTime() < from + WEEK_MS);
      }).length;
      return { weeks: horizon, rate: retained / eligible.length, eligible: eligible.length };
    });
    rows.push({ week: dayKey(new Date(start)), signups: members.length, retention });
  }
  return rows;
}

export interface WeekCount {
  // Monday of the week, YYYY-MM-DD.
  week: string;
  users: number;
}

// Distinct people with at least one transaction in each of the last `weeks` weeks.
export function weeklyActive(transactionDatesByUser: Date[][], now: Date, weeks = 12): WeekCount[] {
  const currentWeek = weekStart(now).getTime();
  const series: WeekCount[] = [];
  for (let back = weeks - 1; back >= 0; back--) {
    const start = currentWeek - back * WEEK_MS;
    const users = transactionDatesByUser.filter((dates) =>
      dates.some((date) => date.getTime() >= start && date.getTime() < start + WEEK_MS)
    ).length;
    series.push({ week: dayKey(new Date(start)), users });
  }
  return series;
}

// How much of the monthly audience comes back every week: weekly actives over monthly actives (0 when there are none).
export function stickiness(weekly: number, monthly: number): number {
  return monthly > 0 ? weekly / monthly : 0;
}

// A histogram keeps the counts, not every sample, so the percentiles are approximate. With N upper edges there are N + 1
// buckets: bucket i holds values up to edge i, and the last one holds everything above the last edge.
export function histogramIndex(value: number, edges: readonly number[]): number {
  const index = edges.findIndex((edge) => value <= edge);
  return index === -1 ? edges.length : index;
}

// The upper edge of the bucket where the cumulative count reaches the p-th percentile. The overflow bucket reports the last
// edge, which is a lower bound for it. null when there are no samples.
export function histogramPercentile(counts: readonly number[], edges: readonly number[], p: number): number | null {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  const target = (p / 100) * total;
  let cumulative = 0;
  for (let i = 0; i < counts.length; i++) {
    cumulative += counts[i];
    if (cumulative >= target) return edges[Math.min(i, edges.length - 1)];
  }
  return edges[edges.length - 1];
}

// "lu***@gmail.com": enough to tell accounts apart without printing the whole address. A value that is not an address (some
// accounts were created with a plain username) is reported as such, not as a blank.
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "(sin correo)";
  if (!email.includes("@")) return "(correo no válido)";
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
