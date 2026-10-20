import { MONTHS_ES_SHORT } from "../format/spanishDates";
import { filterBillsOrIncomes, orderByHighestValue, reduceTransCategoriesSliced, type TransactionLike } from "../transformers/transactionsChange";
import { getPrimaryAmount } from "../transformers/transactionsChange";
import { isInRange } from "../transactions/movementFilters";
import { monthTotals, topSpendingCategories, type CategoryTotal, type MonthBounds, type MonthTotals } from "../transactions/monthSummary";

// The History screen's periods and the comparison of two of them ("this vs the same stretch last year"),
// like the web's History page: totals, month by month, categories and the biggest movements.

export type HistoryPreset = "last3" | "month" | "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "thisYear" | "lastYear" | "custom";

export const HISTORY_PRESETS: { value: HistoryPreset; label: string }[] = [
  { value: "last3", label: "Últimos 3 meses" },
  { value: "month", label: "Un mes" },
  { value: "thisMonth", label: "Este mes" },
  { value: "lastMonth", label: "Mes pasado" },
  { value: "thisQuarter", label: "Este trimestre" },
  { value: "lastQuarter", label: "Trimestre pasado" },
  { value: "thisYear", label: "Este año" },
  { value: "lastYear", label: "Año pasado" },
  { value: "custom", label: "Personalizado" },
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
  { value: "yearAgo", label: "Mismo periodo del año anterior" },
  { value: "previous", label: "Periodo anterior" },
  { value: "custom", label: "Personalizado" },
];

export function compareRange(preset: ComparePreset, base: MonthBounds, custom: { from: Date | null; to: Date | null }): MonthBounds {
  if (preset === "yearAgo") {
    return {
      start: new Date(base.start.getFullYear() - 1, base.start.getMonth(), base.start.getDate(), 0, 0, 0, 0),
      end: new Date(base.end.getFullYear() - 1, base.end.getMonth(), base.end.getDate(), 23, 59, 59, 999),
    };
  }
  if (preset === "previous") {
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

export function summarizePeriod<T extends TransactionLike>(movements: T[], range: MonthBounds): PeriodSummary<T> {
  const inRange = movements.filter((movement) => isInRange(movement, range));
  const { incomes, bills } = filterBillsOrIncomes(inRange);

  const months: MonthBar[] = [];
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  while (cursor <= range.end && months.length < 60) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    const inMonth = inRange.filter((movement) => isInRange(movement, { start: monthStart, end: monthEnd }));
    const totals = monthTotals(inMonth);
    months.push({ label: MONTHS_ES_SHORT[cursor.getMonth()], incomes: totals.incomes, spending: totals.spending });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const incomeRows = orderByHighestValue(reduceTransCategoriesSliced(incomes)).map((row) => ({
    name: row.type === "No category" ? "Sin categoría" : row.type,
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
