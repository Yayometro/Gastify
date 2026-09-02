import React, { useMemo, useState } from "react";
import { ConfigProvider, DatePicker } from "antd";
import esES from "antd/locale/es_ES";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { formatMoneyMajor } from "@/lib/money/currencies";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { getCategoryTransactions, getSubcategoryTransactions } from "@/helpers/transformers/walletAnalyzer";
import useModal from "@/hooks/useModalBasic";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import ModalContentTopMonthItem from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import UniversalCategoIcon from "../UniversalCategoIcon";
import WalletAnalyzerTrendChart from "./WalletAnalyzerTrendChart";
import WalletAnalyzerWeekdayChart from "./WalletAnalyzerWeekdayChart";
import InsightDetailModal from "./InsightDetailModal";
import WalletAnalyzerInsightsStrip from "./WalletAnalyzerInsightsStrip";
import MonthlyChampionsModal from "./MonthlyChampionsModal";
import WeekdaySpendingDetailModal from "./WeekdaySpendingDetailModal";

// Expense-side change: spending more (>0) is the notable/warm direction,
// spending less is the cool/positive one - matches the approved concept.
// `invert`: for expense-side metrics (spending), up is the warm/notable
// direction (red) - for income/balance/savings-rate/FX-value, up is the
// good direction (green), so those pass invert to flip the colors.
function ChangePill({ changePct, isNew, unit = "%", invert = false }) {
  if (isNew) {
    return (
      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">nueva</span>
    );
  }
  if (changePct === null || changePct === undefined) {
    return <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">—</span>;
  }
  if (Math.abs(changePct) < 1) {
    return <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">= 0{unit}</span>;
  }
  const up = changePct > 0;
  const isWarm = invert ? !up : up;
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isWarm ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(Math.round(changePct))}{unit}
    </span>
  );
}

function CategoryDot({ color }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

// `onClick`, when present, drives the same drill-down modal used for the
// "top elements by month" section elsewhere in the app - a category row
// opens that category's transactions, a transaction row opens itself.
function RankRow({ index, item, currency, subtitle, onClick }) {
  return (
    <div
      className={`flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-slate-100 first:border-t-0 transition-colors ${
        onClick ? "cursor-pointer hover:bg-slate-50" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <span className="w-4 text-[11px] text-slate-400 font-bold shrink-0">{index + 1}</span>
      <span
        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: item.color || "#ABABAB" }}
      >
        <UniversalCategoIcon type={item.icon} siz={13} colore="#fff" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-slate-800 truncate">{item.name}</p>
        {subtitle && <p className="text-[10.5px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      <span className="text-[12.5px] font-bold text-slate-800 shrink-0">{formatMoneyMajor(item.amount, currency)}</span>
    </div>
  );
}

// Turns findBiggestSpendPatterns' analysis facts into plain-Spanish
// bullets - every claim here is a direct readout of a computed boolean/
// percentage, not an inference, so it stays consistent with the rest of
// Wallet Analyzer's "no AI" rule-based approach.
function buildSpendPatternAnalysis(patterns) {
  const { biggestTransaction, biggestCategory, biggestSubcategory, mostCommonCategoryTag, analysis } = patterns;
  const bullets = [];

  bullets.push(
    analysis.transactionIsInBiggestCategory
      ? `La transacción más grande sí pertenece a la categoría con más gasto (${biggestCategory.name}).`
      : `La transacción más grande NO pertenece a la categoría con más gasto — está en ${biggestTransaction.categoryName}, mientras que la categoría con más gasto es ${biggestCategory.name}.`
  );

  bullets.push(`${biggestCategory.name} representa el ${Math.round(analysis.categoryShareOfTotal)}% de tu gasto total en los últimos ${patterns.monthsBack} meses.`);

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
}) {
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
    const map = new Map();
    (transactions || []).forEach((t) => map.set(t._id, t));
    return map;
  }, [transactions]);

  const { close, handleClose, renderModal, modalContent } = useModal();
  const [activeInsight, setActiveInsight] = useState(null);
  const [championsModalKind, setChampionsModalKind] = useState(null);
  const [weekdayDetailOpen, setWeekdayDetailOpen] = useState(false);

  // Only when opened FROM the monthly-champions list does the drill-down
  // get a back button - passed straight through as a callback (not state),
  // so there's no timing gap between "remember where we came from" and
  // "render the modal that needs to know it". Every other entry point
  // (Top categories/transactions rows, insight cards) just omits it.
  function handleSelectChampionMonth(monthEntry) {
    const kind = championsModalKind;
    setChampionsModalKind(null);
    const goBack = () => setChampionsModalKind(kind);
    if (kind === "transaction") {
      openTransactionModal(monthEntry.biggestTransaction, goBack);
    } else if (kind === "category") {
      openCategoryModal(
        { name: monthEntry.biggestCategory.name, color: monthEntry.biggestCategory.color, icon: monthEntry.biggestCategory.icon, amount: monthEntry.biggestCategory.total },
        monthEntry.range,
        goBack
      );
    } else if (kind === "subCategory") {
      openSubcategoryModal(monthEntry.biggestSubcategory, monthEntry.range, goBack);
    }
  }

  function openTransactionModal(item, onBack) {
    const raw = transactionsById.get(item._id);
    if (!raw) return;
    renderModal(<ModalContentTopMonthItem item={raw} close={handleClose} onBack={onBack && (() => { handleClose(); onBack(); })} />);
  }

  function openCategoryModal(item, range, onBack) {
    const children = getCategoryTransactions(transactions || [], item.name, true, range);
    renderModal(
      <ModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill: true, value: item.amount, children }}
        close={handleClose}
        onBack={onBack && (() => { handleClose(); onBack(); })}
      />
    );
  }

  function openSubcategoryModal(item, range, onBack) {
    const children = getSubcategoryTransactions(transactions || [], item.name, true, range);
    // Subcategories have no icon/color of their own - borrow the parent
    // category's, read off any matching transaction (they all share it).
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
        onBack={onBack && (() => { handleClose(); onBack(); })}
      />
    );
  }

  return (
    <div className="wallet-analyzer-container w-full flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="wallet-analyzer-title text-2xl text-center font-bold text-slate-900">Wallet Analyzer</h1>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-1.5 shadow-sm" style={{ height: 32 }}>
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Mes anterior"
            className="w-6 h-6 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
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
            <span className="text-xs font-bold text-slate-700 px-1.5 pointer-events-none whitespace-nowrap">{referenceMonthLabel}</span>
            <ConfigProvider locale={esES} theme={{ token: { colorPrimary: "#9333ea", borderRadius: 999 } }}>
              <DatePicker
                picker="month"
                value={referenceMonth ? dayjs(referenceMonth).locale("es") : null}
                onChange={(d) => d && onSelectMonth?.(d.toDate())}
                disabledDate={(d) => maxSelectableMonth && d.toDate() > maxSelectableMonth}
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
            aria-label="Mes siguiente"
            disabled={!canGoNext}
            className="w-6 h-6 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
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

      <div className="grid md:grid-cols-5 gap-4">
        {/* Month vs month */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-slate-800">{referenceMonthLabel} vs. {previousMonthLabel}</p>
          <p className="text-xs text-slate-400 mb-3">Comparativo del mes contra el periodo anterior</p>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-slate-400">
                <th className="text-left font-bold pb-2"></th>
                <th className="text-right font-bold pb-2 text-slate-500">{previousMonthLabel.split(" ")[0]}</th>
                <th className="text-right font-bold pb-2">{referenceMonthLabel.split(" ")[0]}</th>
                <th className="text-right font-bold pb-2">Cambio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-slate-500">Ingresos</td>
                <td className="py-2 text-right text-slate-500">{formatMoneyMajor(previousTotals.income, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-slate-800">
                  {formatMoneyMajor(currentTotals.income, walletPrimaryCurrency)}
                </td>
                <td className="py-2 text-right">
                  <ChangePill changePct={previousTotals.income > 0 ? ((currentTotals.income - previousTotals.income) / previousTotals.income) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500 border-t border-slate-100">Gastos</td>
                <td className="py-2 text-right text-slate-500 border-t border-slate-100">{formatMoneyMajor(previousTotals.expense, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-slate-800 border-t border-slate-100">
                  {formatMoneyMajor(currentTotals.expense, walletPrimaryCurrency)}
                </td>
                <td className="py-2 text-right border-t border-slate-100">
                  <ChangePill changePct={previousTotals.expense > 0 ? ((currentTotals.expense - previousTotals.expense) / previousTotals.expense) * 100 : null} />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500 border-t border-slate-100">Balance</td>
                <td className="py-2 text-right text-slate-500 border-t border-slate-100">{formatMoneyMajor(previousTotals.balance, walletPrimaryCurrency)}</td>
                <td className="py-2 text-right font-semibold text-slate-800 border-t border-slate-100">
                  {formatMoneyMajor(currentTotals.balance, walletPrimaryCurrency)}
                </td>
                <td className="py-2 text-right border-t border-slate-100">
                  <ChangePill changePct={previousTotals.balance > 0 ? ((currentTotals.balance - previousTotals.balance) / previousTotals.balance) * 100 : null} invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500 border-t border-slate-100">Tasa de ahorro</td>
                <td className="py-2 text-right text-slate-500 border-t border-slate-100">{Math.round(previousTotals.savingsRate * 100)}%</td>
                <td className="py-2 text-right font-semibold text-slate-800 border-t border-slate-100">
                  {Math.round(currentTotals.savingsRate * 100)}%
                </td>
                <td className="py-2 text-right border-t border-slate-100">
                  <ChangePill changePct={savingsRateChangePp === 0 ? null : savingsRateChangePp} unit="pp" invert />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500 border-t border-slate-100">Transacciones</td>
                <td className="py-2 text-right text-slate-500 border-t border-slate-100">{previousTotals.transactionCount}</td>
                <td className="py-2 text-right font-semibold text-slate-800 border-t border-slate-100">{currentTotals.transactionCount}</td>
                <td className="py-2 text-right border-t border-slate-100">
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
        <div className="md:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-slate-800">Tendencia · 6 meses</p>
          <p className="text-xs text-slate-400 mb-3">Ingresos vs. gastos por mes — pasa el cursor o toca un mes para ver el detalle</p>
          <div
            onClick={() =>
              setActiveInsight({
                icon: "📅",
                tone: "info",
                title: "Promedio mensual",
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
                  title: "Promedio mensual",
                  type: "monthly_average",
                  data: { avgIncome: monthlyAverages.avgIncome, avgExpense: monthlyAverages.avgExpense, avgTransactionCount: monthlyAverages.avgTransactionCount, trend },
                });
              }
            }}
            className="grid grid-cols-3 gap-3 mb-4 cursor-pointer group"
          >
            <div className="rounded-xl bg-green-50 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-green-700/70">Promedio mensual · Ingresos</p>
              <p className="text-lg font-extrabold text-green-700">{formatMoneyMajor(monthlyAverages.avgIncome, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-red-50 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-700/70">Promedio mensual · Gastos</p>
              <p className="text-lg font-extrabold text-red-700">{formatMoneyMajor(monthlyAverages.avgExpense, walletPrimaryCurrency)}</p>
            </div>
            <div className="rounded-xl bg-purple-50 px-3.5 py-2.5 transition-shadow group-hover:shadow-md">
              <p className="text-[11px] font-bold uppercase tracking-wide text-purple-700/70">Promedio mensual · Transacciones</p>
              <p className="text-lg font-extrabold text-purple-700">{Math.round(monthlyAverages.avgTransactionCount)}</p>
            </div>
          </div>
          <WalletAnalyzerTrendChart
            trend={trend}
            walletPrimaryCurrency={walletPrimaryCurrency}
            onSelectMonth={(month) =>
              setActiveInsight({ icon: "📅", tone: "info", title: month.label, type: "trend_month", data: month })
            }
          />
        </div>
      </div>

      {/* Item-count control - governs both Top categories and Top transactions below */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <p className="text-xs font-semibold text-slate-500">Elementos en Top categorías y Top transacciones</p>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
          {[3, 6, 12, 24].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChangeTopN?.(n)}
              className={`w-7 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                topN === n ? "bg-purple-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Top categories - previous month left, current month right, mirroring top transactions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-600">Top {topN} categorías</p>
          <p className="text-[15px] font-extrabold text-slate-800 mb-2">{previousMonthLabel}</p>
          {topCategoriesBillsPrevious.length === 0 ? (
            <p className="text-xs text-slate-400">Sin gastos el mes pasado.</p>
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
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-600">Top {topN} categorías</p>
          <p className="text-[15px] font-extrabold text-slate-800 mb-2">{referenceMonthLabel}</p>
          {topCategoriesBills.length === 0 ? (
            <p className="text-xs text-slate-400">Sin gastos este mes.</p>
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
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-600">Top {topN} transacciones</p>
          <p className="text-[15px] font-extrabold text-slate-800 mb-2">{previousMonthLabel}</p>
          {topTransactionsBills.previous.length === 0 ? (
            <p className="text-xs text-slate-400">Sin transacciones el mes pasado.</p>
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
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-600">Top {topN} transacciones</p>
          <p className="text-[15px] font-extrabold text-slate-800 mb-2">{referenceMonthLabel}</p>
          {topTransactionsBills.current.length === 0 ? (
            <p className="text-xs text-slate-400">Sin transacciones este mes.</p>
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
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
        <p className="text-[15px] font-extrabold text-slate-800">Presupuestos · cumplimiento y rachas</p>
        <p className="text-xs text-slate-400 mb-3">Qué tan cerca estuviste de tus límites mensuales — toca una fila para ver el detalle</p>
        {budgetRows.length === 0 ? (
          <p className="text-xs text-slate-400">No tienes presupuestos de gasto configurados.</p>
        ) : (
          <div className="flex flex-col">
            {budgetRows.map((b) => {
              const ratio = b.limit > 0 ? b.spent / b.limit : 0;
              return (
                <div
                  key={b.category}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveInsight({ icon: "📊", tone: "info", title: `${b.category} — cumplimiento`, type: "budget", data: b });
                    }
                  }}
                  className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg border-t border-slate-100 first:border-t-0 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="w-24 shrink-0 text-[12.5px] font-semibold text-slate-800 truncate">{b.category}</span>
                  <span className="w-40 shrink-0 text-[11px] text-slate-400">
                    {formatMoneyMajor(b.spent, walletPrimaryCurrency)} / {formatMoneyMajor(b.limit, walletPrimaryCurrency)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, ratio * 100)}%`, backgroundColor: getBudgetBarColor(ratio, false) }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      b.status === "over" ? "text-red-600 bg-red-50" : b.status === "warning" ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"
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
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-slate-800">Grandes gastos · últimos {biggestSpendPatterns.monthsBack} meses</p>
          <p className="text-xs text-slate-400 mb-3">Dónde está tu gasto más grande, y si hay un patrón detrás</p>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div
              onClick={() => setChampionsModalKind("transaction")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setChampionsModalKind("transaction");
              }}
              className="rounded-xl border border-slate-100 p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Transacción más grande</p>
              <p className="text-[13px] font-bold text-slate-800 truncate mt-1">{biggestSpendPatterns.biggestTransaction.name}</p>
              <p className="text-lg font-extrabold text-slate-900">{formatMoneyMajor(biggestSpendPatterns.biggestTransaction.amount, walletPrimaryCurrency)}</p>
              <p className="text-[11px] text-slate-400 truncate">
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setChampionsModalKind("category");
              }}
              className="rounded-xl border border-slate-100 p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Categoría con más gasto</p>
              <p className="text-[13px] font-bold text-slate-800 truncate mt-1">{biggestSpendPatterns.biggestCategory.name}</p>
              <p className="text-lg font-extrabold text-slate-900">{formatMoneyMajor(biggestSpendPatterns.biggestCategory.total, walletPrimaryCurrency)}</p>
              <p className="text-[11px] text-slate-400">{Math.round(biggestSpendPatterns.analysis.categoryShareOfTotal)}% de tu gasto total</p>
            </div>

            {biggestSpendPatterns.biggestSubcategory && (
              <div
                onClick={() => setChampionsModalKind("subCategory")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setChampionsModalKind("subCategory");
                }}
                className="rounded-xl border border-slate-100 p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
              >
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Subcategoría con más gasto</p>
                <p className="text-[13px] font-bold text-slate-800 truncate mt-1">{biggestSpendPatterns.biggestSubcategory.name}</p>
                <p className="text-lg font-extrabold text-slate-900">{formatMoneyMajor(biggestSpendPatterns.biggestSubcategory.total, walletPrimaryCurrency)}</p>
                <p className="text-[11px] text-slate-400">{biggestSpendPatterns.biggestSubcategory.categoryName}</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 -mt-2 mb-2">Toca una tarjeta para ver el detalle mes por mes</p>

          <div className="rounded-xl bg-purple-50 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-purple-700 mb-1.5">Análisis</p>
            <ul className="list-disc pl-4 space-y-1 text-[12.5px] text-slate-700 leading-relaxed">
              {buildSpendPatternAnalysis(biggestSpendPatterns).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Subscriptions */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-slate-800">Suscripciones recurrentes</p>
          <p className="text-xs text-slate-400 mb-3">Detectadas por nombre y frecuencia mensual</p>
          {subscriptions.length === 0 ? (
            <p className="text-xs text-slate-400">No se detectaron suscripciones recurrentes.</p>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveInsight({ icon: "🔁", tone: "info", title: s.name, type: "subscription", data: s });
                    }
                  }}
                  className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-slate-100 first:border-t-0 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    <UniversalCategoIcon type={s.icon} siz={13} colore="#fff" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10.5px] text-slate-400">{s.categoryName}</p>
                  </div>
                  {s.isNew && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">nueva</span>}
                  <span className="text-[12.5px] font-bold text-slate-800 shrink-0">
                    {formatMoneyMajor(s.amount, walletPrimaryCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FX exposure */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <p className="text-[15px] font-extrabold text-slate-800">Exposición multi-moneda</p>
          <p className="text-xs text-slate-400 mb-3">Valor de tus saldos en otras monedas</p>
          {fxExposure.loading ? (
            <p className="text-xs text-slate-400">Consultando tipo de cambio…</p>
          ) : fxExposure.rows.length === 0 ? (
            <p className="text-xs text-slate-400">Todas tus cuentas están en {walletPrimaryCurrency}.</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-wide text-slate-400">
                  <th className="text-left font-bold pb-2">Moneda</th>
                  <th className="text-right font-bold pb-2">Saldo</th>
                  <th className="text-right font-bold pb-2">En {walletPrimaryCurrency}</th>
                  <th className="text-right font-bold pb-2">vs. {previousMonthLabel.split(" ")[0]}</th>
                </tr>
              </thead>
              <tbody>
                {fxExposure.rows.map((r) => (
                  <tr key={r.currency} className="border-t border-slate-100">
                    <td className="py-2 font-semibold text-slate-800">{r.currency}</td>
                    <td className="py-2 text-right text-slate-500">{formatMoneyMajor(r.nativeAmount, r.currency)}</td>
                    <td className="py-2 text-right font-semibold text-slate-800">
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
        onClick={() => setActiveInsight({ icon: "🏃", tone: "info", title: "Ritmo de gasto", type: "spending_pace", data: pace })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setActiveInsight({ icon: "🏃", tone: "info", title: "Ritmo de gasto", type: "spending_pace", data: pace });
          }
        }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-extrabold text-slate-800">Ritmo de gasto</p>
          <span className="text-[11px] font-semibold text-purple-600">Ver detalle →</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">Comparado con tu propio promedio a esta altura del mes</p>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-purple-500" style={{ width: `${pacePct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Llevas gastado {formatMoneyMajor(pace.spentSoFar, walletPrimaryCurrency)} al día {pace.dayOfMonth}
          {pace.deltaPct !== null && (
            <>
              {" — "}
              {pace.deltaPct > 0 ? "más" : "menos"} que tu promedio de{" "}
              {formatMoneyMajor(pace.avgPaceForSameDay, walletPrimaryCurrency)} para esta altura del mes en los últimos
              meses ({Math.abs(Math.round(pace.deltaPct))}%).
            </>
          )}
        </p>
      </div>

      {/* Weekday spending pattern */}
      <div
        onClick={() => setWeekdayDetailOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setWeekdayDetailOpen(true);
        }}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-extrabold text-slate-800">Patrones por día de la semana</p>
          <span className="text-[11px] font-semibold text-purple-600">Ver detalle →</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">Promedio de gasto por día, este mes</p>
        <WalletAnalyzerWeekdayChart days={weekdaySpending.days} walletPrimaryCurrency={walletPrimaryCurrency} />
        <p className="text-xs text-slate-500 mt-3">{weekdaySpending.insight}</p>
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
