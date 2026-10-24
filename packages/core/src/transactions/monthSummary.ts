import { movementTime } from "./historyWindow";
import { dayLabel } from "../i18n/dates";
import type { Locale } from "../i18n/locales";
import type { TranslateFn } from "../i18n/translate";
import {
  filterBillsOrIncomes,
  get_total_value_of_all_transactions,
  getTransactionsFromTimeRange,
  orderByHighestValue,
  reduceTransCategoriesSliced,
  type TransactionLike,
} from "../transformers/transactionsChange";

// One calendar month of movements: the totals, the biggest spending categories and the list
// grouped by day. Same rules as the web dashboard: transfers and exchanges are neither income
// nor spending, and every amount is in the wallet's primary currency (getPrimaryAmount).

export interface MonthBounds {
  start: Date;
  end: Date;
}

export function monthBounds(year: number, monthIndex: number): MonthBounds {
  return {
    start: new Date(year, monthIndex, 1),
    end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
  };
}

export type MovementKind = "income" | "expense" | "transfer";

export function movementKind(movement: TransactionLike): MovementKind {
  if (movement.kind === "transfer" || movement.kind === "exchange") return "transfer";
  return movement.isBill ? "expense" : "income";
}

// Newest first, the order the lists show.
export function sortNewestFirst<T extends TransactionLike>(movements: T[]): T[] {
  return [...movements].sort((a, b) => (movementTime(b) ?? 0) - (movementTime(a) ?? 0));
}

export function movementsInMonth<T extends TransactionLike>(movements: T[], bounds: MonthBounds): T[] {
  return sortNewestFirst(getTransactionsFromTimeRange(movements, bounds.start, bounds.end));
}

export interface MonthTotals {
  incomes: number;
  spending: number;
  balance: number;
  count: number;
}

export function monthTotals<T extends TransactionLike>(movements: T[]): MonthTotals {
  const { incomes, bills } = filterBillsOrIncomes(movements);
  const income = get_total_value_of_all_transactions(incomes);
  const spending = get_total_value_of_all_transactions(bills);
  // Two decimals are enough for every supported currency; this only hides float noise.
  return {
    incomes: Math.round(income * 100) / 100,
    spending: Math.round(spending * 100) / 100,
    balance: Math.round((income - spending) * 100) / 100,
    count: movements.length,
  };
}

export interface CategoryTotal {
  name: string;
  icon: string;
  color: string;
  value: number;
  count: number;
}

// The categories with the most spending, biggest first. Movements without a category are
// grouped under "Sin categoría".
export function topSpendingCategories<T extends TransactionLike>(movements: T[], limit = 3): CategoryTotal[] {
  const { bills } = filterBillsOrIncomes(movements);
  return orderByHighestValue(reduceTransCategoriesSliced(bills))
    .slice(0, limit)
    .map((row) => ({
      name: row.type === "No category" ? "Sin categoría" : row.type,
      icon: row.icon,
      color: row.color,
      value: Math.round(row.value * 100) / 100,
      count: row.children.length,
    }));
}

export interface DayGroup<T> {
  key: string;
  label: string;
  items: T[];
}

// Movements already sorted newest first, split into one group per local calendar day.
// The day's label ("Hoy", "Ayer", "lunes 14 de octubre") is written in the person's language.
export function groupByDay<T extends TransactionLike>(sorted: T[], today: Date, locale: Locale, t: TranslateFn): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const movement of sorted) {
    const time = movementTime(movement);
    if (time === null) continue;
    const date = new Date(time);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(movement);
    } else {
      groups.push({ key, label: dayLabel(date, today, locale, t), items: [movement] });
    }
  }
  return groups;
}
