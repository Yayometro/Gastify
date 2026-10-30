import { idOf } from "../categories/categoryForm";
import { movementKind } from "../transactions/monthSummary";
import { movementTime } from "../transactions/historyWindow";
import { getPrimaryAmount } from "./transactionsChange";

// One category on its own: how its total moves month by month, how it splits among its sub-categories and tags, and its
// biggest movements. A category includes its sub-categories. Spending and income are kept apart (`kind`), transfers are
// left out, and every amount is in the primary currency (getPrimaryAmount). The months of the range are continuous: a
// month with nothing is 0, so the bars never skip one.

export interface CategoryAnalysisMovement {
  _id?: unknown;
  name?: string;
  date?: unknown;
  createdAt?: unknown;
  kind?: string;
  isBill?: boolean;
  amount?: number | string | null;
  category?: unknown;
  subCategory?: unknown;
  tags?: unknown[];
  displayMoney?: unknown;
  [key: string]: unknown;
}

export type CategoryAnalysisKind = "expense" | "income";

export interface CategoryMonth {
  // "YYYY-MM"
  month: string;
  total: number;
  count: number;
  bySub: Record<string, number>;
}

export interface CategorySubRow {
  // The sub-category's id, or NO_SUBCATEGORY for what has none.
  id: string;
  name: string;
  total: number;
  share: number;
  count: number;
  monthly: number[];
}

export interface CategoryTagRow {
  id: string;
  name: string;
  total: number;
  count: number;
}

export interface CategoryAnalysisRow {
  id: string;
  name: string;
  date: number;
  amount: number;
  subCategoryId: string;
}

export interface CategoryAnalysis {
  months: CategoryMonth[];
  stats: {
    total: number;
    count: number;
    avgMonthly: number;
    max: { month: string; total: number } | null;
    min: { month: string; total: number } | null;
    // Against the same number of months right before the range (null when that period had nothing).
    deltaPct: number | null;
    previousTotal: number;
  };
  subs: CategorySubRow[];
  tags: CategoryTagRow[];
  // The biggest movements of the range, and all of them newest first.
  top: CategoryAnalysisRow[];
  movements: CategoryAnalysisRow[];
}

export const NO_SUBCATEGORY = "none";

const round2 = (value: number): number => Math.round(value * 100) / 100;
const keyOf = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function monthKeys(count: number, today: Date): string[] {
  const keys: string[] = [];
  for (let back = count - 1; back >= 0; back--) keys.push(keyOf(new Date(today.getFullYear(), today.getMonth() - back, 1)));
  return keys;
}

function nameOf(value: unknown): string {
  if (typeof value === "string") return value;
  const name = (value as { name?: unknown } | null | undefined)?.name;
  return typeof name === "string" ? name : "";
}

export interface AnalyzeCategoryInput {
  categoryId: string;
  movements: CategoryAnalysisMovement[];
  kind?: CategoryAnalysisKind;
  // How many months the range covers, ending in today's month.
  months?: number;
  today?: Date;
  topN?: number;
  // Names for the sub-categories whose movement carries only the id.
  subNames?: Record<string, string>;
}

export function analyzeCategory({ categoryId, movements, kind = "expense", months = 6, today = new Date(), topN = 6, subNames = {} }: AnalyzeCategoryInput): CategoryAnalysis {
  const keys = monthKeys(months, today);
  const previousKeys = new Set(monthKeys(months * 2, today).slice(0, months));
  const index = new Map(keys.map((key, position) => [key, position]));
  const rows: CategoryMonth[] = keys.map((month) => ({ month, total: 0, count: 0, bySub: {} }));
  const subs = new Map<string, CategorySubRow>();
  const tags = new Map<string, CategoryTagRow>();
  const inRange: CategoryAnalysisRow[] = [];
  let previousTotal = 0;

  for (const movement of movements) {
    if (idOf(movement.category) !== categoryId) continue;
    const movementType = movementKind(movement as never);
    if (movementType === "transfer" || movementType !== kind) continue;
    const time = movementTime(movement);
    if (time === null) continue;
    const key = keyOf(new Date(time));
    const amount = Math.abs(getPrimaryAmount(movement));
    if (previousKeys.has(key)) previousTotal += amount;
    const position = index.get(key);
    if (position === undefined) continue;

    const subId = idOf(movement.subCategory) || NO_SUBCATEGORY;
    const month = rows[position];
    month.total += amount;
    month.count += 1;
    month.bySub[subId] = (month.bySub[subId] ?? 0) + amount;

    const sub = subs.get(subId) ?? { id: subId, name: nameOf(movement.subCategory) || subNames[subId] || "", total: 0, share: 0, count: 0, monthly: keys.map(() => 0) };
    sub.total += amount;
    sub.count += 1;
    sub.monthly[position] += amount;
    if (!sub.name) sub.name = nameOf(movement.subCategory) || subNames[subId] || "";
    subs.set(subId, sub);

    for (const tag of movement.tags ?? []) {
      const id = idOf(tag);
      if (!id) continue;
      const row = tags.get(id) ?? { id, name: nameOf(tag) || id, total: 0, count: 0 };
      row.total += amount;
      row.count += 1;
      tags.set(id, row);
    }

    inRange.push({ id: idOf(movement._id), name: typeof movement.name === "string" ? movement.name : "", date: time, amount: round2(amount), subCategoryId: subId });
  }

  for (const month of rows) {
    month.total = round2(month.total);
    for (const id of Object.keys(month.bySub)) month.bySub[id] = round2(month.bySub[id]);
  }
  const total = round2(rows.reduce((sum, month) => sum + month.total, 0));
  const withData = rows.filter((month) => month.count > 0);
  const max = withData.length ? withData.reduce((best, month) => (month.total > best.total ? month : best)) : null;
  const min = withData.length ? withData.reduce((best, month) => (month.total < best.total ? month : best)) : null;
  previousTotal = round2(previousTotal);

  const subRows = [...subs.values()].map((sub) => ({ ...sub, total: round2(sub.total), share: total > 0 ? sub.total / total : 0, monthly: sub.monthly.map(round2) }));
  subRows.sort((a, b) => b.total - a.total);

  return {
    months: rows,
    stats: {
      total,
      count: rows.reduce((sum, month) => sum + month.count, 0),
      avgMonthly: round2(total / Math.max(1, months)),
      max: max ? { month: max.month, total: max.total } : null,
      min: min ? { month: min.month, total: min.total } : null,
      deltaPct: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
      previousTotal,
    },
    subs: subRows,
    tags: [...tags.values()].map((tag) => ({ ...tag, total: round2(tag.total) })).sort((a, b) => b.total - a.total),
    top: [...inRange].sort((a, b) => b.amount - a.amount).slice(0, topN),
    movements: [...inRange].sort((a, b) => b.date - a.date),
  };
}
