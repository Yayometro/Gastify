"use client";

import React, { useMemo, useState } from "react";
import { ConfigProvider, DatePicker } from "antd";
import esES from "antd/locale/es_ES";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { getCategoryTransactions, getSubcategoryTransactions } from "@/helpers/transformers/walletAnalyzer";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import UniversalCategoIcon from "../UniversalCategoIcon";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import WalletAnalyzerTrendChart from "./WalletAnalyzerTrendChart";
import WalletAnalyzerWeekdayChart from "./WalletAnalyzerWeekdayChart";
import InsightDetailModal from "./InsightDetailModal";
import WalletAnalyzerInsightsStrip from "./WalletAnalyzerInsightsStrip";
import WalletAnalyzerProjectionCard from "./WalletAnalyzerProjectionCard";
import MonthlyChampionsModal from "./MonthlyChampionsModal";
import WeekdaySpendingDetailModal from "./WeekdaySpendingDetailModal";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { WalletAnalyzerTrendItem } from "./WalletAnalyzer";
import { useT, useInfo } from "@/i18n/client";

// Typed bridge for unmigrated ModalContentTopMonthItem
interface ModalContentTopMonthItemProps {
  item: unknown;
  close: () => void;
  onBack?: (() => void) | false;
}
const TypedModalContentTopMonthItem = ModalContentTopMonthItem as React.ComponentType<ModalContentTopMonthItemProps>;

export interface ChangePillProps {
  changePct?: number | null;
  isNew?: boolean;
  unit?: string;
  invert?: boolean;
}

export interface CategoryDotProps {
  color?: string;
}

export interface RankRowItem {
  name: string;
  color?: string;
  icon?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface RankRowProps {
  index: number;
  item: RankRowItem;
  currency?: string;
  subtitle?: string;
  onClick?: () => void;
}

export interface SpendPatternsAnalysis {
  transactionIsInBiggestCategory?: boolean;
  transactionIsBiggestSubcategory?: boolean;
  subcategoryBelongsToBiggestCategory?: boolean;
  categoryShareOfTotal: number;
  transactionShareOfCategory: number;
  transactionSharesTopCategoryTag?: boolean;
  [key: string]: unknown;
}

export interface SpendPatternsCategory {
  name: string;
  color?: string;
  icon?: string;
  total: number;
  [key: string]: unknown;
}

export interface SpendPatternsSubcategory {
  name: string;
  categoryName?: string;
  total: number;
  [key: string]: unknown;
}

export interface SpendPatternsTransaction {
  _id?: string;
  name: string;
  amount: number;
  categoryName: string;
  subcategoryName?: string | null;
  date?: Date | string;
  color?: string;
  icon?: string;
  tags: string[];
  [key: string]: unknown;
}

export interface SpendPatternsTag {
  name: string;
  count: number;
  [key: string]: unknown;
}

export interface BiggestSpendPatternsData {
  biggestTransaction: SpendPatternsTransaction;
  biggestCategory: SpendPatternsCategory;
  biggestSubcategory?: SpendPatternsSubcategory | null;
  mostCommonCategoryTag?: SpendPatternsTag | null;
  analysis: SpendPatternsAnalysis;
  lookbackRange?: { start: Date; end: Date };
  monthsBack?: number;
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

export interface WalletAnalyzerCategoryBill {
  name: string;
  color?: string;
  icon?: string;
  current: number;
  previous?: number;
  changePct?: number | null;
  isNew?: boolean;
  [key: string]: unknown;
}

export interface WalletAnalyzerCategoryBillPrevious {
  name: string;
  color?: string;
  icon?: string;
  amount: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerRankTransaction {
  _id?: string;
  name: string;
  amount: number;
  categoryName: string;
  subcategoryName?: string | null;
  color?: string;
  icon?: string;
  tags?: string[] | { name?: string }[];
  date?: Date | string;
  [key: string]: unknown;
}

export interface WalletAnalyzerTopTransactions {
  current: WalletAnalyzerRankTransaction[];
  previous: WalletAnalyzerRankTransaction[];
  [key: string]: unknown;
}

export interface WalletAnalyzerMonthlyAverages {
  avgIncome: number;
  avgExpense: number;
  avgTransactionCount: number;
  // The months the averages cover (the trend: the chosen month and the ones before it).
  monthsCount?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerBudgetRow {
  budgetId: string;
  category: string;
  limit: number;
  spent: number;
  pct: number;
  status: "over" | "warning" | "ok" | string;
  streakMonths: number;
  monthlySeries?: { label: string; actual: number; goal: number; met: boolean }[];
  [key: string]: unknown;
}

export interface WalletAnalyzerSubscription {
  name: string;
  categoryName: string;
  amount: number;
  color: string;
  icon: string;
  isNew?: boolean;
  [key: string]: unknown;
}

export interface WalletAnalyzerPace {
  spentSoFar: number;
  avgPaceForSameDay: number;
  dayOfMonth: number;
  deltaPct: number | null;
  [key: string]: unknown;
}

export interface WalletAnalyzerChampionMonthItem {
  _id?: string;
  name: string;
  amount: number;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface WalletAnalyzerChampionMonthCategory {
  name: string;
  color?: string;
  icon?: string;
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
  range: { start: Date; end: Date };
  biggestTransaction?: WalletAnalyzerChampionMonthItem;
  biggestCategory?: WalletAnalyzerChampionMonthCategory;
  biggestSubcategory?: WalletAnalyzerChampionMonthSubcategory | null;
  [key: string]: unknown;
}

export interface WalletAnalyzerMonthlyChampionsData {
  months?: WalletAnalyzerMonthlyChampionEntry[];
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayDay {
  dayName: string;
  avgPerOccurrence: number;
  total: number;
  count: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayWeek {
  label: string;
  total: number;
  count: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdayDailyBreakdown {
  dayName: string;
  dayOfMonth: number;
  total: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerWeekdaySpendingData {
  days: WalletAnalyzerWeekdayDay[];
  insight: string;
  weeks?: WalletAnalyzerWeekdayWeek[];
  dailyBreakdown?: WalletAnalyzerWeekdayDailyBreakdown[];
  weekdayAvg?: number;
  weekendAvg?: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerInsightItem {
  type: string;
  data: unknown;
  icon: string;
  title: string;
  tone?: "warning" | "positive" | "info" | string;
  [key: string]: unknown;
}

export interface WalletAnalyzerSnapshotData {
  currentTotals: WalletAnalyzerTotals;
  previousTotals: WalletAnalyzerTotals;
  topCategoriesBills: WalletAnalyzerCategoryBill[];
  topCategoriesBillsPrevious: WalletAnalyzerCategoryBillPrevious[];
  topTransactionsBills: WalletAnalyzerTopTransactions;
  trend: (WalletAnalyzerTrendItem & {
    label?: string;
    shortLabel?: string;
    income?: number;
    expense?: number;
    transactionCount?: number;
    [key: string]: unknown;
  })[];
  monthlyAverages: WalletAnalyzerMonthlyAverages;
  budgetRows: WalletAnalyzerBudgetRow[];
  subscriptions: WalletAnalyzerSubscription[];
  pace: WalletAnalyzerPace;
  biggestSpendPatterns?: BiggestSpendPatternsData | null;
  monthlyChampions?: WalletAnalyzerMonthlyChampionsData | null;
  weekdaySpending: WalletAnalyzerWeekdaySpendingData;
  insights: WalletAnalyzerInsightItem[];
  currentRange: { start: Date; end: Date };
  previousRange: { start: Date; end: Date };
  [key: string]: unknown;
}

export interface FxExposureRow {
  currency: string;
  nativeAmount: number;
  valueInPrimary: number;
  changePct: number | null;
  effectiveDate?: string;
  [key: string]: unknown;
}

export interface FxExposureState {
  rows: FxExposureRow[];
  loading: boolean;
  [key: string]: unknown;
}

export interface ProjectionComparisonData {
  type?: "closed" | "in-progress" | string;
  projectedIncome: number;
  actualIncome: number;
  projectedExpense: number;
  actualExpense: number;
  [key: string]: unknown;
}

export interface WalletAnalyzerViewProps {
  referenceMonth: Date;
  referenceMonthLabel: string;
  previousMonthLabel: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectMonth?: (d: Date) => void;
  maxSelectableMonth?: Date;
  canGoNext?: boolean;
  topN?: number;
  onChangeTopN?: (n: number) => void;
  walletPrimaryCurrency: string;
  snapshot: WalletAnalyzerSnapshotData;
  fxExposure: FxExposureState;
  transactions?: TransactionData[];
  projectionComparison?: ProjectionComparisonData | null;
}

export type ChampionsModalKind = "transaction" | "category" | "subCategory" | null;

export interface ActiveInsightData {
  icon?: string;
  tone?: "warning" | "positive" | "info" | string;
  title?: string;
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}

// Expense-side change: spending more (>0) is the notable/warm direction,
// spending less is the cool/positive one - matches the approved concept.
// `invert`: for expense-side metrics (spending), up is the warm/notable
// direction (red) - for income/balance/savings-rate/FX-value, up is the
// good direction (green), so those pass invert to flip the colors.
export function ChangePill({ changePct, isNew, unit = "%", invert = false }: ChangePillProps): React.JSX.Element {
  const tr = useT();
  if (isNew) {
    return (
      <span className="text-[11px] font-bold text-purple-600 bg-gf-accent-soft-bg px-2 py-0.5 rounded-full">{tr("analyzer.badge.new")}</span>
    );
  }
  if (changePct === null || changePct === undefined) {
    return <span className="text-[11px] font-semibold text-gf-text-muted bg-gf-surface-2 px-2 py-0.5 rounded-full">—</span>;
  }
  if (Math.abs(changePct) < 1) {
    return <span className="text-[11px] font-semibold text-gf-text-muted bg-gf-surface-2 px-2 py-0.5 rounded-full">= 0{unit}</span>;
  }
  const up = changePct > 0;
  const isWarm = invert ? !up : up;
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isWarm ? "text-red-400 bg-red-500/15" : "text-green-400 bg-green-500/15"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(Math.round(changePct))}{unit}
    </span>
  );
}

export function CategoryDot({ color }: CategoryDotProps): React.JSX.Element {
  return <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

// `onClick`, when present, drives the same drill-down modal used for the
// "top elements by month" section elsewhere in the app - a category row
// opens that category's transactions, a transaction row opens itself.
export function RankRow({ index, item, currency, subtitle, onClick }: RankRowProps): React.JSX.Element {
  return (
    <div
      className={`flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 transition-colors ${
        onClick ? "cursor-pointer gf-hover-glass" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <span className="w-4 text-[11px] text-gf-text-muted font-bold shrink-0">{index + 1}</span>
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: item.color || "#ABABAB" }}
      >
        <UniversalCategoIcon type={item.icon} siz={13} colore="#fff" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-gf-text truncate">{item.name}</p>
        {subtitle && <p className="text-[10.5px] text-gf-text-muted truncate">{subtitle}</p>}
      </div>
      <span className="text-[12.5px] font-bold text-gf-text shrink-0">{formatMoneyMajor(item.amount, currency)}</span>
    </div>
  );
}

// Turns findBiggestSpendPatterns' analysis facts into plain-Spanish
// bullets - every claim here is a direct readout of a computed boolean/
// percentage, not an inference, so it stays consistent with the rest of
// Wallet Analyzer's "no AI" rule-based approach.
export function buildSpendPatternAnalysis(patterns: BiggestSpendPatternsData): string[] {
  const { biggestTransaction, biggestCategory, biggestSubcategory, mostCommonCategoryTag, analysis } = patterns;
  const bullets: string[] = [];

  bullets.push(
    analysis.transactionIsInBiggestCategory
      ? `La transacción más grande sí pertenece a la categoría con más gasto (${biggestCategory.name}).`
      : `La transacción más grande NO pertenece a la categoría con más gasto — está en ${biggestTransaction.categoryName}, mientras que la categoría con más gasto es ${biggestCategory.name}.`
  );

  bullets.push(`${biggestCategory.name} representa el ${Math.round(analysis.categoryShareOfTotal)}% de tu gasto total en este periodo.`);

  bullets.push(
    analysis.transactionShareOfCategory >= 50
      ? `Dentro de ${biggestTransaction.categoryName}, esa única transacción representa el ${Math.round(analysis.transactionShareOfCategory)}% del gasto — un gasto aislado, no un patrón recurrente.`
      : `Dentro de ${biggestTransaction.categoryName}, esa transacción es solo el ${Math.round(analysis.transactionShareOfCategory)}% del gasto — la categoría acumula gasto de forma recurrente, no por un solo evento.`
  );

  if (biggestSubcategory) {
    bullets.push(
      analysis.subcategoryBelongsToBiggestCategory
        ? `La subcategoría con más gasto (${biggestSubcategory.name}) sí pertenece a la categoría con más gasto.`
        : `La subcategoría con más gasto (${biggestSubcategory.name}) pertenece a ${biggestSubcategory.categoryName}, una categoría distinta a la de más gasto.`
    );
  }

  if (mostCommonCategoryTag) {
    bullets.push(
      `El tag más frecuente en ${biggestCategory.name} es "${mostCommonCategoryTag.name}" (${mostCommonCategoryTag.count} transacciones)` +
        (analysis.transactionSharesTopCategoryTag
          ? ` — y la transacción más grande también lo tiene.`
          : `, pero la transacción más grande no lo tiene.`)
    );
  }

  return bullets;
}

function WalletAnalyzerView({
  referenceMonth,
  referenceMonthLabel,
  previousMonthLabel,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  maxSelectableMonth,
  canGoNext,
  topN,
  onChangeTopN,
  walletPrimaryCurrency,
  snapshot,
  fxExposure,
  transactions,
  projectionComparison,
}: WalletAnalyzerViewProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const tr = useT();
  const {
    currentTotals,
    previousTotals,
    topCategoriesBills,
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
    insights,
    currentRange,
    previousRange,
  } = snapshot;

  const savingsRateChangePp = Math.round((currentTotals.savingsRate - previousTotals.savingsRate) * 100);
  const pacePct = pace.avgPaceForSameDay > 0 ? Math.min(100, (pace.spentSoFar / pace.avgPaceForSameDay) * 100) : 0;

  const transactionsById = useMemo(() => {
    const map = new Map<string | undefined, TransactionData>();
    (transactions || []).forEach((t) => map.set(t._id, t));
    return map;
  }, [transactions]);

  const { close, handleClose, renderModal, modalContent } = useModal();
  const [activeInsight, setActiveInsight] = useState<ActiveInsightData | null>(null);
  const [championsModalKind, setChampionsModalKind] = useState<ChampionsModalKind>(null);
  const [weekdayDetailOpen, setWeekdayDetailOpen] = useState<boolean>(false);

  // Only when opened FROM the monthly-champions list does the drill-down
  // get a back button - passed straight through as a callback (not state),
  // so there's no timing gap between "remember where we came from" and
  // "render the modal that needs to know it". Every other entry point
  // (Top categories/transactions rows, insight cards) just omits it.
  function handleSelectChampionMonth(monthEntry: WalletAnalyzerMonthlyChampionEntry) {
    const kind = championsModalKind;
    setChampionsModalKind(null);
    const goBack = () => setChampionsModalKind(kind);
    if (kind === "transaction") {
      if (monthEntry.biggestTransaction) {
        openTransactionModal(monthEntry.biggestTransaction, goBack);
      }
    } else if (kind === "category") {
      if (monthEntry.biggestCategory) {
        openCategoryModal(
          { name: monthEntry.biggestCategory.name, color: monthEntry.biggestCategory.color, icon: monthEntry.biggestCategory.icon, amount: monthEntry.biggestCategory.total },
          monthEntry.range,
          goBack
        );
      }
    } else if (kind === "subCategory") {
      if (monthEntry.biggestSubcategory) {
        openSubcategoryModal(monthEntry.biggestSubcategory, monthEntry.range, goBack);
      }
    }
  }

  function openTransactionModal(item: { _id?: string }, onBack?: () => void) {
    const raw = transactionsById.get(item._id);
    if (!raw) return;
    renderModal(<TypedModalContentTopMonthItem item={raw} close={handleClose} onBack={onBack && (() => { handleClose(); onBack(); })} />);
  }

  function openCategoryModal(item: { name: string; icon?: string; color?: string; amount?: number }, range: { start: Date; end: Date }, onBack?: () => void) {
    const children = getCategoryTransactions(transactions || [], item.name, true, range);
    renderModal(
      <TypedModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill: true, value: item.amount, children }}
        close={handleClose}
        onBack={onBack && (() => { handleClose(); onBack(); })}
      />
    );
  }

  function openSubcategoryModal(item: { name: string; total: number }, range: { start: Date; end: Date }, onBack?: () => void) {
    const children = getSubcategoryTransactions(transactions || [], item.name, true, range);
    // Subcategories have no icon/color of their own - borrow the parent
    // category's, read off any matching transaction (they all share it).
    const parentCategory = (children[0] as TransactionData | undefined)?.category as { icon?: string; color?: string } | undefined;
    renderModal(
      <TypedModalContentTopMonthItem
        item={{
          name: item.name,
          icon: parentCategory?.icon || "MdFilterNone",
          color: parentCategory?.color || "#ABABAB",
          isBill: true,
          value: item.total,
          children,
          filterBy: "subCategory",
        }}
        close={handleClose}
        onBack={onBack && (() => { handleClose(); onBack(); })}
      />
    );
  }

  return (
    <div className="wallet-analyzer-container w-full flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="wallet-analyzer-title text-2xl text-center font-bold text-gf-text">{tr("analyzer.title")}</h1>
        <div className="flex items-center gap-1.5 bg-gf-surface border border-gf-border rounded-full px-1.5 shadow-sm" style={{ height: 32 }}>
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label={tr("analyzer.prevMonth")}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gf-text-muted hover:bg-gf-surface-2 transition-colors"
          >
            ‹
          </button>
          {/* Clicking the label opens the same month/year picker the old
              separate control did - merged into one filter instead of two,
              the arrows stay for quick one-step navigation. */}
          {/* overflow: hidden clips the (deliberately wider, see below) invisible
              trigger back down to just this label's own footprint, so it can't
              bleed into and swallow clicks meant for the ‹ › buttons next to it -
              the trigger's un-clipped geometry still drives popup centering,
              since antd reads its full layout box, not what's visibly clipped. */}
          <div className="relative inline-flex items-center justify-center overflow-hidden" style={{ minWidth: 84, height: 32 }}>
            <span className="text-xs font-bold text-gf-text-muted px-1.5 pointer-events-none whitespace-nowrap">{referenceMonthLabel}</span>
            <ConfigProvider locale={esES} theme={{ token: { colorPrimary: "#9333ea", borderRadius: 999 } }}>
              <DatePicker
                picker="month"
                value={referenceMonth ? dayjs(referenceMonth).locale("es") : null}
                onChange={(d) => d && onSelectMonth?.(d.toDate())}
                disabledDate={(d) => Boolean(maxSelectableMonth && d.toDate() > maxSelectableMonth)}
                format="MMMM YYYY"
                allowClear={false}
                suffixIcon={null}
                // Antd anchors the calendar popup to this trigger's own
                // left edge - if the trigger were only as wide as the
                // label, the (much wider) popup would spill off to the
                // right instead of looking centered under the pill. Widen
                // the invisible trigger to roughly the popup's own width
                // and center it (via translateX) on the label instead, so
                // the popup ends up visually centered without affecting
                // the pill's own layout width (absolute positioning takes
                // it out of flow).
                style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 280, height: "100%", opacity: 0, cursor: "pointer" }}
              />
            </ConfigProvider>
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label={tr("analyzer.nextMonth")}
            disabled={!canGoNext}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gf-text-muted hover:bg-gf-surface-2 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ›
          </button>
        </div>
      </div>

      <WalletAnalyzerInsightsStrip
        insights={insights}
        walletPrimaryCurrency={walletPrimaryCurrency}
        transactions={transactions}
        currentRange={currentRange}
      />

      <WalletAnalyzerProjectionCard
        comparison={projectionComparison}
        walletPrimaryCurrency={walletPrimaryCurrency}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Month vs month */}
        <div className="md:col-span-2 gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.compare.vs", { p1: referenceMonthLabel, p2: previousMonthLabel })}</p>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.monthCompare")}</p>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-gf-text-muted">
                <th className="text-left font-bold pb-2"></th>
                <th className="text-right font-bold pb-2 text-gf-text-muted">{previousMonthLabel.split(" ")[0]}</th>
                <th className="text-right font-bold pb-2">{referenceMonthLabel.split(" ")[0]}</th>
                <th className="text-right font-bold pb-2">{tr("analyzer.change")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-gf-text-muted">{tr("analyzer.incomes")}</td>
                <td className="py-2 text-right text-gf-text-muted">{formatMoneyMajor(previousTotals.income, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text">
                  {formatMoneyMajor(currentTotals.income, walletPrimaryCurrency)}
                </td>
                <td className="py-2 text-right">
                  <ChangePill changePct={previousTotals.income > 0 ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.bills")}</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(previousTotals.expense, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">
                  {formatMoneyMajor(currentTotals.expense, walletPrimaryCurrency)}
                </td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={previousTotals.expense > 0 ? ((currentTotals.expense - previousTotals.expense) / previousTotals.expense) * 100 : null} />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.balance")}</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(previousTotals.balance, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">
                  {formatMoneyMajor(currentTotals.balance, walletPrimaryCurrency)}
                </td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={previousTotals.balance > 0 ? ((currentTotals.balance - previousTotals.balance) / previousTotals.balance) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.savingsRate")}</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{Math.round(previousTotals.savingsRate * 100)}%</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">
                  {Math.round(currentTotals.savingsRate * 100)}%
                </td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={savingsRateChangePp === 0 ? null : savingsRateChangePp} unit="pp" invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.transactions")}</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{previousTotals.transactionCount}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{currentTotals.transactionCount}</td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill
                    changePct={
                      previousTotals.transactionCount > 0
                        ? ((currentTotals.transactionCount - previousTotals.transactionCount) / previousTotals.transactionCount) * 100
                        : null
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Trend */}
        <div className="md:col-span-3 gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.trend6")}</p><InfoTip info={APP_INFO.tendencia_2} /></div>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.trend6.help")}</p>
          <div
            onClick={() =>
              setActiveInsight({
                icon: "📅",
                tone: "info",
                title: tr("analyzer.monthlyAvg"),
                type: "monthly_average",
                data: { avgIncome: monthlyAverages.avgIncome, avgExpense: monthlyAverages.avgExpense, avgTransactionCount: monthlyAverages.avgTransactionCount, trend },
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                setActiveInsight({
                  icon: "📅",
                  tone: "info",
                  title: tr("analyzer.monthlyAvg"),
                  type: "monthly_average",
                  data: { avgIncome: monthlyAverages.avgIncome, avgExpense: monthlyAverages.avgExpense, avgTransactionCount: monthlyAverages.avgTransactionCount, trend },
                });
              }
            }}
            className="grid grid-cols-3 gap-3 mb-4 cursor-pointer group"
          >
            <div className="rounded-xl bg-green-500/15 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <div className="flex items-center gap-1"><p className="text-[11px] font-bold uppercase tracking-wide text-green-400/70">{tr("analyzer.monthlyAvg.incomes")}</p><InfoTip info={APP_INFO.promedio_mensual_2(monthlyAverages.monthsCount ?? 6)} /></div>
              <p className="text-lg font-extrabold text-green-400">{formatMoneyMajor(monthlyAverages.avgIncome, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-red-500/15 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-400/70">{tr("analyzer.monthlyAvg.bills")}</p>
              <p className="text-lg font-extrabold text-red-400">{formatMoneyMajor(monthlyAverages.avgExpense, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-gf-accent-soft-bg px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-purple-300/70">{tr("analyzer.monthlyAvg.transactions")}</p>
              <p className="text-lg font-extrabold text-purple-300">{Math.round(monthlyAverages.avgTransactionCount)}</p>
            </div>
          </div>
          <WalletAnalyzerTrendChart
            trend={trend}
            walletPrimaryCurrency={walletPrimaryCurrency}
            onSelectMonth={(month: unknown) =>
              setActiveInsight({ icon: "📅", tone: "info", title: (month as { label?: string })?.label, type: "trend_month", data: month })
            }
          />
        </div>
      </div>

      {/* Item-count control - governs both Top categories and Top transactions below */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-1.5"><p className="text-xs font-semibold text-gf-text-muted">{tr("analyzer.topItems")}</p><InfoTip info={APP_INFO.analyzer(topN)} /></div>
        <div className="flex items-center gap-1 bg-gf-surface border border-gf-border rounded-full p-1 shadow-sm">
          {[3, 6, 12, 24].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChangeTopN?.(n)}
              className={`w-7 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                topN === n ? "bg-purple-600 text-white" : "text-gf-text-muted hover:bg-gf-surface-2"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Top categories - previous month left, current month right, mirroring top transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topCategories", { p1: topN })}</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{previousMonthLabel}</p>
          {topCategoriesBillsPrevious.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noBillsLastMonth")}</p>
          ) : (
            topCategoriesBillsPrevious.map((c, i) => (
              <RankRow
                key={c.name}
                index={i}
                item={c}
                currency={walletPrimaryCurrency}
                onClick={() => openCategoryModal(c, previousRange)}
              />
            ))
          )}
        </div>
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topCategories", { p1: topN })}</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{referenceMonthLabel}</p>
          {topCategoriesBills.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noBillsThisMonth")}</p>
          ) : (
            topCategoriesBills.map((c, i) => (
              <RankRow
                key={c.name}
                index={i}
                item={{ name: c.name, color: c.color, icon: c.icon, amount: c.current }}
                currency={walletPrimaryCurrency}
                onClick={() => openCategoryModal({ name: c.name, color: c.color, icon: c.icon, amount: c.current }, currentRange)}
              />
            ))
          )}
        </div>
      </div>

      {/* Top transactions - previous month left, current month right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topTransactions", { p1: topN })}</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{previousMonthLabel}</p>
          {topTransactionsBills.previous.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noTxLastMonth")}</p>
          ) : (
            topTransactionsBills.previous.map((t, i) => (
              <RankRow
                key={`${t.name}-${i}`}
                index={i}
                item={t}
                currency={walletPrimaryCurrency}
                subtitle={`${t.categoryName}${t.subcategoryName ? ` · ${t.subcategoryName}` : ""}`}
                onClick={() => openTransactionModal(t)}
              />
            ))
          )}
        </div>
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topTransactions", { p1: topN })}</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{referenceMonthLabel}</p>
          {topTransactionsBills.current.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noTxThisMonth")}</p>
          ) : (
            topTransactionsBills.current.map((t, i) => (
              <RankRow
                key={`${t.name}-${i}`}
                index={i}
                item={t}
                currency={walletPrimaryCurrency}
                subtitle={`${t.categoryName}${t.subcategoryName ? ` · ${t.subcategoryName}` : ""}`}
                onClick={() => openTransactionModal(t)}
              />
            ))
          )}
        </div>
      </div>

      {/* Budgets */}
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
        <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.budgets.title")}</p><InfoTip info={APP_INFO.presupuestos_del_analizador} /></div>
        <div className="flex items-start gap-1.5 mb-3"><p className="text-xs text-gf-text-muted">{tr("analyzer.budgetsMonth.help")}</p><InfoTip info={APP_INFO.cumplimiento_del_presupuesto} className="mt-px" /></div>
        {budgetRows.length === 0 ? (
          <p className="text-xs text-gf-text-muted">{tr("analyzer.budgets.none")}</p>
        ) : (
          <div className="flex flex-col">
            {budgetRows.map((b) => {
              const ratio = b.limit > 0 ? b.spent / b.limit : 0;
              return (
                <div
                  key={b.budgetId}
                  onClick={() =>
                    setActiveInsight({
                      icon: b.status === "over" ? "⚠️" : "📊",
                      tone: "info",
                      title: `${b.category} — cumplimiento`,
                      type: "budget",
                      data: b,
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveInsight({ icon: "📊", tone: "info", title: `${b.category} — cumplimiento`, type: "budget", data: b });
                    }
                  }}
                  className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
                >
                  <span className="w-24 shrink-0 text-[12.5px] font-semibold text-gf-text truncate">{b.category}</span>
                  <span className="w-40 shrink-0 text-[11px] text-gf-text-muted">
                    {formatMoneyMajor(b.spent, walletPrimaryCurrency)} / {formatMoneyMajor(b.limit, walletPrimaryCurrency)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gf-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, ratio * 100)}%`, backgroundColor: getBudgetBarColor(ratio, false) }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      b.status === "over" ? "text-red-400 bg-red-500/15" : b.status === "warning" ? "text-amber-400 bg-amber-500/15" : "text-green-400 bg-green-500/15"
                    }`}
                  >
                    {b.streakMonths >= 2 ? `${b.streakMonths} meses ✅` : `${Math.round(b.pct)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Biggest spend patterns */}
      {biggestSpendPatterns && (
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.big.lastMonths", { p1: biggestSpendPatterns.monthsBack })}</p><InfoTip info={APP_INFO.grandes_gastos_2} /></div>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.big.help2")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div
              onClick={() => setChampionsModalKind("transaction")}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") setChampionsModalKind("transaction");
              }}
              className="rounded-xl border border-gf-border p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">{tr("analyzer.big.transaction")}</p>
              <p className="text-[13px] font-bold text-gf-text truncate mt-1">{biggestSpendPatterns.biggestTransaction.name}</p>
              <p className="text-lg font-extrabold text-gf-text">{formatMoneyMajor(biggestSpendPatterns.biggestTransaction.amount, walletPrimaryCurrency)}</p>
              <p className="text-[11px] text-gf-text-muted truncate">
                {biggestSpendPatterns.biggestTransaction.categoryName}
                {biggestSpendPatterns.biggestTransaction.subcategoryName ? ` · ${biggestSpendPatterns.biggestTransaction.subcategoryName}` : ""}
              </p>
              {biggestSpendPatterns.biggestTransaction.tags.length > 0 && (
                <p className="text-[10.5px] text-purple-500 truncate mt-0.5">#{biggestSpendPatterns.biggestTransaction.tags.join(" #")}</p>
              )}
            </div>

            <div
              onClick={() => setChampionsModalKind("category")}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") setChampionsModalKind("category");
              }}
              className="rounded-xl border border-gf-border p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">{tr("analyzer.big.category")}</p>
              <p className="text-[13px] font-bold text-gf-text truncate mt-1">{biggestSpendPatterns.biggestCategory.name}</p>
              <p className="text-lg font-extrabold text-gf-text">{formatMoneyMajor(biggestSpendPatterns.biggestCategory.total, walletPrimaryCurrency)}</p>
              <p className="text-[11px] text-gf-text-muted">{tr("analyzer.big.percentOfTotal", { p1: Math.round(biggestSpendPatterns.analysis.categoryShareOfTotal) })}</p>
            </div>

            {biggestSpendPatterns.biggestSubcategory && (
              <div
                onClick={() => setChampionsModalKind("subCategory")}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") setChampionsModalKind("subCategory");
                }}
                className="rounded-xl border border-gf-border p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
              >
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">{tr("analyzer.big.subcategory")}</p>
                <p className="text-[13px] font-bold text-gf-text truncate mt-1">{biggestSpendPatterns.biggestSubcategory.name}</p>
                <p className="text-lg font-extrabold text-gf-text">{formatMoneyMajor(biggestSpendPatterns.biggestSubcategory.total, walletPrimaryCurrency)}</p>
                <p className="text-[11px] text-gf-text-muted">{biggestSpendPatterns.biggestSubcategory.categoryName}</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gf-text-muted -mt-2 mb-2">{tr("analyzer.tapCard")}</p>

          <div className="rounded-xl bg-gf-accent-soft-bg p-3.5">
            <div className="mb-1.5 flex items-center gap-1"><p className="text-[11px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.analysis")}</p><InfoTip info={APP_INFO.de_d_nde_sale_este_an_lisis} /></div>
            <ul className="list-disc pl-4 space-y-1 text-[12.5px] text-gf-text-muted leading-relaxed">
              {buildSpendPatternAnalysis(biggestSpendPatterns).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscriptions */}
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.subscriptions")}</p><InfoTip info={APP_INFO.suscripciones_recurrentes} /></div>
          <div className="flex items-start gap-1.5 mb-3"><p className="text-xs text-gf-text-muted">{tr("analyzer.subscriptions.help")}</p><InfoTip info={APP_INFO.pagos_recurrentes} className="mt-px" /></div>
          {subscriptions.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.subscriptions.none")}</p>
          ) : (
            <div className="flex flex-col">
              {subscriptions.map((s) => (
                <div
                  key={s.name}
                  onClick={() =>
                    setActiveInsight({ icon: "🔁", tone: "info", title: s.name, type: "subscription", data: s })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveInsight({ icon: "🔁", tone: "info", title: s.name, type: "subscription", data: s });
                    }
                  }}
                  className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    <UniversalCategoIcon type={s.icon} siz={13} colore="#fff" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gf-text truncate">{s.name}</p>
                    <p className="text-[10.5px] text-gf-text-muted">{s.categoryName}</p>
                  </div>
                  {s.isNew && <span className="text-[10px] font-bold text-purple-600 bg-gf-accent-soft-bg px-2 py-0.5 rounded-full">{tr("analyzer.badge.new")}</span>}
                  <span className="text-[12.5px] font-bold text-gf-text shrink-0">
                    {formatMoneyMajor(s.amount, walletPrimaryCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FX exposure */}
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.fx.title")}</p><InfoTip info={APP_INFO.exposici_n_multimoneda} /></div>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.fx.help")}</p>
          {fxExposure.loading ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.fx.loading")}</p>
          ) : fxExposure.rows.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.fx.allSame", { p1: walletPrimaryCurrency })}</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-wide text-gf-text-muted">
                  <th className="text-left font-bold pb-2">{tr("analyzer.fx.currency")}</th>
                  <th className="text-right font-bold pb-2">{tr("analyzer.fx.balance")}</th>
                  <th className="text-right font-bold pb-2">{tr("analyzer.fx.inCurrency", { p1: walletPrimaryCurrency })}</th>
                  <th className="text-right font-bold pb-2">{tr("analyzer.vsLabel", { p1: previousMonthLabel.split(" ")[0] })}</th>
                </tr>
              </thead>
              <tbody>
                {fxExposure.rows.map((r) => (
                  <tr key={r.currency} className="border-t border-gf-border">
                    <td className="py-2 font-semibold text-gf-text">{r.currency}</td>
                    <td className="py-2 text-right text-gf-text-muted">{formatMoneyMajor(r.nativeAmount, r.currency)}</td>
                    <td className="py-2 text-right font-semibold text-gf-text">
                      {formatMoneyMajor(r.valueInPrimary, walletPrimaryCurrency)}
                    </td>
                    <td className="py-2 text-right">
                      <ChangePill changePct={r.changePct} invert />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pace */}
      <div
        onClick={() => setActiveInsight({ icon: "🏃", tone: "info", title: tr("analyzer.pace.title"), type: "spending_pace", data: pace })}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            setActiveInsight({ icon: "🏃", tone: "info", title: tr("analyzer.pace.title"), type: "spending_pace", data: pace });
          }
        }}
        className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.pace.title")}</p><InfoTip info={APP_INFO.ritmo_de_gasto} /></div>
          <span className="text-[11px] font-semibold text-purple-600">{tr("analyzer.seeDetail")}</span>
        </div>
        <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.pace.monthHelp")}</p>
        <div className="h-2.5 rounded-full bg-gf-surface-2 overflow-hidden">
          <div className="h-full rounded-full bg-purple-500" style={{ width: `${pacePct}%` }} />
        </div>
        <p className="text-xs text-gf-text-muted mt-2">
          {tr("analyzer.pace.spent")} {formatMoneyMajor(pace.spentSoFar, walletPrimaryCurrency)} {tr("analyzer.pace.today")} {pace.dayOfMonth}
          {pace.deltaPct !== null && (
            <>
              {tr("analyzer.pace.monthVsAverage", { p1: pace.deltaPct > 0 ? "más" : "menos", p2: formatMoneyMajor(pace.avgPaceForSameDay, walletPrimaryCurrency), p3: Math.abs(Math.round(pace.deltaPct)) })}
            </>
          )}
        </p>
      </div>

      {/* Weekday spending pattern */}
      <div
        onClick={() => setWeekdayDetailOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") setWeekdayDetailOpen(true);
        }}
        className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.weekday.title")}</p><InfoTip info={APP_INFO.patr_n_semanal} /></div>
  <span className="text-[11px] font-semibold text-purple-600">{tr("analyzer.seeDetail")}</span>
        </div>
        <div className="flex items-start gap-1.5 mb-3"><p className="text-xs text-gf-text-muted">{tr("analyzer.dailyAvgThisMonth")}</p><InfoTip info={APP_INFO.c_mo_se_calcula} className="mt-px" /></div>
        <WalletAnalyzerWeekdayChart days={weekdaySpending.days} walletPrimaryCurrency={walletPrimaryCurrency} />
        <p className="text-xs text-gf-text-muted mt-3">{weekdaySpending.insight}</p>
      </div>

      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
      <InsightDetailModal insight={activeInsight} onClose={() => setActiveInsight(null)} walletPrimaryCurrency={walletPrimaryCurrency} />
      <MonthlyChampionsModal
        kind={championsModalKind}
        months={monthlyChampions?.months}
        onClose={() => setChampionsModalKind(null)}
        onSelectMonth={handleSelectChampionMonth}
        walletPrimaryCurrency={walletPrimaryCurrency}
      />
      <WeekdaySpendingDetailModal
        open={weekdayDetailOpen}
        onClose={() => setWeekdayDetailOpen(false)}
        weekdaySpending={weekdaySpending}
        walletPrimaryCurrency={walletPrimaryCurrency}
      />
    </div>
  );
}

export default WalletAnalyzerView;
