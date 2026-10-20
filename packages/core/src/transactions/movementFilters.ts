import { majorToMinor } from "../money/currencies";
import { idOf } from "../categories/categoryForm";
import { normalizeText } from "../search/normalizeText";
import { movementTime } from "./historyWindow";
import { monthBounds, movementKind, type MonthBounds } from "./monthSummary";
import type { TransactionLike } from "../transformers/transactionsChange";

// The filters of the Movements list, the same ones the web has (search, type, exact amount in the
// main or the account's currency, category, sub-category) plus the account, and the periods.

export type TypeFilter = "all" | "income" | "expense" | "transfer";

// Whether the movement was readable when it was imported (the web's "Readable" selector).
export type ReadableFilter = "all" | "readable" | "unreadable";

export interface MovementFilters {
  query: string;
  type: TypeFilter;
  readable: ReadableFilter;
  categoryId: string;
  subCategoryId: string;
  accountId: string;
  // An exact amount, compared in the wallet's main currency or in the account's own ("native").
  exactAmount: string;
  exactMode: "primary" | "native";
  exactCurrency: string;
}

export const EMPTY_FILTERS: MovementFilters = {
  query: "",
  type: "all",
  readable: "all",
  categoryId: "",
  subCategoryId: "",
  accountId: "",
  exactAmount: "",
  exactMode: "primary",
  exactCurrency: "MXN",
};

interface Named {
  name?: string;
}

export interface FilterableMovement extends TransactionLike {
  name?: string;
  amount?: number;
  isReadable?: boolean | null;
  account?: unknown;
  tags?: unknown[];
  category?: (TransactionLike["category"] & Named) | null;
  subCategory?: (TransactionLike["subCategory"] & Named) | null;
  displayMoney?: {
    primary?: { amountMinor: number; currency: string };
    native?: { amountMinor: number; currency: string };
    [key: string]: unknown;
  };
}

function tagNames(tags: unknown[] | undefined): string[] {
  return (tags ?? []).map((tag) => (typeof tag === "string" ? tag : String((tag as Named)?.name ?? ""))).filter(Boolean);
}

export function countActiveFilters(filters: MovementFilters): number {
  return [
    filters.query.trim() !== "",
    filters.type !== "all",
    filters.readable !== "all",
    filters.categoryId !== "",
    filters.subCategoryId !== "",
    filters.accountId !== "",
    filters.exactAmount.trim() !== "",
  ].filter(Boolean).length;
}

export function applyMovementFilters<T extends FilterableMovement>(items: T[], filters: MovementFilters, primaryCurrency: string): T[] {
  const query = normalizeText(filters.query);
  const exact = filters.exactAmount.trim() === "" ? null : Number(filters.exactAmount.replace(/,/g, ""));
  return items.filter((movement) => {
    if (filters.type !== "all" && movementKind(movement) !== filters.type) return false;
    if (filters.readable === "readable" && !movement.isReadable) return false;
    if (filters.readable === "unreadable" && movement.isReadable) return false;
    if (query) {
      const haystack = normalizeText([movement.name, movement.category?.name, movement.subCategory?.name, ...tagNames(movement.tags)].filter(Boolean).join(" "));
      if (!haystack.includes(query)) return false;
    }
    if (filters.categoryId && idOf(movement.category) !== filters.categoryId) return false;
    if (filters.subCategoryId && idOf(movement.subCategory) !== filters.subCategoryId) return false;
    if (filters.accountId && idOf(movement.account) !== filters.accountId) return false;
    if (exact !== null && Number.isFinite(exact)) {
      if (filters.exactMode === "native") {
        const target = majorToMinor(exact, filters.exactCurrency);
        const native = movement.displayMoney?.native;
        const matches = native
          ? native.currency === filters.exactCurrency && native.amountMinor === target
          : filters.exactCurrency === "MXN" && Math.round(Math.abs(movement.amount ?? 0) * 100) === target;
        if (!matches) return false;
      } else {
        const target = majorToMinor(exact, primaryCurrency);
        const primary = movement.displayMoney?.primary;
        if (!primary || primary.currency !== primaryCurrency || primary.amountMinor !== target) return false;
      }
    }
    return true;
  });
}

// The time windows of the list, the web's selector: a month (it follows the month switcher), the last days, last
// month, the last three months, each quarter and half of this year, this and last year, any whole year the
// person has data for ("year:2025"), or two chosen dates. The rolling ones end today.
export type RangePreset =
  | "month"
  | "last7"
  | "last30"
  | "last90"
  | "lastMonth"
  | "last3"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "h1"
  | "h2"
  | "year"
  | "lastYear"
  | "custom"
  | `year:${number}`;

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "month", label: "Por mes" },
  { value: "last7", label: "7 días" },
  { value: "last30", label: "30 días" },
  { value: "last90", label: "90 días" },
  { value: "lastMonth", label: "Mes pasado" },
  { value: "last3", label: "Últimos 3 meses" },
  { value: "q1", label: "Trimestre 1" },
  { value: "q2", label: "Trimestre 2" },
  { value: "q3", label: "Trimestre 3" },
  { value: "q4", label: "Trimestre 4" },
  { value: "h1", label: "Primer semestre" },
  { value: "h2", label: "Segundo semestre" },
  { value: "year", label: "Este año" },
  { value: "lastYear", label: "Año pasado" },
  { value: "custom", label: "Personalizado" },
];

// The presets plus one entry per whole year ("Todo 2025"), newest first, before "Personalizado".
export function presetsWithYears(years: number[]): { value: RangePreset; label: string }[] {
  const yearEntries = [...new Set(years)].sort((a, b) => b - a).map((year) => ({ value: `year:${year}` as RangePreset, label: `Todo ${year}` }));
  const custom = RANGE_PRESETS[RANGE_PRESETS.length - 1];
  return [...RANGE_PRESETS.slice(0, -1), ...yearEntries, custom];
}

export function rangePresetLabel(preset: RangePreset): string {
  if (preset.startsWith("year:")) return `Todo ${preset.slice(5)}`;
  return RANGE_PRESETS.find((entry) => entry.value === preset)?.label ?? "Periodo";
}

// The years that have at least one movement, for the whole-year entries (movements without a date are skipped).
export function yearsWithMovements(movements: { date?: unknown; createdAt?: unknown }[]): number[] {
  const years = new Set<number>();
  for (const movement of movements) {
    const time = movementTime(movement);
    if (time !== null) years.add(new Date(time).getFullYear());
  }
  return [...years];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function rangeFor(preset: RangePreset, now: Date, monthCursor: Date, custom: { from: Date | null; to: Date | null }): MonthBounds {
  switch (preset) {
    case "last7":
      return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), end: endOfDay(now) };
    case "last30":
      return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), end: endOfDay(now) };
    case "last90":
      return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)), end: endOfDay(now) };
    case "lastMonth":
      return monthBounds(now.getFullYear(), now.getMonth() - 1);
    case "last3":
      return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: endOfDay(now) };
    case "q1":
    case "q2":
    case "q3":
    case "q4": {
      const first = (Number(preset.slice(1)) - 1) * 3;
      return { start: new Date(now.getFullYear(), first, 1), end: new Date(now.getFullYear(), first + 3, 0, 23, 59, 59, 999) };
    }
    case "h1":
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 6, 0, 23, 59, 59, 999) };
    case "h2":
      return { start: new Date(now.getFullYear(), 6, 1), end: new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999) };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case "lastYear":
      return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 12, 0, 23, 59, 59, 999) };
    case "custom": {
      const from = custom.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
      const to = custom.to ?? now;
      return from <= to ? { start: startOfDay(from), end: endOfDay(to) } : { start: startOfDay(to), end: endOfDay(from) };
    }
    default: {
      if (preset.startsWith("year:")) {
        const year = Number(preset.slice(5));
        return { start: new Date(year, 0, 1), end: new Date(year, 12, 0, 23, 59, 59, 999) };
      }
      return monthBounds(monthCursor.getFullYear(), monthCursor.getMonth());
    }
  }
}

// Whether a movement's time falls in the window (movements without a date never do).
export function isInRange(movement: { date?: unknown; createdAt?: unknown }, range: MonthBounds): boolean {
  const time = movementTime(movement);
  return time !== null && time >= range.start.getTime() && time <= range.end.getTime();
}
