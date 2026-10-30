// Projection accuracy: how close a projected figure landed to the real one.
// Pure math only. Callers decide which months are eligible (closed months with
// projection data); this module never reads dates or transactions.
//
// One value:  acc = 100 × (1 − |P − A| / max(|P|, |A|)), clamped to [0, 100].
//   P = projected, A = actual. Both zero → 100. Only one zero → 0 (the formula gives it).
// A range:    acc = 100 × (1 − Σ|Pi − Ai| / Σ max(|Pi|, |Ai|)), clamped to [0, 100].
//   For one month this is the same number as the single-value formula.
// Global:     the range formula applied to income and expense pooled together.

export interface AccuracyPair {
  projected: number;
  actual: number;
}

export interface AccuracyMonthInput {
  monthName?: string;
  year?: number;
  projectedIncome: number;
  actualIncome: number;
  projectedExpense: number;
  actualExpense: number;
}

export interface MonthAccuracy {
  income: number;
  expense: number;
  global: number;
}

export interface AccuracySummary {
  // Eligible months that were counted.
  months: number;
  // 0..100 (not rounded). Null when there was no eligible month.
  income: number | null;
  expense: number | null;
  global: number | null;
}

export type AccuracyTone = "good" | "warning" | "poor";

// Display thresholds on the rounded percentage: ≥90 good, 70-89 warning, <70 poor.
export const ACCURACY_GOOD_MIN = 90;
export const ACCURACY_WARNING_MIN = 70;

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

// Precision of one value: how close the projected figure was to the real one.
export function valueAccuracy(projected: number, actual: number): number {
  return rangeAccuracy([{ projected, actual }]) ?? 100;
}

// Precision of several values at once. Each pair weighs by its own size, so a big
// month moves the result more than a small one. Returns null for an empty list.
export function rangeAccuracy(pairs: AccuracyPair[]): number | null {
  if (pairs.length === 0) return null;
  let error = 0;
  let scale = 0;
  for (const pair of pairs) {
    const projected = finiteOrZero(pair.projected);
    const actual = finiteOrZero(pair.actual);
    error += Math.abs(projected - actual);
    scale += Math.max(Math.abs(projected), Math.abs(actual));
  }
  // Every pair was zero against zero: nothing was missed.
  if (scale === 0) return 100;
  return clampPercent(100 * (1 - error / scale));
}

// Income, expense and global precision of one month.
export function monthAccuracy(month: AccuracyMonthInput): MonthAccuracy {
  const income = valueAccuracy(month.projectedIncome, month.actualIncome);
  const expense = valueAccuracy(month.projectedExpense, month.actualExpense);
  const global = rangeAccuracy(incomeAndExpensePairs([month])) ?? 100;
  return { income, expense, global };
}

// Income, expense and global precision over a list of eligible months.
export function summarizeAccuracy(months: AccuracyMonthInput[]): AccuracySummary {
  if (months.length === 0) return { months: 0, income: null, expense: null, global: null };
  return {
    months: months.length,
    income: rangeAccuracy(months.map((m) => ({ projected: m.projectedIncome, actual: m.actualIncome }))),
    expense: rangeAccuracy(months.map((m) => ({ projected: m.projectedExpense, actual: m.actualExpense }))),
    global: rangeAccuracy(incomeAndExpensePairs(months)),
  };
}

// Colour band for a percentage, decided on the rounded value that is shown.
export function accuracyTone(percent: number): AccuracyTone {
  const shown = Math.round(percent);
  if (shown >= ACCURACY_GOOD_MIN) return "good";
  if (shown >= ACCURACY_WARNING_MIN) return "warning";
  return "poor";
}

function incomeAndExpensePairs(months: AccuracyMonthInput[]): AccuracyPair[] {
  return months.flatMap((m) => [
    { projected: m.projectedIncome, actual: m.actualIncome },
    { projected: m.projectedExpense, actual: m.actualExpense },
  ]);
}
