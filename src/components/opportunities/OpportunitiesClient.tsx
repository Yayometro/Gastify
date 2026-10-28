"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IoArrowForward, IoInformationCircleOutline, IoSparkles } from "react-icons/io5";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import useBudgetsInPrimaryCurrency from "@/hooks/money/useBudgetsInPrimaryCurrency";
import { useLinkedAccountsTotal } from "@/helpers/hooks/useLinkedAccountsTotal";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import { isSavingBudget } from "@/helpers/transformers/budgetTypes";
import { formatMoneyMajor, formatMoneyMinor, majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import { resolveOpportunityMoney, scanOpportunityTransactions } from "@gastify/core/opportunities/transactions";
import { compareOpportunityWithGoal, opportunityPrincipal } from "@gastify/core/opportunities/scenarios";
import { projectDatedExpenses, projectSingleDeposit } from "@gastify/core/opportunities/investment";
import { findOverlappingSavingAccounts } from "@gastify/core/goals/progress";
import type { OpportunityDateRange, OpportunityDimension } from "@gastify/core/opportunities/types";
import { useInfo, useLocale, useT } from "@/i18n/client";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import type { InfoText } from "@gastify/core/info/createInfo";
import "@/components/multiUsedComp/css/muliUsed.css";

const idOf = (value: unknown): string => String((value as { _id?: unknown } | null)?.["_id"] ?? value ?? "");
const dayText = (value: Date): string => value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0") + "-" + String(value.getDate()).padStart(2, "0");
const rangeDate = (value: string): Date | null => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
};
const field = (value: unknown, key: string): unknown => (value as Record<string, unknown> | null)?.[key];
const labelOf = (value: unknown): string => String(field(value, "name") || "");

function kindOf(tx: TransactionData): string {
  return tx.kind || (tx.isIncome ? "income" : tx.isBill ? "expense" : "income");
}

export default function OpportunitiesClient(): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const periodInfo = APP_INFO.periodo_de_oportunidades as InfoText;
  const shareInfo = APP_INFO.parte_del_gasto as InfoText;
  const investmentInfo = APP_INFO.inversion_ilustrativa as InfoText;
  const scenariosInfo = APP_INFO.tres_alternativas_de_ese_monto as InfoText;
  const travelInfo = APP_INFO.viaje_en_oportunidades as InfoText;
  const goalInfo = APP_INFO.metas_en_oportunidades as InfoText;
  const locale = useLocale();
  const transactionsState = useSelector((state: RootState) => state.transacctionsReducer);
  const storedBudgets = useSelector((state: RootState) => state.budgetReducer?.data || []);
  const accounts = useSelector((state: RootState) => state.accountsReducer?.data || []);
  const categoriesState = useSelector((state: RootState) => state.categoriesReducer?.data);
  const subCategoriesState = useSelector((state: RootState) => state.subCategoryReducer?.data);
  const currency = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const transactions = transactionsState.data as TransactionData[];
  const convertedBudgets = useBudgetsInPrimaryCurrency(storedBudgets, currency);
  const availableGoals = useMemo(() => convertedBudgets.filter((budget) => !budget.archived && isSavingBudget(budget as never) && budget.goalDetails?.status === "active"), [convertedBudgets]);
  const fundingConflicts = useMemo(() => findOverlappingSavingAccounts(storedBudgets.filter((budget) => !budget.archived && isSavingBudget(budget as never)).map((budget) => ({
    id: idOf(budget), name: budget.name, linkedAccountIds: (budget.linkedAccounts || []).map(idOf).filter(Boolean),
  }))), [storedBudgets]);
  const today = useMemo(() => new Date(), []);
  const [range, setRange] = useState<OpportunityDateRange>(() => ({ startDate: today.getFullYear() + "-01-01", endDate: dayText(today), complete: false }));
  const [preset, setPreset] = useState<"year" | "quarter" | "month" | "custom">("year");
  const [dimension, setDimension] = useState<OpportunityDimension>("all");
  const [selectedId, setSelectedId] = useState("");
  const [concept, setConcept] = useState("");
  const [share, setShare] = useState(25);
  const [ratePercent, setRatePercent] = useState(6);
  const [horizonYears, setHorizonYears] = useState(1);
  const [travelTarget, setTravelTarget] = useState(260000);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [movementLimit, setMovementLimit] = useState(20);
  const completeHistory = transactionsState.historyStatus === "complete";

  const categories = [...(categoriesState?.user || []), ...(categoriesState?.default || [])];
  const subCategories = [...(subCategoriesState?.subCat || []), ...(subCategoriesState?.default || [])];
  const tagChoices = useMemo(() => {
    const tags = new Map<string, string>();
    for (const transaction of transactions) for (const tag of transaction.tags || []) {
      const id = idOf(tag);
      const name = labelOf(tag);
      if (id && name) tags.set(id, name);
    }
    return [...tags].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);

  const selectedChoices = dimension === "category"
    ? categories.map((item) => ({ id: idOf(item), name: item.name || "" }))
    : dimension === "subcategory"
      ? subCategories.map((item) => ({ id: idOf(item), name: item.name || "" }))
      : dimension === "tag" ? tagChoices : [];

  const filters = useMemo(() => ({
    includeAllExpenses: dimension === "all",
    categoryIds: dimension === "category" && selectedId ? [selectedId] : [],
    subCategoryIds: dimension === "subcategory" && selectedId ? [selectedId] : [],
    tagIds: dimension === "tag" && selectedId ? [selectedId] : [],
    conceptQuery: dimension === "concept" ? concept.trim() : "",
    primaryCurrency: currency,
  }), [dimension, selectedId, concept, currency]);
  const scan = useMemo(() => scanOpportunityTransactions(transactions, filters, range), [transactions, filters, range]);
  const selectedGoal = availableGoals.find((item) => String(item._id) === selectedGoalId) || availableGoals[0];
  const linkedGoalAccounts = selectedGoal ? accounts.filter((account) => (selectedGoal.linkedAccounts || []).map(idOf).includes(idOf(account))) : [];
  const linkedGoalTotal = useLinkedAccountsTotal(linkedGoalAccounts, currency);
  const selectedGoalLinkedIds = (selectedGoal?.linkedAccounts || []).map(idOf).filter(Boolean);
  const selectedGoalFundingConflict = selectedGoal ? fundingConflicts.get(idOf(selectedGoal)) : undefined;
  const selectedGoalMissingAccounts = selectedGoalLinkedIds.filter((id) => !linkedGoalAccounts.some((account) => idOf(account) === id));
  const selectedGoalAvailableCurrencies = new Set(linkedGoalTotal.breakdown.breakdown.map((item) => item.currency));
  const selectedGoalMissingCurrencies = [...new Set(linkedGoalAccounts.map((account) => account.currency || currency))].filter((code) => !selectedGoalAvailableCurrencies.has(code));
  const selectedGoalFundingIncomplete = Boolean(selectedGoal && (selectedGoal.conversionUnavailable || selectedGoalFundingConflict?.accountIds.length || selectedGoalMissingAccounts.length || selectedGoalMissingCurrencies.length));
  const selectedGoalSaved = selectedGoal
    ? linkedGoalAccounts.length > 0 ? linkedGoalTotal.total : Math.max(0, Number(selectedGoal.savingAmount) || 0)
    : 0;
  const selectedGoalTarget = selectedGoal ? Math.max(0, Number(selectedGoal.goalAmount) || 0) : 0;
  const principalMinor = opportunityPrincipal(scan.amountMinor, share / 100);
  const actualMoney = minorToMajor(scan.amountMinor, currency);
  const principal = principalMinor === null ? 0 : minorToMajor(principalMinor, currency);
  const refund = minorToMajor(scan.refundMinor, currency);
  const fees = minorToMajor(scan.feeMinor, currency);
  const datedExpenses = useMemo(() => {
    const ids = new Set(scan.transactionIds);
    return transactions.filter((tx) => ids.has(idOf(tx)) && kindOf(tx) === "expense" && tx.date).flatMap((tx) => {
      const money = resolveOpportunityMoney(tx, currency);
      if (!money) return [];
      return [{
      amountMinor: Math.round(Math.abs(money.amountMinor) * share / 100),
      date: (() => { const date = new Date(tx.date as Date | string); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10); })(),
    }];
    }).filter((expense) => expense.amountMinor > 0 && expense.date);
  }, [transactions, scan.transactionIds, share, currency]);
  const projectionNow = dayText(today);
  const annualRate = Math.min(1, Math.max(-0.99, Number.isFinite(ratePercent) ? ratePercent / 100 : 0));
  const investmentYears = Number.isFinite(horizonYears) ? Math.min(60, Math.max(0, horizonYears)) : 0;
  const investmentNow = projectSingleDeposit({ principalMinor: principalMinor || 0, currency, annualEffectiveRate: annualRate, years: investmentYears, asOf: projectionNow });
  const historicalInvestment = projectDatedExpenses({ expenses: datedExpenses, currency, annualEffectiveRate: annualRate, asOf: projectionNow });
  const matchedTransactions = useMemo(() => {
    const ids = new Set(scan.transactionIds);
    return transactions.filter((tx) => ids.has(idOf(tx))).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [transactions, scan.transactionIds]);
  const travelCoverage = travelTarget > 0 ? (principal / travelTarget) * 100 : 0;
  const goalComparison = selectedGoal && !selectedGoalFundingIncomplete ? compareOpportunityWithGoal({
    expenseMinor: scan.amountMinor,
    percent: share / 100,
    targetMinor: majorToMinor(selectedGoalTarget, currency),
    savedMinor: majorToMinor(selectedGoalSaved, currency),
  }) : null;
  const rangeStart = rangeDate(range.startDate);
  const rangeEnd = rangeDate(range.endDate);
  const displayDate = (date: Date): string => new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "medium" }).format(date);
  const setPresetRange = (value: "year" | "quarter" | "month") => {
    setPreset(value);
    const end = new Date();
    const start = value === "month" ? new Date(end.getFullYear(), end.getMonth(), 1) : value === "quarter" ? new Date(end.getFullYear(), Math.floor(end.getMonth() / 3) * 3, 1) : new Date(end.getFullYear(), 0, 1);
    setRange({ startDate: dayText(start), endDate: dayText(end), complete: completeHistory });
  };
  const applyRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return;
    const [a, b] = start <= end ? [start, end] : [end, start];
    setPreset("custom");
    setRange({ startDate: dayText(a), endDate: dayText(b), complete: completeHistory });
  };

  return (
    <main className="min-h-[calc(100vh-70px)] w-full px-3 pb-16 pt-5 sm:px-6 xl:px-8">
      <header className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-semibold text-gf-text sm:text-4xl">{t("opportunities.title")}</h1><p className="mt-2 max-w-3xl text-sm text-gf-text-muted">{t("opportunities.subtitle")}</p></div>
        <Link href="/dashboard/goals" className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-gf-border px-4 py-2.5 text-sm text-gf-text sm:self-auto">{t("goals.title")}<IoArrowForward aria-hidden="true" /></Link>
      </header>

      <section className="mx-auto mt-6 grid w-full max-w-[1800px] items-stretch gap-4 2xl:grid-cols-[minmax(0,1.04fr)_minmax(0,.96fr)]">
        <div className="gf-glass-card flex h-full flex-col rounded-3xl border border-gf-border p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-gf-text">{t("opportunities.range")}</h2><InfoTip info={periodInfo} /></div><div role="group" aria-label={t("opportunities.range")} className="flex max-w-full gap-1 overflow-x-auto rounded-full gf-glass-inset p-1.5">{(["month", "quarter", "year"] as const).map((item) => <button key={item} type="button" aria-pressed={preset === item} onClick={() => setPresetRange(item)} className={"shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " + (preset === item ? "gf-glass-button text-white" : "text-gf-text-muted hover:text-gf-text")}>{t("opportunities.preset." + item)}</button>)}<button type="button" aria-pressed={preset === "custom"} onClick={() => setPreset("custom")} className={"shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " + (preset === "custom" ? "gf-glass-button text-white" : "text-gf-text-muted hover:text-gf-text")}>{t("opportunities.preset.custom")}</button></div></div>
          {rangeStart && rangeEnd && <><div className="mt-4"><TimeRange startDateValue={rangeStart} endDateValue={rangeEnd} rpDate={applyRange} styles="flex w-fit max-w-full items-center justify-center gap-1 rounded-full gf-glass-inset px-2 py-2" /></div><p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.del.p1.al.p2", { p1: displayDate(rangeStart), p2: displayDate(rangeEnd) })}</p></>}
          <p className="mt-2 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.periodHelp")}</p>
          <p className="mt-3 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.rangeWarning")}</p>
          {!completeHistory && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/90"><IoInformationCircleOutline className="mt-0.5 shrink-0" />{t("opportunities.partial")}</div>}

          <div className="form-trans-edit mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-semibold text-gf-text-muted">{t("opportunities.dimension")}</span><select value={dimension} onChange={(event) => { setDimension(event.target.value as OpportunityDimension); setSelectedId(""); }} className="etm-selector"><option value="all">{t("opportunities.allExpenses")}</option><option value="category">{t("opportunities.category")}</option><option value="subcategory">{t("opportunities.subcategory")}</option><option value="tag">{t("opportunities.tag")}</option><option value="concept">{t("opportunities.concept")}</option></select></label>
            {dimension === "all" ? <p className="flex items-end pb-2 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.allExpensesHelp")}</p> : dimension === "concept" ? <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-semibold text-gf-text-muted">{t("opportunities.concept")}</span><input value={concept} onChange={(event) => setConcept(event.target.value)} placeholder={t("opportunities.search")} /></label> : <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-semibold text-gf-text-muted">{t("opportunities.select")}</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="etm-selector"><option value="">{t("opportunities.select")}</option>{selectedChoices.filter((item) => item.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.filterHelp")}</p>
          <div className="mt-6 rounded-2xl border border-purple-300/20 bg-purple-300/[.05] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gf-text-muted">{t("opportunities.observedTotal")}<InfoTip info={shareInfo} /></p><p className="mt-1 text-2xl font-bold tracking-tight text-gf-text sm:text-3xl">{formatMoneyMajor(actualMoney, currency)}</p></div><span className="rounded-full border border-gf-border px-3 py-1 text-xs text-gf-text-muted">{t("opportunities.count", { p1: scan.count })}</span></div>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-gf-text">{t("opportunities.shareQuestion")}</p><p className="mt-1 text-xs text-gf-text-muted">{t("opportunities.shareHelp")}</p></div><div className="form-trans-edit flex w-28 shrink-0 items-center gap-2"><label htmlFor="growth-custom-share" className="sr-only">{t("opportunities.customShare")}</label><input id="growth-custom-share" aria-label={t("opportunities.customShare")} type="number" min="0" max="100" step="1" value={share} onChange={(event) => setShare(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} /><span className="text-sm font-semibold text-gf-text">%</span></div></div>
            <div role="group" aria-label={t("opportunities.shareQuestion")} className="mt-4 grid grid-cols-3 gap-2">{[25, 50, 100].map((value) => {
              const optionAmount = minorToMajor(opportunityPrincipal(scan.amountMinor, value / 100) || 0, currency);
              return <button key={value} type="button" aria-pressed={share === value} onClick={() => setShare(value)} className={"flex min-w-0 flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors " + (share === value ? "border-purple-300/70 bg-purple-300/15 text-gf-text" : "border-gf-border bg-gf-surface/20 text-gf-text-muted hover:border-purple-300/40")}><span className="text-sm font-bold">{value}%</span><span className="mt-0.5 truncate text-[11px]">{formatMoneyMajor(optionAmount, currency)}</span></button>;
            })}</div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gf-border/70 pt-3"><span className="text-xs text-gf-text-muted">{t("opportunities.referenceAmount")} · {t("opportunities.amountOfObserved", { p1: share + "%" })}</span><strong className="text-lg text-purple-200 sm:text-xl">{formatMoneyMajor(principal, currency)}</strong></div>
          </div>
          {scan.count === 0 && <p className="mt-4 rounded-xl border border-gf-border p-3 text-sm text-gf-text-muted">{t("opportunities.noSpend")}</p>}
          {scan.unmatchedRefundCount > 0 && <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/90">{t("opportunities.refunds", { p1: scan.unmatchedRefundCount })} · {formatMoneyMajor(refund, currency)}</p>}
          {fees > 0 && <p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.fees", { p1: formatMoneyMajor(fees, currency) })}</p>}
          {(scan.excludedCount > 0 || scan.missingFxCount > 0) && <p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.exclude", { p1: scan.excludedCount + scan.missingFxCount })}</p>}
          {scan.staleFxCount > 0 && <p className="mt-2 text-xs text-amber-200">{t("opportunities.staleFx", { p1: scan.staleFxCount })}</p>}
          {scan.count > 0 && <details className="mt-4 rounded-2xl border border-gf-border bg-gf-surface/30 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-gf-text">{t("opportunities.movements", { p1: scan.count })}</summary>
            <ul className="mt-3 divide-y divide-gf-border/70">
              {matchedTransactions.slice(0, movementLimit).map((tx) => {
                const money = resolveOpportunityMoney(tx, currency);
                const categoryName = labelOf(tx.category) || t("history.noCategory");
                const date = tx.date ? new Date(tx.date) : null;
                return <li key={idOf(tx)} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <span className="min-w-0"><strong className="block truncate text-gf-text">{tx.name || t("opportunities.concept")}</strong><span className="text-gf-text-muted">{categoryName}{date && !Number.isNaN(date.getTime()) ? " · " + new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "medium" }).format(date) : ""}</span></span>
                  <span className="shrink-0 text-gf-text">{money && money.currency === currency ? formatMoneyMinor(money.amountMinor, currency) : "—"}</span>
                </li>;
              })}
            </ul>
            {matchedTransactions.length > movementLimit && <button type="button" onClick={() => setMovementLimit((current) => Math.min(current + 20, matchedTransactions.length))} className="mt-2 text-xs font-semibold text-purple-200">{t("opportunities.showMore", { p1: Math.min(20, matchedTransactions.length - movementLimit) })}</button>}
          </details>}
        </div>

        <div className="gf-glass-card flex h-full flex-col rounded-3xl border border-gf-border p-4 sm:p-6">
          <div className="flex items-center gap-2"><IoSparkles className="text-purple-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-gf-text">{t("opportunities.threeExamples")}</h2><InfoTip info={scenariosInfo} /></div>
          <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.sameAmountNote")}</p>
          <div className="mt-4 flex flex-1 snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-2">
            <article className="flex h-full w-[calc((100%-1.5rem)/3)] min-w-[220px] shrink-0 snap-start flex-col rounded-2xl border border-gf-border bg-gf-surface/30 p-4">
              <div className="flex items-center gap-1.5"><h3 className="font-semibold text-gf-text">{t("opportunities.investment")}</h3><InfoTip info={investmentInfo} /></div>
              <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.investmentHelp")}</p>
              <div className="form-trans-edit mt-3 grid grid-cols-2 gap-3"><label className="min-w-0 text-xs font-medium text-gf-text-muted"><span>{t("opportunities.rateField")}</span><input type="number" min="-99" max="100" step="0.1" value={ratePercent} onChange={(event) => setRatePercent(Math.min(100, Math.max(-99, Number(event.target.value) || 0)))} className="mt-1" /></label><label className="min-w-0 text-xs font-medium text-gf-text-muted"><span>{t("opportunities.horizonField")}</span><input type="number" min="0" max="60" step="0.5" value={horizonYears} onChange={(event) => setHorizonYears(Math.min(60, Math.max(0, Number(event.target.value) || 0)))} className="mt-1" /></label></div>
              <div className="mt-3 rounded-xl border border-purple-300/15 bg-purple-300/[.04] px-3 py-2.5"><span className="text-xs text-gf-text-muted">{t("opportunities.startingAmount")}</span><strong className="mt-1 block text-sm text-gf-text">{formatMoneyMajor(principal, currency)}</strong></div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-gf-border/70 p-3"><p className="text-xs text-gf-text-muted">{t("opportunities.singleDeposit")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMajor(minorToMajor(investmentNow?.valueMinor || 0, currency), currency)}</p><p className="mt-0.5 text-[11px] text-emerald-300">+{formatMoneyMajor(minorToMajor(investmentNow?.returnMinor || 0, currency), currency)} {t("opportunities.simulatedReturn")}</p></div>
                <div className="rounded-xl border border-gf-border/70 p-3"><p className="text-xs text-gf-text-muted">{t("opportunities.datedDeposits")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMajor(minorToMajor(historicalInvestment?.valueMinor || 0, currency), currency)}</p><p className="mt-0.5 text-[11px] text-emerald-300">+{formatMoneyMajor(minorToMajor(historicalInvestment?.returnMinor || 0, currency), currency)} {t("opportunities.simulatedReturn")}</p></div>
              </div>
            </article>
            <article className="flex h-full w-[calc((100%-1.5rem)/3)] min-w-[220px] shrink-0 snap-start flex-col rounded-2xl border border-gf-border bg-gf-surface/30 p-4">
              <div className="flex items-center gap-1.5"><h3 className="font-semibold text-gf-text">{t("opportunities.travel")}</h3><InfoTip info={travelInfo} /></div>
              <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.travelTargetHelp")}</p>
              <label className="form-trans-edit mt-3 block text-xs font-medium text-gf-text-muted"><span>{t("opportunities.exampleGoalCurrency", { p1: currency })}</span><input type="number" min="1" value={travelTarget} onChange={(event) => setTravelTarget(Math.max(1, Number(event.target.value) || 1))} className="mt-1" /></label>
              <div className="mt-4 rounded-xl border border-gf-border/70 p-3"><p className="text-xs text-gf-text-muted">{t("opportunities.referenceAmount")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMajor(principal, currency)}</p><p className="mt-0.5 text-[11px] text-cyan-200">{travelCoverage.toFixed(1)}% {t("opportunities.goalCoverage")}</p><div role="progressbar" aria-label={t("opportunities.progressBarLabel")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, travelCoverage))} className="mt-3 h-3 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300" style={{ width: Math.min(100, Math.max(0, travelCoverage)) + "%" }} /></div><p className="mt-2 text-[11px] leading-relaxed text-gf-text-muted">{t("opportunities.unallocated")}</p></div>
            </article>
            <article className="flex h-full w-[calc((100%-1.5rem)/3)] min-w-[220px] shrink-0 snap-start flex-col rounded-2xl border border-gf-border bg-gf-surface/30 p-4">
              <div className="flex items-center gap-1.5"><h3 className="font-semibold text-gf-text">{t("opportunities.downPayment")}</h3><InfoTip info={goalInfo} /></div>
              <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.goalPickerHelp")}</p>
              {availableGoals.length ? <label className="form-trans-edit mt-3 block text-xs font-medium text-gf-text-muted">{t("opportunities.growthPath.target")}<select aria-label={t("opportunities.growthPath.target")} value={selectedGoal?._id || ""} onChange={(event) => setSelectedGoalId(event.target.value)} className="etm-selector mt-1">{availableGoals.map((goal) => <option key={goal._id} value={goal._id}>{goal.name}</option>)}</select></label> : <div className="mt-3 rounded-xl border border-gf-border/70 p-3"><p className="text-sm font-semibold text-gf-text">{t("opportunities.growthPath.target")}</p><p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.growthPath.createGoal")}</p></div>}
              {selectedGoalFundingIncomplete && <p className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/5 p-2 text-xs text-amber-200">{selectedGoalFundingConflict?.accountIds.length ? t("goals.sharedAccounts", { p1: selectedGoalFundingConflict.otherNames.join(", ") }) : selectedGoalMissingAccounts.length ? t("goals.missingAccounts") : t("goals.partialFx")}</p>}
              {goalComparison && <div className="mt-4 rounded-xl border border-gf-border/70 p-3"><p className="text-xs text-gf-text-muted">{t("opportunities.progressBarLabel")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMajor(minorToMajor(goalComparison.simulatedSavedMinor, currency), currency)}</p><p className="mt-0.5 text-[11px] text-gf-text-muted">{t("opportunities.goalProgress", { p1: (goalComparison.targetCoverage * 100).toFixed(1) + "%" })}</p><div role="progressbar" aria-label={t("opportunities.progressBarLabel")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, goalComparison.targetCoverage * 100))} className="mt-3 h-3 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-300" style={{ width: Math.min(100, Math.max(0, goalComparison.targetCoverage * 100)) + "%" }} /></div><p className="mt-2 text-[11px] text-gf-text-muted">{t("goals.remaining")}: {formatMoneyMajor(minorToMajor(goalComparison.simulatedRemainingMinor, currency), currency)}</p></div>}
              <Link href="/dashboard/goals?new=1" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-purple-200 underline decoration-purple-200/30 underline-offset-4">{availableGoals.length ? t("opportunities.openGoals") : t("opportunities.addGoal")}<IoArrowForward aria-hidden="true" /></Link>
            </article>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-purple-300/15 bg-purple-300/[.04] p-3 text-xs leading-relaxed text-gf-text-muted"><span className="font-semibold text-gf-text">{t("opportunities.disclaimerTitle")}:</span><span>{t("opportunities.disclaimerBody")}</span></p>
        </div>
      </section>
    </main>
  );
}
