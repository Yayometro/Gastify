import { months as monthNames } from "../timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange, getPrimaryAmount } from "./transactionsChange";
import { getValueActiveInMonth } from "./budgetHistory";
import { matchBillToBudget } from "./projectionsChange";
import { isSpendingBudget } from "./budgetTypes";
import type { BudgetTypeInput } from "./budgetTypes";

export interface MonthRangeItem {
  monthStart: Date;
  monthEnd: Date;
  label: string;
}

export interface BudgetHistoricalHistoryEntry {
  goalAmount?: number | null;
  savingAmount?: number | null;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  [key: string]: unknown;
}

export interface BudgetHistoricalInput extends BudgetTypeInput {
  _id?: string | unknown;
  name?: string | null;
  period?: "monthly" | "quarterly" | "biannual" | "yearly" | string | null;
  goalAmount?: number | null;
  createdAt?: Date | string | number | null;
  history?: BudgetHistoricalHistoryEntry[] | null;
  category?: unknown;
  subCategory?: unknown;
  categories?: unknown[];
  [key: string]: unknown;
}

export interface TransactionHistoricalInput {
  _id?: string | unknown;
  isBill?: boolean | null;
  date?: Date | string | number | null;
  createdAt?: Date | string | number | null;
  amount?: number | string | null;
  value?: number | string | null;
  displayMoney?: {
    primary?: {
      amountMinor: number;
      currency: string;
    };
  } | null;
  category?: unknown;
  subCategory?: unknown;
  [key: string]: unknown;
}

export interface EarliestKnownGoalResult {
  goalAmount: number;
  earliestFrom: Date | null;
}

export interface ResolvedMonthlyGoalResult {
  goalAmount: number;
  estimated: boolean;
}

export interface MonthlyBudgetSeriesItem {
  label: string;
  actual: number;
  goal: number;
  met: boolean;
  estimated: boolean;
  [key: string]: unknown;
}

export interface BudgetHistoricalComparativeRowData<TBudget = BudgetHistoricalInput> {
  budget: TBudget;
  monthlySeries: MonthlyBudgetSeriesItem[];
  monthsTracked: number;
  monthsMet: number;
  monthsExceeded: number;
  monthsEstimated: number;
  complianceRate: number | null;
  [key: string]: unknown;
}

export interface BuildBudgetHistoricalComparativeParams<
  TBudget = BudgetHistoricalInput,
  TTransaction = TransactionHistoricalInput
> {
  budgets?: (TBudget | unknown)[] | null;
  transactions?: (TTransaction | unknown)[] | null;
  startDate: Date;
  endDate: Date;
  today?: Date;
}

// A Budget's goalAmount is scoped to its own period (a quarterly budget's
// goal covers 3 months), so comparing it against a single month's spend
// needs a monthly-equivalent share.
const PERIOD_MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, biannual: 6, yearly: 12 };

function getMonthsInRange(start: Date, end: Date): MonthRangeItem[] {
  const result: MonthRangeItem[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    result.push({
      monthStart,
      monthEnd,
      label: `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return result;
}

// The earliest goal we actually know about for this budget - either its
// oldest history[] entry, or its current goalAmount when there's no
// history at all (meaning it's never changed since creation). Used to
// extrapolate backward into months that predate any known config.
function getEarliestKnownGoal(budget: BudgetHistoricalInput): EarliestKnownGoalResult {
  if (Array.isArray(budget.history) && budget.history.length > 0) {
    const earliest = budget.history.reduce((a, b) =>
      new Date(a.effectiveFrom as string | Date) < new Date(b.effectiveFrom as string | Date) ? a : b
    );
    return { goalAmount: earliest.goalAmount || 0, earliestFrom: new Date(earliest.effectiveFrom as string | Date) };
  }
  return {
    goalAmount: budget.goalAmount || 0,
    earliestFrom: budget.createdAt ? new Date(budget.createdAt) : null,
  };
}

// Resolves the goalAmount to compare a given month against, plus whether
// that figure is a real historical record or an assumption. Luis's call
// (2026-08-29): a month before the budget's earliest known config still
// gets included, extrapolating backward with that earliest goal, rather
// than being skipped outright - real spend against an assumed goal beats
// no data at all, as long as it's clearly labeled `estimated`.
function resolveMonthlyGoalAmount(
  budget: BudgetHistoricalInput,
  monthStart: Date,
  earliestKnown: EarliestKnownGoalResult
): ResolvedMonthlyGoalResult {
  if (Array.isArray(budget.history) && budget.history.length > 0) {
    const resolved = getValueActiveInMonth<BudgetHistoricalHistoryEntry>(budget.history, monthStart);
    if (resolved) return { goalAmount: resolved.goalAmount || 0, estimated: false };
    return { goalAmount: earliestKnown.goalAmount, estimated: true };
  }
  const isBeforeCreation = earliestKnown.earliestFrom && monthStart < earliestKnown.earliestFrom;
  return { goalAmount: budget.goalAmount || 0, estimated: Boolean(isBeforeCreation) };
}

// Builds a per-month actual-vs-goal series for every spending Budget
// (saving/project budgets track differently - accumulation or one-off
// linkage, not a recurring monthly limit - so they're out of scope here),
// across an arbitrary [startDate, endDate] range picked on dashboard/history
// - not tied to a calendar year the way Projections' yearly table is.
// Budgets are sorted worst-compliance-first so the ones habitually
// exceeded surface at the top. Months that haven't started yet are
// excluded - a future month with $0 actual spend isn't "met", it just
// hasn't happened, and counting it would inflate compliance.
export function buildBudgetHistoricalComparative<
  TBudget extends BudgetHistoricalInput = BudgetHistoricalInput,
  TTransaction extends TransactionHistoricalInput = TransactionHistoricalInput
>({
  budgets,
  transactions,
  startDate,
  endDate,
  today = new Date(),
}: BuildBudgetHistoricalComparativeParams<TBudget, TTransaction>): BudgetHistoricalComparativeRowData<TBudget>[] {
  const spendingBudgets = (budgets || []).filter(isSpendingBudget) as (TBudget & BudgetHistoricalInput)[];
  const monthsInRange = getMonthsInRange(startDate, endDate).filter((m) => m.monthStart <= today);

  const rows: BudgetHistoricalComparativeRowData<TBudget>[] = spendingBudgets
    .map((budget: TBudget & BudgetHistoricalInput) => {
      const divisor = PERIOD_MONTHS[budget.period as string] || 1;
      const earliestKnown = getEarliestKnownGoal(budget);
      const monthlySeries: MonthlyBudgetSeriesItem[] = [];

      monthsInRange.forEach(({ monthStart, monthEnd, label }) => {
        const { goalAmount, estimated } = resolveMonthlyGoalAmount(budget, monthStart, earliestKnown);
        const monthlyGoal = goalAmount / divisor;
        const monthTx = getTransactionsFromTimeRange(transactions as TransactionHistoricalInput[], monthStart, monthEnd);
        const actual = monthTx
          .filter((tra: TransactionHistoricalInput) => tra.isBill && matchBillToBudget(tra, budget))
          .reduce((acc: number, bill: TransactionHistoricalInput) => acc + (getPrimaryAmount(bill) as number), 0);
        monthlySeries.push({ label, actual, goal: monthlyGoal, met: actual <= monthlyGoal, estimated });
      });

      const monthsTracked = monthlySeries.length;
      const monthsMet = monthlySeries.filter((m) => m.met).length;
      const monthsEstimated = monthlySeries.filter((m) => m.estimated).length;
      return {
        budget,
        monthlySeries,
        monthsTracked,
        monthsMet,
        monthsExceeded: monthsTracked - monthsMet,
        monthsEstimated,
        complianceRate: monthsTracked > 0 ? monthsMet / monthsTracked : null,
      };
    })
    .filter((row) => row.monthsTracked > 0);

  rows.sort((a, b) => (a.complianceRate ?? 1) - (b.complianceRate ?? 1));
  return rows;
}
