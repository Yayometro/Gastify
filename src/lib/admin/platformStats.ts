import dbConnection from "@/app/api/dbConnection";
import { getSharedMongoClient } from "@/lib/db/mongoClient";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Budget from "@/model/Budget";
import Tag from "@/model/Tag";
import {
  activation,
  activeWithin,
  bucketCounts,
  dailySeries,
  maskEmail,
  percentile,
  topCounts,
  type Activation,
  type BucketCount,
  type DayCount,
} from "./statsMath";

// What the platform admin shows. READ ONLY: this module only counts and groups. It never reads amounts, names of transactions or
// full emails, and never selects the API tokens' hashes. Per person it keeps counts and dates, nothing else.

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

export interface UserRow {
  id: string;
  emailMasked: string;
  createdAt: string;
  lastActivity: string | null;
  providers: string[];
  country: string | null;
  transactions: number;
  categories: number;
  accounts: number;
  budgets: number;
}

export interface PlatformStats {
  generatedAt: string;
  users: {
    total: number;
    new7d: number;
    new30d: number;
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
    // People who added a transaction (by when it was saved) in the last day / week / month.
    addedData: { d1: number; d7: number; d30: number };
    // People whose session passed the API gate in the last day / week / month. Sessions are deleted when they expire or
    // the person signs out, so this undercounts the past; the "addedData" numbers are the durable ones.
    sessions: { d1: number; d7: number; d30: number };
    signupsByDay: DayCount[];
    transactionsByDay: DayCount[];
  };
  content: {
    transactions: number;
    categories: number;
    subCategories: number;
    accounts: number;
    budgets: number;
    tags: number;
    perUser: { median: number; p90: number; max: number; average: number; buckets: BucketCount[] };
  };
  // The 25 people with the most recent activity.
  recentUsers: UserRow[];
}

interface UserDoc {
  _id: unknown;
  mail?: string;
  language?: string | null;
  country?: string | null;
  createdAt?: Date;
  apiTokenCount?: number;
}

interface PerUserCount {
  _id: unknown;
  count: number;
  first?: Date;
  last?: Date;
}

const asKey = (id: unknown): string => String(id);
const toMap = (rows: PerUserCount[]): Map<string, PerUserCount> => new Map(rows.map((row) => [asKey(row._id), row]));

export async function getPlatformStats(now: Date = new Date()): Promise<PlatformStats> {
  await dbConnection();
  const db = getSharedMongoClient().db();
  const since = (days: number): Date => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // The people. The API tokens are only counted: their hashes are never selected.
  const users = (await User.aggregate([
    {
      $project: {
        mail: 1,
        language: 1,
        country: 1,
        createdAt: 1,
        apiTokenCount: { $size: { $ifNull: ["$apiTokens", []] } },
      },
    },
  ])) as UserDoc[];

  const perUser = (model: { aggregate: (pipeline: object[]) => Promise<unknown[]> }, match: object): Promise<PerUserCount[]> =>
    model.aggregate([
      { $match: { user: { $exists: true, $ne: null }, ...match } },
      { $group: { _id: "$user", count: { $sum: 1 }, first: { $min: "$createdAt" }, last: { $max: "$createdAt" } } },
    ]) as Promise<PerUserCount[]>;

  const [txRows, categoryRows, accountRows, budgetRows] = await Promise.all([
    perUser(Transaction, { name: { $not: SEED.transaction } }),
    perUser(Category, { name: { $not: SEED.category }, isDefaultCatego: { $ne: true } }),
    perUser(Account, { name: { $not: SEED.account } }),
    perUser(Budget, { name: { $not: SEED.budget } }),
  ]);

  const [subCategories, tags, txByDate, accountProviders, passkeyUsers, twoFactorUsers, sessionRows] = await Promise.all([
    SubCategory.countDocuments({ name: { $not: SEED.subCategory } }),
    Tag.countDocuments({ name: { $not: SEED.tag } }),
    Transaction.find({ name: { $not: SEED.transaction }, createdAt: { $gte: since(30) } }, { createdAt: 1 }).lean(),
    db.collection("account").aggregate([{ $group: { _id: { user: "$userId", provider: "$providerId" } } }]).toArray(),
    db.collection("passkey").distinct("userId"),
    db.collection("twoFactor").distinct("userId"),
    db.collection("session").aggregate([
      { $match: { lastApiActivityAt: { $gte: since(30) } } },
      { $group: { _id: "$userId", last: { $max: "$lastApiActivityAt" } } },
    ]).toArray(),
  ]);

  const tx = toMap(txRows);
  const categories = toMap(categoryRows);
  const accounts = toMap(accountRows);
  const budgets = toMap(budgetRows);
  const sessions = new Map<string, Date>(sessionRows.map((row) => [asKey(row._id), row.last as Date]));
  const passkeys = new Set(passkeyUsers.map(asKey));
  const twoFactors = new Set(twoFactorUsers.map(asKey));
  const providersByUser = new Map<string, string[]>();
  for (const row of accountProviders) {
    const key = asKey((row._id as { user: unknown }).user);
    providersByUser.set(key, [...(providersByUser.get(key) ?? []), String((row._id as { provider: unknown }).provider)]);
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
  const total = users.length;

  const recentUsers: UserRow[] = [...users]
    .sort((a, b) => (lastActivity(b)?.getTime() ?? 0) - (lastActivity(a)?.getTime() ?? 0))
    .slice(0, 25)
    .map((user) => {
      const key = asKey(user._id);
      return {
        id: key.slice(-6),
        emailMasked: maskEmail(user.mail),
        createdAt: created(user).toISOString(),
        lastActivity: lastActivity(user)?.toISOString() ?? null,
        providers: providersByUser.get(key) ?? [],
        country: user.country ?? null,
        transactions: tx.get(key)?.count ?? 0,
        categories: categories.get(key)?.count ?? 0,
        accounts: accounts.get(key)?.count ?? 0,
        budgets: budgets.get(key)?.count ?? 0,
      };
    });

  return {
    generatedAt: now.toISOString(),
    users: {
      total,
      new7d: users.filter((user) => created(user) >= since(7)).length,
      new30d: users.filter((user) => created(user) >= since(30)).length,
      withTransactions: txCounts.filter((count) => count > 0).length,
      withPasskey: users.filter((user) => passkeys.has(asKey(user._id))).length,
      withTwoFactor: users.filter((user) => twoFactors.has(asKey(user._id))).length,
      withApiToken: users.filter((user) => (user.apiTokenCount ?? 0) > 0).length,
      byProvider: topCounts(users.flatMap((user) => (providersByUser.get(asKey(user._id)) ?? ["sin cuenta"])), 6),
      byLanguage: topCounts(users.map((user) => user.language ?? "automático"), 4),
      byCountry: topCounts(users.map((user) => user.country), 8),
      activation: activation(
        users.map((user) => ({ createdAt: created(user), firstTransactionAt: tx.get(asKey(user._id))?.first ?? null })),
        now
      ),
    },
    activity: {
      addedData: {
        d1: activeWithin(users.map(lastTx), 1, now),
        d7: activeWithin(users.map(lastTx), 7, now),
        d30: activeWithin(users.map(lastTx), 30, now),
      },
      sessions: {
        d1: activeWithin(users.map(lastSession), 1, now),
        d7: activeWithin(users.map(lastSession), 7, now),
        d30: activeWithin(users.map(lastSession), 30, now),
      },
      signupsByDay: dailySeries(users.map(created), 30, now),
      transactionsByDay: dailySeries(
        (txByDate as { createdAt?: Date }[]).flatMap((row) => (row.createdAt ? [row.createdAt] : [])),
        30,
        now
      ),
    },
    content: {
      transactions: txRows.reduce((sum, row) => sum + row.count, 0),
      categories: categoryRows.reduce((sum, row) => sum + row.count, 0),
      subCategories,
      accounts: accountRows.reduce((sum, row) => sum + row.count, 0),
      budgets: budgetRows.reduce((sum, row) => sum + row.count, 0),
      tags,
      perUser: {
        median: percentile(txCounts, 50),
        p90: percentile(txCounts, 90),
        max: txCounts.reduce((max, count) => Math.max(max, count), 0),
        average: total === 0 ? 0 : txCounts.reduce((sum, count) => sum + count, 0) / total,
        buckets: bucketCounts(txCounts),
      },
    },
    recentUsers,
  };
}
