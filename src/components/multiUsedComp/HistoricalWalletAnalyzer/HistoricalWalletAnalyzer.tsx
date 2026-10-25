"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import fetcher from "@/helpers/fetcher";
import useGetUserSession from "@/hooks/useGetUserSession";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { getPeriodLabel } from "@gastify/core/time/timeFunctions";
import { useAccountsFxExposure } from "@/helpers/hooks/useAccountsFxExposure";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import UniversalCategoIcon from "../UniversalCategoIcon";
import PeriodFiltersWithCompare from "../periodFiltersWithCompare/PeriodFiltersWithCompare";
import {
  buildPeriodSnapshot,
  buildPeriodComparison,
  getCategoryTransactions,
  getSubcategoryTransactions,
  type DateRange,
  type BudgetPeriodChangeRow,
  type WalletAnalyzerCategoryBill,
  type WalletAnalyzerMonthlyChampionEntry,
  type WalletAnalyzerWeekdaySpendingData,
  type PopulatedCategory,
} from "@/helpers/transformers/walletAnalyzer";
import {
  ChangePill,
  RankRow,
  buildSpendPatternAnalysis,
  type ChampionsModalKind,
} from "../walletAnalyzer/WalletAnalyzerView";
import WalletAnalyzerInsightsStrip from "../walletAnalyzer/WalletAnalyzerInsightsStrip";
import WalletAnalyzerTrendChart, { type WalletAnalyzerTrendChartItem } from "../walletAnalyzer/WalletAnalyzerTrendChart";
import WalletAnalyzerWeekdayChart from "../walletAnalyzer/WalletAnalyzerWeekdayChart";
import InsightDetailModal, { type InsightDetailItem } from "../walletAnalyzer/InsightDetailModal";
import MonthlyChampionsModal from "../walletAnalyzer/MonthlyChampionsModal";
import WeekdaySpendingDetailModal from "../walletAnalyzer/WeekdaySpendingDetailModal";
import BudgetPeriodDetailModal from "./BudgetPeriodDetailModal";
import type { RootState } from "@/lib/store";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { AccountData } from "@/lib/features/accountsSlice";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { useT, useInfo, useWalletText } from "@/i18n/client";

// Typed bridge for unmigrated ModalContentTopMonthItem

// Typed bridge for unmigrated BudgetPeriodDetailModal
interface BudgetPeriodDetailModalProps {
  row: BudgetPeriodChangeRow;
  labelA: string;
  labelB: string;
  walletPrimaryCurrency: string;
  close: () => void;
}
const TypedBudgetPeriodDetailModal = BudgetPeriodDetailModal as React.ComponentType<BudgetPeriodDetailModalProps>;

export interface PeriodStateProps {
  timePeriod?: [Date, Date] | Date[];
  setTimePeriod?: (dates: [Date, Date] | Date[]) => void;
  comparePeriod?: [Date, Date] | Date[];
  setComparePeriod?: (dates: [Date, Date] | Date[]) => void;
  compareEnabled?: boolean;
  setCompareEnabled?: (enabled: boolean) => void;
  timePeriodsForSelecter?: Array<{ value: string; name: string; [key: string]: unknown }>;
  timePeriodsForCompareSelecter?: Array<{ value: string; name: string; [key: string]: unknown }>;
  periodFromFather?: { value: string; name: string; [key: string]: unknown };
  getValueFromSelecter?: (v: string) => void;
  handleRangeDate?: (start: Date, end: Date) => void;
  getCompareValueFromSelecter?: (v: string) => void;
  handleCompareRangeDate?: (start: Date, end: Date) => void;
  labelA: string;
  labelB?: string;
  rangePickerResponse?: unknown;
  extraControls?: React.ReactNode;
  [key: string]: unknown;
}

// Typed bridge for unmigrated PeriodFiltersWithCompare
const TypedPeriodFiltersWithCompare = PeriodFiltersWithCompare as React.ComponentType<PeriodStateProps>;

// Short "DD/MM/YYYY" for the small parenthetical dates next to a friendlier
// period phrase (e.g. "Últimos 3 meses (01/07/2026 - 09/09/2026)").
function formatShortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export interface CategoryCompareRowProps {
  index: number;
  item: WalletAnalyzerCategoryBill;
  currency: string;
  onClick?: () => void;
}

// The period-vs-period compare table's row for a single category -
// buildPeriodComparison's categoriesBills/categoriesIncomes are ALREADY a
// joined list (ranked by periodA's spend, periodB's value alongside), so
// this is one row, not two side-by-side ones. A CSS grid (fixed column
// template) instead of ad hoc flex gaps keeps every row's icon/amount/pill
// columns aligned regardless of name length - and the icon is the same
// filled circle + UniversalCategoIcon RankRow uses (was a tiny bare dot
// before, inconsistent with every other icon on this page).
function CategoryCompareRow({ index, item, currency, onClick }: CategoryCompareRowProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className="grid grid-cols-[16px_28px_1fr_auto_auto_56px] items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
    >
      <span className="text-[11px] text-gf-text-muted font-bold">{index + 1}</span>
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: item.color || "#ABABAB" }}
      >
        <UniversalCategoIcon type={item.icon} siz={13} colore="#fff" />
      </span>
      <p className="min-w-0 text-[12.5px] font-semibold text-gf-text truncate">{item.name}</p>
      <span className="text-[11px] text-gf-text-muted text-right">{formatMoneyMajor(item.previous, currency)}</span>
      <span className="text-[12.5px] font-bold text-gf-text text-right">{formatMoneyMajor(item.current, currency)}</span>
      <span className="justify-self-end">
        <ChangePill changePct={item.changePct} isNew={item.isNew} />
      </span>
    </div>
  );
}

export interface HistoricalWalletAnalyzerProps {
  periodState: PeriodStateProps;
}

// History's Wallet Analyzer - the arbitrary-period sibling of the
// Dashboard's own single-month one. Always renders the full single-period
// analysis (buildPeriodSnapshot, auto-comparing against the immediately
// preceding equivalent period) for whichever ONE period is selected via the
// shared usePeriodComparison state - "Compare" is an additional overlay
// (buildPeriodComparison, period-vs-period), not a requirement. Reuses
// every Dashboard Wallet Analyzer sub-component
// (WalletAnalyzerInsightsStrip/TrendChart/WeekdayChart, InsightDetailModal,
// MonthlyChampionsModal, WeekdaySpendingDetailModal, ChangePill/RankRow/
// buildSpendPatternAnalysis) so both Wallet Analyzers speak the exact same
// visual language without a second copy of any of them.
function HistoricalWalletAnalyzer({ periodState }: HistoricalWalletAnalyzerProps): React.JSX.Element {
  const text = useWalletText();
  const { APP_INFO } = useInfo();
  const tr = useT();
  const { timePeriod, comparePeriod, compareEnabled, labelA, labelB, timePeriodsForSelecter } = periodState;
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [topN, setTopN] = useState<number>(6);
  const { email } = useGetUserSession();
  const { accounts } = useGetDataFromProvider() as { accounts?: AccountData[] };
  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);
  const walletPrimaryCurrency =
    (useSelector((state: RootState) => state.walletReducer?.data?.primaryCurrency) as string | undefined) || "MXN";
  const { close, modalContent, renderModal, handleClose } = useModal();
  const fxExposure = useAccountsFxExposure(accounts, walletPrimaryCurrency, timePeriod?.[1]);

  const [activeInsight, setActiveInsight] = useState<InsightDetailItem | null>(null);
  const [championsModalKind, setChampionsModalKind] = useState<ChampionsModalKind>(null);
  const [weekdayDetailOpen, setWeekdayDetailOpen] = useState<boolean>(false);

  // Same dedicated route HistoricalBudgetsComparative uses - includes
  // archived budgets, since an archived budget's past months still belong
  // to whichever period they fall into.
  useEffect(() => {
    if (!email) return;
    const toFetch = fetcher();
    toFetch
      .post("general-data/budget/get-historical", email)
      .then((res: unknown) => {
        const budgetRes = res as { ok?: boolean; data?: BudgetData[] } | undefined;
        if (budgetRes?.ok) setBudgets(budgetRes.data || []);
      })
      .catch(() => {});
  }, [email]);

  const transactions: TransactionData[] = useMemo(() => ccTransacciones.data || [], [ccTransacciones.data]);
  const transactionsById = useMemo(() => {
    const map = new Map<string, TransactionData>();
    transactions.forEach((t) => {
      if (t._id) map.set(t._id, t);
    });
    return map;
  }, [transactions]);

  const range: DateRange | null = useMemo(
    () => (timePeriod?.[0] && timePeriod?.[1] ? { start: timePeriod[0], end: timePeriod[1] } : null),
    [timePeriod]
  );

  const snapshot = useMemo(() => {
    if (!range || transactions.length < 1) return null;
    return buildPeriodSnapshot({ text, transactions, budgets, range, topN });
  }, [range, transactions, budgets, topN, text]);

  const comparison = useMemo(() => {
    if (!compareEnabled) return null;
    if (!range || !comparePeriod?.[0] || !comparePeriod?.[1]) return null;
    if (transactions.length < 1) return null;
    const rangeB = { start: comparePeriod[0], end: comparePeriod[1] };
    return buildPeriodComparison({ text, transactions, budgets, rangeA: range, rangeB, labelA, labelB: labelB || "", topN });
  }, [compareEnabled, range, comparePeriod, transactions, budgets, labelA, labelB, topN, text]);

  function openCategoryModal(
    item: { name: string; icon?: string; color?: string; current?: number; amount?: number },
    isBill: boolean,
    forRange?: DateRange
  ) {
    const children = getCategoryTransactions(text, transactions, item.name, isBill, forRange);
    renderModal(
      <ModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill, value: item.current ?? item.amount, children }}
        close={handleClose}
      />
    );
  }

  function openSubcategoryModal(item: { name: string; total?: number; [key: string]: unknown }, forRange?: DateRange) {
    const children = getSubcategoryTransactions(transactions, item.name, true, forRange);
    const parentCategory = children[0]?.category as PopulatedCategory | undefined;
    renderModal(
      <ModalContentTopMonthItem
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
      />
    );
  }

  function openTransactionModal(item: { _id?: string; [key: string]: unknown }) {
    const raw = item._id ? transactionsById.get(item._id) : undefined;
    if (!raw) return;
    renderModal(<ModalContentTopMonthItem item={raw} close={handleClose} />);
  }

  // Routed through the same renderModal()/BasicModal mechanism as the
  // drill-down modals above (not a bare conditional render) - BasicModal is
  // what actually provides the fixed, viewport-centered overlay positioning;
  // rendering BudgetPeriodDetailModal on its own left it positioned
  // relative to the document instead (no positioned ancestor), placing it
  // thousands of pixels off-screen on this long page.
  function openBudgetPeriodModal(row: BudgetPeriodChangeRow) {
    renderModal(
      <TypedBudgetPeriodDetailModal
        row={row}
        labelA={labelA}
        labelB={labelB || ""}
        walletPrimaryCurrency={walletPrimaryCurrency}
        close={handleClose}
      />
    );
  }

  const periodFilters = (
    <div className="flex flex-col items-center gap-1">
      <h2 className="text-2xl text-center font-bold text-gf-text">{tr("analyzer.title")}</h2>
      <TypedPeriodFiltersWithCompare {...periodState} />
    </div>
  );

  if (!snapshot) {
    return (
      <div className="w-full flex flex-col gap-4">
        {periodFilters}
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 text-center">
          <p className="text-xs text-gf-text-muted">{tr("analyzer.loading")}</p>
        </div>
      </div>
    );
  }

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

  const previousPeriodLabel = getPeriodLabel(
    (timePeriodsForSelecter as { value: string; name: string }[]) || [],
    [previousRange.start, previousRange.end]
  );
  const savingsRateChangePp = Math.round((currentTotals.savingsRate - previousTotals.savingsRate) * 100);
  const pacePct = pace.avgPaceForSameDay > 0 ? Math.min(100, (pace.spentSoFar / pace.avgPaceForSameDay) * 100) : 0;

  function handleSelectChampionMonth(monthEntry: WalletAnalyzerMonthlyChampionEntry) {
    const kind = championsModalKind;
    setChampionsModalKind(null);
    const goBack = () => setChampionsModalKind(kind);
    if (kind === "transaction") {
      const raw = monthEntry.biggestTransaction?._id
        ? transactionsById.get(monthEntry.biggestTransaction._id)
        : undefined;
      if (raw) {
        renderModal(
          <ModalContentTopMonthItem
            item={raw}
            close={handleClose}
            onBack={() => {
              handleClose();
              goBack();
            }}
          />
        );
      }
    } else if (kind === "category") {
      if (monthEntry.biggestCategory) {
        openCategoryModal(
          {
            name: monthEntry.biggestCategory.name,
            color: monthEntry.biggestCategory.color,
            icon: monthEntry.biggestCategory.icon,
            current: monthEntry.biggestCategory.total,
          },
          true,
          monthEntry.range
        );
      }
    } else if (kind === "subCategory") {
      if (monthEntry.biggestSubcategory) {
        openSubcategoryModal(monthEntry.biggestSubcategory, monthEntry.range);
      }
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {periodFilters}

      <WalletAnalyzerInsightsStrip
        insights={insights}
        walletPrimaryCurrency={walletPrimaryCurrency}
        transactions={transactions}
        currentRange={currentRange}
        title={tr("analyzer.highlights")}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Period vs. auto-previous-equivalent-period */}
        <div className="md:col-span-2 gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-gf-text">
            {labelA} <span className="text-[11px] font-normal text-gf-text-muted">({formatShortDate(currentRange.start)} - {formatShortDate(currentRange.end)})</span>
            {" "}{tr("analyzer.vsPrevious")}{" "}
            <InfoTip info={APP_INFO.vs_el_mes_anterior_2} />
            <span className="text-[11px] font-normal text-gf-text-muted">({formatShortDate(previousRange.start)} - {formatShortDate(previousRange.end)})</span>
          </p>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.previousHelp")}</p>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-gf-text-muted">
                <th className="text-left font-bold pb-2"><InfoTip info={APP_INFO.totales} /></th>
                <th className="text-right font-bold pb-2 text-gf-text-muted">{tr("analyzer.previous")}</th>
                <th className="text-right font-bold pb-2">{labelA}</th>
                <th className="text-right font-bold pb-2">{tr("analyzer.change")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-gf-text-muted">{tr("analyzer.incomes")}</td>
                <td className="py-2 text-right text-gf-text-muted">{formatMoneyMajor(previousTotals.income, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text">{formatMoneyMajor(currentTotals.income, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right">
                  <ChangePill changePct={previousTotals.income > 0 ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.bills")}</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(previousTotals.expense, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{formatMoneyMajor(currentTotals.expense, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={previousTotals.expense > 0 ? ((currentTotals.expense - previousTotals.expense) / previousTotals.expense) * 100 : null} />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.balance")} <InfoTip info={APP_INFO.resumen_2} /></td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(previousTotals.balance, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{formatMoneyMajor(currentTotals.balance, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={previousTotals.balance > 0 ? ((currentTotals.balance - previousTotals.balance) / previousTotals.balance) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">{tr("analyzer.savingsRate")} <InfoTip info={APP_INFO.datos_del_periodo} /></td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{Math.round(previousTotals.savingsRate * 100)}%</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{Math.round(currentTotals.savingsRate * 100)}%</td>
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
          <span className="inline-flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.trend")}</p><InfoTip info={APP_INFO.tendencia} /></span>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.trend.vsPrevious")}</p>
          <div
            onClick={() =>
              setActiveInsight({
                icon: "📅",
                tone: "info",
                title: tr("analyzer.avgPerPeriod"),
                type: "monthly_average",
                data: { avgIncome: monthlyAverages.avgIncome, avgExpense: monthlyAverages.avgExpense, avgTransactionCount: monthlyAverages.avgTransactionCount, trend },
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setActiveInsight({
                  icon: "📅",
                  tone: "info",
                  title: tr("analyzer.avgPerPeriod"),
                  type: "monthly_average",
                  data: { avgIncome: monthlyAverages.avgIncome, avgExpense: monthlyAverages.avgExpense, avgTransactionCount: monthlyAverages.avgTransactionCount, trend },
                });
              }
            }}
            className="grid grid-cols-3 gap-3 mb-4 cursor-pointer group"
          >
            <div className="rounded-xl bg-green-500/15 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <div className="flex items-center gap-1"><p className="text-[11px] font-bold uppercase tracking-wide text-green-400/70">{tr("analyzer.avg.incomes")}</p><InfoTip info={APP_INFO.promedio_mensual(monthlyAverages.monthsCount ?? 6)} /></div>
              <p className="text-lg font-extrabold text-green-400">{formatMoneyMajor(monthlyAverages.avgIncome, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-red-500/15 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-400/70">{tr("analyzer.avg.bills")}</p>
              <p className="text-lg font-extrabold text-red-400">{formatMoneyMajor(monthlyAverages.avgExpense, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-gf-accent-soft-bg px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-purple-300/70">{tr("analyzer.avg.transactions")}</p>
              <p className="text-lg font-extrabold text-purple-300">{Math.round(monthlyAverages.avgTransactionCount)}</p>
            </div>
          </div>
          <WalletAnalyzerTrendChart
            trend={trend}
            walletPrimaryCurrency={walletPrimaryCurrency}
            onSelectMonth={(month: WalletAnalyzerTrendChartItem) => setActiveInsight({ icon: "📅", tone: "info", title: month.label, type: "trend_month", data: month })}
          />
        </div>
      </div>

      {/* Item-count control */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <p className="text-xs font-semibold text-gf-text-muted">{tr("analyzer.topItems")}</p>
        <div className="flex items-center gap-1 bg-gf-surface border border-gf-border rounded-full p-1 shadow-sm">
          {[3, 6, 12, 24].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTopN(n)}
              className={`w-7 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                topN === n ? "bg-purple-600 text-white" : "text-gf-text-muted hover:bg-gf-surface-2"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Top categories - previous equivalent period left, current right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <div className="flex items-center gap-1.5"><p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topCategories", { p1: topN })}</p><InfoTip info={APP_INFO.analyzer(topN)} /></div>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{previousPeriodLabel}</p>
          {topCategoriesBillsPrevious.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noBillsPrevious")}</p>
          ) : (
            topCategoriesBillsPrevious.map((c, i) => (
              <RankRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, true, previousRange)} />
            ))
          )}
        </div>
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topCategories", { p1: topN })}</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelA}</p>
          {topCategoriesBills.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noBills")}</p>
          ) : (
            topCategoriesBills.map((c, i) => (
              <RankRow
                key={c.name}
                index={i}
                item={{ name: c.name, color: c.color, icon: c.icon, amount: c.current }}
                currency={walletPrimaryCurrency}
                onClick={() => openCategoryModal({ name: c.name, color: c.color, icon: c.icon, current: c.current }, true, currentRange)}
              />
            ))
          )}
        </div>
      </div>

      {/* Top transactions - previous equivalent period left, current right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.topTransactions", { p1: topN })}</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{previousPeriodLabel}</p>
          {topTransactionsBills.previous.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noTxPrevious")}</p>
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
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelA}</p>
          {topTransactionsBills.current.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{tr("analyzer.noTx")}</p>
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
        <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.budgets.title")}</p><InfoTip info={APP_INFO.c_mo_leer_esto} /></div>
        <div className="flex items-start gap-1.5 mb-3"><p className="text-xs text-gf-text-muted">{tr("analyzer.budgets.help")}</p><InfoTip info={APP_INFO.cumplimiento_del_presupuesto} className="mt-px" /></div>
        {budgetRows.length === 0 ? (
          <p className="text-xs text-gf-text-muted">{tr("analyzer.budgets.none")}</p>
        ) : (
          <div className="flex flex-col">
            {budgetRows.map((b) => {
              const ratio = b.limit > 0 ? b.spent / b.limit : 0;
              return (
                <div
                  key={b.budgetId}
                  onClick={() => setActiveInsight({ icon: b.status === "over" ? "⚠️" : "📊", tone: "info", title: tr("web.p1.compliance", { p1: b.category }), type: "budget", data: b })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveInsight({ icon: "📊", tone: "info", title: tr("web.p1.compliance", { p1: b.category }), type: "budget", data: b });
                    }
                  }}
                  className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
                >
                  <span className="w-24 shrink-0 text-[12.5px] font-semibold text-gf-text truncate">{b.category}</span>
                  <span className="w-40 shrink-0 text-[11px] text-gf-text-muted">
                    {formatMoneyMajor(b.spent, walletPrimaryCurrency)} / {formatMoneyMajor(b.limit, walletPrimaryCurrency)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gf-surface-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 100)}%`, backgroundColor: getBudgetBarColor(ratio, false) }} />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      b.status === "over" ? "text-red-400 bg-red-500/15" : b.status === "warning" ? "text-amber-400 bg-amber-500/15" : "text-green-400 bg-green-500/15"
                    }`}
                  >
                    {b.streakMonths >= 2 ? tr("web.p1.months", { p1: b.streakMonths }) : `${Math.round(b.pct)}%`}
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
          <span className="inline-flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.big.title")}</p><InfoTip info={APP_INFO.grandes_gastos} /></span>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.big.help")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div
              onClick={() => setChampionsModalKind("transaction")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setChampionsModalKind("transaction"); }}
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
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setChampionsModalKind("category"); }}
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
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setChampionsModalKind("subCategory"); }}
                className="rounded-xl border border-gf-border p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
              >
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">{tr("analyzer.big.subcategory")}</p>
                <p className="text-[13px] font-bold text-gf-text truncate mt-1">{biggestSpendPatterns.biggestSubcategory.name}</p>
                <p className="text-lg font-extrabold text-gf-text">{formatMoneyMajor(biggestSpendPatterns.biggestSubcategory.total, walletPrimaryCurrency)}</p>
                <p className="text-[11px] text-gf-text-muted">{biggestSpendPatterns.biggestSubcategory.categoryName}</p>
              </div>
            )}
          </div>
          <div className="-mt-2 mb-2 flex items-center gap-1"><p className="text-[11px] text-gf-text-muted">{tr("analyzer.tapCard")}</p><InfoTip info={APP_INFO.mes_a_mes_2} /></div>

          <div className="rounded-xl bg-gf-accent-soft-bg p-3.5">
            <div className="mb-1.5 flex items-center gap-1"><p className="text-[11px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.analysis")}</p><InfoTip info={APP_INFO.de_d_nde_sale_este_an_lisis} /></div>
            <ul className="space-y-1 text-[12.5px] text-gf-text-muted leading-relaxed">
              {buildSpendPatternAnalysis(biggestSpendPatterns, tr).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Category leader per month - History always analyzes 3+ months, so
          "which category led the spend, month by month" (already computed
          per-month by monthlyChampions, previously only reachable via the
          "Grandes gastos" drill-down) is worth its own glanceable table -
          especially useful for year-vs-year comparisons. Hidden for a
          single-month window since there'd be nothing to compare. */}
      {monthlyChampions && monthlyChampions.months.length > 1 && (
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.leaderByMonth")}</p><InfoTip info={APP_INFO.l_deres_por_mes} /></div>
          <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.leaderByMonth.help")}</p>
          <div className="flex flex-col">
            {monthlyChampions.months.map((m) => (
              <div
                key={m.label}
                onClick={() => m.biggestCategory && openCategoryModal({ name: m.biggestCategory.name, color: m.biggestCategory.color, icon: m.biggestCategory.icon, current: m.biggestCategory.total }, true, m.range)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && m.biggestCategory) {
                    openCategoryModal({ name: m.biggestCategory.name, color: m.biggestCategory.color, icon: m.biggestCategory.icon, current: m.biggestCategory.total }, true, m.range);
                  }
                }}
                className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
              >
                <span className="w-28 shrink-0 text-[11px] font-semibold text-gf-text-muted">{m.label}</span>
                {m.biggestCategory ? (
                  <>
                    <span className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: m.biggestCategory.color }}>
                      <UniversalCategoIcon type={m.biggestCategory.icon} siz={13} colore="#fff" />
                    </span>
                    <p className="flex-1 min-w-0 text-[12.5px] font-semibold text-gf-text truncate">{m.biggestCategory.name}</p>
                    <span className="text-[12.5px] font-bold text-gf-text shrink-0">{formatMoneyMajor(m.biggestCategory.total, walletPrimaryCurrency)}</span>
                  </>
                ) : (
                  <p className="flex-1 text-[12px] text-gf-text-muted">{tr("analyzer.noBillsMonth")}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions + FX exposure, side by side - subscriptions alone
          didn't need the full card width, so the freed half goes to
          another metric worth having (how much of the wallet sits in a
          non-primary currency, and how that's moved). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onClick={() => setActiveInsight({ icon: "🔁", tone: "info", title: s.name, type: "subscription", data: s })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setActiveInsight({ icon: "🔁", tone: "info", title: s.name, type: "subscription", data: s });
                  }}
                  className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
                >
                  <span className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: s.color }}>
                    <UniversalCategoIcon type={s.icon} siz={13} colore="#fff" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gf-text truncate">{s.name}</p>
                    <p className="text-[10.5px] text-gf-text-muted">{s.categoryName}</p>
                  </div>
                  {s.isNew && <span className="text-[10px] font-bold text-purple-600 bg-gf-accent-soft-bg px-2 py-0.5 rounded-full">{tr("analyzer.badge.new")}</span>}
                  {s.possibleDuplicateInMonth && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">{tr("analyzer.badge.duplicate")}</span>
                  )}
                  <span className="text-[12.5px] font-bold text-gf-text shrink-0">{formatMoneyMajor(s.amount, walletPrimaryCurrency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
                  <th className="text-right font-bold pb-2">{tr("analyzer.change")}</th>
                </tr>
              </thead>
              <tbody>
                {fxExposure.rows.map((r) => (
                  <tr key={r.currency} className="border-t border-gf-border">
                    <td className="py-2 font-semibold text-gf-text">{r.currency}</td>
                    <td className="py-2 text-right text-gf-text-muted">{formatMoneyMajor(r.nativeAmount, r.currency)}</td>
                    <td className="py-2 text-right font-semibold text-gf-text">{formatMoneyMajor(r.valueInPrimary, walletPrimaryCurrency)}</td>
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
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveInsight({ icon: "🏃", tone: "info", title: tr("analyzer.pace.title"), type: "spending_pace", data: pace }); }}
        className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5"><p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.pace.title")}</p><InfoTip info={APP_INFO.ritmo_de_gasto_2} /></div>
          <span className="text-[11px] font-semibold text-purple-600">{tr("analyzer.seeDetail")}</span>
        </div>
        <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.pace.help")}</p>
        <div className="h-2.5 rounded-full bg-gf-surface-2 overflow-hidden">
          <div className="h-full rounded-full bg-purple-500" style={{ width: `${pacePct}%` }} />
        </div>
        <p className="text-xs text-gf-text-muted mt-2">
          {tr("analyzer.pace.spent")} {formatMoneyMajor(pace.spentSoFar, walletPrimaryCurrency)} {tr("analyzer.pace.today")} {pace.dayOfMonth} {tr("analyzer.pace.ofPeriod")}
          {pace.deltaPct !== null && (
            <>
              {tr("analyzer.pace.vsAverage", { p1: pace.deltaPct > 0 ? "más" : "menos", p2: formatMoneyMajor(pace.avgPaceForSameDay, walletPrimaryCurrency), p3: Math.abs(Math.round(pace.deltaPct)) })}
            </>
          )}
        </p>
      </div>

      {/* Weekday pattern */}
      <div
        onClick={() => setWeekdayDetailOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setWeekdayDetailOpen(true); }}
        className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.weekday.title")}</p>
          <span className="text-[11px] font-semibold text-purple-600">{tr("analyzer.seeDetail")}</span>
        </div>
        <p className="text-xs text-gf-text-muted mb-3">{tr("analyzer.weekday.help")}</p>
        <WalletAnalyzerWeekdayChart days={weekdaySpending.days} walletPrimaryCurrency={walletPrimaryCurrency} />
        <p className="text-xs text-gf-text-muted mt-3">{weekdaySpending.insight}</p>
      </div>

      {/* Compare section - only when "Compare" is on, additional to everything above */}
      {compareEnabled && comparison && (
        <>
          <div className="flex flex-col items-center gap-1 pt-2">
            <h2 className="text-2xl text-center font-bold text-gf-text">{tr("analyzer.compare.title")}</h2>
            <p className="text-xs text-gf-text-muted text-center">{tr("analyzer.compare.vs", { p1: labelA, p2: labelB })}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.compare.topBills", { p1: topN })}</p>
              <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB} → {labelA}</p>
              {comparison.categoriesBills.length === 0 ? (
                <p className="text-xs text-gf-text-muted">{tr("analyzer.compare.noBills")}</p>
              ) : (
                comparison.categoriesBills.map((c, i) => (
                  <CategoryCompareRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, true, currentRange)} />
                ))
              )}
            </div>
            <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">{tr("analyzer.compare.topIncomes", { p1: topN })}</p>
              <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB} → {labelA}</p>
              {comparison.categoriesIncomes.length === 0 ? (
                <p className="text-xs text-gf-text-muted">{tr("analyzer.compare.noIncomes")}</p>
              ) : (
                comparison.categoriesIncomes.map((c, i) => (
                  <CategoryCompareRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, false, currentRange)} />
                ))
              )}
            </div>
          </div>

          <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
            <p className="text-[15px] font-extrabold text-gf-text">{tr("analyzer.budgetsChange.title")}</p>
            <p className="text-xs text-gf-text-muted mb-3">
              {tr("analyzer.budgetsChange.help", { p1: labelB, p2: labelA })}
            </p>
            {comparison.budgetChanges.length === 0 ? (
              <p className="text-xs text-gf-text-muted">{tr("analyzer.budgetsChange.none")}</p>
            ) : (
              <div className="flex flex-col">
                {comparison.budgetChanges.map((row) => {
                  const ratioA = row.periodA && row.periodA.goal > 0 ? row.periodA.actual / row.periodA.goal : 0;
                  const changePct =
                    row.periodA && row.periodB && row.periodB.actual > 0
                      ? ((row.periodA.actual - row.periodB.actual) / row.periodB.actual) * 100
                      : null;
                  return (
                    <div
                      key={row.budgetId}
                      onClick={() => openBudgetPeriodModal(row)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openBudgetPeriodModal(row); }}
                      className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
                    >
                      <span className="w-24 shrink-0 text-[12.5px] font-semibold text-gf-text truncate">{row.category}</span>
                      <span className="w-36 shrink-0 text-[11px] text-gf-text-muted truncate">
                        {row.periodB ? formatMoneyMajor(row.periodB.actual, walletPrimaryCurrency) : "—"} →{" "}
                        {row.periodA ? formatMoneyMajor(row.periodA.actual, walletPrimaryCurrency) : "—"}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-gf-surface-2 overflow-hidden">
                        {row.periodA && (
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratioA * 100)}%`, backgroundColor: getBudgetBarColor(ratioA, false) }} />
                        )}
                      </div>
                      <span className="shrink-0">
                        <ChangePill changePct={changePct} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

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
        weekdaySpending={weekdaySpending as unknown as WalletAnalyzerWeekdaySpendingData}
        walletPrimaryCurrency={walletPrimaryCurrency}
      />
    </div>
  );
}

export default HistoricalWalletAnalyzer;
