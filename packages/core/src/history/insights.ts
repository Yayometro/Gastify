import { percentChange, type PeriodSummary } from "./periodComparison";
import { getPrimaryAmount, type TransactionLike } from "../transformers/transactionsChange";

// A few readings of a period (the phone's version of the web's "Wallet analyzer" strip): what is spent
// per day, where the period is heading, how much of the income is kept, how it compares with the previous
// period and what weighs the most.
export interface PeriodInsights {
  days: number;
  daysElapsed: number;
  dailyAverage: number;
  // What the whole period would reach at the current pace; null once the period is over.
  projectedSpending: number | null;
  // Share of the income that was not spent (0.2 = kept 20 %); null without income.
  savingsRate: number | null;
  // Spending against the previous period, as a fraction; null when there is nothing to compare with.
  spendingChange: number | null;
  incomeChange: number | null;
  topCategory: { name: string; value: number; share: number } | null;
  // What stays after spending (income minus spending) and how many movements the period has.
  balance: number;
  movementCount: number;
  // The single biggest expense of the period, and how much of the spending it alone is.
  biggestExpense: { name: string; amount: number; share: number } | null;
  // Spending divided by the number of expenses.
  averageExpense: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeInsights<T extends TransactionLike>(current: PeriodSummary<T>, previous: PeriodSummary<T> | null, now: Date): PeriodInsights {
  const { start, end } = current.range;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
  const reference = now < end ? now : end;
  const daysElapsed = Math.min(days, Math.max(1, Math.ceil((reference.getTime() - start.getTime()) / DAY_MS)));
  const spending = current.totals.spending;
  const dailyAverage = Math.round((spending / daysElapsed) * 100) / 100;
  const top = current.spendingByCategory[0];
  const biggest = current.biggest[0];
  const biggestAmount = biggest ? getPrimaryAmount(biggest) : 0;
  const expenseCount = current.spendingByCategory.reduce((sum, row) => sum + row.count, 0);
  return {
    days,
    daysElapsed,
    dailyAverage,
    projectedSpending: now < end ? Math.round(dailyAverage * days * 100) / 100 : null,
    savingsRate: current.totals.incomes > 0 ? (current.totals.incomes - spending) / current.totals.incomes : null,
    spendingChange: previous ? percentChange(spending, previous.totals.spending) : null,
    incomeChange: previous ? percentChange(current.totals.incomes, previous.totals.incomes) : null,
    topCategory: top && spending > 0 ? { name: top.name, value: top.value, share: top.value / spending } : null,
    balance: current.totals.balance,
    movementCount: current.totals.count,
    biggestExpense: biggest && spending > 0 ? { name: (biggest as { name?: string }).name || "Sin nombre", amount: biggestAmount, share: biggestAmount / spending } : null,
    averageExpense: expenseCount > 0 ? Math.round((spending / expenseCount) * 100) / 100 : null,
  };
}
