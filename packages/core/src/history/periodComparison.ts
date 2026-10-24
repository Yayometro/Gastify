import { monthName } from "../i18n/dates";
import type { Locale } from "../i18n/locales";
import { filterBillsOrIncomes, orderByHighestValue, reduceTransCategoriesSliced, type TransactionLike } from "../transformers/transactionsChange";
import { getPrimaryAmount } from "../transformers/transactionsChange";
import { isInRange } from "../transactions/movementFilters";
import { monthTotals, topSpendingCategories, type CategoryTotal, type MonthBounds, type MonthTotals } from "../transactions/monthSummary";

// The History screen's periods and the comparison of two of them ("this vs the same stretch last year"),
// like the web's History page: totals, month by month, categories and the biggest movements.

export type HistoryPreset = "last3" | "month" | "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "thisYear" | "lastYear" | "q1" | "q2" | "q3" | "q4" | "h1" | "h2" | "custom";

export const HISTORY_PRESETS: { value: HistoryPreset; label: string }[] = [
  { value: "last3", label: "history.preset.last3" },
  { value: "month", label: "history.preset.month" },
  { value: "thisMonth", label: "history.preset.thisMonth" },
  { value: "lastMonth", label: "history.preset.lastMonth" },
  { value: "thisQuarter", label: "history.preset.thisQuarter" },
  { value: "lastQuarter", label: "history.preset.lastQuarter" },
  { value: "thisYear", label: "history.preset.thisYear" },
  { value: "lastYear", label: "history.preset.lastYear" },
  { value: "custom", label: "history.preset.custom" },
];

// The longer list of the wide screens (the web's): the same as above plus each quarter and each half of the current year.
export const HISTORY_PRESETS_EXTENDED: { value: HistoryPreset; label: string }[] = [
  { value: "last3", label: "history.preset.last3" },
  { value: "month", label: "history.preset.month" },
  { value: "thisMonth", label: "history.preset.thisMonth" },
  { value: "lastMonth", label: "history.preset.lastMonth" },
  { value: "thisQuarter", label: "history.preset.thisQuarter" },
  { value: "lastQuarter", label: "history.preset.lastQuarter" },
  { value: "q1", label: "history.preset.q1" },
  { value: "q2", label: "history.preset.q2" },
  { value: "q3", label: "history.preset.q3" },
  { value: "q4", label: "history.preset.q4" },
  { value: "h1", label: "history.preset.h1" },
  { value: "h2", label: "history.preset.h2" },
  { value: "thisYear", label: "history.preset.thisYear" },
  { value: "lastYear", label: "history.preset.lastYear" },
  { value: "custom", label: "history.preset.custom" },
];

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

export function historyRange(preset: HistoryPreset, now: Date, custom: { from: Date | null; to: Date | null }, month?: Date): MonthBounds {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "month": {
      const picked = month ?? now;
      return { start: startOfMonth(picked.getFullYear(), picked.getMonth()), end: endOfMonth(picked.getFullYear(), picked.getMonth()) };
    }
    case "thisMonth":
      return { start: startOfMonth(y, m), end: endOfMonth(y, m) };
    case "lastMonth":
      return { start: startOfMonth(y, m - 1), end: endOfMonth(y, m - 1) };
    case "thisQuarter": {
      const q = Math.floor(m / 3) * 3;
      return { start: startOfMonth(y, q), end: endOfMonth(y, q + 2) };
    }
    case "lastQuarter": {
      const q = Math.floor(m / 3) * 3 - 3;
      return { start: startOfMonth(y, q), end: endOfMonth(y, q + 2) };
    }
    case "q1":
    case "q2":
    case "q3":
    case "q4": {
      const first = (Number(preset[1]) - 1) * 3;
      return { start: startOfMonth(y, first), end: endOfMonth(y, first + 2) };
    }
    case "h1":
      return { start: startOfMonth(y, 0), end: endOfMonth(y, 5) };
    case "h2":
      return { start: startOfMonth(y, 6), end: endOfMonth(y, 11) };
    case "thisYear":
      return { start: startOfMonth(y, 0), end: endOfMonth(y, 11) };
    case "lastYear":
      return { start: startOfMonth(y - 1, 0), end: endOfMonth(y - 1, 11) };
    case "custom": {
      const from = custom.from ?? startOfMonth(y, m);
      const to = custom.to ?? now;
      const [a, b] = from <= to ? [from, to] : [to, from];
      return { start: new Date(a.getFullYear(), a.getMonth(), a.getDate(), 0, 0, 0, 0), end: new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59, 999) };
    }
    default:
      return { start: startOfMonth(y, m - 2), end: endOfMonth(y, m) };
  }
}

export type ComparePreset = "yearAgo" | "previous" | "custom";

export const COMPARE_PRESETS: { value: ComparePreset; label: string }[] = [
  { value: "yearAgo", label: "history.compare.yearAgo" },
  { value: "previous", label: "history.compare.previous" },
  { value: "custom", label: "history.preset.custom" },
];

export function compareRange(preset: ComparePreset, base: MonthBounds, custom: { from: Date | null; to: Date | null }): MonthBounds {
  if (preset === "yearAgo") {
    return {
      start: new Date(base.start.getFullYear() - 1, base.start.getMonth(), base.start.getDate(), 0, 0, 0, 0),
      end: new Date(base.end.getFullYear() - 1, base.end.getMonth(), base.end.getDate(), 23, 59, 59, 999),
    };
  }
  if (preset === "previous") {
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const monthsSpan = (base.end.getFullYear() - base.start.getFullYear()) * 12 + (base.end.getMonth() - base.start.getMonth()) + 1;
    const startsOnFirst = base.start.getDate() === 1;
    const lastOfMonth = new Date(base.end.getFullYear(), base.end.getMonth() + 1, 0);
    const endsOnLast = sameDay(base.end, lastOfMonth);
    // A stretch of whole months (a month, a quarter, a half, a year) is compared with the whole months right
    // before it: "2026" with "2025", "Q4" with "Q3", "October" with "September".
    if (startsOnFirst && endsOnLast) {
      const start = new Date(base.start.getFullYear(), base.start.getMonth() - monthsSpan, 1, 0, 0, 0, 0);
      return { start, end: new Date(start.getFullYear(), start.getMonth() + monthsSpan, 0, 23, 59, 59, 999) };
    }
    // Any other stretch: the same number of days right before it.
    const span = base.end.getTime() - base.start.getTime();
    return { start: new Date(base.start.getTime() - span - 1), end: new Date(base.start.getTime() - 1) };
  }
  return historyRange("custom", base.start, custom);
}

export interface MonthBar {
  label: string;
  incomes: number;
  spending: number;
}

export interface PeriodSummary<T extends TransactionLike = TransactionLike> {
  range: MonthBounds;
  totals: MonthTotals;
  // Spending and income by category, biggest first.
  spendingByCategory: CategoryTotal[];
  incomeByCategory: CategoryTotal[];
  // Month by month, from the first month of the range to the last.
  months: MonthBar[];
  // The five biggest expenses.
  biggest: T[];
}

// What the summary says in the person's language: the month names, and the name of the movements with no category.
export interface PeriodLabels {
  locale: Locale;
  noCategory: string;
}

export function summarizePeriod<T extends TransactionLike>(movements: T[], range: MonthBounds, labels: PeriodLabels): PeriodSummary<T> {
  const inRange = movements.filter((movement) => isInRange(movement, range));
  const { incomes, bills } = filterBillsOrIncomes(inRange);

  const months: MonthBar[] = [];
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  while (cursor <= range.end && months.length < 60) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    const inMonth = inRange.filter((movement) => isInRange(movement, { start: monthStart, end: monthEnd }));
    const totals = monthTotals(inMonth);
    months.push({ label: monthName(cursor.getMonth(), labels.locale, "short"), incomes: totals.incomes, spending: totals.spending });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const incomeRows = orderByHighestValue(reduceTransCategoriesSliced(incomes)).map((row) => ({
    name: row.type === "No category" ? labels.noCategory : row.type,
    icon: row.icon,
    color: row.color,
    value: Math.round(row.value * 100) / 100,
    count: row.children.length,
  }));

  return {
    range,
    totals: monthTotals(inRange),
    spendingByCategory: topSpendingCategories(inRange, 200),
    incomeByCategory: incomeRows,
    months,
    biggest: orderByHighestValue(bills.map((bill) => ({ bill, value: getPrimaryAmount(bill) }))).slice(0, 5).map((entry) => entry.bill),
  };
}

export interface CompareRow {
  name: string;
  icon: string;
  color: string;
  a: number;
  b: number;
}

// The categories of both periods side by side; a category in only one of them has 0 in the other.
// Biggest combined first.
export function compareCategories(a: CategoryTotal[], b: CategoryTotal[]): CompareRow[] {
  const byName = new Map<string, CompareRow>();
  for (const row of a) byName.set(row.name, { name: row.name, icon: row.icon, color: row.color, a: row.value, b: 0 });
  for (const row of b) {
    const found = byName.get(row.name);
    if (found) found.b = row.value;
    else byName.set(row.name, { name: row.name, icon: row.icon, color: row.color, a: 0, b: row.value });
  }
  return [...byName.values()].sort((x, y) => y.a + y.b - (x.a + x.b));
}

// How much the current value moved against the previous one, as a fraction (0.25 = +25 %). Null when
// there was nothing to compare with.
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
