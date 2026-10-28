import { ObjectId } from "mongodb";
import { adminDb } from "./adminDb";
import { readMetricDocs, firstDayOf, USAGE_EVENTS } from "./metrics";
import { summarizeRoutes, summarizeVitals, usageSeries, type RouteSummary, type VitalSummary } from "./metricsMath";
import { planOf, revenueByPlan, type PlanRevenue } from "./plans";
import { readSnapshots, saveSnapshot, type DailySnapshot } from "./snapshots";
import { readAudit, type AuditEntry } from "./audit";
import {
  activation,
  activeWithin,
  bucketCounts,
  dailySeries,
  maskEmail,
  percentile,
  stickiness,
  topCounts,
  weeklyActive,
  weeklyCohorts,
  type Activation,
  type BucketCount,
  type CohortRow,
  type DayCount,
  type RangeDays,
  type WeekCount,
} from "./statsMath";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

// Every new account is given one starter document of each kind (see provisionNewUserData.ts). They are not the person's own
// data, so they are left out of the counts.
const SEED = {
  transaction: /first transaction$/i,
  category: /First Category$/i,
  subCategory: /First Sub Category$/i,
  account: /General Account$/i,
  budget: /First Budget$/i,
  tag: /First Tag$/i,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface UserRow {
  id: string;
  emailMasked: string;
  createdAt: string;
  lastActivity: string | null;
  providers: string[];
  country: string | null;
  plan: string;
  transactions: number;
  categories: number;
  accounts: number;
  budgets: number;
}

export interface Overview {
  range: RangeDays;
  generatedAt: string;
  users: {
    total: number;
    newInRange: number;
    new7d: number;
    withTransactions: number;
    withPasskey: number;
    withTwoFactor: number;
    withApiToken: number;
    byProvider: { label: string; count: number }[];
    byLanguage: { label: string; count: number }[];
    byCountry: { label: string; count: number }[];
    activation: Activation;
  };
  activity: {
    addedData: { d1: number; d7: number; d30: number };
    sessions: { d1: number; d7: number; d30: number };
    mau: number;
    wau: number;
    stickiness: number;
    weeklyActive: WeekCount[];
    signupsByDay: DayCount[];
    transactionsByDay: DayCount[];
    snapshots: DailySnapshot[];
  };
  cohorts: CohortRow[];
  content: {
    transactions: number;
    categories: number;
    subCategories: number;
    accounts: number;
    budgets: number;
    tags: number;
    perUser: { median: number; p90: number; max: number; average: number; buckets: BucketCount[] };
  };
  usage: { event: string; total: number; series: DayCount[] }[];
  performance: { routes: RouteSummary[]; vitals: VitalSummary[] };
  revenue: PlanRevenue[];
  recentUsers: UserRow[];
}

interface UserDoc {
  _id: unknown;
  mail?: string;
  fullName?: string | null;
  language?: string | null;
  country?: string | null;
  plan?: string | null;
  createdAt?: Date;
  apiTokens?: unknown[];
}

interface PerUserCount {
  _id: unknown;
  count: number;
  first?: Date;
  last?: Date;
  dates?: Date[];
}

const asKey = (id: unknown): string => String(id);

function byUser(rows: PerUserCount[]): Map<string, PerUserCount> {
  return new Map(rows.map((row) => [asKey(row._id), row]));
}

async function loadUsers(): Promise<UserDoc[]> {
  return (await User.aggregate([
    {
      $project: {
        mail: 1,
        language: 1,
        country: 1,
        plan: 1,
        createdAt: 1,
        apiTokens: { $ifNull: ["$apiTokens", []] },
      },
    },
  ])) as UserDoc[];
}

async function loadTransactionsPerUser(match: object = {}): Promise<Map<string, PerUserCount>> {
  const db = await adminDb();
  const rows = (await db
    .collection("transactions")
    .aggregate([
      { $match: { user: { $exists: true, $ne: null }, name: { $not: SEED.transaction }, ...match } },
      { $group: { _id: "$user", count: { $sum: 1 }, first: { $min: "$createdAt" }, last: { $max: "$createdAt" }, dates: { $push: "$createdAt" } } },
    ])
    .toArray()) as PerUserCount[];
  return byUser(rows);
}

async function countPerUser(collection: string, nameExclusion?: RegExp, isDefault = false): Promise<Map<string, PerUserCount>> {
  const db = await adminDb();
  const match: Record<string, unknown> = { user: { $exists: true, $ne: null } };
  if (nameExclusion) match.name = { $not: nameExclusion };
  if (isDefault) match.isDefaultCatego = { $ne: true };
  const rows = (await db
    .collection(collection)
    .aggregate([{ $match: match }, { $group: { _id: "$user", count: { $sum: 1 }, first: { $min: "$createdAt" }, last: { $max: "$createdAt" } } }])
    .toArray()) as PerUserCount[];
  return byUser(rows);
}

const totalOf = (map: Map<string, PerUserCount>): number => [...map.values()].reduce((sum, row) => sum + row.count, 0);

export async function getOverview(range: RangeDays = 30, now: Date = new Date()): Promise<Overview> {
  await dbConnection();
  const db = await adminDb();
  const since = (days: number): Date => new Date(now.getTime() - days * DAY_MS);
  const rangeStart = since(range - 1);

  const [users, tx, categories, accounts, budgets, tags, subCategories, passkeyUsers, twoFactorUsers, sessionRows, accountRows] = await Promise.all([
    loadUsers(),
    loadTransactionsPerUser(),
    countPerUser("categories", SEED.category, true),
    countPerUser("accounts", SEED.account),
    countPerUser("budgets", SEED.budget),
    db.collection("tags").countDocuments({ name: { $not: SEED.tag } }),
    db.collection("subcategories").countDocuments({ name: { $not: SEED.subCategory } }),
    db.collection("passkey").distinct("userId"),
    db.collection("twoFactor").distinct("userId"),
    db.collection("session").aggregate([
      { $match: { lastApiActivityAt: { $gte: since(30) } } },
      { $group: { _id: "$userId", last: { $max: "$lastApiActivityAt" } } },
    ]).toArray(),
    db.collection("account").aggregate([{ $group: { _id: { user: "$userId", provider: "$providerId" } } }]).toArray(),
  ]);

  const sessions = new Map<string, Date>(sessionRows.map((row) => [asKey(row._id), row.last as Date]));
  const passkeys = new Set(passkeyUsers.map(asKey));
  const twoFactors = new Set(twoFactorUsers.map(asKey));
  const providers = new Map<string, string[]>();
  for (const row of accountRows) {
    const key = asKey((row._id as { user: unknown }).user);
    providers.set(key, [...(providers.get(key) ?? []), String((row._id as { provider: unknown }).provider)]);
  }

  const created = (user: UserDoc): Date => user.createdAt ?? new Date(0);
  const lastTx = (user: UserDoc): Date | null => tx.get(asKey(user._id))?.last ?? null;
  const lastSession = (user: UserDoc): Date | null => sessions.get(asKey(user._id)) ?? null;
  const lastActivity = (user: UserDoc): Date | null => {
    const a = lastTx(user);
    const b = lastSession(user);
    if (a && b) return a > b ? a : b;
    return a ?? b;
  };
  const txCounts = users.map((user) => tx.get(asKey(user._id))?.count ?? 0);
  const txDatesPerUser = [...tx.values()].map((row) => row.dates ?? []);
  const cohortUsers = users.map((user) => ({
    createdAt: created(user),
    transactionDates: (tx.get(asKey(user._id))?.dates ?? []).map((date) => new Date(date)),
  }));

  const weekly = weeklyActive(txDatesPerUser, now, 12);
  const mau = activeWithin(users.map(lastTx), 30, now);
  const wau = activeWithin(users.map(lastTx), 7, now);

  // Today's totals go to the daily snapshot, so the history keeps growing even if the raw data does not.
  const today = now.toISOString().slice(0, 10);
  const totalTransactions = totalOf(tx);
  await saveSnapshot({ day: today, users: users.length, transactions: totalTransactions, wau, mau }).catch(() => {});
  const snapshots = await readSnapshots(firstDayOf(range, now)).catch(() => [] as DailySnapshot[]);

  const storedPlans = users.map((user) => user.plan ?? null);
  const metricDocs = await readMetricDocs(firstDayOf(range, now)).catch(() => []);
  const usage = USAGE_EVENTS.map((event) => {
    const series = usageSeries(metricDocs, event, range, now);
    return { event, total: series.reduce((sum, entry) => sum + entry.count, 0), series: series.map((entry) => ({ day: entry.day, count: entry.count })) };
  });

  const recent: UserRow[] = [...users]
    .sort((a, b) => (lastActivity(b)?.getTime() ?? 0) - (lastActivity(a)?.getTime() ?? 0))
    .slice(0, 25)
    .map((user) => {
      const key = asKey(user._id);
      return {
        id: key,
        emailMasked: maskEmail(user.mail),
        createdAt: created(user).toISOString(),
        lastActivity: lastActivity(user)?.toISOString() ?? null,
        providers: providers.get(key) ?? [],
        country: user.country ?? null,
        plan: planOf(user.plan),
        transactions: tx.get(key)?.count ?? 0,
        categories: categories.get(key)?.count ?? 0,
        accounts: accounts.get(key)?.count ?? 0,
        budgets: budgets.get(key)?.count ?? 0,
      };
    });

  return {
    range,
    generatedAt: now.toISOString(),
    users: {
      total: users.length,
      newInRange: users.filter((user) => created(user) >= rangeStart).length,
      new7d: users.filter((user) => created(user) >= since(7)).length,
      withTransactions: txCounts.filter((count) => count > 0).length,
      withPasskey: users.filter((user) => passkeys.has(asKey(user._id))).length,
      withTwoFactor: users.filter((user) => twoFactors.has(asKey(user._id))).length,
      withApiToken: users.filter((user) => (user.apiTokens?.length ?? 0) > 0).length,
      byProvider: topCounts(users.flatMap((user) => providers.get(asKey(user._id)) ?? ["sin cuenta"]), 6),
      byLanguage: topCounts(users.map((user) => user.language ?? "automático"), 4),
      byCountry: topCounts(users.map((user) => user.country), 8),
      activation: activation(
        users.map((user) => ({ createdAt: created(user), firstTransactionAt: tx.get(asKey(user._id))?.first ?? null })),
        now,
        range
      ),
    },
    activity: {
      addedData: { d1: activeWithin(users.map(lastTx), 1, now), d7: wau, d30: mau },
      sessions: {
        d1: activeWithin(users.map(lastSession), 1, now),
        d7: activeWithin(users.map(lastSession), 7, now),
        d30: activeWithin(users.map(lastSession), 30, now),
      },
      mau,
      wau,
      stickiness: stickiness(wau, mau),
      weeklyActive: weekly,
      signupsByDay: dailySeries(users.map(created), range, now),
      transactionsByDay: dailySeries(
        [...tx.values()].flatMap((row) => (row.dates ?? []).map((date) => new Date(date))),
        range,
        now
      ),
      snapshots,
    },
    cohorts: weeklyCohorts(cohortUsers, now, 12),
    content: {
      transactions: totalTransactions,
      categories: totalOf(categories),
      subCategories,
      accounts: totalOf(accounts),
      budgets: totalOf(budgets),
      tags,
      perUser: {
        median: percentile(txCounts, 50),
        p90: percentile(txCounts, 90),
        max: txCounts.reduce((max, count) => Math.max(max, count), 0),
        average: users.length === 0 ? 0 : txCounts.reduce((sum, count) => sum + count, 0) / users.length,
        buckets: bucketCounts(txCounts),
      },
    },
    usage,
    performance: {
      routes: summarizeRoutes(metricDocs),
      vitals: summarizeVitals(metricDocs),
    },
    revenue: revenueByPlan(storedPlans),
    recentUsers: recent,
  };
}

export interface PerformanceView {
  range: RangeDays;
  generatedAt: string;
  routes: RouteSummary[];
  vitals: VitalSummary[];
  // Daily request count and failed count for every route, for the trend.
  daily: { day: string; requests: number; errors: number }[];
}

// The performance panel: only the metric documents, so it is cheap to open.
export async function getPerformance(range: RangeDays = 30, now: Date = new Date()): Promise<PerformanceView> {
  const docs = await readMetricDocs(firstDayOf(range, now));
  const days = dailySeries([], range, now).map((entry) => entry.day);
  const daily = days.map((day) => {
    const routeDocs = docs.filter((doc) => doc.kind === "route" && doc.day === day);
    return {
      day,
      requests: routeDocs.reduce((sum, doc) => sum + (doc.count ?? 0), 0),
      errors: routeDocs.reduce((sum, doc) => sum + (doc.errors ?? 0), 0),
    };
  });
  return {
    range,
    generatedAt: now.toISOString(),
    routes: summarizeRoutes(docs),
    vitals: summarizeVitals(docs),
    daily,
  };
}

export interface UserDetail {
  id: string;
  emailMasked: string;
  fullName: string | null;
  createdAt: string | null;
  lastActivity: string | null;
  providers: string[];
  language: string | null;
  country: string | null;
  plan: string;
  hasPasskey: boolean;
  hasTwoFactor: boolean;
  apiTokens: number;
  activeSessions: number;
  counts: { transactions: number; categories: number; accounts: number; budgets: number };
  firstTransactionAt: string | null;
  audit: AuditEntry[];
}

// One account, for the detail page. Counts and dates only; no amounts, no transaction names, no token values.
export async function getUserDetail(id: string, now: Date = new Date()): Promise<UserDetail | null> {
  await dbConnection();
  const db = await adminDb();
  const objectId = new ObjectId(id);
  const user = (await User.collection.findOne({ _id: objectId })) as UserDoc | null;
  if (!user) return null;
  const key = id;
  const [tx, categories, accounts, budgets, providers, passkey, twoFactor, sessions, activeSessions, audit] = await Promise.all([
    loadTransactionsPerUser({ user: objectId }),
    countPerUser("categories", SEED.category, true),
    countPerUser("accounts", SEED.account),
    countPerUser("budgets", SEED.budget),
    db.collection("account").distinct("providerId", { userId: { $in: [objectId, key] } }),
    db.collection("passkey").countDocuments({ userId: { $in: [objectId, key] } }),
    db.collection("twoFactor").countDocuments({ userId: { $in: [objectId, key] } }),
    db.collection("session").aggregate([
      { $match: { userId: { $in: [objectId, key] } } },
      { $group: { _id: null, last: { $max: "$lastApiActivityAt" } } },
    ]).toArray(),
    db.collection("session").countDocuments({ userId: { $in: [objectId, key] }, expiresAt: { $gt: now } }),
    readAudit(20, id),
  ]);
  const row = tx.get(key);
  const lastSession = (sessions[0]?.last as Date | undefined) ?? null;
  const lastTx = row?.last ?? null;
  const last = lastTx && lastSession ? (lastTx > lastSession ? lastTx : lastSession) : (lastTx ?? lastSession);
  const pick = (map: Map<string, PerUserCount>) => map.get(key)?.count ?? 0;
  return {
    id,
    emailMasked: maskEmail(user.mail),
    fullName: user.fullName ?? null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    lastActivity: last ? new Date(last).toISOString() : null,
    providers: providers.map(String),
    language: user.language ?? null,
    country: user.country ?? null,
    plan: planOf(user.plan),
    hasPasskey: passkey > 0,
    hasTwoFactor: twoFactor > 0,
    apiTokens: user.apiTokens?.length ?? 0,
    activeSessions,
    counts: { transactions: pick(tx), categories: pick(categories), accounts: pick(accounts), budgets: pick(budgets) },
    firstTransactionAt: row?.first ? new Date(row.first).toISOString() : null,
    audit,
  };
}
