import { getTransactionsFromTimeRange, filterBillsOrIncomes } from "@/helpers/transformers/transactionsChange";
import { getMonthBucketBreakdown, getExpectedOccurrencesInMonth, getMonthCurrencyBreakdown } from "@/helpers/transformers/projectionsChange";
import { getValueActiveInMonth } from "@/helpers/transformers/budgetHistory";
import { isSpendingBudget } from "@/helpers/transformers/budgetTypes";
import type { MonthDateRange } from "@gastify/core/time/timeFunctions";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { IncomeSourceItem } from "@/hooks/useProjectionTable";
import type { CurrencyBreakdownData } from "../CurrencyBreakdownChips";
import type { BucketBreakdownItem, IncomeOccurrenceItem } from "./ProjectionMonthDetailModal";

// What the month detail modal shows for one month. Shared by the Projections page and the History page, so both open the same
// detail from the same data (the page passes what it already has; nothing here fetches).
export interface SelectedMonthDetails {
  bucketBreakdown: BucketBreakdownItem[];
  incomeOccurrences: IncomeOccurrenceItem[];
  incomeCurrencyBreakdown: CurrencyBreakdownData | null;
  expenseCurrencyBreakdown: CurrencyBreakdownData | null;
}

export const EMPTY_MONTH_DETAILS: SelectedMonthDetails = {
  bucketBreakdown: [],
  incomeOccurrences: [],
  incomeCurrencyBreakdown: null,
  expenseCurrencyBreakdown: null,
};

export interface MonthDetailsInput {
  // "actual" for a closed month, otherwise an estimate (the rows' own `type`).
  rowType: string;
  range: MonthDateRange | undefined;
  transactions: TransactionData[];
  budgets: BudgetData[];
  incomeSources: IncomeSourceItem[];
  unexpectedBuffer: number;
  walletPrimaryCurrency: string;
  // The names the buckets read in the language on screen.
  labels: { budget: string; unexpected: string };
}

export function buildSelectedMonthDetails({
  rowType,
  range,
  transactions,
  budgets,
  incomeSources,
  unexpectedBuffer,
  walletPrimaryCurrency,
  labels,
}: MonthDetailsInput): SelectedMonthDetails {
  const { start, end } = (range || {}) as MonthDateRange;
  const monthTx = getTransactionsFromTimeRange(transactions, start, end);
  const { bills, incomes } = filterBillsOrIncomes(monthTx);
  const expenseCurrencyBreakdown = getMonthCurrencyBreakdown(bills, walletPrimaryCurrency);
  const incomeCurrencyBreakdown = getMonthCurrencyBreakdown(incomes, walletPrimaryCurrency);
  // Past months compare against the goalAmount that was actually active back
  // then (via history[]), not today's value - otherwise the chart would show
  // a budget you only set recently as if it applied to a much older month.
  const nonSavingBudgets = (budgets || []).filter(isSpendingBudget);
  const budgetsForChart =
    rowType === "actual"
      ? nonSavingBudgets
          .map((b) => {
            const resolved = getValueActiveInMonth(b.history, start);
            return resolved ? { ...b, goalAmount: resolved.goalAmount } : null;
          })
          .filter(Boolean)
      : nonSavingBudgets.filter((b) => !b.archived);
  const bucketBreakdown = getMonthBucketBreakdown(bills, budgetsForChart, unexpectedBuffer, labels);
  const incomeOccurrences =
    rowType === "actual"
      ? []
      : (incomeSources || [])
          .filter((s) => s.active && !s.archived)
          .map((s) => ({
            name: s.name,
            amount: s.amount as number,
            occurrences: getExpectedOccurrencesInMonth(s, start, end),
          }));
  return { bucketBreakdown, incomeOccurrences, incomeCurrencyBreakdown, expenseCurrencyBreakdown };
}
