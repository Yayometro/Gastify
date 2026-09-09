"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import fetcher from "@/helpers/fetcher";
import useGetUserSession from "@/hooks/useGetUserSession";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { getPeriodLabel } from "@/helpers/timeFunctions/timeFunctions";
import UniversalCategoIcon from "../UniversalCategoIcon";
import {
  buildPeriodSnapshot,
  buildPeriodComparison,
  getCategoryTransactions,
  getSubcategoryTransactions,
} from "@/helpers/transformers/walletAnalyzer";
import { ChangePill, RankRow, buildSpendPatternAnalysis } from "../walletAnalyzer/WalletAnalyzerView";
import WalletAnalyzerInsightsStrip from "../walletAnalyzer/WalletAnalyzerInsightsStrip";
import WalletAnalyzerTrendChart from "../walletAnalyzer/WalletAnalyzerTrendChart";
import WalletAnalyzerWeekdayChart from "../walletAnalyzer/WalletAnalyzerWeekdayChart";
import InsightDetailModal from "../walletAnalyzer/InsightDetailModal";
import MonthlyChampionsModal from "../walletAnalyzer/MonthlyChampionsModal";
import WeekdaySpendingDetailModal from "../walletAnalyzer/WeekdaySpendingDetailModal";
import BudgetPeriodDetailModal from "./BudgetPeriodDetailModal";

// The period-vs-period compare table's row for a single category -
// buildPeriodComparison's categoriesBills/categoriesIncomes are ALREADY a
// joined list (ranked by periodA's spend, periodB's value alongside), so
// this is one row, not two side-by-side ones. A CSS grid (fixed column
// template) instead of ad hoc flex gaps keeps every row's icon/amount/pill
// columns aligned regardless of name length - and the icon is the same
// filled circle + UniversalCategoIcon RankRow uses (was a tiny bare dot
// before, inconsistent with every other icon on this page).
function CategoryCompareRow({ index, item, currency, onClick }) {
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
function HistoricalWalletAnalyzer({ periodState }) {
  const { timePeriod, comparePeriod, compareEnabled, labelA, labelB, timePeriodsForSelecter } = periodState;
  const [budgets, setBudgets] = useState([]);
  const [topN, setTopN] = useState(6);
  const { email } = useGetUserSession();
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const { close, modalContent, renderModal, handleClose } = useModal();

  const [activeInsight, setActiveInsight] = useState(null);
  const [championsModalKind, setChampionsModalKind] = useState(null);
  const [weekdayDetailOpen, setWeekdayDetailOpen] = useState(false);

  // Same dedicated route HistoricalBudgetsComparative uses - includes
  // archived budgets, since an archived budget's past months still belong
  // to whichever period they fall into.
  useEffect(() => {
    if (!email) return;
    const toFetch = fetcher();
    toFetch
      .post("general-data/budget/get-historical", email)
      .then((res) => {
        if (res.ok) setBudgets(res.data || []);
      })
      .catch(() => {});
  }, [email]);

  const transactions = useMemo(() => ccTransacciones.data || [], [ccTransacciones.data]);
  const transactionsById = useMemo(() => {
    const map = new Map();
    transactions.forEach((t) => map.set(t._id, t));
    return map;
  }, [transactions]);

  const range = useMemo(
    () => (timePeriod?.[0] && timePeriod?.[1] ? { start: timePeriod[0], end: timePeriod[1] } : null),
    [timePeriod]
  );

  const snapshot = useMemo(() => {
    if (!range || transactions.length < 1) return null;
    return buildPeriodSnapshot({ transactions, budgets, range, topN });
  }, [range, transactions, budgets, topN]);

  const comparison = useMemo(() => {
    if (!compareEnabled) return null;
    if (!range || !comparePeriod?.[0] || !comparePeriod?.[1]) return null;
    if (transactions.length < 1) return null;
    const rangeB = { start: comparePeriod[0], end: comparePeriod[1] };
    return buildPeriodComparison({ transactions, budgets, rangeA: range, rangeB, labelA, labelB, topN });
  }, [compareEnabled, range, comparePeriod, transactions, budgets, labelA, labelB, topN]);

  function openCategoryModal(item, isBill, forRange) {
    const children = getCategoryTransactions(transactions, item.name, isBill, forRange);
    renderModal(
      <ModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill, value: item.current ?? item.amount, children }}
        close={handleClose}
      />
    );
  }

  function openSubcategoryModal(item, forRange) {
    const children = getSubcategoryTransactions(transactions, item.name, true, forRange);
    const parentCategory = children[0]?.category;
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

  function openTransactionModal(item) {
    const raw = transactionsById.get(item._id);
    if (!raw) return;
    renderModal(<ModalContentTopMonthItem item={raw} close={handleClose} />);
  }

  // Routed through the same renderModal()/BasicModal mechanism as the
  // drill-down modals above (not a bare conditional render) - BasicModal is
  // what actually provides the fixed, viewport-centered overlay positioning;
  // rendering BudgetPeriodDetailModal on its own left it positioned
  // relative to the document instead (no positioned ancestor), placing it
  // thousands of pixels off-screen on this long page.
  function openBudgetPeriodModal(row) {
    renderModal(
      <BudgetPeriodDetailModal row={row} labelA={labelA} labelB={labelB} walletPrimaryCurrency={walletPrimaryCurrency} close={handleClose} />
    );
  }

  if (!snapshot) {
    return (
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 text-center">
        <p className="text-xs text-gf-text-muted">Cargando Wallet Analyzer…</p>
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

  const previousPeriodLabel = getPeriodLabel(timePeriodsForSelecter, [previousRange.start, previousRange.end]);
  const savingsRateChangePp = Math.round((currentTotals.savingsRate - previousTotals.savingsRate) * 100);
  const pacePct = pace.avgPaceForSameDay > 0 ? Math.min(100, (pace.spentSoFar / pace.avgPaceForSameDay) * 100) : 0;

  function handleSelectChampionMonth(monthEntry) {
    const kind = championsModalKind;
    setChampionsModalKind(null);
    const goBack = () => setChampionsModalKind(kind);
    if (kind === "transaction") {
      const raw = transactionsById.get(monthEntry.biggestTransaction?._id);
      if (raw) renderModal(<ModalContentTopMonthItem item={raw} close={handleClose} onBack={() => { handleClose(); goBack(); }} />);
    } else if (kind === "category") {
      openCategoryModal(
        { name: monthEntry.biggestCategory.name, color: monthEntry.biggestCategory.color, icon: monthEntry.biggestCategory.icon, current: monthEntry.biggestCategory.total },
        true,
        monthEntry.range
      );
    } else if (kind === "subCategory") {
      openSubcategoryModal(monthEntry.biggestSubcategory, monthEntry.range);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl text-center font-bold text-gf-text">Wallet Analyzer</h2>
        <p className="text-xs text-gf-text-muted text-center">{labelA}</p>
      </div>

      <WalletAnalyzerInsightsStrip
        insights={insights}
        walletPrimaryCurrency={walletPrimaryCurrency}
        transactions={transactions}
        currentRange={currentRange}
        title="Lo más destacado del periodo"
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Period vs. auto-previous-equivalent-period */}
        <div className="md:col-span-2 gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-gf-text">{labelA} vs. {previousPeriodLabel}</p>
          <p className="text-xs text-gf-text-muted mb-3">Comparativo contra el periodo inmediatamente anterior de igual duración</p>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-gf-text-muted">
                <th className="text-left font-bold pb-2"></th>
                <th className="text-right font-bold pb-2 text-gf-text-muted">Anterior</th>
                <th className="text-right font-bold pb-2">{labelA}</th>
                <th className="text-right font-bold pb-2">Cambio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-gf-text-muted">Ingresos</td>
                <td className="py-2 text-right text-gf-text-muted">{formatMoneyMajor(previousTotals.income, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text">{formatMoneyMajor(currentTotals.income, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right">
                  <ChangePill changePct={previousTotals.income > 0 ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">Gastos</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(previousTotals.expense, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{formatMoneyMajor(currentTotals.expense, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={previousTotals.expense > 0 ? ((currentTotals.expense - previousTotals.expense) / previousTotals.expense) * 100 : null} />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">Balance</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(previousTotals.balance, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{formatMoneyMajor(currentTotals.balance, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={previousTotals.balance > 0 ? ((currentTotals.balance - previousTotals.balance) / previousTotals.balance) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">Tasa de ahorro</td>
                <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{Math.round(previousTotals.savingsRate * 100)}%</td>
                <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{Math.round(currentTotals.savingsRate * 100)}%</td>
                <td className="py-2 text-right border-t border-gf-border">
                  <ChangePill changePct={savingsRateChangePp === 0 ? null : savingsRateChangePp} unit="pp" invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gf-text-muted border-t border-gf-border">Transacciones</td>
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
          <p className="text-[15px] font-extrabold text-gf-text">Tendencia</p>
          <p className="text-xs text-gf-text-muted mb-3">Ingresos vs. gastos por periodo anterior equivalente</p>
          <div
            onClick={() =>
              setActiveInsight({
                icon: "📅",
                tone: "info",
                title: "Promedio por periodo",
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
                  title: "Promedio por periodo",
                  type: "monthly_average",
                  data: { avgIncome: monthlyAverages.avgIncome, avgExpense: monthlyAverages.avgExpense, avgTransactionCount: monthlyAverages.avgTransactionCount, trend },
                });
              }
            }}
            className="grid grid-cols-3 gap-3 mb-4 cursor-pointer group"
          >
            <div className="rounded-xl bg-green-500/15 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-green-400/70">Promedio · Ingresos</p>
              <p className="text-lg font-extrabold text-green-400">{formatMoneyMajor(monthlyAverages.avgIncome, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-red-500/15 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-400/70">Promedio · Gastos</p>
              <p className="text-lg font-extrabold text-red-400">{formatMoneyMajor(monthlyAverages.avgExpense, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-gf-accent-soft-bg px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-purple-300/70">Promedio · Transacciones</p>
              <p className="text-lg font-extrabold text-purple-300">{Math.round(monthlyAverages.avgTransactionCount)}</p>
            </div>
          </div>
          <WalletAnalyzerTrendChart
            trend={trend}
            walletPrimaryCurrency={walletPrimaryCurrency}
            onSelectMonth={(month) => setActiveInsight({ icon: "📅", tone: "info", title: month.label, type: "trend_month", data: month })}
          />
        </div>
      </div>

      {/* Item-count control */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <p className="text-xs font-semibold text-gf-text-muted">Elementos en Top categorías y Top transacciones</p>
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
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} categorías</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{previousPeriodLabel}</p>
          {topCategoriesBillsPrevious.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin gastos en el periodo anterior.</p>
          ) : (
            topCategoriesBillsPrevious.map((c, i) => (
              <RankRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, true, previousRange)} />
            ))
          )}
        </div>
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} categorías</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelA}</p>
          {topCategoriesBills.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin gastos en este periodo.</p>
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
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} transacciones</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{previousPeriodLabel}</p>
          {topTransactionsBills.previous.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin transacciones en el periodo anterior.</p>
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
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} transacciones</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelA}</p>
          {topTransactionsBills.current.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin transacciones en este periodo.</p>
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
        <p className="text-[15px] font-extrabold text-gf-text">Presupuestos · cumplimiento y rachas</p>
        <p className="text-xs text-gf-text-muted mb-3">Qué tan cerca estuviste de tus límites mensuales - toca una fila para ver el detalle</p>
        {budgetRows.length === 0 ? (
          <p className="text-xs text-gf-text-muted">No tienes presupuestos de gasto configurados.</p>
        ) : (
          <div className="flex flex-col">
            {budgetRows.map((b) => {
              const ratio = b.limit > 0 ? b.spent / b.limit : 0;
              return (
                <div
                  key={b.budgetId}
                  onClick={() => setActiveInsight({ icon: b.status === "over" ? "⚠️" : "📊", tone: "info", title: `${b.category} — cumplimiento`, type: "budget", data: b })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
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
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 100)}%`, backgroundColor: getBudgetBarColor(ratio, false) }} />
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
          <p className="text-[15px] font-extrabold text-gf-text">Grandes gastos</p>
          <p className="text-xs text-gf-text-muted mb-3">Dónde está tu gasto más grande en este periodo, y si hay un patrón detrás</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div
              onClick={() => setChampionsModalKind("transaction")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setChampionsModalKind("transaction"); }}
              className="rounded-xl border border-gf-border p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">Transacción más grande</p>
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
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">Categoría con más gasto</p>
              <p className="text-[13px] font-bold text-gf-text truncate mt-1">{biggestSpendPatterns.biggestCategory.name}</p>
              <p className="text-lg font-extrabold text-gf-text">{formatMoneyMajor(biggestSpendPatterns.biggestCategory.total, walletPrimaryCurrency)}</p>
              <p className="text-[11px] text-gf-text-muted">{Math.round(biggestSpendPatterns.analysis.categoryShareOfTotal)}% de tu gasto total</p>
            </div>

            {biggestSpendPatterns.biggestSubcategory && (
              <div
                onClick={() => setChampionsModalKind("subCategory")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setChampionsModalKind("subCategory"); }}
                className="rounded-xl border border-gf-border p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
              >
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-gf-text-muted">Subcategoría con más gasto</p>
                <p className="text-[13px] font-bold text-gf-text truncate mt-1">{biggestSpendPatterns.biggestSubcategory.name}</p>
                <p className="text-lg font-extrabold text-gf-text">{formatMoneyMajor(biggestSpendPatterns.biggestSubcategory.total, walletPrimaryCurrency)}</p>
                <p className="text-[11px] text-gf-text-muted">{biggestSpendPatterns.biggestSubcategory.categoryName}</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gf-text-muted -mt-2 mb-2">Toca una tarjeta para ver el detalle mes por mes</p>

          <div className="rounded-xl bg-gf-accent-soft-bg p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-purple-300 mb-1.5">Análisis</p>
            <ul className="list-disc pl-4 space-y-1 text-[12.5px] text-gf-text-muted leading-relaxed">
              {buildSpendPatternAnalysis(biggestSpendPatterns).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Subscriptions */}
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
        <p className="text-[15px] font-extrabold text-gf-text">Suscripciones recurrentes</p>
        <p className="text-xs text-gf-text-muted mb-3">Detectadas por nombre y frecuencia mensual</p>
        {subscriptions.length === 0 ? (
          <p className="text-xs text-gf-text-muted">No se detectaron suscripciones recurrentes.</p>
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
                {s.isNew && <span className="text-[10px] font-bold text-purple-600 bg-gf-accent-soft-bg px-2 py-0.5 rounded-full">nueva</span>}
                {s.possibleDuplicateInMonth && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">posible duplicado</span>
                )}
                <span className="text-[12.5px] font-bold text-gf-text shrink-0">{formatMoneyMajor(s.amount, walletPrimaryCurrency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pace */}
      <div
        onClick={() => setActiveInsight({ icon: "🏃", tone: "info", title: "Ritmo de gasto", type: "spending_pace", data: pace })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveInsight({ icon: "🏃", tone: "info", title: "Ritmo de gasto", type: "spending_pace", data: pace }); }}
        className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-extrabold text-gf-text">Ritmo de gasto</p>
          <span className="text-[11px] font-semibold text-purple-600">Ver detalle →</span>
        </div>
        <p className="text-xs text-gf-text-muted mb-3">Comparado con tu propio promedio a esta misma altura de periodos anteriores</p>
        <div className="h-2.5 rounded-full bg-gf-surface-2 overflow-hidden">
          <div className="h-full rounded-full bg-purple-500" style={{ width: `${pacePct}%` }} />
        </div>
        <p className="text-xs text-gf-text-muted mt-2">
          Llevas gastado {formatMoneyMajor(pace.spentSoFar, walletPrimaryCurrency)} al día {pace.dayOfMonth} de este periodo
          {pace.deltaPct !== null && (
            <>
              {" — "}
              {pace.deltaPct > 0 ? "más" : "menos"} que tu promedio de {formatMoneyMajor(pace.avgPaceForSameDay, walletPrimaryCurrency)} para esta misma altura en periodos anteriores ({Math.abs(Math.round(pace.deltaPct))}%).
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
          <p className="text-[15px] font-extrabold text-gf-text">Patrones por día de la semana</p>
          <span className="text-[11px] font-semibold text-purple-600">Ver detalle →</span>
        </div>
        <p className="text-xs text-gf-text-muted mb-3">Promedio de gasto por día, en este periodo</p>
        <WalletAnalyzerWeekdayChart days={weekdaySpending.days} walletPrimaryCurrency={walletPrimaryCurrency} />
        <p className="text-xs text-gf-text-muted mt-3">{weekdaySpending.insight}</p>
      </div>

      {/* Compare section - only when "Compare" is on, additional to everything above */}
      {compareEnabled && comparison && (
        <>
          <div className="flex flex-col items-center gap-1 pt-2">
            <h2 className="text-2xl text-center font-bold text-gf-text">Comparativo entre periodos</h2>
            <p className="text-xs text-gf-text-muted text-center">{labelA} vs. {labelB}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} categorías · gastos</p>
              <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB} → {labelA}</p>
              {comparison.categoriesBills.length === 0 ? (
                <p className="text-xs text-gf-text-muted">Sin gastos en estos periodos.</p>
              ) : (
                comparison.categoriesBills.map((c, i) => (
                  <CategoryCompareRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, true, currentRange)} />
                ))
              )}
            </div>
            <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} categorías · ingresos</p>
              <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB} → {labelA}</p>
              {comparison.categoriesIncomes.length === 0 ? (
                <p className="text-xs text-gf-text-muted">Sin ingresos en estos periodos.</p>
              ) : (
                comparison.categoriesIncomes.map((c, i) => (
                  <CategoryCompareRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, false, currentRange)} />
                ))
              )}
            </div>
          </div>

          <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
            <p className="text-[15px] font-extrabold text-gf-text">Presupuestos · cambios entre periodos</p>
            <p className="text-xs text-gf-text-muted mb-3">
              Gasto acumulado contra el límite de cada presupuesto ({labelB} → {labelA}) - toca una fila para ver el detalle mes a mes
            </p>
            {comparison.budgetChanges.length === 0 ? (
              <p className="text-xs text-gf-text-muted">No hay presupuestos con datos en estos periodos.</p>
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
        weekdaySpending={weekdaySpending}
        walletPrimaryCurrency={walletPrimaryCurrency}
      />
    </div>
  );
}

export default HistoricalWalletAnalyzer;
