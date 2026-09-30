import { getYearMonthDateRange } from "../timeFunctions/timeFunctions";
import {
  getTransactionsFromTimeRange,
  filterBillsOrIncomes,
  getPrimaryAmount,
  type TransactionLike,
} from "./transactionsChange";
import { getValueActiveInMonth } from "./budgetHistory";
import { isSpendingBudget } from "./budgetTypes";
import { minorToMajor } from "@/lib/money/currencies";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type DateLike = Date | string | number;

type IdRef = { _id?: unknown; name?: string } | null | undefined;

export interface BudgetCategoryEntryLike {
  category?: unknown;
  subCategory?: unknown;
}

export interface BudgetHistoryEntryLike {
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  goalAmount?: number;
}

export interface MatchableBudget {
  isSaving?: boolean | null;
  budgetType?: string | null;
  name?: string;
  goalAmount?: number;
  period?: string;
  archived?: boolean;
  categories?: BudgetCategoryEntryLike[];
  category?: unknown;
  subCategory?: unknown;
  history?: BudgetHistoryEntryLike[];
}

export interface BillLike extends TransactionLike {
  _id?: unknown;
}

export interface IncomeSourceHistoryEntryLike {
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  amount?: number;
  recurrence?: string;
}

export interface ExpectedOccurrenceSource {
  recurrence?: string;
  anchorDate?: DateLike | null;
}

export interface ProjectionIncomeSource extends ExpectedOccurrenceSource {
  amount?: number;
  active?: boolean;
  archived?: boolean;
  history?: IncomeSourceHistoryEntryLike[];
}

export interface MonthlyBufferRevisionLike {
  updatedAt?: DateLike;
  unexpectedBuffer?: number;
  unexpectedIncomeBuffer?: number;
}

export interface MonthlyBufferEntryLike {
  month?: number;
  unexpectedBuffer?: number;
  unexpectedIncomeBuffer?: number;
  revisions?: MonthlyBufferRevisionLike[];
}

export interface MonthlyBalanceEntryLike {
  month?: number;
  balance?: number;
}

export interface ProjectionSettingsLike {
  monthlyBuffers?: MonthlyBufferEntryLike[] | null;
}

export type BaselineMoneyField = "incomeMoney" | "expenseMoney";

export interface BaselineEntryLike {
  effectiveFrom?: DateLike;
  effectiveTo?: DateLike | null;
  incomeMoney?: { amountMinor: number; currency: string };
  expenseMoney?: { amountMinor: number; currency: string };
}

export interface ProjectionBaselineLike {
  incomeHistory?: BaselineEntryLike[];
  expenseHistory?: BaselineEntryLike[];
}

export interface MonthBucketBreakdownRow {
  label: string;
  budgeted: number;
  actual: number;
}

export interface CurrencyBreakdownTransaction {
  displayMoney?: {
    native?: { amountMinor: number; currency: string };
    primary?: { amountMinor: number; currency: string; rate?: number | string | null; effectiveDate?: Date | string | null };
  };
}

export interface CurrencyBreakdownGroup {
  currency: string;
  nativeAmountMinor: number;
  primaryAmountMinor: number;
  rate: number | string | null;
  effectiveDate: Date | string | null;
}

export interface YearProjectionRow {
  monthName: string;
  year: number;
  type: "actual" | "estimate" | "current";
  income?: number;
  expense?: number;
  historicalIncome?: number;
  historicalExpense?: number;
  hasTransactions?: boolean;
  shadowIncome?: number;
  actualIncome?: number;
  projectedIncome?: number;
  shadowExpense?: number;
  actualExpense?: number;
  projectedExpense?: number;
}

export interface YearProjectionRowWithBalance extends YearProjectionRow {
  net: number;
  balance: number | null;
  manualBalance?: number;
  estimatedBalance?: number | null;
}

export interface BuildYearProjectionTableParams {
  transactions: BillLike[];
  budgets?: MatchableBudget[] | null;
  incomeSources?: ProjectionIncomeSource[] | null;
  projectionSettings?: ProjectionSettingsLike | null;
  projectionBaseline?: ProjectionBaselineLike | null;
  year: number;
  today: Date;
}

export interface ProjectionAccuracyEntry {
  monthName: string;
  projectedIncome: number;
  projectedExpense: number;
  actualIncome: number;
  actualExpense: number;
  varianceIncome: number;
  varianceExpense: number;
}

export type ProjectionMonthComparison = {
  type: "closed" | "in-progress";
  projectedIncome: number;
  actualIncome: number;
  projectedExpense: number;
  actualExpense: number;
};

function sum(arr: (number | undefined | null)[]): number {
  return arr.reduce((acc, n) => acc + (n || 0), 0);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function countIntervalOccurrences(anchorDate: DateLike, intervalDays: number, monthStart: Date, monthEnd: Date): number {
  const anchor = new Date(anchorDate);
  const diffDays = Math.floor((+monthStart - +anchor) / MS_PER_DAY);
  // No clamping to 0: months before the anchor date must walk the periodic
  // sequence backward (negative k) too, otherwise every month before the
  // anchor incorrectly shows 0 expected occurrences.
  let k = Math.floor(diffDays / intervalDays);
  let current = new Date(anchor.getTime() + k * intervalDays * MS_PER_DAY);
  while (current < monthStart) {
    k += 1;
    current = new Date(anchor.getTime() + k * intervalDays * MS_PER_DAY);
  }
  let count = 0;
  while (current <= monthEnd) {
    count += 1;
    k += 1;
    current = new Date(anchor.getTime() + k * intervalDays * MS_PER_DAY);
  }
  return count;
}

// How many payments of this income source are expected to land inside [monthStart, monthEnd].
// `semimonthly` (fixed paydays, e.g. 15th + last day) is always exactly 2/month.
// `biweekly` (every 14 days from anchorDate) can occasionally land 3 in a month due to calendar drift.
export function getExpectedOccurrencesInMonth(incomeSource: ExpectedOccurrenceSource, monthStart: Date, monthEnd: Date): number {
  switch (incomeSource.recurrence) {
    case "monthly":
      return 1;
    case "semimonthly":
      return 2;
    case "biweekly":
      return incomeSource.anchorDate
        ? countIntervalOccurrences(incomeSource.anchorDate, 14, monthStart, monthEnd)
        : 2;
    case "weekly":
      return incomeSource.anchorDate
        ? countIntervalOccurrences(incomeSource.anchorDate, 7, monthStart, monthEnd)
        : 4;
    default:
      return 1;
  }
}

export function matchBillToBudget(bill: BillLike, budget: MatchableBudget): boolean {
  if (budget.categories && Array.isArray(budget.categories) && budget.categories.length > 0) {
    return budget.categories.some((entry) => {
      if (entry.subCategory) {
        const subCategoryId = (entry.subCategory as IdRef)?._id || entry.subCategory;
        return String(bill.subCategory?._id) === String(subCategoryId);
      }
      if (entry.category) {
        const categoryId = (entry.category as IdRef)?._id || entry.category;
        return String(bill.category?._id) === String(categoryId);
      }
      return false;
    });
  }
  if (budget.subCategory) {
    const subCategoryId = (budget.subCategory as IdRef)?._id || budget.subCategory;
    return String(bill.subCategory?._id) === String(subCategoryId);
  }
  if (budget.category) {
    const categoryId = (budget.category as IdRef)?._id || budget.category;
    return String(bill.category?._id) === String(categoryId);
  }
  return false;
}

export function getBudgetPeriodRange(
  budget: { period?: string },
  referenceDate: DateLike | null = new Date(),
  fallbackStartDate: Date | null = null,
  fallbackEndDate: Date | null = null
): { startDate: Date; endDate: Date } {
  const period = budget.period || "monthly";
  if (period === "monthly") {
    if (fallbackStartDate && fallbackEndDate) {
      return { startDate: fallbackStartDate, endDate: fallbackEndDate };
    }
    const d = new Date(referenceDate || new Date());
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }
  const d = new Date(referenceDate || fallbackStartDate || new Date());
  const year = d.getFullYear();
  const month = d.getMonth();

  if (period === "quarterly") {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    const startDate = new Date(year, quarterStartMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  if (period === "biannual") {
    const halfStartMonth = month < 6 ? 0 : 6;
    const startDate = new Date(year, halfStartMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(year, halfStartMonth + 6, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  // default / yearly
  const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  return { startDate, endDate };
}

export function getBudgetActualSpend(
  budget: MatchableBudget,
  allTransactions: BillLike[] | null | undefined,
  fallbackStartDate: Date | null = null,
  fallbackEndDate: Date | null = null
): number {
  const refDate = fallbackStartDate || new Date();
  const { startDate, endDate } = getBudgetPeriodRange(budget, refDate, fallbackStartDate, fallbackEndDate);
  const matched = (allTransactions || []).filter((tra) => {
    if (!tra.isBill) return false;
    const tDate = new Date(tra.date || tra.createdAt);
    if (tDate < startDate || tDate > endDate) return false;
    return matchBillToBudget(tra, budget);
  });
  return matched.reduce((acc, bill) => acc + ((bill.amount as number) || 0), 0);
}


// Per Budget bucket: MAX(budgeted goal, real spend this month). Bills matching no
// Budget fall into the "unexpected" bucket, compared the same way against the buffer.
function sumPerBucketMax(bills: BillLike[], budgets: MatchableBudget[], bufferAmount?: number): number {
  const matchedBillIds = new Set<string>();
  let total = 0;
  budgets.forEach((budget) => {
    const matched = bills.filter((bill) => matchBillToBudget(bill, budget));
    matched.forEach((bill) => matchedBillIds.add(String(bill._id)));
    const actual = sum(matched.map(getPrimaryAmount));
    total += Math.max(budget.goalAmount || 0, actual);
  });
  const unmatched = bills.filter((bill) => !matchedBillIds.has(String(bill._id)));
  const unmatchedActual = sum(unmatched.map(getPrimaryAmount));
  total += Math.max(bufferAmount || 0, unmatchedActual);
  return total;
}

// Per-bucket breakdown (one row per Budget + one "Unexpected" row) for the detail-modal chart.
export function getMonthBucketBreakdown(bills: BillLike[], budgets: MatchableBudget[], bufferAmount?: number): MonthBucketBreakdownRow[] {
  const matchedBillIds = new Set<string>();
  const rows = budgets.map((budget) => {
    const matched = bills.filter((bill) => matchBillToBudget(bill, budget));
    matched.forEach((bill) => matchedBillIds.add(String(bill._id)));
    return {
      label: budget.name || (budget.subCategory as IdRef)?.name || (budget.category as IdRef)?.name || "Budget",
      budgeted: budget.goalAmount || 0,
      actual: sum(matched.map(getPrimaryAmount)),
    };
  });
  const unmatched = bills.filter((bill) => !matchedBillIds.has(String(bill._id)));
  rows.push({
    label: "Unexpected/Other",
    budgeted: bufferAmount || 0,
    actual: sum(unmatched.map(getPrimaryAmount)),
  });
  return rows;
}

// Groups a set of transactions by their own native currency, summing both
// the native amount and its Wallet-primary equivalent per currency - so a
// month's income/expense total can be shown broken down by "how much of
// this actually came in pesos vs. dollars", plus the rate used for each
// foreign currency. Transactions with no displayMoney (never migrated) are
// skipped rather than guessed. `isMultiCurrency` is false when everything
// is already in the wallet's own currency, so callers can hide the
// breakdown UI entirely in the common single-currency case.
export function getMonthCurrencyBreakdown(
  transactions: CurrencyBreakdownTransaction[] | null | undefined,
  walletPrimaryCurrency: string
): { breakdown: CurrencyBreakdownGroup[]; isMultiCurrency: boolean } {
  const groups: Record<string, CurrencyBreakdownGroup> = {};
  for (const t of transactions || []) {
    const native = t?.displayMoney?.native;
    const primary = t?.displayMoney?.primary;
    if (!native || !primary) continue;
    const currency = native.currency;
    if (!groups[currency]) {
      groups[currency] = {
        currency,
        nativeAmountMinor: 0,
        primaryAmountMinor: 0,
        rate: null,
        effectiveDate: null,
      };
    }
    const g = groups[currency];
    g.nativeAmountMinor += native.amountMinor;
    g.primaryAmountMinor += primary.amountMinor;
    if (!g.effectiveDate || new Date(primary.effectiveDate) > new Date(g.effectiveDate)) {
      g.rate = primary.rate;
      g.effectiveDate = primary.effectiveDate;
    }
  }
  const breakdown = Object.values(groups);
  const isMultiCurrency =
    breakdown.length > 1 || (breakdown.length === 1 && breakdown[0].currency !== walletPrimaryCurrency);
  return { breakdown, isMultiCurrency };
}

// Each month's unexpected buffers are set independently (see monthlyBuffers on
// ProjectionSettings) - a value entered while looking at August must not leak
// into any other month, so this always looks up that specific month's entry.
function getMonthBuffer(
  monthlyBuffers: MonthlyBufferEntryLike[] | null | undefined,
  monthIndex: number
): { unexpectedBuffer: number; unexpectedIncomeBuffer: number } {
  const entry = (monthlyBuffers || []).find((m) => m.month === monthIndex);
  return {
    unexpectedBuffer: entry?.unexpectedBuffer || 0,
    unexpectedIncomeBuffer: entry?.unexpectedIncomeBuffer || 0,
  };
}

// Resolves what a month's buffer was AS OF a given date (e.g. that month's
// own end), not its current live value - so editing a closed month's buffer
// today doesn't rewrite what it "was" back then. Falls back to the entry's
// flat fields when there's no revisions[] yet (pre-feature data, or a month
// never touched again after its first save).
function getMonthBufferAtDate(
  monthlyBuffers: MonthlyBufferEntryLike[] | null | undefined,
  monthIndex: number,
  asOfDate: Date
): { unexpectedBuffer: number; unexpectedIncomeBuffer: number } {
  const entry = (monthlyBuffers || []).find((m) => m.month === monthIndex);
  if (!entry) return { unexpectedBuffer: 0, unexpectedIncomeBuffer: 0 };
  const revisions = entry.revisions || [];
  if (revisions.length === 0) {
    // No revision log at all yet (data saved before this feature shipped) -
    // the flat fields are the only signal available, same as pre-feature behavior.
    return { unexpectedBuffer: entry.unexpectedBuffer || 0, unexpectedIncomeBuffer: entry.unexpectedIncomeBuffer || 0 };
  }
  const candidates = revisions.filter((r) => new Date(r.updatedAt) <= asOfDate);
  if (candidates.length === 0) {
    // Every recorded revision happened AFTER this month closed - nothing was
    // actually set by month-end, so there's no historical buffer to report.
    // (Falling back to the flat fields here would just return the latest
    // too-late edit, reintroducing the exact bug this function fixes.)
    return { unexpectedBuffer: 0, unexpectedIncomeBuffer: 0 };
  }
  const latest = candidates.reduce((a, b) => (new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a));
  return { unexpectedBuffer: latest.unexpectedBuffer || 0, unexpectedIncomeBuffer: latest.unexpectedIncomeBuffer || 0 };
}

// Resolves the user's rough "as of this date, here's roughly my monthly
// income" (or, separately, "...my monthly expense") guess active in a given
// month, applied to ProjectionBaseline's own incomeHistory/expenseHistory.
// Unlike Budget.history/IncomeSource.history (where only the latest entry
// as of a date applies, via getValueActiveInMonth), entries here are
// ADDITIVE: every entry whose [effectiveFrom, effectiveTo) window covers
// this month is summed - e.g. two simultaneous jobs both count. Callers are
// expected to have already converted every entry's money to a single
// currency (see ProjectionsClient's baseline-conversion step), so summing
// major-unit numbers directly here is safe. Income and expense are
// independent timelines (a raise doesn't imply rent changed the same
// month), so each is resolved on its own. Only meant as a fallback for
// months with no real Budget/IncomeSource/transaction data at all (see
// callers).
function sumBaselineEntriesAtDate(
  entries: BaselineEntryLike[] | null | undefined,
  monthStart: Date,
  moneyField: BaselineMoneyField
): number | null {
  const active = (entries || []).filter((entry) => {
    const from = new Date(entry.effectiveFrom);
    const to = entry.effectiveTo ? new Date(entry.effectiveTo) : null;
    return from <= monthStart && (!to || to > monthStart);
  });
  if (active.length === 0) return null;
  return sum(active.map((entry) => minorToMajor(entry[moneyField]?.amountMinor || 0, entry[moneyField]?.currency || "MXN")));
}

function getBaselineIncomeAtDate(projectionBaseline: ProjectionBaselineLike | null | undefined, monthStart: Date): number | null {
  return sumBaselineEntriesAtDate(projectionBaseline?.incomeHistory, monthStart, "incomeMoney");
}

function getBaselineExpenseAtDate(projectionBaseline: ProjectionBaselineLike | null | undefined, monthStart: Date): number | null {
  return sumBaselineEntriesAtDate(projectionBaseline?.expenseHistory, monthStart, "expenseMoney");
}

// Builds the 12-month projection table for a given year:
// - past months: pure actual (real transactions), plus the historical Budget/IncomeSource
//   values that were active back then (for the detail-modal chart, not the headline number).
// - future months: pure estimate, using the CURRENTLY active Budgets/IncomeSources.
// - the current month: MAX(estimate, real-so-far) per bucket, see sumPerBucketMax.
export function buildYearProjectionTable({
  transactions,
  budgets,
  incomeSources,
  projectionSettings,
  projectionBaseline,
  year,
  today,
}: BuildYearProjectionTableParams): YearProjectionRow[] {
  const monthRanges = getYearMonthDateRange(new Date(year, 0, 1));
  const nonSavingBudgets = (budgets || []).filter(isSpendingBudget);
  const monthlyBuffers = projectionSettings?.monthlyBuffers || [];
  const todayMonthStart = startOfMonth(today);
  const todayMonthEnd = endOfMonth(today);

  return [...monthRanges.entries()].map(([monthName, { start, end }], monthIndex): YearProjectionRow => {
    const monthTx = getTransactionsFromTimeRange(transactions, start, end);
    const { incomes, bills } = filterBillsOrIncomes(monthTx);
    const actualIncome = sum(incomes.map(getPrimaryAmount));
    const actualExpense = sum(bills.map(getPrimaryAmount));

    if (end < todayMonthStart) {
      // past month: headline is pure actual; also resolve what was budgeted/expected
      // back then (not the current value) for the modal's estimate-vs-real chart.
      // The buffer itself is resolved as of THIS month's own end, not today's live
      // value, so editing a closed month's buffer later doesn't rewrite history.
      const { unexpectedBuffer: historicalBuffer, unexpectedIncomeBuffer: historicalIncomeBuffer } =
        getMonthBufferAtDate(monthlyBuffers, monthIndex, end);
      const budgetBasedExpense = sum(
        nonSavingBudgets.map((b) => getValueActiveInMonth(b.history, start)?.goalAmount || 0)
      );
      const incomeSourceBasedIncome = sum(
        (incomeSources || []).map((source) => {
          const resolved = getValueActiveInMonth(source.history, start);
          if (!resolved) return 0;
          return (resolved.amount || 0) * getExpectedOccurrencesInMonth(
            { ...source, recurrence: resolved.recurrence },
            start,
            end
          );
        })
      );
      // Fall back to the user's rough historical guess only when there's no
      // real Budget/IncomeSource history to resolve at all (e.g. years before
      // either existed in the app) - real history always wins otherwise.
      const historicalExpense =
        (budgetBasedExpense > 0 ? budgetBasedExpense : (getBaselineExpenseAtDate(projectionBaseline, start) || 0)) + historicalBuffer;
      const historicalIncome =
        (incomeSourceBasedIncome > 0 ? incomeSourceBasedIncome : (getBaselineIncomeAtDate(projectionBaseline, start) || 0)) + historicalIncomeBuffer;
      return {
        monthName, year, type: "actual",
        income: actualIncome, expense: actualExpense,
        historicalIncome, historicalExpense,
        hasTransactions: monthTx.length > 0,
      };
    }

    const { unexpectedBuffer, unexpectedIncomeBuffer } = getMonthBuffer(monthlyBuffers, monthIndex);
    const activeBudgets = nonSavingBudgets.filter((b) => !b.archived);
    const activeIncomeSources = (incomeSources || []).filter((s) => s.active && !s.archived);
    const shadowExpense = sum(activeBudgets.map((b) => b.goalAmount)) + unexpectedBuffer;
    const shadowIncome = sum(
      activeIncomeSources.map((s) => (s.amount || 0) * getExpectedOccurrencesInMonth(s, start, end))
    ) + unexpectedIncomeBuffer;

    if (start > todayMonthEnd) {
      // future month: pure estimate
      return { monthName, year, type: "estimate", income: shadowIncome, expense: shadowExpense };
    }

    // current month: blend
    const projectedExpense = sumPerBucketMax(bills, activeBudgets, unexpectedBuffer);
    return {
      monthName, year, type: "current",
      shadowIncome, actualIncome, projectedIncome: Math.max(shadowIncome, actualIncome),
      shadowExpense, actualExpense, projectedExpense,
    };
  });
}

// True when a closed month actually has something recorded to compare
// against - either a buffer entry (from the month-detail modal) or a
// resolvable ProjectionBaseline entry. Used to skip months that would
// otherwise show a false "0 projected" mismatch, since there's no way to
// know what, if anything, was actually projected for them.
function hasProjectionDataForMonth(
  projectionSettings: ProjectionSettingsLike | null | undefined,
  projectionBaseline: ProjectionBaselineLike | null | undefined,
  monthIndex: number,
  monthStart: Date
): boolean {
  const monthlyBuffers = projectionSettings?.monthlyBuffers || [];
  if (monthlyBuffers.find((m) => m.month === monthIndex)) return true;
  return getBaselineIncomeAtDate(projectionBaseline, monthStart) != null || getBaselineExpenseAtDate(projectionBaseline, monthStart) != null;
}

// Projected-vs-actual accuracy, one row per closed month that has at least
// one recorded buffer entry OR a resolvable ProjectionBaseline entry.
export function buildProjectionAccuracyReport({
  transactions,
  budgets,
  incomeSources,
  projectionSettings,
  projectionBaseline,
  year,
  today,
}: BuildYearProjectionTableParams): ProjectionAccuracyEntry[] {
  const rows = buildYearProjectionTable({ transactions, budgets, incomeSources, projectionSettings, projectionBaseline, year, today });
  const monthRanges = [...getYearMonthDateRange(new Date(year, 0, 1)).values()];
  return rows
    .map((row, monthIndex) => ({ row, monthIndex }))
    .filter(({ row, monthIndex }) => {
      if (row.type !== "actual") return false;
      return hasProjectionDataForMonth(projectionSettings, projectionBaseline, monthIndex, monthRanges[monthIndex].start);
    })
    .map(({ row }) => ({
      monthName: row.monthName,
      projectedIncome: row.historicalIncome,
      projectedExpense: row.historicalExpense,
      actualIncome: row.income,
      actualExpense: row.expense,
      varianceIncome: row.income - row.historicalIncome,
      varianceExpense: row.expense - row.historicalExpense,
    }));
}

// Same projected-vs-actual comparison as buildProjectionAccuracyReport, but
// for a single month (e.g. whichever one Wallet Analyzer's stepper is
// currently showing) instead of a whole year. Reuses buildYearProjectionTable
// entirely - no new projection math - and returns null when there's nothing
// meaningful to show: a future month (hasn't happened yet) or a closed month
// with no buffer/baseline data recorded for it at all.
export function buildProjectionComparisonForMonth({
  transactions,
  budgets,
  incomeSources,
  projectionSettings,
  projectionBaseline,
  referenceDate,
  today,
}: Omit<BuildYearProjectionTableParams, "year"> & { referenceDate: Date }): ProjectionMonthComparison | null {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const rows = buildYearProjectionTable({ transactions, budgets, incomeSources, projectionSettings, projectionBaseline, year, today });
  const row = rows[monthIndex];
  if (!row) return null;

  if (row.type === "actual") {
    if (!hasProjectionDataForMonth(projectionSettings, projectionBaseline, monthIndex, new Date(year, monthIndex, 1))) return null;
    return {
      type: "closed",
      projectedIncome: row.historicalIncome, actualIncome: row.income,
      projectedExpense: row.historicalExpense, actualExpense: row.expense,
    };
  }
  if (row.type === "current") {
    return {
      type: "in-progress",
      projectedIncome: row.shadowIncome, actualIncome: row.actualIncome,
      projectedExpense: row.shadowExpense, actualExpense: row.actualExpense,
    };
  }
  return null; // future month - nothing to compare yet
}

// Fills in an approximate `estimatedBalance` for closed months that have no
// real balance (no manual entry, and not covered by the forward chain from
// today's real total) - never overwrites `balance` itself. Chains from the
// nearest real anchor found anywhere in the year (a manual balance, or the
// current/future rows' own forward-computed balance) in both directions,
// using each month's real net when it has transactions, else the
// ProjectionBaseline guess active that month. When the year has no anchor
// at all, seeds January at $0 instead - an explicitly relative, same-year
// trendline rather than a real total.
export function estimateHistoricalBalances<
  R extends { type: string; hasTransactions?: boolean; income?: number; expense?: number; balance?: number | null; estimatedBalance?: number | null }
>(rows: R[], monthStarts: Date[], projectionBaseline: ProjectionBaselineLike | null | undefined): R[] {
  const netOf = (i: number): number => {
    const row = rows[i];
    if (row.hasTransactions) return (row.income || 0) - (row.expense || 0);
    const income = getBaselineIncomeAtDate(projectionBaseline, monthStarts[i]) || 0;
    const expense = getBaselineExpenseAtDate(projectionBaseline, monthStarts[i]) || 0;
    return income - expense;
  };

  const result = rows.map((row) => ({ ...row }));
  const hasAnyAnchor = result.some((row) => row.balance != null);
  const hasAnyBaseline =
    (projectionBaseline?.incomeHistory?.length || 0) > 0 || (projectionBaseline?.expenseHistory?.length || 0) > 0;

  // Only seed a $0-start trendline when there's at least a baseline to draw
  // one from - with neither a real anchor nor a baseline configured, there's
  // nothing to estimate at all, so this leaves the original dash placeholder.
  let runningBalance = hasAnyAnchor ? null : (hasAnyBaseline ? 0 : null);
  for (let i = 0; i < result.length; i++) {
    const row = result[i];
    if (row.balance != null) {
      runningBalance = row.balance;
      continue;
    }
    if (runningBalance == null) continue; // no anchor reached yet - left for the backward pass
    runningBalance += netOf(i);
    if (row.type === "actual") row.estimatedBalance = runningBalance;
  }

  const firstKnownIndex = result.findIndex((row) => row.balance != null || row.estimatedBalance != null);
  if (firstKnownIndex > 0) {
    let bal = result[firstKnownIndex].balance != null ? result[firstKnownIndex].balance : result[firstKnownIndex].estimatedBalance;
    for (let i = firstKnownIndex; i > 0; i--) {
      bal -= netOf(i);
      if (result[i - 1].type === "actual") result[i - 1].estimatedBalance = bal;
    }
  }

  return result;
}

// Walks one year's buildYearProjectionTable() rows and attaches `net` plus a
// running `balance` - extracted from useProjectionTable's own useMemo (the
// projections page and History's own projections table both need this exact
// math, and the MCP get_projections tool needs it a third time, server-side
// where there's no React hook to reuse) so all three read one implementation
// instead of drifting apart. A past, already-closed month only gets a real
// `balance` if a manual entry exists for it (`monthlyBalances`) - there's no
// way to know a real historical total otherwise. From the current month
// onward, `balance` walks forward from `startingBalance` (today's real
// account total): the current month absorbs whatever's left of its own
// shadow projection beyond what's already actually happened
// (`projected - actual`, both directions), and every month after that just
// adds its own net.
export function computeYearRowsWithBalance(
  rows: YearProjectionRow[],
  monthlyBalances: MonthlyBalanceEntryLike[] | null | undefined,
  startingBalance: number,
  year: number,
  today: Date
): YearProjectionRowWithBalance[] {
  let runningBalance = startingBalance;
  let reachedCurrent = false;
  return rows.map((row, index): YearProjectionRowWithBalance => {
    const net = row.type === "current" ? row.projectedIncome - row.projectedExpense : row.income - row.expense;
    const isCurrentOrLater = year > today.getFullYear() || row.type !== "actual";
    const manualEntry = (monthlyBalances || []).find((m) => m.month === index);
    if (!isCurrentOrLater) {
      return { ...row, net, balance: manualEntry ? manualEntry.balance : null, manualBalance: manualEntry?.balance };
    }
    if (row.type === "current") {
      reachedCurrent = true;
      const remainingNet = (row.projectedIncome - row.actualIncome) - (row.projectedExpense - row.actualExpense);
      runningBalance += remainingNet;
      return { ...row, net, balance: runningBalance };
    }
    if (reachedCurrent || row.type === "estimate") {
      runningBalance += net;
      return { ...row, net, balance: runningBalance };
    }
    return { ...row, net, balance: manualEntry ? manualEntry.balance : null, manualBalance: manualEntry?.balance };
  });
}
