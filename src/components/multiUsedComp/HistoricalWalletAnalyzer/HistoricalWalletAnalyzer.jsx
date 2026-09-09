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
import { buildPeriodComparison, getCategoryTransactions } from "@/helpers/transformers/walletAnalyzer";
import { ChangePill, RankRow } from "../walletAnalyzer/WalletAnalyzerView";

// Same joined-row idea as the totals table below, applied to a single
// category: buildPeriodComparison's categoriesBills/categoriesIncomes are
// ALREADY a joined list (ranked by periodA's spend, periodB's value
// alongside) - unlike Top transactions, which stays two independent
// top-N lists since transactions don't repeat period to period. A plain
// RankRow only shows one amount, so this is its two-amount-plus-pill
// sibling, kept local to this file since nothing else needs it yet.
function CategoryCompareRow({ index, item, currency, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className="flex items-center gap-2.5 py-2 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0 cursor-pointer gf-hover-glass transition-colors"
    >
      <span className="w-4 text-[11px] text-gf-text-muted font-bold shrink-0">{index + 1}</span>
      <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
      <p className="flex-1 min-w-0 text-[12.5px] font-semibold text-gf-text truncate">{item.name}</p>
      <span className="text-[11px] text-gf-text-muted shrink-0">{formatMoneyMajor(item.previous, currency)}</span>
      <span className="text-[12.5px] font-bold text-gf-text shrink-0">{formatMoneyMajor(item.current, currency)}</span>
      <span className="shrink-0">
        <ChangePill changePct={item.changePct} isNew={item.isNew} invert={false} />
      </span>
    </div>
  );
}

// The deep, period-vs-period sibling of the Dashboard's own (single-month)
// Wallet Analyzer - reuses buildPeriodComparison (walletAnalyzer.js) so the
// two arbitrary ranges already selected above on this page (via the shared
// usePeriodComparison state - quarter, half, year, custom range, "compare"
// toggle) get the same depth of category/transaction/budget analysis a
// single month gets, instead of only the shallow bar charts the rest of
// History shows. Reuses WalletAnalyzerView's ChangePill/RankRow so both
// Wallet Analyzers speak the same visual language without duplicating them.
function HistoricalWalletAnalyzer({ periodState }) {
  const { timePeriod, comparePeriod, compareEnabled, labelA, labelB } = periodState;
  const [budgets, setBudgets] = useState([]);
  const [topN, setTopN] = useState(6);
  const { email } = useGetUserSession();
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const { close, modalContent, renderModal, handleClose } = useModal();

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

  const comparison = useMemo(() => {
    if (!compareEnabled) return null;
    if (!timePeriod?.[0] || !timePeriod?.[1] || !comparePeriod?.[0] || !comparePeriod?.[1]) return null;
    if (transactions.length < 1) return null;
    const rangeA = { start: timePeriod[0], end: timePeriod[1] };
    const rangeB = { start: comparePeriod[0], end: comparePeriod[1] };
    return buildPeriodComparison({ transactions, budgets, rangeA, rangeB, labelA, labelB, topN });
  }, [compareEnabled, timePeriod, comparePeriod, transactions, budgets, labelA, labelB, topN]);

  function openCategoryModal(item, isBill) {
    const range = { start: timePeriod[0], end: timePeriod[1] };
    const children = getCategoryTransactions(transactions, item.name, isBill, range);
    renderModal(
      <ModalContentTopMonthItem
        item={{ name: item.name, icon: item.icon, color: item.color, isBill, value: item.current, children }}
        close={handleClose}
      />
    );
  }

  function openTransactionModal(item) {
    const raw = transactionsById.get(item._id);
    if (!raw) return;
    renderModal(<ModalContentTopMonthItem item={raw} close={handleClose} />);
  }

  if (!compareEnabled) {
    return (
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 text-center">
        <p className="text-[15px] font-extrabold text-gf-text mb-1">Wallet Analyzer · comparativo</p>
        <p className="text-xs text-gf-text-muted">
          Activa &quot;Comparar&quot; arriba para ver el análisis profundo entre los dos periodos seleccionados.
        </p>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 text-center">
        <p className="text-xs text-gf-text-muted">Cargando comparativo…</p>
      </div>
    );
  }

  const { periodA, periodB, categoriesBills, categoriesIncomes, transactionsBills, budgetChanges } = comparison;
  const savingsRateChangePp = Math.round((periodA.totals.savingsRate - periodB.totals.savingsRate) * 100);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl text-center font-bold text-gf-text">Wallet Analyzer · comparativo</h2>
        <p className="text-xs text-gf-text-muted text-center">
          {labelA} vs. {labelB}
        </p>
      </div>

      {/* Totals */}
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
        <p className="text-[15px] font-extrabold text-gf-text">{labelA} vs. {labelB}</p>
        <p className="text-xs text-gf-text-muted mb-3">Comparativo de totales entre los dos periodos seleccionados</p>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wide text-gf-text-muted">
              <th className="text-left font-bold pb-2"></th>
              <th className="text-right font-bold pb-2 text-gf-text-muted">{labelB}</th>
              <th className="text-right font-bold pb-2">{labelA}</th>
              <th className="text-right font-bold pb-2">Cambio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 text-gf-text-muted">Ingresos</td>
              <td className="py-2 text-right text-gf-text-muted">{formatMoneyMajor(periodB.totals.income, walletPrimaryCurrency)}</td>
              <td className="py-2 text-right font-semibold text-gf-text">{formatMoneyMajor(periodA.totals.income, walletPrimaryCurrency)}</td>
              <td className="py-2 text-right">
                <ChangePill changePct={periodB.totals.income > 0 ? ((periodA.totals.income - periodB.totals.income) / periodB.totals.income) * 100 : null} invert />
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gf-text-muted border-t border-gf-border">Gastos</td>
              <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(periodB.totals.expense, walletPrimaryCurrency)}</td>
              <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{formatMoneyMajor(periodA.totals.expense, walletPrimaryCurrency)}</td>
              <td className="py-2 text-right border-t border-gf-border">
                <ChangePill changePct={periodB.totals.expense > 0 ? ((periodA.totals.expense - periodB.totals.expense) / periodB.totals.expense) * 100 : null} />
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gf-text-muted border-t border-gf-border">Balance</td>
              <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{formatMoneyMajor(periodB.totals.balance, walletPrimaryCurrency)}</td>
              <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{formatMoneyMajor(periodA.totals.balance, walletPrimaryCurrency)}</td>
              <td className="py-2 text-right border-t border-gf-border">
                <ChangePill changePct={periodB.totals.balance > 0 ? ((periodA.totals.balance - periodB.totals.balance) / periodB.totals.balance) * 100 : null} invert />
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gf-text-muted border-t border-gf-border">Tasa de ahorro</td>
              <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{Math.round(periodB.totals.savingsRate * 100)}%</td>
              <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{Math.round(periodA.totals.savingsRate * 100)}%</td>
              <td className="py-2 text-right border-t border-gf-border">
                <ChangePill changePct={savingsRateChangePp === 0 ? null : savingsRateChangePp} unit="pp" invert />
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gf-text-muted border-t border-gf-border">Transacciones</td>
              <td className="py-2 text-right text-gf-text-muted border-t border-gf-border">{periodB.totals.transactionCount}</td>
              <td className="py-2 text-right font-semibold text-gf-text border-t border-gf-border">{periodA.totals.transactionCount}</td>
              <td className="py-2 text-right border-t border-gf-border">
                <ChangePill
                  changePct={
                    periodB.totals.transactionCount > 0
                      ? ((periodA.totals.transactionCount - periodB.totals.transactionCount) / periodB.totals.transactionCount) * 100
                      : null
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Item-count control */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <p className="text-xs font-semibold text-gf-text-muted">Elementos en categorías y transacciones</p>
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

      {/* Top categories - one joined ranked list per kind, both periods' amounts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} categorías · gastos</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB} → {labelA}</p>
          {categoriesBills.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin gastos en estos periodos.</p>
          ) : (
            categoriesBills.map((c, i) => (
              <CategoryCompareRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, true)} />
            ))
          )}
        </div>
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} categorías · ingresos</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB} → {labelA}</p>
          {categoriesIncomes.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin ingresos en estos periodos.</p>
          ) : (
            categoriesIncomes.map((c, i) => (
              <CategoryCompareRow key={c.name} index={i} item={c} currency={walletPrimaryCurrency} onClick={() => openCategoryModal(c, false)} />
            ))
          )}
        </div>
      </div>

      {/* Top transactions - two independent top-N lists, same as the Dashboard's own Wallet Analyzer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-purple-300">Top {topN} transacciones</p>
          <p className="text-[15px] font-extrabold text-gf-text mb-2">{labelB}</p>
          {transactionsBills.previous.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin transacciones en este periodo.</p>
          ) : (
            transactionsBills.previous.map((t, i) => (
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
          {transactionsBills.current.length === 0 ? (
            <p className="text-xs text-gf-text-muted">Sin transacciones en este periodo.</p>
          ) : (
            transactionsBills.current.map((t, i) => (
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

      {/* Budget limit/spend changes between the two periods */}
      <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5">
        <p className="text-[15px] font-extrabold text-gf-text">Presupuestos · cambios entre periodos</p>
        <p className="text-xs text-gf-text-muted mb-3">
          Gasto acumulado contra el límite de cada presupuesto ({labelB} → {labelA})
        </p>
        {budgetChanges.length === 0 ? (
          <p className="text-xs text-gf-text-muted">No hay presupuestos con datos en estos periodos.</p>
        ) : (
          <div className="flex flex-col">
            {budgetChanges.map((row) => {
              const ratioA = row.periodA && row.periodA.goal > 0 ? row.periodA.actual / row.periodA.goal : 0;
              const changePct =
                row.periodA && row.periodB && row.periodB.actual > 0
                  ? ((row.periodA.actual - row.periodB.actual) / row.periodB.actual) * 100
                  : null;
              return (
                <div key={row.budgetId} className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg border-t border-gf-border first:border-t-0">
                  <span className="w-24 shrink-0 text-[12.5px] font-semibold text-gf-text truncate">{row.category}</span>
                  <span className="w-36 shrink-0 text-[11px] text-gf-text-muted truncate">
                    {row.periodB ? formatMoneyMajor(row.periodB.actual, walletPrimaryCurrency) : "—"} →{" "}
                    {row.periodA ? formatMoneyMajor(row.periodA.actual, walletPrimaryCurrency) : "—"}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gf-surface-2 overflow-hidden">
                    {row.periodA && (
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, ratioA * 100)}%`, backgroundColor: getBudgetBarColor(ratioA, false) }}
                      />
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

      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </div>
  );
}

export default HistoricalWalletAnalyzer;
