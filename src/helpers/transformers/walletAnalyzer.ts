import {
  getPrimaryAmount,
  getTransactionsFromTimeRange,
  filterBillsOrIncomes,
  orderItemsInRelativeMonth,
} from "./transactionsChange";
import { buildBudgetHistoricalComparative } from "./budgetHistoricalComparative";
import { months } from "../timeFunctions/timeFunctions";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PopulatedCategory {
  _id?: string;
  name?: string;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface PopulatedSubCategory {
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface PopulatedTag {
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface PopulatedAccount {
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface WalletAnalyzerTransaction {
  _id?: string;
  name?: string;
  amount?: number;
  value?: number;
  isIncome?: boolean;
  isBill?: boolean;
  isReadable?: boolean;
  isForSaving?: boolean;
  date?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  user?: string | unknown;
  wallet?: string | unknown;
  account?: PopulatedAccount | null;
  category?: PopulatedCategory | null;
  subCategory?: PopulatedSubCategory | null;
  budget?: string | unknown;
  tags?: (PopulatedTag | string | unknown)[];
  kind?: string;
  direction?: string;
  state?: string;
  money?: unknown;
  displayMoney?: {
    primary?: {
      amountMinor: number;
      currency: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface WalletAnalyzerTotals {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerRankCategory {
  name: string;
  color: string;
  icon: string;
  amount: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerCategoryBill {
  name: string;
  color?: string;
  icon?: string;
  current: number;
  previous: number;
  changePct: number | null;
  isNew: boolean;
  [key: string]: unknown;
}

export interface WalletAnalyzerCategoryBillPrevious {
  name: string;
  color?: string;
  icon?: string;
  amount: number;
  [key: string]: unknown;
}

export interface CategoryHistoryMonthlyTotal {
  label: string;
  amount: number;
  [key: string]: unknown;
}

export interface CategoryHistoryAverageResult {
  average: number;
  monthsOfHistory: number;
  monthlyTotals: CategoryHistoryMonthlyTotal[];
  [key: string]: unknown;
}

export interface WalletAnalyzerRankTransaction {
  _id?: string;
  name: string;
  categoryName: string;
  subcategoryName: string | null;
  amount: number;
  date?: Date | string;
  color?: string;
  icon?: string;
  tags?: string[] | { name?: string }[];
  [key: string]: unknown;
}

export interface WalletAnalyzerTopTransactions {
  current: WalletAnalyzerRankTransaction[];
  previous: WalletAnalyzerRankTransaction[];
  [key: string]: unknown;
}

export interface WalletAnalyzerTrendItem {
  label: string;
  income: number;
  expense: number;
  transactionCount: number;
  shortLabel?: string;
  [key: string]: unknown;
}

export interface WalletAnalyzerMonthlyAverages {
  avgIncome: number;
  avgExpense: number;
  avgTransactionCount: number;
  monthsCount: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerBudgetMonthlySeriesItem {
  label: string;
  actual: number;
  goal: number;
  met: boolean;
  estimated?: boolean;
  [key: string]: unknown;
}

export interface WalletAnalyzerBudgetRow {
  budgetId: string;
  category: string;
  limit: number;
  spent: number;
  pct: number;
  streakMonths: number;
  status: "over" | "warning" | "ok" | string;
  monthlySeries?: WalletAnalyzerBudgetMonthlySeriesItem[];
  [key: string]: unknown;
}

export interface SubscriptionOccurrence {
  date: Date | string;
  amount: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerSubscription {
  name: string;
  categoryName: string;
  accountName: string | null;
  amount: number;
  color: string;
  icon: string;
  isNew: boolean;
  possibleDuplicateInMonth: boolean;
  occurrences: SubscriptionOccurrence[];
  [key: string]: unknown;
}

export interface SpendPatternsTransaction {
  _id?: string;
  name: string;
  amount: number;
  categoryName: string;
  subcategoryName: string | null;
  date?: Date | string;
  color: string;
  icon: string;
  tags: string[];
  [key: string]: unknown;
}

export interface SpendPatternsCategory {
  name: string;
  color: string;
  icon: string;
  total: number;
  [key: string]: unknown;
}

export interface SpendPatternsSubcategory {
  name: string;
  categoryName: string;
  total: number;
  [key: string]: unknown;
}

export interface SpendPatternsTag {
  name: string;
  count: number;
  [key: string]: unknown;
}

export interface SpendPatternsAnalysis {
  transactionIsInBiggestCategory: boolean;
  transactionIsBiggestSubcategory: boolean;
  subcategoryBelongsToBiggestCategory: boolean;
  categoryShareOfTotal: number;
  transactionShareOfCategory: number;
  transactionSharesTopCategoryTag: boolean;
  [key: string]: unknown;
}

export interface BiggestSpendPatternsData {
  biggestTransaction: SpendPatternsTransaction;
  biggestCategory: SpendPatternsCategory;
  biggestSubcategory: SpendPatternsSubcategory | null;
  mostCommonCategoryTag: SpendPatternsTag | null;
  analysis: SpendPatternsAnalysis;
  lookbackRange: DateRange;
  monthsBack?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerChampionMonthItem {
  _id?: string;
  name: string;
  amount: number;
  categoryName: string;
  date?: Date | string;
  color: string;
  icon: string;
  [key: string]: unknown;
}

export interface WalletAnalyzerChampionMonthCategory {
  name: string;
  color: string;
  icon: string;
  total: number;
  pctOfWindowTotal?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerChampionMonthSubcategory {
  name: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  total: number;
  pctOfWindowTotal?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerMonthlyChampionEntry {
  label: string;
  range: DateRange;
  total: number;
  biggestTransaction: WalletAnalyzerChampionMonthItem | null;
  biggestCategory: WalletAnalyzerChampionMonthCategory | null;
  biggestSubcategory: WalletAnalyzerChampionMonthSubcategory | null;
  [key: string]: unknown;
}

export interface WalletAnalyzerMonthlyChampionsData {
  months: WalletAnalyzerMonthlyChampionEntry[];
  windowTotal: number;
  monthsBack: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerQuarterMonthItem {
  label: string;
  total: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerQuarterTotal {
  label: string;
  year: number;
  quarter: number;
  total: number;
  months: WalletAnalyzerQuarterMonthItem[];
  [key: string]: unknown;
}

export interface SpendingPaceMonthlyDetail {
  label: string;
  throughDay: number;
  amount: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerPace {
  spentSoFar: number;
  avgPaceForSameDay: number;
  deltaPct: number | null;
  dayOfMonth: number;
  monthlyDetail: SpendingPaceMonthlyDetail[];
  periodWidthDays?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayDay {
  dayIndex: number;
  dayName: string;
  total: number;
  count: number;
  occurrences: number;
  avgPerOccurrence: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayWeek {
  label: string;
  startDay?: number;
  endDay?: number;
  total: number;
  count: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayDailyBreakdownMonth {
  dayOfMonth: number;
  dayName: string;
  total: number;
  count: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayDailyBreakdownRange {
  date: Date;
  dayName: string;
  total: number;
  count: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdaySpendingData {
  days: WalletAnalyzerWeekdayDay[];
  insight: string;
  weekdayAvg: number;
  weekendAvg: number;
  overallMean: number;
  weeks: WalletAnalyzerWeekdayWeek[];
  dailyBreakdown: WalletAnalyzerWeekdayDailyBreakdownMonth[];
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdaySpendingDataForRange {
  days: WalletAnalyzerWeekdayDay[];
  insight: string;
  weekdayAvg: number;
  weekendAvg: number;
  overallMean: number;
  weeks: WalletAnalyzerWeekdayWeek[];
  dailyBreakdown: WalletAnalyzerWeekdayDailyBreakdownRange[];
  [key: string]: unknown;
}

export interface WalletAnalyzerCategoryAnomaly {
  name: string;
  current: number;
  average: number;
  changePct: number;
  monthlyTotals: CategoryHistoryMonthlyTotal[];
  [key: string]: unknown;
}

export interface WalletAnalyzerSavingsHistoryLabeled {
  label: string;
  rate: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerInsightItem {
  icon: string;
  tone: "warning" | "positive" | "info" | string;
  title: string;
  type: string;
  data: unknown;
  [key: string]: unknown;
}

export interface WalletAnalyzerFacts {
  currentTotals: WalletAnalyzerTotals;
  previousTotals: WalletAnalyzerTotals;
  topCategoriesBills: WalletAnalyzerCategoryBill[];
  topCategoriesIncomes: WalletAnalyzerCategoryBill[];
  topCategoriesBillsPrevious: (WalletAnalyzerCategoryBillPrevious | WalletAnalyzerRankCategory)[];
  topTransactionsBills: WalletAnalyzerTopTransactions;
  trend: WalletAnalyzerTrendItem[];
  monthlyAverages: WalletAnalyzerMonthlyAverages;
  budgetRows: WalletAnalyzerBudgetRow[];
  subscriptions: WalletAnalyzerSubscription[];
  pace: WalletAnalyzerPace;
  biggestSpendPatterns?: BiggestSpendPatternsData | null;
  monthlyChampions?: WalletAnalyzerMonthlyChampionsData | null;
  previousMonthlyChampions?: WalletAnalyzerMonthlyChampionsData | null;
  quarterTotals?: WalletAnalyzerQuarterTotal[];
  weekdaySpending: WalletAnalyzerWeekdaySpendingData;
  savingsHistory: number[];
  savingsHistoryLabeled: WalletAnalyzerSavingsHistoryLabeled[];
  categoryAnomaly?: WalletAnalyzerCategoryAnomaly | null;
  [key: string]: unknown;
}

export interface BuildWalletAnalyzerSnapshotParams {
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[];
  budgets: (BudgetData | unknown)[];
  referenceDate: Date | string | number;
  today?: Date;
  topN?: number;
}

export interface WalletAnalyzerSnapshotData extends WalletAnalyzerFacts {
  insights: WalletAnalyzerInsightItem[];
  currentRange: DateRange;
  previousRange: DateRange;
  [key: string]: unknown;
}

export interface CuratedWalletSummary {
  currentTotals: WalletAnalyzerTotals;
  previousTotals: WalletAnalyzerTotals;
  insights: WalletAnalyzerInsightItem[];
  budgetRows: Omit<WalletAnalyzerBudgetRow, "monthlySeries">[];
  topCategoriesBills: WalletAnalyzerCategoryBill[];
  topCategoriesIncomes: WalletAnalyzerCategoryBill[];
  topTransactionsBills: {
    current: WalletAnalyzerRankTransaction[];
    previous: WalletAnalyzerRankTransaction[];
  };
  subscriptions: WalletAnalyzerSubscription[];
  pace: WalletAnalyzerPace;
  weekdaySpending: WalletAnalyzerWeekdaySpendingData;
  savingsHistoryLabeled: WalletAnalyzerSavingsHistoryLabeled[];
  monthlyAverages: WalletAnalyzerMonthlyAverages;
  categoryAnomaly: WalletAnalyzerCategoryAnomaly | null;
  [key: string]: unknown;
}

export interface MonthComparisonMonthItem {
  label: string;
  totals: WalletAnalyzerTotals;
  [key: string]: unknown;
}

export interface MonthComparisonData {
  monthA: MonthComparisonMonthItem;
  monthB: MonthComparisonMonthItem;
  categoriesBills: WalletAnalyzerCategoryBill[];
  categoriesIncomes: WalletAnalyzerCategoryBill[];
  transactionsBills: WalletAnalyzerTopTransactions;
  [key: string]: unknown;
}

export interface BuildMonthComparisonParams {
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[];
  monthADate: Date | string | number;
  monthBDate: Date | string | number;
  topN?: number;
}

export interface HistoricalComparativeBudgetRow {
  budget: BudgetData & { _id?: string; category?: { name?: string }; name?: string };
  monthlySeries: WalletAnalyzerBudgetMonthlySeriesItem[];
  monthsTracked: number;
  monthsMet: number;
  monthsExceeded: number;
  monthsEstimated: number;
  complianceRate: number | null;
  [key: string]: unknown;
}

export interface SumBudgetSeriesResult {
  actual: number;
  goal: number;
  monthsTracked: number;
  monthsMet: number;
  complianceRate: number | null;
  monthlySeries: WalletAnalyzerBudgetMonthlySeriesItem[];
  [key: string]: unknown;
}

export interface BudgetPeriodChangeRow {
  budgetId: string;
  budget: unknown;
  category: string;
  periodA: SumBudgetSeriesResult | null;
  periodB: SumBudgetSeriesResult | null;
  [key: string]: unknown;
}

export interface PeriodComparisonPeriodItem {
  label: string;
  totals: WalletAnalyzerTotals;
  [key: string]: unknown;
}

export interface PeriodComparisonData {
  periodA: PeriodComparisonPeriodItem;
  periodB: PeriodComparisonPeriodItem;
  categoriesBills: WalletAnalyzerCategoryBill[];
  categoriesIncomes: WalletAnalyzerCategoryBill[];
  transactionsBills: WalletAnalyzerTopTransactions;
  budgetChanges: BudgetPeriodChangeRow[];
  [key: string]: unknown;
}

export interface BuildPeriodComparisonParams {
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[];
  budgets: (BudgetData | unknown)[];
  rangeA: DateRange;
  rangeB: DateRange;
  labelA: string;
  labelB: string;
  topN?: number;
}

export interface BuildPeriodSnapshotParams {
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[];
  budgets: (BudgetData | unknown)[];
  range: DateRange;
  periodsBack?: number;
  topN?: number;
  today?: Date;
}

export interface PeriodFacts {
  currentTotals: WalletAnalyzerTotals;
  previousTotals: WalletAnalyzerTotals;
  topCategoriesBills: WalletAnalyzerCategoryBill[];
  topCategoriesIncomes: WalletAnalyzerCategoryBill[];
  topCategoriesBillsPrevious: (WalletAnalyzerCategoryBillPrevious | WalletAnalyzerRankCategory)[];
  topTransactionsBills: WalletAnalyzerTopTransactions;
  trend: WalletAnalyzerTrendItem[];
  monthlyAverages: WalletAnalyzerMonthlyAverages;
  budgetRows: WalletAnalyzerBudgetRow[];
  subscriptions: WalletAnalyzerSubscription[];
  pace: WalletAnalyzerPace;
  biggestSpendPatterns?: BiggestSpendPatternsData | null;
  monthlyChampions?: WalletAnalyzerMonthlyChampionsData | null;
  previousMonthlyChampions?: WalletAnalyzerMonthlyChampionsData | null;
  quarterTotals?: WalletAnalyzerQuarterTotal[];
  weekdaySpending: WalletAnalyzerWeekdaySpendingDataForRange | WalletAnalyzerWeekdaySpendingData;
  savingsHistory: number[];
  savingsHistoryLabeled: WalletAnalyzerSavingsHistoryLabeled[];
  categoryAnomaly?: WalletAnalyzerCategoryAnomaly | null;
  [key: string]: unknown;
}

export interface PeriodSnapshotData extends PeriodFacts {
  insights: WalletAnalyzerInsightItem[];
  currentRange: DateRange;
  previousRange: DateRange;
  [key: string]: unknown;
}

export interface CuratedPeriodSummaryMonthlyChampionMonth {
  label: string;
  total: number;
  topCategory: { name: string; total: number } | null;
  [key: string]: unknown;
}

export interface CuratedPeriodSummary {
  currentTotals: WalletAnalyzerTotals;
  previousTotals: WalletAnalyzerTotals;
  insights: WalletAnalyzerInsightItem[];
  budgetRows: Omit<WalletAnalyzerBudgetRow, "monthlySeries">[];
  topCategoriesBills: WalletAnalyzerCategoryBill[];
  topCategoriesIncomes: WalletAnalyzerCategoryBill[];
  topTransactionsBills: {
    current: WalletAnalyzerRankTransaction[];
    previous: WalletAnalyzerRankTransaction[];
  };
  subscriptions: WalletAnalyzerSubscription[];
  pace: WalletAnalyzerPace;
  weekdaySpending: WalletAnalyzerWeekdaySpendingDataForRange | WalletAnalyzerWeekdaySpendingData;
  savingsHistoryLabeled: WalletAnalyzerSavingsHistoryLabeled[];
  monthlyAverages: WalletAnalyzerMonthlyAverages;
  categoryAnomaly: WalletAnalyzerCategoryAnomaly | null;
  monthlyChampions: {
    months: CuratedPeriodSummaryMonthlyChampionMonth[];
  };
  quarterTotals?: WalletAnalyzerQuarterTotal[];
  currentRange: DateRange;
  previousRange: DateRange;
  [key: string]: unknown;
}

// All range helpers build explicit start-of-day/end-of-day boundaries
// themselves (not via getLastDayOfMonth, which returns midnight) - a range
// end at midnight would silently exclude same-day transactions with a
// later time component.
export function getMonthRange(referenceDate: Date | string | number): DateRange {
  const d = new Date(referenceDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getPreviousMonthRange(referenceDate: Date | string | number): DateRange {
  const d = new Date(referenceDate);
  return getMonthRange(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

// ---- Arbitrary-width period generalization ----
// The functions above (and most of this file) are month-shaped by design -
// perfect for the Dashboard's single-month Wallet Analyzer. History's
// period-vs-period Wallet Analyzer needs the same depth of analysis for a
// period of ANY width (a quarter, "last 3 months", a full year) - these
// primitives, and the *ForRange sibling functions below that use them, are
// that generalization. Existing month-based functions are left completely
// untouched (not rewritten as thin wrappers around these) because a
// calendar month's day-count varies (28-31) - a fixed-day-width "preceding
// period" does NOT reproduce "the previous calendar month" exactly, so
// silently swapping one for the other would subtly change already-tested
// Dashboard behavior. Kept as fully independent, parallel implementations.
function startOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date | string | number): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date | string | number, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// `range.end` is conventionally end-of-day (23:59:59.999), not a clean day
// boundary - normalizing it down to start-of-day before dividing (then
// adding 1 back for inclusive counting) avoids overcounting by a day,
// which dividing the raw end-of-day timestamp directly does.
function getRangeWidthDays(range: DateRange): number {
  return Math.round((startOfDay(range.end).getTime() - startOfDay(range.start).getTime()) / 86400000) + 1;
}

function formatShortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// A period's display label: "Julio 2026" when it happens to be exactly one
// calendar month (the common case - matches the existing month-based
// labeling convention elsewhere in this file), a short date range otherwise.
function formatPeriodLabel(period: DateRange): string {
  const sameCalendarMonth =
    period.start.getDate() === 1 &&
    period.start.getMonth() === period.end.getMonth() &&
    period.start.getFullYear() === period.end.getFullYear();
  if (sameCalendarMonth) return `${months[period.start.getMonth()]} ${period.start.getFullYear()}`;
  return `${formatShortDate(period.start)} - ${formatShortDate(period.end)}`;
}

// `count` equal-width ranges (same width as `range`), ending immediately
// before `range.start` - oldest first, matching computeTrend's existing
// oldest->newest ordering convention. The arbitrary-width sibling of "N
// calendar months back from a reference date."
export function getPrecedingPeriods(range: DateRange, count: number): DateRange[] {
  const widthDays = getRangeWidthDays(range);
  const periods: DateRange[] = [];
  let cursorEnd = endOfDay(addDays(range.start, -1));
  for (let i = 0; i < count; i++) {
    const end = cursorEnd;
    const start = startOfDay(addDays(end, -(widthDays - 1)));
    periods.unshift({ start, end });
    cursorEnd = endOfDay(addDays(start, -1));
  }
  return periods;
}

// 1. Income / expense / balance / savings-rate for one month.
export function getMonthTotals(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  monthStart: Date,
  monthEnd: Date
): WalletAnalyzerTotals {
  const monthTx = getTransactionsFromTimeRange(transactions, monthStart, monthEnd);
  const { incomes, bills } = filterBillsOrIncomes(monthTx);
  const income = incomes.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
  const expense = bills.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
  const balance = income - expense;
  return { income, expense, balance, savingsRate: income > 0 ? balance / income : 0, transactionCount: bills.length };
}

// Sums per-category spend for a single range and returns the sorted/
// sliced top-N - the independent (non-comparative) ranking used to show
// a month's own top-12 categories side by side with another month's,
// mirroring how top transactions already work (two independent top-N
// lists, not one merged comparison row).
export function rankCategoriesForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  isBill: boolean,
  range: DateRange,
  topN: number = 12
): WalletAnalyzerRankCategory[] {
  const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
  const map = new Map<string, WalletAnalyzerRankCategory>();
  set.forEach((t) => {
    const name = t.category?.name || "No category";
    if (!map.has(name)) {
      map.set(name, { name, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", amount: 0 });
    }
    map.get(name)!.amount += getPrimaryAmount(t);
  });
  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topN);
}

// Raw transaction docs for one category in one range - feeds the
// existing ModalContentTopMonthItem drill-down modal's `children`.
export function getCategoryTransactions(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  categoryName: string,
  isBill: boolean,
  range: DateRange
): TransactionData[] {
  const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
  return set.filter((t) => (t.category?.name || "No category") === categoryName) as unknown as TransactionData[];
}

// Same as getCategoryTransactions, but for one subcategory.
export function getSubcategoryTransactions(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  subcategoryName: string,
  isBill: boolean,
  range: DateRange
): TransactionData[] {
  const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
  const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
  return set.filter((t) => t.subCategory?.name === subcategoryName) as unknown as TransactionData[];
}

// 2. Top categories by current-month spend, each compared against the same
// category's previous-month total. `isNew` marks a category with nothing
// in the previous month at all (not just a dip to zero).
export function compareCategoriesAcrossMonths(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  isBill: boolean,
  currentRange: DateRange,
  previousRange: DateRange,
  topN: number = 12
): WalletAnalyzerCategoryBill[] {
  const sumByCategory = (range: DateRange) => {
    const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
    const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
    const map = new Map<string, { name: string; color: string; icon: string; value: number }>();
    set.forEach((t) => {
      const name = t.category?.name || "No category";
      if (!map.has(name)) {
        map.set(name, { name, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", value: 0 });
      }
      map.get(name)!.value += getPrimaryAmount(t);
    });
    return map;
  };

  const currentMap = sumByCategory(currentRange);
  const previousMap = sumByCategory(previousRange);

  return Array.from(currentMap.values())
    .map((c) => {
      const previous = previousMap.get(c.name)?.value || 0;
      return {
        name: c.name,
        color: c.color,
        icon: c.icon,
        current: c.value,
        previous,
        changePct: previous > 0 ? ((c.value - previous) / previous) * 100 : null,
        isNew: previous === 0,
      };
    })
    .sort((a, b) => b.current - a.current)
    .slice(0, topN);
}

// A category's trailing-N-month average (excluding the reference month
// itself) - used to flag "spent way more than usual" independently of the
// single-month-over-single-month comparison above, which can't tell a
// one-off dip in an otherwise-typical previous month from a real trend.
export function computeCategoryHistoryAverage(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  categoryName: string,
  isBill: boolean,
  referenceDate: Date | string | number,
  monthsBack: number = 6
): CategoryHistoryAverageResult {
  const ref = new Date(referenceDate);
  const monthlyTotals: number[] = [];
  const monthlyTotalsLabeled: CategoryHistoryMonthlyTotal[] = [];
  for (let m = monthsBack; m >= 1; m--) {
    const monthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const { start, end } = getMonthRange(monthDate);
    const tx = getTransactionsFromTimeRange(transactions, start, end);
    const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
    const total = set
      .filter((t) => (t.category?.name || "No category") === categoryName)
      .reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
    monthlyTotals.push(total);
    monthlyTotalsLabeled.push({ label: `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`, amount: total });
  }
  const monthsOfHistory = monthlyTotals.filter((v) => v > 0).length;
  const average = monthlyTotals.reduce((a, b) => a + b, 0) / (monthlyTotals.length || 1);
  return { average, monthsOfHistory, monthlyTotals: monthlyTotalsLabeled };
}

// Arbitrary-width sibling - a category's trailing-N-period average
// (periods the same width as `range`, immediately preceding it), instead
// of always trailing calendar months. Same field names as the month-based
// version above (`monthsOfHistory`/`monthlyTotals`) so downstream
// rendering (categoryAnomaly cards/modals) works with either unchanged.
export function computeCategoryHistoryAverageForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  categoryName: string,
  isBill: boolean,
  range: DateRange,
  periodsBack: number = 6
): CategoryHistoryAverageResult {
  const periods = getPrecedingPeriods(range, periodsBack);
  const totals: number[] = [];
  const totalsLabeled: CategoryHistoryMonthlyTotal[] = [];
  periods.forEach((period) => {
    const tx = getTransactionsFromTimeRange(transactions, period.start, period.end);
    const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
    const total = set
      .filter((t) => (t.category?.name || "No category") === categoryName)
      .reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
    totals.push(total);
    totalsLabeled.push({ label: formatPeriodLabel(period), amount: total });
  });
  const monthsOfHistory = totals.filter((v) => v > 0).length;
  const average = totals.reduce((a, b) => a + b, 0) / (totals.length || 1);
  return { average, monthsOfHistory, monthlyTotals: totalsLabeled };
}

// 3. Top individual transactions for the current month and, separately,
// the previous month - transactions don't repeat month to month the way
// categories do, so this is two independent top-N lists, not a joined one.
export function compareTransactionsAcrossMonths(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  isBill: boolean,
  currentRange: DateRange,
  previousRange: DateRange,
  topN: number = 12
): WalletAnalyzerTopTransactions {
  const build = (range: DateRange): WalletAnalyzerRankTransaction[] => {
    const tx = getTransactionsFromTimeRange(transactions, range.start, range.end);
    const set = (isBill ? filterBillsOrIncomes(tx).bills : filterBillsOrIncomes(tx).incomes) as WalletAnalyzerTransaction[];
    return set
      .map((t) => ({
        _id: t._id,
        name: t.name || "Transaction",
        categoryName: t.category?.name || "No category",
        subcategoryName: t.subCategory?.name || null,
        amount: getPrimaryAmount(t),
        date: t.date || t.createdAt,
        color: t.category?.color || "#ABABAB",
        icon: t.category?.icon || "MdFilterNone",
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topN);
  };
  return { current: build(currentRange), previous: build(previousRange) };
}

// 4. Income vs. expense for the trailing N months (oldest -> newest,
// reference month last), for the trend chart. Reuses
// orderItemsInRelativeMonth (already used by the Top-elements compare
// table) instead of re-deriving month-bucketing from scratch.
export function computeTrend(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number,
  monthsBack: number = 6
): WalletAnalyzerTrendItem[] {
  const ref = new Date(referenceDate);
  const rangeStart = new Date(ref.getFullYear(), ref.getMonth() - (monthsBack - 1), 1);
  const rangeEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const windowTx = getTransactionsFromTimeRange(transactions, rangeStart, rangeEnd);
  const { incomes, bills } = filterBillsOrIncomes(windowTx);
  const incomeByIndex = new Map<number, number>(
    orderItemsInRelativeMonth(incomes, rangeStart).map((b: { index: number; value: number }) => [b.index, b.value])
  );
  const expenseBuckets: { index: number; value: number; childrens: unknown[] }[] = orderItemsInRelativeMonth(bills, rangeStart);
  const expenseByIndex = new Map<number, number>(expenseBuckets.map((b) => [b.index, b.value]));
  const expenseCountByIndex = new Map<number, number>(expenseBuckets.map((b) => [b.index, b.childrens.length]));

  const result: WalletAnalyzerTrendItem[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const monthDate = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
    result.push({
      label: `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
      income: incomeByIndex.get(i) || 0,
      expense: expenseByIndex.get(i) || 0,
      transactionCount: expenseCountByIndex.get(i) || 0,
    });
  }
  return result;
}

// Arbitrary-width sibling of computeTrend - `periodsBack` equal-width
// periods (same width as `range`), oldest first, `range` itself last. Feeds
// the same trend-chart shape ({label, income, expense, transactionCount}),
// so computeMonthlyAverages below works on either unchanged.
export function computeTrendForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  range: DateRange,
  periodsBack: number = 6
): WalletAnalyzerTrendItem[] {
  const periods = [...getPrecedingPeriods(range, periodsBack - 1), range];
  return periods.map((period) => {
    const tx = getTransactionsFromTimeRange(transactions, period.start, period.end);
    const { incomes, bills } = filterBillsOrIncomes(tx);
    return {
      label: formatPeriodLabel(period),
      income: incomes.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0),
      expense: bills.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0),
      transactionCount: bills.length,
    };
  });
}

// Average monthly income/expense across the same trend window - reuses
// `trend`'s already-computed whole-month totals instead of re-deriving them.
export function computeMonthlyAverages(
  trend: { income: number; expense: number; transactionCount: number; [key: string]: unknown }[]
): WalletAnalyzerMonthlyAverages {
  const count = trend.length || 1;
  return {
    avgIncome: trend.reduce((a, m) => a + m.income, 0) / count,
    avgExpense: trend.reduce((a, m) => a + m.expense, 0) / count,
    avgTransactionCount: trend.reduce((a, m) => a + m.transactionCount, 0) / count,
    monthsCount: trend.length,
  };
}

// 5. Per-budget streak of consecutive months under limit, ending at the
// reference month. Wraps buildBudgetHistoricalComparative (already
// resolves each month's goal via the budget's history[]) instead of
// re-deriving month-by-month compliance.
export function computeBudgetStreaks(
  budgets: (BudgetData | unknown)[],
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number,
  lookbackMonths: number = 12
): WalletAnalyzerBudgetRow[] {
  const ref = new Date(referenceDate);
  const startDate = new Date(ref.getFullYear(), ref.getMonth() - (lookbackMonths - 1), 1);
  const endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const rows: HistoricalComparativeBudgetRow[] = buildBudgetHistoricalComparative({
    budgets,
    transactions,
    startDate,
    endDate,
    today: endDate,
  });

  return rows.map((row) => {
    const series = row.monthlySeries;
    let streakMonths = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (!series[i].met) break;
      streakMonths += 1;
    }
    const last = series[series.length - 1] || { actual: 0, goal: 0 };
    const pct = last.goal > 0 ? (last.actual / last.goal) * 100 : 0;
    return {
      // Two different Budgets can share the same category name (e.g. a
      // spending budget and a separate one, both tagged "Clothes") - this
      // is one row per BUDGET, not per category name, so callers rendering
      // a list need `budgetId` (unique) as the key, not `category` (only
      // unique in the common case).
      budgetId: String(row.budget._id),
      category: row.budget.category?.name || row.budget.name || "Budget",
      limit: last.goal,
      spent: last.actual,
      pct,
      streakMonths,
      status: pct > 100 ? "over" : pct > 80 ? "warning" : "ok",
      monthlySeries: series.map((s) => ({ label: s.label, actual: s.actual, goal: s.goal, met: s.met })),
    };
  });
}

// 6. Best-effort recurring-payment detection. There's no recurring/
// subscription field on Transaction - this groups bills by normalized
// name and flags a group as a subscription when it shows up in at least 2
// of the last `lookbackMonths` months with amount variance under 15%.
// `isNew` marks a group with no occurrence before that lookback window,
// within the wider `historyMonths` window.
function normalizeTxName(name?: string | null): string {
  return (name || "").trim().toLowerCase();
}

export function detectSubscriptions(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number,
  lookbackMonths: number = 3,
  historyMonths: number = 6
): WalletAnalyzerSubscription[] {
  const ref = new Date(referenceDate);
  const historyStart = new Date(ref.getFullYear(), ref.getMonth() - (historyMonths - 1), 1);
  const historyEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, historyStart, historyEnd)).bills as WalletAnalyzerTransaction[];

  const byName = new Map<string, WalletAnalyzerTransaction[]>();
  bills.forEach((t) => {
    const key = normalizeTxName(t.name);
    if (!key) return;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(t);
  });

  const lookbackStart = new Date(ref.getFullYear(), ref.getMonth() - (lookbackMonths - 1), 1);
  const results: WalletAnalyzerSubscription[] = [];

  byName.forEach((allTx) => {
    const recentTx = allTx.filter((t) => new Date((t.date || t.createdAt) as string | number | Date).getTime() >= lookbackStart.getTime());
    const monthsTouched = new Set(
      recentTx.map((t) => {
        const d = new Date((t.date || t.createdAt) as string | number | Date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    if (monthsTouched.size < 2) return;

    const amounts = recentTx.map((t) => getPrimaryAmount(t));
    const avg = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    const withinVariance = avg > 0 && amounts.every((a: number) => Math.abs(a - avg) / avg <= 0.15);
    if (!withinVariance) return;

    const isNew = !allTx.some((t) => new Date((t.date || t.createdAt) as string | number | Date).getTime() < lookbackStart.getTime());
    const latest = [...recentTx].sort((a, b) => new Date((b.date || b.createdAt) as string | number | Date).getTime() - new Date((a.date || a.createdAt) as string | number | Date).getTime())[0];
    const occurrences: SubscriptionOccurrence[] = [...recentTx]
      .sort((a, b) => new Date((a.date || a.createdAt) as string | number | Date).getTime() - new Date((b.date || b.createdAt) as string | number | Date).getTime())
      .map((t) => ({ date: (t.date || t.createdAt) as string | Date, amount: getPrimaryAmount(t) }));

    // A real recurring subscription fires once per billing cycle - two
    // occurrences less than 48h apart, in the current month, are far more
    // likely a duplicate charge (a retry, a double-submit) than the provider
    // actually billing twice - worth surfacing explicitly rather than relying
    // on the AI to notice it while eyeballing raw dates, which is how this
    // was caught in the first place (inconsistently, only by some models).
    const { start: currentMonthStart, end: currentMonthEnd } = getMonthRange(ref);
    const occurrencesThisMonth = occurrences.filter((o) => {
      const d = new Date(o.date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    let possibleDuplicateInMonth = false;
    for (let i = 0; i < occurrencesThisMonth.length && !possibleDuplicateInMonth; i++) {
      for (let j = i + 1; j < occurrencesThisMonth.length; j++) {
        const hoursApart = Math.abs(new Date(occurrencesThisMonth[i].date).getTime() - new Date(occurrencesThisMonth[j].date).getTime()) / 36e5;
        if (hoursApart <= 48) {
          possibleDuplicateInMonth = true;
          break;
        }
      }
    }

    results.push({
      name: latest.name || "Subscription",
      categoryName: latest.category?.name || "No category",
      accountName: latest.account?.name || null,
      amount: avg,
      color: latest.category?.color || "#ABABAB",
      icon: latest.category?.icon || "MdFilterNone",
      isNew,
      possibleDuplicateInMonth,
      occurrences,
    });
  });

  return results.sort((a, b) => b.amount - a.amount);
}

// "Grandes gastos" - a rule-based (no AI) look at the single biggest
// transaction, the category with the highest 12-month total, and the
// subcategory with the highest 12-month total, plus a few deterministic
// checks for whether they're actually related - whether a category's
// total is dominated by one big one-off vs. accumulated from many
// smaller, recurring transactions, and whether tags tie them together.
// Shared by findBiggestSpendPatterns (month-based) and
// findBiggestSpendPatternsForRange (arbitrary range) - everything after
// resolving the bills-in-range set is identical either way, so this is the
// one place that logic lives.
function computeBiggestSpendPatternsCore(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  range: DateRange
): BiggestSpendPatternsData | null {
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, range.start, range.end)).bills as WalletAnalyzerTransaction[];
  if (bills.length === 0) return null;

  const totalSpend = bills.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);

  const biggestTransactionRaw = [...bills].sort(
    (a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)
  )[0];
  const transactionAmount = getPrimaryAmount(biggestTransactionRaw);
  const transactionCategoryName = biggestTransactionRaw.category?.name || "No category";
  const transactionSubcategoryName = biggestTransactionRaw.subCategory?.name || null;

  const byCategory = new Map<string, SpendPatternsCategory>();
  const byCategoryTagCounts = new Map<string, Map<string, number>>(); // categoryName -> Map(tagName -> count)
  const bySubcategory = new Map<string, SpendPatternsSubcategory>();
  bills.forEach((t) => {
    const catName = t.category?.name || "No category";
    if (!byCategory.has(catName)) {
      byCategory.set(catName, { name: catName, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", total: 0 });
    }
    byCategory.get(catName)!.total += getPrimaryAmount(t);

    if (!byCategoryTagCounts.has(catName)) byCategoryTagCounts.set(catName, new Map<string, number>());
    (t.tags || []).forEach((tag: PopulatedTag | string | unknown) => {
      const tagName = typeof tag === "object" && tag !== null && "name" in tag ? (tag as PopulatedTag).name : undefined;
      if (!tagName) return;
      const counts = byCategoryTagCounts.get(catName)!;
      counts.set(tagName, (counts.get(tagName) || 0) + 1);
    });

    if (t.subCategory?.name) {
      const subName = t.subCategory.name;
      if (!bySubcategory.has(subName)) bySubcategory.set(subName, { name: subName, categoryName: catName, total: 0 });
      bySubcategory.get(subName)!.total += getPrimaryAmount(t);
    }
  });

  const biggestCategory = [...byCategory.values()].sort((a, b) => b.total - a.total)[0];
  const biggestSubcategory = [...bySubcategory.values()].sort((a, b) => b.total - a.total)[0] || null;

  const categoryTagCounts = byCategoryTagCounts.get(biggestCategory.name);
  const mostCommonCategoryTag: SpendPatternsTag | null =
    categoryTagCounts && categoryTagCounts.size > 0
      ? [...categoryTagCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))[0]
      : null;

  const transactionTagNames = (biggestTransactionRaw.tags || [])
    .map((tag: PopulatedTag | string | unknown) => (typeof tag === "object" && tag !== null && "name" in tag ? (tag as PopulatedTag).name : undefined))
    .filter((name): name is string => Boolean(name));

  // Always measured against the transaction's OWN category total (not
  // necessarily `biggestCategory` - they may differ) - "what fraction of
  // that category's spend is this one transaction" only means something
  // relative to the category it actually belongs to.
  const transactionOwnCategoryTotal = byCategory.get(transactionCategoryName)?.total || 0;

  const analysis: SpendPatternsAnalysis = {
    transactionIsInBiggestCategory: transactionCategoryName === biggestCategory.name,
    transactionIsBiggestSubcategory: !!biggestSubcategory && transactionSubcategoryName === biggestSubcategory.name,
    subcategoryBelongsToBiggestCategory: !!biggestSubcategory && biggestSubcategory.categoryName === biggestCategory.name,
    categoryShareOfTotal: totalSpend > 0 ? (biggestCategory.total / totalSpend) * 100 : 0,
    transactionShareOfCategory: transactionOwnCategoryTotal > 0 ? (transactionAmount / transactionOwnCategoryTotal) * 100 : 0,
    transactionSharesTopCategoryTag: !!mostCommonCategoryTag && transactionTagNames.includes(mostCommonCategoryTag.name),
  };

  return {
    biggestTransaction: {
      _id: biggestTransactionRaw._id,
      name: biggestTransactionRaw.name || "Transaction",
      amount: transactionAmount,
      categoryName: transactionCategoryName,
      subcategoryName: transactionSubcategoryName,
      date: biggestTransactionRaw.date || biggestTransactionRaw.createdAt,
      color: biggestTransactionRaw.category?.color || "#ABABAB",
      icon: biggestTransactionRaw.category?.icon || "MdFilterNone",
      tags: transactionTagNames,
    },
    biggestCategory,
    biggestSubcategory,
    mostCommonCategoryTag,
    analysis,
    lookbackRange: range,
  };
}

export function findBiggestSpendPatterns(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number,
  monthsBack: number = 12
): BiggestSpendPatternsData | null {
  const ref = new Date(referenceDate);
  const start = new Date(ref.getFullYear(), ref.getMonth() - (monthsBack - 1), 1, 0, 0, 0, 0);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const core = computeBiggestSpendPatternsCore(transactions, { start, end });
  return core ? { ...core, monthsBack } : null;
}

// Arbitrary-width sibling - the range IS the lookback window, no monthsBack
// concept (the caller already chose the window's width by picking `range`).
export function findBiggestSpendPatternsForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  range: DateRange
): BiggestSpendPatternsData | null {
  return computeBiggestSpendPatternsCore(transactions, range);
}

// Per-month version of findBiggestSpendPatterns - instead of one winner
// over the whole window, this is "who won each month", so a click on
// "Grandes gastos" can first show the evidence (12 months side by side)
// before drilling into any single month's actual transactions. Category/
// subcategory `pctOfWindowTotal` is still measured against the *whole*
// 12-month total (not that month's own total), so the 12 rows are
// directly comparable to each other and to findBiggestSpendPatterns'
// own categoryShareOfTotal.
export function computeMonthlyChampions(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number,
  monthsBack: number = 12
): WalletAnalyzerMonthlyChampionsData {
  const ref = new Date(referenceDate);
  const windowStart = new Date(ref.getFullYear(), ref.getMonth() - (monthsBack - 1), 1, 0, 0, 0, 0);
  const windowEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  const windowBills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, windowStart, windowEnd)).bills as WalletAnalyzerTransaction[];
  const windowTotal = windowBills.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);

  const monthEntries: WalletAnalyzerMonthlyChampionEntry[] = [];
  for (let m = monthsBack - 1; m >= 0; m--) {
    const monthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const range = getMonthRange(monthDate);
    const label = `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
    const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, range.start, range.end)).bills as WalletAnalyzerTransaction[];

    if (bills.length === 0) {
      monthEntries.push({ label, range, total: 0, biggestTransaction: null, biggestCategory: null, biggestSubcategory: null });
      continue;
    }

    const total = bills.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
    const biggestTransactionRaw = [...bills].sort(
      (a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)
    )[0];

    const byCategory = new Map<string, SpendPatternsCategory>();
    const bySubcategory = new Map<string, { name: string; categoryName: string; categoryColor: string; categoryIcon: string; total: number }>();
    bills.forEach((t) => {
      const catName = t.category?.name || "No category";
      if (!byCategory.has(catName)) {
        byCategory.set(catName, { name: catName, color: t.category?.color || "#ABABAB", icon: t.category?.icon || "MdFilterNone", total: 0 });
      }
      byCategory.get(catName)!.total += getPrimaryAmount(t);
      if (t.subCategory?.name) {
        const subName = t.subCategory.name;
        if (!bySubcategory.has(subName)) {
          bySubcategory.set(subName, {
            name: subName,
            categoryName: catName,
            categoryColor: t.category?.color || "#ABABAB",
            categoryIcon: t.category?.icon || "MdFilterNone",
            total: 0,
          });
        }
        bySubcategory.get(subName)!.total += getPrimaryAmount(t);
      }
    });
    const biggestCategoryRaw = [...byCategory.values()].sort((a, b) => b.total - a.total)[0];
    const biggestSubcategoryRaw = [...bySubcategory.values()].sort((a, b) => b.total - a.total)[0] || null;

    monthEntries.push({
      label,
      range,
      total,
      biggestTransaction: {
        _id: biggestTransactionRaw._id,
        name: biggestTransactionRaw.name || "Transaction",
        amount: getPrimaryAmount(biggestTransactionRaw),
        categoryName: biggestTransactionRaw.category?.name || "No category",
        date: biggestTransactionRaw.date || biggestTransactionRaw.createdAt,
        color: biggestTransactionRaw.category?.color || "#ABABAB",
        icon: biggestTransactionRaw.category?.icon || "MdFilterNone",
      },
      biggestCategory: {
        ...biggestCategoryRaw,
        pctOfWindowTotal: windowTotal > 0 ? (biggestCategoryRaw.total / windowTotal) * 100 : 0,
      },
      biggestSubcategory: biggestSubcategoryRaw
        ? { ...biggestSubcategoryRaw, pctOfWindowTotal: windowTotal > 0 ? (biggestSubcategoryRaw.total / windowTotal) * 100 : 0 }
        : null,
    });
  }

  return { months: monthEntries, windowTotal, monthsBack };
}

// History's Wallet Analyzer always analyzes an arbitrary multi-month
// range (never a single month), so it needs the champions window to
// exactly cover the SELECTED range - not "N months back from an anchor
// date" like computeMonthlyChampions (built for the Dashboard's one-month
// view, where "anchor + lookback" and "the analyzed period" are the same
// thing by construction). Reusing computeMonthlyChampions here with
// monthsBack=someGuess would misalign the window with `range` whenever
// `range` doesn't happen to end at `today` (e.g. "all 2026" picked in
// September: the real range is Jan-Dec, but a lookback from today would
// cover Oct(previous year)-Sept instead). This walks calendar months from
// range.start through min(range.end, today) directly.
export function computeMonthlyChampionsForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  range: DateRange,
  today: Date = new Date()
): WalletAnalyzerMonthlyChampionsData {
  const effectiveEnd = range.end < today ? range.end : today;
  if (effectiveEnd < range.start) {
    return { months: [], windowTotal: 0, monthsBack: 0 };
  }
  const monthsBack =
    (effectiveEnd.getFullYear() - range.start.getFullYear()) * 12 + (effectiveEnd.getMonth() - range.start.getMonth()) + 1;
  return computeMonthlyChampions(transactions, effectiveEnd, monthsBack);
}

// The single busiest calendar month inside a champions window - the
// concrete answer to "mes del período en el que más se gastó".
export function findPeakMonth(monthlyChampions: WalletAnalyzerMonthlyChampionsData): WalletAnalyzerMonthlyChampionEntry | null {
  const withSpend = monthlyChampions.months.filter((m) => m.total > 0);
  if (withSpend.length === 0) return null;
  return withSpend.reduce((best, m) => (m.total > best.total ? m : best));
}

// Buckets a champions window's months into real calendar quarters (Q1
// Jan-Mar ... Q4 Oct-Dec), so "período del año en el que más se gastó"
// reads as an actual season/quarter rather than an arbitrary 3-month
// slice - meaningful once a period spans enough months to compare more
// than one quarter against another (a 3-month "last quarter" selection
// only ever touches one bucket, so there's nothing to compare there).
export function computeQuarterTotals(monthlyChampions: WalletAnalyzerMonthlyChampionsData): WalletAnalyzerQuarterTotal[] {
  const byQuarter = new Map<string, WalletAnalyzerQuarterTotal>();
  monthlyChampions.months.forEach((m) => {
    const monthDate = m.range.start;
    const year = monthDate.getFullYear();
    const quarter = Math.floor(monthDate.getMonth() / 3) + 1;
    const key = `${year}-Q${quarter}`;
    if (!byQuarter.has(key)) {
      byQuarter.set(key, { label: `Q${quarter} ${year}`, year, quarter, total: 0, months: [] });
    }
    const entry = byQuarter.get(key)!;
    entry.total += m.total;
    entry.months.push({ label: m.label, total: m.total });
  });
  return [...byQuarter.values()].sort((a, b) => (a.year - b.year) || (a.quarter - b.quarter));
}

export function findPeakQuarter(quarterTotals: WalletAnalyzerQuarterTotal[]): WalletAnalyzerQuarterTotal | null {
  const withSpend = quarterTotals.filter((q) => q.total > 0);
  if (withSpend.length === 0) return null;
  return withSpend.reduce((best, q) => (q.total > best.total ? q : best));
}

// 7. How this month's spend-through-today compares to the same
// day-of-month average over the trailing lookback months. `referenceDate`
// is normally day-1-anchored by the caller (it doubles as "which month"),
// so it can't supply "today" itself - `today` is a separate, explicit,
// defaultable param (same convention as buildBudgetHistoricalComparative's
// `today`) so this stays deterministic for tests instead of reaching for
// `new Date()` internally. When the reference month IS the real current
// month, pace runs through today's actual date; for an already-elapsed
// past month it runs through that month's last day (a full-month
// comparison), since "today" has no meaning there.
export function computeSpendingPace(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number,
  isBill: boolean = true,
  lookbackMonths: number = 6,
  today: Date = new Date()
): WalletAnalyzerPace {
  const ref = new Date(referenceDate);
  const isCurrentMonth = ref.getFullYear() === today.getFullYear() && ref.getMonth() === today.getMonth();
  const lastDayOfRefMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const dayOfMonth = isCurrentMonth ? today.getDate() : lastDayOfRefMonth;
  const { start: monthStart } = getMonthRange(ref);
  const soFarEnd = new Date(ref.getFullYear(), ref.getMonth(), dayOfMonth, 23, 59, 59, 999);
  const currentSet = isBill
    ? filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, monthStart, soFarEnd)).bills
    : filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, monthStart, soFarEnd)).incomes;
  const spentSoFar = currentSet.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);

  const pastPaces: number[] = [];
  const monthlyDetail: SpendingPaceMonthlyDetail[] = [];
  for (let m = lookbackMonths; m >= 1; m--) {
    const pastMonthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const lastDayOfPastMonth = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth() + 1, 0).getDate();
    const cappedDay = Math.min(dayOfMonth, lastDayOfPastMonth);
    const pastStart = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth(), 1, 0, 0, 0, 0);
    const pastEnd = new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth(), cappedDay, 23, 59, 59, 999);
    const pastSet = isBill
      ? filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, pastStart, pastEnd)).bills
      : filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, pastStart, pastEnd)).incomes;
    const amount = pastSet.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
    pastPaces.push(amount);
    monthlyDetail.push({ label: `${months[pastMonthDate.getMonth()]} ${pastMonthDate.getFullYear()}`, throughDay: cappedDay, amount });
  }
  const avgPaceForSameDay = pastPaces.length > 0 ? pastPaces.reduce((a, b) => a + b, 0) / pastPaces.length : 0;
  return {
    spentSoFar,
    avgPaceForSameDay,
    deltaPct: avgPaceForSameDay > 0 ? ((spentSoFar - avgPaceForSameDay) / avgPaceForSameDay) * 100 : null,
    dayOfMonth,
    monthlyDetail,
  };
}

// Arbitrary-width sibling - "day of month" becomes "day elapsed into the
// period" (capped at the period's own width for an already-closed period),
// compared against the same elapsed-day mark in `periodsBack` preceding
// periods of the same width. Same field names as computeSpendingPace
// (`dayOfMonth`/`monthlyDetail`) so existing pace-card rendering works with
// either - "day of month" reads fine as "day of period" too.
export function computeSpendingPaceForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  range: DateRange,
  isBill: boolean = true,
  periodsBack: number = 6,
  today: Date = new Date()
): WalletAnalyzerPace {
  const widthDays = getRangeWidthDays(range);
  const isCurrentPeriod = today >= range.start && today <= range.end;
  const elapsedDays = isCurrentPeriod ? Math.floor((startOfDay(today).getTime() - range.start.getTime()) / 86400000) + 1 : widthDays;
  const soFarEnd = endOfDay(addDays(range.start, elapsedDays - 1));
  const currentSet = isBill
    ? filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, range.start, soFarEnd)).bills
    : filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, range.start, soFarEnd)).incomes;
  const spentSoFar = currentSet.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);

  const pastPaces: number[] = [];
  const monthlyDetail: SpendingPaceMonthlyDetail[] = [];
  getPrecedingPeriods(range, periodsBack).forEach((period) => {
    const cappedDays = Math.min(elapsedDays, getRangeWidthDays(period));
    const pastEnd = endOfDay(addDays(period.start, cappedDays - 1));
    const pastSet = isBill
      ? filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, period.start, pastEnd)).bills
      : filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, period.start, pastEnd)).incomes;
    const amount = pastSet.reduce<number>((a: number, t: object) => a + getPrimaryAmount(t), 0);
    pastPaces.push(amount);
    monthlyDetail.push({ label: formatPeriodLabel(period), throughDay: cappedDays, amount });
  });
  const avgPaceForSameDay = pastPaces.length > 0 ? pastPaces.reduce((a, b) => a + b, 0) / pastPaces.length : 0;
  return {
    spentSoFar,
    avgPaceForSameDay,
    deltaPct: avgPaceForSameDay > 0 ? ((spentSoFar - avgPaceForSameDay) / avgPaceForSameDay) * 100 : null,
    dayOfMonth: elapsedDays,
    periodWidthDays: widthDays,
    monthlyDetail,
  };
}

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const WEEKDAY_PLURAL: Record<string, string> = {
  Lunes: "lunes",
  Martes: "martes",
  Miércoles: "miércoles",
  Jueves: "jueves",
  Viernes: "viernes",
  Sábado: "sábados",
  Domingo: "domingos",
};

// JS Date#getDay(): 0=Sunday..6=Saturday. Remapped to a Monday-first index
// (0=Monday..6=Sunday) so a calendar week reads left-to-right naturally.
function mondayFirstIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

// Which weekdays this month's spending skews toward - scoped to the
// current reference month only (not a multi-month average), so it reads
// as "this month's pattern" rather than a long-run claim. Compares
// `avgPerOccurrence` (total / how many of that weekday actually fell in
// this month), not raw totals, since a month has 4 or 5 of each weekday
// unevenly - raw totals would unfairly favor whichever weekday occurs
// one extra time.
export function computeSpendingByWeekday(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  referenceDate: Date | string | number
): WalletAnalyzerWeekdaySpendingData {
  const ref = new Date(referenceDate);
  const { start, end } = getMonthRange(ref);
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, start, end)).bills as WalletAnalyzerTransaction[];

  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  bills.forEach((t) => {
    const idx = mondayFirstIndex(new Date((t.date || t.createdAt) as string | number | Date).getDay());
    totals[idx] += getPrimaryAmount(t);
    counts[idx] += 1;
  });

  const occurrences = new Array(7).fill(0);
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    occurrences[mondayFirstIndex(new Date(ref.getFullYear(), ref.getMonth(), day).getDay())] += 1;
  }

  const days: WalletAnalyzerWeekdayDay[] = WEEKDAY_NAMES.map((dayName, i) => ({
    dayIndex: i,
    dayName,
    total: totals[i],
    count: counts[i],
    occurrences: occurrences[i],
    avgPerOccurrence: occurrences[i] > 0 ? totals[i] / occurrences[i] : 0,
  }));

  const hasAnySpend = totals.some((t) => t > 0);
  const weekdayDays = days.slice(0, 5);
  const weekendDays = days.slice(5);
  const weekdayAvg = weekdayDays.reduce((a, d) => a + d.avgPerOccurrence, 0) / weekdayDays.length;
  const weekendAvg = weekendDays.reduce((a, d) => a + d.avgPerOccurrence, 0) / weekendDays.length;
  const overallMean = days.reduce((a, d) => a + d.avgPerOccurrence, 0) / days.length;

  // A single day dominating every other day individually is a sharper,
  // more useful claim than a broad weekday/weekend split - checked first
  // so it isn't drowned out by that split trivially being "true" whenever
  // the other category happens to be $0 (e.g. all spend falls on one
  // Wednesday: weekday avg > weekend avg is technically true, but "los
  // miércoles" is the actual story).
  const sortedByAvg = [...days].sort((a, b) => b.avgPerOccurrence - a.avgPerOccurrence);
  const standout = sortedByAvg[0];
  const runnerUp = sortedByAvg[1];

  let insight: string;
  if (!hasAnySpend) {
    insight = "Sin gastos este mes para detectar un patrón.";
  } else if (standout.avgPerOccurrence > 0 && (runnerUp.avgPerOccurrence === 0 || standout.avgPerOccurrence > runnerUp.avgPerOccurrence * 1.5)) {
    insight = `Los ${WEEKDAY_PLURAL[standout.dayName]} destacan como tu día de mayor gasto este mes.`;
  } else if (weekendAvg > weekdayAvg * 1.2) {
    insight = "Sueles gastar más los fines de semana este mes.";
  } else if (weekdayAvg > weekendAvg * 1.2) {
    insight = "Sueles gastar más entre semana este mes.";
  } else if (overallMean > 0 && standout.avgPerOccurrence > overallMean * 1.3) {
    insight = `Los ${WEEKDAY_PLURAL[standout.dayName]} destacan como tu día de mayor gasto este mes.`;
  } else {
    insight = "Sin un patrón claro por día de la semana este mes.";
  }

  // Day-by-day and week-by-week breakdowns, for the detail modal - "why
  // did the app conclude this" needs the actual daily numbers, not just
  // the 7-bucket weekday averages above.
  const dailyTotalsByDay = new Map<number, { total: number; count: number }>();
  for (let day = 1; day <= lastDay; day++) dailyTotalsByDay.set(day, { total: 0, count: 0 });
  bills.forEach((t) => {
    const d = new Date((t.date || t.createdAt) as string | number | Date);
    const entry = dailyTotalsByDay.get(d.getDate());
    if (entry) {
      entry.total += getPrimaryAmount(t);
      entry.count += 1;
    }
  });
  const dailyBreakdown: WalletAnalyzerWeekdayDailyBreakdownMonth[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const jsDay = new Date(ref.getFullYear(), ref.getMonth(), day).getDay();
    const entry = dailyTotalsByDay.get(day) || { total: 0, count: 0 };
    dailyBreakdown.push({ dayOfMonth: day, dayName: WEEKDAY_NAMES[mondayFirstIndex(jsDay)], total: entry.total, count: entry.count });
  }

  // Simple day-range weeks (1-7, 8-14, ...) rather than calendar weeks,
  // so every month cleanly splits into ~4 weeks plus a short tail instead
  // of partial weeks bleeding into neighboring months.
  const weeks: WalletAnalyzerWeekdayWeek[] = [];
  for (let weekStart = 1; weekStart <= lastDay; weekStart += 7) {
    const weekEnd = Math.min(weekStart + 6, lastDay);
    const weekDays = dailyBreakdown.filter((d) => d.dayOfMonth >= weekStart && d.dayOfMonth <= weekEnd);
    weeks.push({
      label: `Días ${weekStart}-${weekEnd}`,
      startDay: weekStart,
      endDay: weekEnd,
      total: weekDays.reduce((a, d) => a + d.total, 0),
      count: weekDays.reduce((a, d) => a + d.count, 0),
    });
  }

  return { days, insight, weekdayAvg, weekendAvg, overallMean, weeks, dailyBreakdown };
}

// Arbitrary-width sibling - iterates the whole `range` day by day instead
// of one calendar month's days, so the pattern reflects the entire
// selected period (e.g. "last 3 months"), not just its final month.
export function computeSpendingByWeekdayForRange(
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  range: DateRange
): WalletAnalyzerWeekdaySpendingDataForRange {
  const widthDays = getRangeWidthDays(range);
  const bills = filterBillsOrIncomes(getTransactionsFromTimeRange(transactions, range.start, range.end)).bills as WalletAnalyzerTransaction[];

  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  bills.forEach((t) => {
    const idx = mondayFirstIndex(new Date((t.date || t.createdAt) as string | number | Date).getDay());
    totals[idx] += getPrimaryAmount(t);
    counts[idx] += 1;
  });

  const occurrences = new Array(7).fill(0);
  for (let i = 0; i < widthDays; i++) {
    occurrences[mondayFirstIndex(addDays(range.start, i).getDay())] += 1;
  }

  const days: WalletAnalyzerWeekdayDay[] = WEEKDAY_NAMES.map((dayName, i) => ({
    dayIndex: i,
    dayName,
    total: totals[i],
    count: counts[i],
    occurrences: occurrences[i],
    avgPerOccurrence: occurrences[i] > 0 ? totals[i] / occurrences[i] : 0,
  }));

  const hasAnySpend = totals.some((t) => t > 0);
  const weekdayDays = days.slice(0, 5);
  const weekendDays = days.slice(5);
  const weekdayAvg = weekdayDays.reduce((a, d) => a + d.avgPerOccurrence, 0) / weekdayDays.length;
  const weekendAvg = weekendDays.reduce((a, d) => a + d.avgPerOccurrence, 0) / weekendDays.length;
  const overallMean = days.reduce((a, d) => a + d.avgPerOccurrence, 0) / days.length;

  const sortedByAvg = [...days].sort((a, b) => b.avgPerOccurrence - a.avgPerOccurrence);
  const standout = sortedByAvg[0];
  const runnerUp = sortedByAvg[1];

  let insight: string;
  if (!hasAnySpend) {
    insight = "Sin gastos en este periodo para detectar un patrón.";
  } else if (standout.avgPerOccurrence > 0 && (runnerUp.avgPerOccurrence === 0 || standout.avgPerOccurrence > runnerUp.avgPerOccurrence * 1.5)) {
    insight = `Los ${WEEKDAY_PLURAL[standout.dayName]} destacan como tu día de mayor gasto en este periodo.`;
  } else if (weekendAvg > weekdayAvg * 1.2) {
    insight = "Sueles gastar más los fines de semana en este periodo.";
  } else if (weekdayAvg > weekendAvg * 1.2) {
    insight = "Sueles gastar más entre semana en este periodo.";
  } else if (overallMean > 0 && standout.avgPerOccurrence > overallMean * 1.3) {
    insight = `Los ${WEEKDAY_PLURAL[standout.dayName]} destacan como tu día de mayor gasto en este periodo.`;
  } else {
    insight = "Sin un patrón claro por día de la semana en este periodo.";
  }

  const dailyTotalsByKey = new Map<string, { total: number; count: number }>();
  for (let i = 0; i < widthDays; i++) {
    dailyTotalsByKey.set(addDays(range.start, i).toDateString(), { total: 0, count: 0 });
  }
  bills.forEach((t) => {
    const d = new Date((t.date || t.createdAt) as string | number | Date);
    const entry = dailyTotalsByKey.get(d.toDateString());
    if (entry) {
      entry.total += getPrimaryAmount(t);
      entry.count += 1;
    }
  });
  const dailyBreakdown: WalletAnalyzerWeekdayDailyBreakdownRange[] = [];
  for (let i = 0; i < widthDays; i++) {
    const day = addDays(range.start, i);
    const entry = dailyTotalsByKey.get(day.toDateString()) || { total: 0, count: 0 };
    dailyBreakdown.push({ date: day, dayName: WEEKDAY_NAMES[mondayFirstIndex(day.getDay())], total: entry.total, count: entry.count });
  }

  // Simple day-range weeks (day 1-7, 8-14, ...) across the whole span,
  // rather than calendar weeks - same convention as the month-based
  // version, just not clipped to one month's days.
  const weeks: WalletAnalyzerWeekdayWeek[] = [];
  for (let weekStartIdx = 0; weekStartIdx < widthDays; weekStartIdx += 7) {
    const weekEndIdx = Math.min(weekStartIdx + 6, widthDays - 1);
    const weekDays = dailyBreakdown.slice(weekStartIdx, weekEndIdx + 1);
    weeks.push({
      label: `${formatShortDate(addDays(range.start, weekStartIdx))} - ${formatShortDate(addDays(range.start, weekEndIdx))}`,
      total: weekDays.reduce((a, d) => a + d.total, 0),
      count: weekDays.reduce((a, d) => a + d.count, 0),
    });
  }

  return { days, insight, weekdayAvg, weekendAvg, overallMean, weeks, dailyBreakdown };
}

// 8. Rule-based highlight cards - deliberately NOT an LLM call: every
// number here is already computed exactly, so a template just has to word
// it, not derive it. Ranked warnings-first, capped so the strip stays
// scannable.
const INSIGHT_PRIORITY: Record<string, number> = { warning: 0, positive: 1, info: 2 };

// Insights carry `type`/`data` (raw facts) instead of a pre-baked string -
// currency formatting needs `walletPrimaryCurrency`, which this
// currency-agnostic transformer layer intentionally doesn't know about.
// The View renders both the card's one-line detail AND the "why" modal's
// expanded breakdown from this same `data`, keyed by `type`.
// `extraInsights` and `maxInsights` let buildPeriodSnapshot append
// period-native insights (peak month/quarter, etc. - things that only
// make sense across a multi-month range) without duplicating this
// function's sort/priority logic; both default away to nothing so every
// existing single-month caller (buildWalletAnalyzerSnapshot, the
// Dashboard) behaves exactly as before.
export function generateInsights(
  facts: WalletAnalyzerFacts | PeriodFacts,
  extraInsights: WalletAnalyzerInsightItem[] = [],
  maxInsights: number = 5
): WalletAnalyzerInsightItem[] {
  const insights: WalletAnalyzerInsightItem[] = [];

  const worstBudget = facts.budgetRows.find((b) => b.status === "over");
  if (worstBudget) {
    insights.push({
      icon: "⚠️",
      tone: "warning",
      title: `${worstBudget.category} superó su presupuesto`,
      type: "budget",
      data: worstBudget,
    });
  }

  if (facts.categoryAnomaly) {
    const { changePct } = facts.categoryAnomaly;
    insights.push({
      icon: changePct >= 0 ? "🔥" : "🧊",
      tone: changePct >= 0 ? "warning" : "positive",
      title: `${facts.categoryAnomaly.name} ${changePct >= 0 ? "+" : ""}${Math.round(changePct)}% vs. tu promedio`,
      type: "category_anomaly",
      data: facts.categoryAnomaly,
    });
  }

  const newCategory = facts.topCategoriesBills.find((c) => c.isNew && c.current > 0);
  if (newCategory) {
    insights.push({
      icon: "🆕",
      tone: "info",
      title: `Nueva categoría: ${newCategory.name}`,
      type: "new_category",
      data: newCategory,
    });
  }

  const newSubscription = facts.subscriptions.find((s) => s.isNew);
  if (newSubscription) {
    insights.push({
      icon: "🆕",
      tone: "info",
      title: `Nueva suscripción: ${newSubscription.name}`,
      type: "subscription",
      data: newSubscription,
    });
  }

  const bestStreak = [...facts.budgetRows].sort((a, b) => b.streakMonths - a.streakMonths)[0];
  if (bestStreak && bestStreak.streakMonths >= 2) {
    insights.push({
      icon: "📈",
      tone: "positive",
      title: `Racha de ${bestStreak.streakMonths} meses en ${bestStreak.category}`,
      type: "budget",
      data: bestStreak,
    });
  }

  if (facts.savingsHistory.length >= 3) {
    const current = facts.savingsHistory[0];
    const rest = facts.savingsHistory.slice(1);
    const max = Math.max(...rest);
    const min = Math.min(...rest);
    if (current >= max && current > 0) {
      insights.push({
        icon: "💰",
        tone: "positive",
        title: `Mejor tasa de ahorro en ${facts.savingsHistory.length} meses`,
        type: "savings_rate",
        data: { currentRate: current, savingsHistoryLabeled: facts.savingsHistoryLabeled },
      });
    } else if (current <= min) {
      insights.push({
        icon: "📉",
        tone: "warning",
        title: `Tasa de ahorro más baja en ${facts.savingsHistory.length} meses`,
        type: "savings_rate",
        data: { currentRate: current, savingsHistoryLabeled: facts.savingsHistoryLabeled },
      });
    }
  }

  return [...insights, ...extraInsights].sort((a, b) => (INSIGHT_PRIORITY[a.tone] ?? 2) - (INSIGHT_PRIORITY[b.tone] ?? 2)).slice(0, maxInsights);
}

// Orchestrator - composes every sync computation above into one snapshot.
// FX exposure isn't included here: it needs network calls (fx/quote), so
// it's computed separately by a hook the component calls alongside this.
export function buildWalletAnalyzerSnapshot({
  transactions,
  budgets,
  referenceDate,
  today = new Date(),
  topN = 12,
}: BuildWalletAnalyzerSnapshotParams): WalletAnalyzerSnapshotData {
  const ref = new Date(referenceDate);
  const currentRange = getMonthRange(ref);
  const previousRange = getPreviousMonthRange(ref);

  const currentTotals = getMonthTotals(transactions, currentRange.start, currentRange.end);
  const previousTotals = getMonthTotals(transactions, previousRange.start, previousRange.end);

  const topCategoriesBills = compareCategoriesAcrossMonths(transactions, true, currentRange, previousRange, topN);
  const topCategoriesIncomes = compareCategoriesAcrossMonths(transactions, false, currentRange, previousRange, topN);
  const topCategoriesBillsPrevious = rankCategoriesForRange(transactions, true, previousRange, topN);
  const topTransactionsBills = compareTransactionsAcrossMonths(transactions, true, currentRange, previousRange, topN);

  const trend = computeTrend(transactions, ref, 6);
  const monthlyAverages = computeMonthlyAverages(trend);
  const budgetRows = computeBudgetStreaks(budgets, transactions, ref, 12);
  const subscriptions = detectSubscriptions(transactions, ref, 3, 6);
  const pace = computeSpendingPace(transactions, ref, true, 6, today);
  const biggestSpendPatterns = findBiggestSpendPatterns(transactions, ref, 12);
  const monthlyChampions = computeMonthlyChampions(transactions, ref, 12);
  const weekdaySpending = computeSpendingByWeekday(transactions, ref);

  const savingsHistory: number[] = [];
  const savingsHistoryLabeled: WalletAnalyzerSavingsHistoryLabeled[] = [];
  for (let m = 0; m < 6; m++) {
    const monthDate = new Date(ref.getFullYear(), ref.getMonth() - m, 1);
    const { start, end } = getMonthRange(monthDate);
    const rate = getMonthTotals(transactions, start, end).savingsRate;
    savingsHistory.push(rate);
    savingsHistoryLabeled.unshift({ label: `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`, rate });
  }

  // Among the top few categories, whichever deviates most (in either
  // direction) from its own trailing average is the one worth calling out
  // - not necessarily whichever spends the most in absolute terms.
  let categoryAnomaly: WalletAnalyzerCategoryAnomaly | null = null;
  topCategoriesBills.slice(0, 5).forEach((c) => {
    const { average, monthsOfHistory, monthlyTotals } = computeCategoryHistoryAverage(transactions, c.name, true, ref, 6);
    if (average <= 0 || monthsOfHistory < 3) return;
    const changePct = ((c.current - average) / average) * 100;
    if (!categoryAnomaly || Math.abs(changePct) > Math.abs(categoryAnomaly.changePct)) {
      if (Math.abs(changePct) >= 25) {
        categoryAnomaly = { name: c.name, current: c.current, average, changePct, monthlyTotals };
      }
    }
  });

  const facts: WalletAnalyzerFacts = {
    currentTotals,
    previousTotals,
    topCategoriesBills,
    topCategoriesIncomes,
    topCategoriesBillsPrevious,
    topTransactionsBills,
    trend,
    monthlyAverages,
    budgetRows,
    subscriptions,
    pace,
    biggestSpendPatterns,
    monthlyChampions,
    weekdaySpending,
    savingsHistory,
    savingsHistoryLabeled,
    categoryAnomaly,
  };

  return { ...facts, insights: generateInsights(facts), currentRange, previousRange };
}

// Every computation inside buildWalletAnalyzerSnapshot caps its own lookback
// at 12 months back from the reference date (computeBudgetStreaks,
// findBiggestSpendPatterns, computeMonthlyChampions all use
// lookbackMonths=12; everything else uses less) - so a caller fetching
// transactions from a database (rather than an already-loaded Redux store)
// never needs more than this window, regardless of whether it's building
// the curated or the detailed summary.
export function getSnapshotLookbackStart(referenceDate: Date | string | number): Date {
  const ref = new Date(referenceDate);
  return new Date(ref.getFullYear(), ref.getMonth() - 11, 1);
}

// Trims a full buildWalletAnalyzerSnapshot() result down to what a monthly
// summary actually needs - for the AI-facing MCP tool (get_monthly_summary),
// where every extra field is tokens the user's own LLM pays for. The single
// biggest cut isn't topN (12->6) - it's dropping each budget's monthlySeries
// (up to 12 months per budget), which dwarfs everything else in the full
// snapshot. Keeping this as its own pure function (rather than inlining the
// trim in the MCP handler) means the exact same curation logic is testable
// on its own and can't drift from a second copy if anything else ever needs
// the same "cheap monthly summary" shape.
function stripMonthlySeries<T extends Record<string, unknown>>(obj: T): Omit<T, "monthlySeries"> {
  const clone = { ...obj };
  delete clone.monthlySeries;
  return clone;
}

export function buildCuratedWalletSummary(snapshot: WalletAnalyzerSnapshotData): CuratedWalletSummary {
  return {
    currentTotals: snapshot.currentTotals,
    previousTotals: snapshot.previousTotals,
    // A "budget" insight's `data` is a full budgetRows entry (see
    // generateInsights: `data: worstBudget` / `data: bestStreak`), copied
    // from the *uncurated* snapshot - so it still carries `monthlySeries`
    // even after the top-level budgetRows below gets trimmed. Strip it here
    // too, or a heavy field leaks right back in through the insight cards.
    insights: snapshot.insights.map((insight) =>
      insight.type === "budget" && (insight.data as Record<string, unknown>)?.monthlySeries
        ? { ...insight, data: stripMonthlySeries(insight.data as Record<string, unknown>) }
        : insight
    ),
    budgetRows: snapshot.budgetRows.map((row) => stripMonthlySeries(row as unknown as Record<string, unknown>)),
    topCategoriesBills: snapshot.topCategoriesBills.slice(0, 6),
    topCategoriesIncomes: snapshot.topCategoriesIncomes.slice(0, 6),
    topTransactionsBills: {
      current: snapshot.topTransactionsBills.current.slice(0, 6),
      previous: snapshot.topTransactionsBills.previous.slice(0, 6),
    },
    subscriptions: snapshot.subscriptions,
    pace: snapshot.pace,
    weekdaySpending: snapshot.weekdaySpending,
    savingsHistoryLabeled: snapshot.savingsHistoryLabeled,
    monthlyAverages: snapshot.monthlyAverages,
    categoryAnomaly: snapshot.categoryAnomaly,
  };
}

// Compares two arbitrary calendar months directly against each other - not
// necessarily adjacent, and not anchored to "now" the way the snapshot's own
// current-vs-previous comparison is (e.g. "January vs. December" from two
// years apart). Reuses the exact same per-range primitives
// buildWalletAnalyzerSnapshot itself calls (compareCategoriesAcrossMonths,
// compareTransactionsAcrossMonths) - both already take two independent
// ranges as parameters, so no new comparison math is needed here, just an
// orchestrator that doesn't assume the two ranges are consecutive.
export function buildMonthComparison({ transactions, monthADate, monthBDate, topN = 12 }: BuildMonthComparisonParams): MonthComparisonData {
  const dateA = new Date(monthADate);
  const dateB = new Date(monthBDate);
  const rangeA = getMonthRange(dateA);
  const rangeB = getMonthRange(dateB);
  const labelFor = (d: Date) => `${months[d.getMonth()]} ${d.getFullYear()}`;

  return {
    monthA: { label: labelFor(dateA), totals: getMonthTotals(transactions, rangeA.start, rangeA.end) },
    monthB: { label: labelFor(dateB), totals: getMonthTotals(transactions, rangeB.start, rangeB.end) },
    categoriesBills: compareCategoriesAcrossMonths(transactions, true, rangeA, rangeB, topN),
    categoriesIncomes: compareCategoriesAcrossMonths(transactions, false, rangeA, rangeB, topN),
    transactionsBills: compareTransactionsAcrossMonths(transactions, true, rangeA, rangeB, topN),
  };
}

// Compares every spending Budget's limit/spend between two arbitrary
// ranges (a quarter, a half, a year - not just a single month) - reuses
// buildBudgetHistoricalComparative's own per-month goal resolution (it
// already walks each budget's history[] to know what the limit WAS during
// a given past month, and applies the period-type monthly divisor) rather
// than re-deriving any of that, once per range, then merges the two
// month-series into one row per budget by summing across each range.
// A budget with no tracked months in one of the two ranges (created after
// range A ended, or archived before range B started) still gets a row -
// its data for that side is just `null` instead of being silently dropped.
// Keeps `monthlySeries` (not just the summed totals) so a click on a
// period-comparison budget row can open the same month-by-month detail
// view BudgetHistoricalDetailModal already renders for a single period -
// one per side here, via the new BudgetPeriodDetailModal.
function sumBudgetSeries(row: HistoricalComparativeBudgetRow): SumBudgetSeriesResult {
  return {
    actual: row.monthlySeries.reduce((a: number, m) => a + m.actual, 0),
    goal: row.monthlySeries.reduce((a: number, m) => a + m.goal, 0),
    monthsTracked: row.monthsTracked,
    monthsMet: row.monthsMet,
    complianceRate: row.complianceRate,
    monthlySeries: row.monthlySeries,
  };
}

export function buildBudgetPeriodChanges(
  budgets: (BudgetData | unknown)[],
  transactions: (TransactionData | WalletAnalyzerTransaction | unknown)[],
  rangeA: DateRange,
  rangeB: DateRange
): BudgetPeriodChangeRow[] {
  const rowsA: HistoricalComparativeBudgetRow[] = buildBudgetHistoricalComparative({ budgets, transactions, startDate: rangeA.start, endDate: rangeA.end });
  const rowsB: HistoricalComparativeBudgetRow[] = buildBudgetHistoricalComparative({ budgets, transactions, startDate: rangeB.start, endDate: rangeB.end });

  const byId = (rows: HistoricalComparativeBudgetRow[]) =>
    new Map<string, HistoricalComparativeBudgetRow>(rows.map((row) => [String(row.budget._id), row]));
  const mapA = byId(rowsA);
  const mapB = byId(rowsB);
  const allIds = new Set<string>([...mapA.keys(), ...mapB.keys()]);

  const results: BudgetPeriodChangeRow[] = [];
  allIds.forEach((id) => {
    const rowA = mapA.get(id);
    const rowB = mapB.get(id);
    const budget = (rowA || rowB)!.budget;
    results.push({
      budgetId: id,
      budget,
      category: budget.category?.name || budget.name || "Budget",
      periodA: rowA ? sumBudgetSeries(rowA) : null,
      periodB: rowB ? sumBudgetSeries(rowB) : null,
    });
  });
  return results;
}

// Compares two arbitrary date RANGES against each other - a quarter vs. the
// same quarter last year, this year vs. last year, any 3/6-month window vs.
// another - not just two single calendar months (see buildMonthComparison
// above for that narrower case, still used by the MCP tools).
// getMonthTotals/compareCategoriesAcrossMonths/compareTransactionsAcrossMonths
// already accept a range of any width on each side, so this is a pure
// orchestrator - no new comparison math beyond the budget merge above.
export function buildPeriodComparison({
  transactions,
  budgets,
  rangeA,
  rangeB,
  labelA,
  labelB,
  topN = 12,
}: BuildPeriodComparisonParams): PeriodComparisonData {
  return {
    periodA: { label: labelA, totals: getMonthTotals(transactions, rangeA.start, rangeA.end) },
    periodB: { label: labelB, totals: getMonthTotals(transactions, rangeB.start, rangeB.end) },
    categoriesBills: compareCategoriesAcrossMonths(transactions, true, rangeA, rangeB, topN),
    categoriesIncomes: compareCategoriesAcrossMonths(transactions, false, rangeA, rangeB, topN),
    transactionsBills: compareTransactionsAcrossMonths(transactions, true, rangeA, rangeB, topN),
    budgetChanges: buildBudgetPeriodChanges(budgets, transactions, rangeA, rangeB),
  };
}

// Arbitrary-width sibling of buildWalletAnalyzerSnapshot - the orchestrator
// behind History's standalone Wallet Analyzer (one period at a time, no
// "Compare" required). `previousRange` is auto-computed as the immediately
// preceding equal-width period, so every current-vs-previous figure below
// already has trend context without the caller needing to opt into an
// explicit comparison. Reuses every *ForRange function above for stats
// that are genuinely sensitive to the selected period's own width (trend,
// pace, weekday pattern, biggest-spend, category anomaly) - and reuses the
// EXISTING month-based functions unchanged, anchored at `range.end`, for
// stats that are inherently monthly regardless of the display width
// (budget limits, subscription billing cycles, "which calendar month
// spent the most"): generalizing those to the display period's own width
// would be answering a question nobody asked.
export function buildPeriodSnapshot({
  transactions,
  budgets,
  range,
  periodsBack,
  topN = 12,
  today = new Date(),
}: BuildPeriodSnapshotParams): PeriodSnapshotData {
  const previousRange = getPrecedingPeriods(range, 1)[0];

  // A fixed periodsBack (the original month-based Wallet Analyzer always
  // used 6) doesn't scale: 6 PRECEDING periods of the SAME width as `range`
  // means 6 months back for a 1-month range (fine, matches the original),
  // but 6 YEARS back for a full-year range - most accounts don't have 6
  // years of history, so trend/pace/anomaly would come back empty not
  // because anything's broken, but because that much history genuinely
  // doesn't exist. Scaling the default so the total lookback horizon stays
  // roughly "about a year" regardless of the selected width keeps this
  // asking for a realistic amount of history - capped at 6 (matches the
  // original monthly behavior exactly for a 1-month range) and floored at
  // 2 (need at least two points to show anything resembling a trend).
  const widthDays = getRangeWidthDays(range);
  const resolvedPeriodsBack = periodsBack ?? Math.max(2, Math.min(6, Math.round(365 / widthDays)));

  const currentTotals = getMonthTotals(transactions, range.start, range.end);
  const previousTotals = getMonthTotals(transactions, previousRange.start, previousRange.end);

  const topCategoriesBills = compareCategoriesAcrossMonths(transactions, true, range, previousRange, topN);
  const topCategoriesIncomes = compareCategoriesAcrossMonths(transactions, false, range, previousRange, topN);
  const topCategoriesBillsPrevious = rankCategoriesForRange(transactions, true, previousRange, topN);
  const topTransactionsBills = compareTransactionsAcrossMonths(transactions, true, range, previousRange, topN);

  const trend = computeTrendForRange(transactions, range, resolvedPeriodsBack);
  const monthlyAverages = computeMonthlyAverages(trend);
  // Budget streaks/subscriptions/"biggest month" are inherently monthly
  // (budget limits and billing cycles don't stretch to match a wide
  // selected range) and are anchored at range.end - but when `range` is
  // the current, still-in-progress period (e.g. "All 2026" picked while
  // today is still September), range.end is a FUTURE date. Anchoring
  // there asked these month-based functions about months that haven't
  // happened yet, which is why they came back empty even though real data
  // exists earlier in the very same range - clamping to "today" instead
  // fixes that without changing anything for a fully-closed past range.
  const monthAnchor = range.end < today ? range.end : today;
  const budgetRows = computeBudgetStreaks(budgets, transactions, monthAnchor, 12);
  const subscriptions = detectSubscriptions(transactions, monthAnchor, 3, 6);
  const pace = computeSpendingPaceForRange(transactions, range, true, resolvedPeriodsBack, today);
  const biggestSpendPatterns = findBiggestSpendPatternsForRange(transactions, range);
  // Scoped exactly to the selected range (see computeMonthlyChampionsForRange's
  // own comment) - and computed for the previous equivalent range too, so
  // "peak month"/"peak quarter" can be compared period-over-period below,
  // matching what History always needs: this section only ever analyzes
  // periods of 3+ months, never a single calendar month.
  const monthlyChampions = computeMonthlyChampionsForRange(transactions, range, today);
  const previousMonthlyChampions = computeMonthlyChampionsForRange(transactions, previousRange, today);
  const quarterTotals = computeQuarterTotals(monthlyChampions);
  const weekdaySpending = computeSpendingByWeekdayForRange(transactions, range);

  // savingsHistory[0] is the CURRENT period (matching generateInsights'
  // `facts.savingsHistory[0]` = current convention), oldest last - the
  // labeled array stays chronological (oldest first) for the trend chart.
  const savingsHistory: number[] = [];
  const savingsHistoryLabeled: WalletAnalyzerSavingsHistoryLabeled[] = [];
  const orderedPeriods = [range, ...getPrecedingPeriods(range, resolvedPeriodsBack - 1).reverse()];
  orderedPeriods.forEach((period) => {
    const rate = getMonthTotals(transactions, period.start, period.end).savingsRate;
    savingsHistory.push(rate);
    savingsHistoryLabeled.unshift({ label: formatPeriodLabel(period), rate });
  });

  // Among the top few categories, whichever deviates most (in either
  // direction) from its own trailing average is the one worth calling out.
  let categoryAnomaly: WalletAnalyzerCategoryAnomaly | null = null;
  topCategoriesBills.slice(0, 5).forEach((c) => {
    const { average, monthsOfHistory, monthlyTotals } = computeCategoryHistoryAverageForRange(transactions, c.name, true, range, resolvedPeriodsBack);
    if (average <= 0 || monthsOfHistory < 3) return;
    const changePct = ((c.current - average) / average) * 100;
    if (!categoryAnomaly || Math.abs(changePct) > Math.abs(categoryAnomaly.changePct)) {
      if (Math.abs(changePct) >= 25) {
        categoryAnomaly = { name: c.name, current: c.current, average, changePct, monthlyTotals };
      }
    }
  });

  // Insights that only make sense across a genuinely multi-month range -
  // "which month/quarter within the period spent the most", and how that
  // compares to the equivalent previous period. History's Wallet Analyzer
  // always analyzes 3+ months, so these are the period-native complement
  // to generateInsights' month-anchored ones (budget streaks, anomalies,
  // savings-rate swings) - without them, a wide range like a full year
  // came back nearly empty since most of those single-month-flavored
  // conditions rarely fire over a long span.
  const periodInsights: WalletAnalyzerInsightItem[] = [];
  const peakMonth = findPeakMonth(monthlyChampions);
  if (peakMonth && monthlyChampions.months.length > 1) {
    periodInsights.push({
      icon: "📊",
      tone: "info",
      title: `${peakMonth.label} fue el mes con más gasto del período`,
      type: "peak_month",
      data: { peakMonth },
    });

    const previousPeakMonth = findPeakMonth(previousMonthlyChampions);
    if (previousPeakMonth) {
      const samePosition = peakMonth.range.start.getMonth() === previousPeakMonth.range.start.getMonth();
      periodInsights.push({
        icon: "🔁",
        tone: "info",
        title: samePosition
          ? `${months[peakMonth.range.start.getMonth()]} también fue el mes de mayor gasto en el período anterior`
          : `El período anterior gastó más en ${previousPeakMonth.label}, este período en ${peakMonth.label}`,
        type: "peak_month_vs_previous",
        data: { current: peakMonth, previous: previousPeakMonth },
      });
    }
  }

  const peakQuarter = findPeakQuarter(quarterTotals);
  if (peakQuarter && quarterTotals.length >= 2) {
    periodInsights.push({
      icon: "🗓️",
      tone: "info",
      title: `${peakQuarter.label} concentró el mayor gasto del período`,
      type: "peak_quarter",
      data: { peakQuarter },
    });
  }

  const facts: PeriodFacts = {
    currentTotals,
    previousTotals,
    topCategoriesBills,
    topCategoriesIncomes,
    topCategoriesBillsPrevious,
    topTransactionsBills,
    trend,
    monthlyAverages,
    budgetRows,
    subscriptions,
    pace,
    biggestSpendPatterns,
    monthlyChampions,
    previousMonthlyChampions,
    quarterTotals,
    weekdaySpending,
    savingsHistory,
    savingsHistoryLabeled,
    categoryAnomaly,
  };

  return { ...facts, insights: generateInsights(facts, periodInsights, 8), currentRange: range, previousRange };
}

// The MCP tools fetch transactions fresh from the database on every call
// (not from an already-loaded Redux store), so they need to know up front
// how far back to query. buildPeriodSnapshot's own resolvedPeriodsBack caps
// at 6 (see its own comment) regardless of range width, so 6 preceding
// periods of the same width as `range` is always enough - the arbitrary-
// range sibling of getSnapshotLookbackStart, which does the same thing for
// the single-month snapshot.
export function getPeriodSnapshotLookbackStart(range: DateRange): Date {
  return getPrecedingPeriods(range, 6)[0].start;
}

// Trims a full buildPeriodSnapshot() result down to what an AI-facing MCP
// tool needs - same rationale and shape as buildCuratedWalletSummary
// (dropping each budget's monthlySeries, the heaviest field, and capping
// top-N lists), plus the period-native additions buildCuratedWalletSummary
// doesn't have: monthlyChampions is trimmed to just {label, total,
// topCategory} per month (dropping the full biggestTransaction/
// biggestSubcategory detail, which the AI can get via get_period_summary_
// detailed if it actually needs it) and quarterTotals is kept as-is since
// it's already small.
export function buildCuratedPeriodSummary(snapshot: PeriodSnapshotData): CuratedPeriodSummary {
  return {
    currentTotals: snapshot.currentTotals,
    previousTotals: snapshot.previousTotals,
    insights: snapshot.insights.map((insight) =>
      insight.type === "budget" && (insight.data as Record<string, unknown>)?.monthlySeries
        ? { ...insight, data: stripMonthlySeries(insight.data as Record<string, unknown>) }
        : insight
    ),
    budgetRows: snapshot.budgetRows.map((row) => stripMonthlySeries(row as unknown as Record<string, unknown>)),
    topCategoriesBills: snapshot.topCategoriesBills.slice(0, 6),
    topCategoriesIncomes: snapshot.topCategoriesIncomes.slice(0, 6),
    topTransactionsBills: {
      current: snapshot.topTransactionsBills.current.slice(0, 6),
      previous: snapshot.topTransactionsBills.previous.slice(0, 6),
    },
    subscriptions: snapshot.subscriptions,
    pace: snapshot.pace,
    weekdaySpending: snapshot.weekdaySpending,
    savingsHistoryLabeled: snapshot.savingsHistoryLabeled,
    monthlyAverages: snapshot.monthlyAverages,
    categoryAnomaly: snapshot.categoryAnomaly,
    monthlyChampions: {
      months: (snapshot.monthlyChampions?.months || []).map((m) => ({
        label: m.label,
        total: m.total,
        topCategory: m.biggestCategory ? { name: m.biggestCategory.name, total: m.biggestCategory.total } : null,
      })),
    },
    quarterTotals: snapshot.quarterTotals,
    currentRange: snapshot.currentRange,
    previousRange: snapshot.previousRange,
  };
}
