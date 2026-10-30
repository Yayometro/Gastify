"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IoAirplaneOutline, IoArrowForward, IoCarSportOutline, IoInformationCircleOutline, IoTrendingUpOutline } from "react-icons/io5";
import { GiArcheryTarget } from "react-icons/gi";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import useBudgetsInPrimaryCurrency from "@/hooks/money/useBudgetsInPrimaryCurrency";
import { useLinkedAccountsTotal } from "@/helpers/hooks/useLinkedAccountsTotal";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import { isSavingBudget } from "@/helpers/transformers/budgetTypes";
import { formatMoneyMajor, formatMoneyMinor, majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import { resolveOpportunityMoney, scanOpportunityTransactions } from "@gastify/core/opportunities/transactions";
import { compareOpportunityWithGoal, opportunityPrincipal } from "@gastify/core/opportunities/scenarios";
import { projectSingleDeposit } from "@gastify/core/opportunities/investment";
import { affordability, carAffordability, DOWN_PAYMENT_FRACTION, ILLUSTRATIVE_REFERENCE_YEAR, ILLUSTRATIVE_TRIPS, suggestWasteCategories, type IllustrativeItem } from "@gastify/core/opportunities/story";
import { findOverlappingSavingAccounts } from "@gastify/core/goals/progress";
import type { OpportunityDateRange, OpportunityDimension } from "@gastify/core/opportunities/types";
import { useInfo, useLocale, useT } from "@/i18n/client";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import type { InfoText } from "@gastify/core/info/createInfo";
import { useGrowthCategoryPreferences } from "@/hooks/useGrowthCategoryPreferences";
import { calculateBudgetOverage } from "@gastify/core/opportunities/budgetOverage";
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
const kindOf = (tx: TransactionData): string => tx.kind || (tx.isIncome ? "income" : tx.isBill ? "expense" : "income");
// What the person typed in a number box: an empty box is nothing (never a forced 0), and the comma counts as a decimal point.
const typed = (value: string): number | null => {
  const text = value.trim().replace(",", ".");
  if (text === "") return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
};

type Preset = "year" | "quarter" | "month" | "custom";
type SourceId = "all" | "overage" | `cat:${string}`;

// A bar: how much of something is covered, 0..1.
function Bar({ ratio, from, to, label }: { ratio: number; from: string; to: string; label: string }): React.JSX.Element {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped * 100)} className="h-3 w-full overflow-hidden rounded-full bg-gf-surface-2">
      <div className={"h-full rounded-full bg-gradient-to-r " + from + " " + to} style={{ width: clamped * 100 + "%" }} />
    </div>
  );
}

// "Growth opportunities": where the money went that did not add much to your life (or the budgets you went over) and what it
// could have been. The simple view prepares the sources; the advanced mode keeps every filter. Numbers come from core.
export default function OpportunitiesClient(): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const locale = useLocale();
  const info = (key: string): InfoText => APP_INFO[key] as InfoText;
  const transactionsState = useSelector((state: RootState) => state.transacctionsReducer);
  const storedBudgets = useSelector((state: RootState) => state.budgetReducer?.data || []);
  const accounts = useSelector((state: RootState) => state.accountsReducer?.data || []);
  const categoriesState = useSelector((state: RootState) => state.categoriesReducer?.data);
  const subCategoriesState = useSelector((state: RootState) => state.subCategoryReducer?.data);
  const growthPreferences = useGrowthCategoryPreferences();
  const currency = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const transactions = transactionsState.data as TransactionData[];
  const convertedBudgets = useBudgetsInPrimaryCurrency(storedBudgets, currency);
  const availableGoals = useMemo(() => convertedBudgets.filter((budget) => !budget.archived && isSavingBudget(budget as never) && (!budget.goalDetails || budget.goalDetails.status === "active")), [convertedBudgets]);
  const fundingConflicts = useMemo(() => findOverlappingSavingAccounts(storedBudgets.filter((budget) => !budget.archived && isSavingBudget(budget as never)).map((budget) => ({
    id: idOf(budget), name: budget.name, linkedAccountIds: (budget.linkedAccounts || []).map(idOf).filter(Boolean),
  }))), [storedBudgets]);
  const today = useMemo(() => new Date(), []);
  const [range, setRange] = useState<OpportunityDateRange>(() => ({ startDate: today.getFullYear() + "-01-01", endDate: dayText(today), complete: false }));
  const [preset, setPreset] = useState<Preset>("year");
  const [advanced, setAdvanced] = useState(false);
  const [source, setSource] = useState<SourceId>("all");
  const [dimension, setDimension] = useState<OpportunityDimension>("all");
  const [selectedId, setSelectedId] = useState("");
  const [concept, setConcept] = useState("");
  const [shareInput, setShareInput] = useState("10");
  const [rateInput, setRateInput] = useState("12");
  const [yearsInput, setYearsInput] = useState("1");
  const [tripInput, setTripInput] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [movementLimit, setMovementLimit] = useState(20);
  const completeHistory = transactionsState.historyStatus === "complete";
  const isMxn = currency === "MXN";

  const categories = useMemo(() => [...(categoriesState?.user || []), ...(categoriesState?.default || [])], [categoriesState]);
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

  // What was spent in each category in the period (the base for the suggestions and for the bars).
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of transactions) {
      if (kindOf(tx) !== "expense" || (tx.state && tx.state !== "completed") || !tx.date) continue;
      const date = new Date(tx.date);
      if (Number.isNaN(date.getTime())) continue;
      const day = dayText(date);
      if (day < range.startDate || day > range.endDate) continue;
      const id = idOf(tx.category);
      const money = resolveOpportunityMoney(tx, currency);
      if (!id || !money || money.currency !== currency) continue;
      totals.set(id, (totals.get(id) || 0) + Math.abs(money.amountMinor));
    }
    return totals;
  }, [transactions, currency, range.startDate, range.endDate]);
  const categoryNames = useMemo(() => new Map(categories.map((item) => [idOf(item), item.name || ""])), [categories]);
  // The categories to put in front: the ones the person chose to cut, or else the ones that look like indulgences by name.
  const categorySources = useMemo(() => {
    const chosen = growthPreferences.preferences
      .map((preference) => ({ id: preference.categoryId, name: categoryNames.get(preference.categoryId) || "", amountMinor: categoryTotals.get(preference.categoryId) || 0, share: preference.reductionPercent, chosen: true, hint: "" }))
      .filter((item) => item.name && item.amountMinor > 0)
      .sort((a, b) => b.amountMinor * b.share - a.amountMinor * a.share)
      .slice(0, 2);
    if (chosen.length > 0) return chosen;
    return suggestWasteCategories([...categoryTotals].map(([id, amountMinor]) => ({ id, name: categoryNames.get(id) || "", amountMinor })).filter((row) => row.name)).map((item) => ({ id: item.id, name: item.name, amountMinor: item.amountMinor, share: 10, chosen: false, hint: item.kind }));
  }, [growthPreferences.preferences, categoryTotals, categoryNames]);

  const sourceCategoryId = !advanced && source.startsWith("cat:") ? source.slice(4) : "";
  const filters = useMemo(() => advanced ? {
    includeAllExpenses: dimension === "all",
    categoryIds: dimension === "category" && selectedId ? [selectedId] : [],
    subCategoryIds: dimension === "subcategory" && selectedId ? [selectedId] : [],
    tagIds: dimension === "tag" && selectedId ? [selectedId] : [],
    conceptQuery: dimension === "concept" ? concept.trim() : "",
    primaryCurrency: currency,
  } : sourceCategoryId ? { categoryIds: [sourceCategoryId], primaryCurrency: currency } : { includeAllExpenses: true, primaryCurrency: currency }, [advanced, dimension, selectedId, concept, currency, sourceCategoryId]);
  const regularScan = useMemo(() => scanOpportunityTransactions(transactions, filters, range), [transactions, filters, range]);
  const budgetOverage = useMemo(() => calculateBudgetOverage({ transactions, budgets: convertedBudgets, range, currency }), [transactions, convertedBudgets, range, currency]);
  const overageSelected = !advanced && source === "overage";
  const scan = useMemo(() => overageSelected ? {
    ...regularScan, amountMinor: budgetOverage.amountMinor, refundMinor: 0, feeMinor: 0,
    missingFxCount: budgetOverage.missingFxCount, unmatchedRefundCount: 0,
    count: new Set(budgetOverage.cycles.flatMap((cycle) => cycle.transactionIds)).size,
    transactionIds: [...new Set(budgetOverage.cycles.flatMap((cycle) => cycle.transactionIds))],
  } : regularScan, [overageSelected, regularScan, budgetOverage]);
  const allSpendMinor = useMemo(() => scanOpportunityTransactions(transactions, { includeAllExpenses: true, primaryCurrency: currency }, range).amountMinor, [transactions, currency, range]);

  const share = overageSelected ? 100 : Math.min(100, Math.max(0, typed(shareInput) ?? 0));
  const principalMinor = opportunityPrincipal(scan.amountMinor, share / 100) ?? 0;
  const principal = minorToMajor(principalMinor, currency);
  const money = (value: number) => formatMoneyMajor(value, currency);

  // Your goal
  const selectedGoal = availableGoals.find((item) => String(item._id) === selectedGoalId) || availableGoals[0];
  const linkedGoalAccounts = selectedGoal ? accounts.filter((account) => (selectedGoal.linkedAccounts || []).map(idOf).includes(idOf(account))) : [];
  const linkedGoalTotal = useLinkedAccountsTotal(linkedGoalAccounts, currency);
  const goalLinkedIds = (selectedGoal?.linkedAccounts || []).map(idOf).filter(Boolean);
  const goalConflict = selectedGoal ? fundingConflicts.get(idOf(selectedGoal)) : undefined;
  const goalMissingAccounts = goalLinkedIds.filter((id) => !linkedGoalAccounts.some((account) => idOf(account) === id));
  const goalCurrencies = new Set(linkedGoalTotal.breakdown.breakdown.map((item) => item.currency));
  const goalMissingCurrencies = [...new Set(linkedGoalAccounts.map((account) => account.currency || currency))].filter((code) => !goalCurrencies.has(code));
  const goalIncomplete = Boolean(selectedGoal && (selectedGoal.conversionUnavailable || goalConflict?.accountIds.length || goalMissingAccounts.length || goalMissingCurrencies.length));
  const goalSaved = selectedGoal ? (linkedGoalAccounts.length > 0 ? linkedGoalTotal.total : Math.max(0, Number(selectedGoal.savingAmount) || 0)) : 0;
  const goalTarget = selectedGoal ? Math.max(0, Number(selectedGoal.goalAmount) || 0) : 0;
  const goalComparison = selectedGoal && !goalIncomplete ? compareOpportunityWithGoal({ expenseMinor: scan.amountMinor, percent: share / 100, targetMinor: majorToMinor(goalTarget, currency), savedMinor: majorToMinor(goalSaved, currency) }) : null;

  // Investment: nothing typed means the default (12 % for 1 year), but the box itself stays empty while the person types.
  const rate = typed(rateInput);
  const years = typed(yearsInput);
  const annualRate = Math.min(1, Math.max(-0.99, (rate ?? 12) / 100));
  const horizon = Math.min(60, Math.max(0, years ?? 1));
  const investment = projectSingleDeposit({ principalMinor, currency, annualEffectiveRate: annualRate, years: horizon, asOf: dayText(today) });
  const yearsText = horizon === 1 ? t("opportunities.row.investYearOne") : t("opportunities.row.investYearMany", { p1: String(horizon) });

  // Trip and car examples (rough pesos)
  const itemName = (item: IllustrativeItem): string => t("opportunities.item." + item.id, { p1: formatMoneyMajor(item.priceMxn, "MXN") });
  const trips = isMxn ? affordability(principal, ILLUSTRATIVE_TRIPS) : null;
  const cars = isMxn ? carAffordability(principal) : null;
  const customTrip = typed(tripInput);
  const percent = (ratio: number): string => Math.round(Math.min(1, Math.max(0, ratio)) * 100) + "%";

  const rangeStart = rangeDate(range.startDate);
  const rangeEnd = rangeDate(range.endDate);
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
  const periodText = preset === "custom" ? t("opportunities.period.custom", { p1: range.startDate, p2: range.endDate }) : t("opportunities.period." + preset);
  const pickSource = (id: SourceId, defaultShare: string) => { setSource(id); setShareInput(defaultShare); };
  const matchedTransactions = useMemo(() => {
    const ids = new Set(scan.transactionIds);
    return transactions.filter((tx) => ids.has(idOf(tx))).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [transactions, scan.transactionIds]);

  const card = "gf-glass-card flex h-full flex-col rounded-3xl border border-gf-border p-4 sm:p-6";
  const row = "rounded-2xl border border-gf-border bg-gf-surface/30 p-4";
  const sourceButton = (active: boolean) => "w-full rounded-2xl border p-3.5 text-left text-sm transition-colors " + (active ? "border-purple-300/60 bg-purple-300/10 text-gf-text" : "border-gf-border text-gf-text-muted hover:border-purple-200");
  const numberBox = "mt-1 w-full";

  return (
    <main className="min-h-[calc(100vh-70px)] w-full px-3 pb-16 pt-5 sm:px-6 xl:px-8">
      <header className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-tour="opp-title">
        <div>
          <TitleWithHelp as="h1" title={t("opportunities.title")} info={info("oportunidades_de_crecimiento")} tour="budOpportunities" titleClassName="text-3xl font-semibold text-gf-text sm:text-4xl" />
          <p className="mt-2 max-w-3xl text-sm text-gf-text-muted">{t("opportunities.subtitle")}</p>
        </div>
        <Link href="/dashboard/goals" className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-gf-border px-4 py-2.5 text-sm text-gf-text sm:self-auto">{t("goals.title")}<IoArrowForward aria-hidden="true" /></Link>
      </header>

      <section className="mx-auto mt-6 grid w-full max-w-[1800px] items-stretch gap-4 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <div className={card}>
          <p className="text-sm leading-relaxed text-gf-text" data-tour="opp-lead">{t("opportunities.lead")}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3" data-tour="opp-period">
            <p className="text-base font-semibold text-gf-text">{periodText}</p>
            <div role="group" aria-label={t("opportunities.range")} className="flex max-w-full gap-1 overflow-x-auto rounded-full gf-glass-inset p-1.5">
              {(["month", "quarter", "year"] as const).map((item) => <button key={item} type="button" aria-pressed={preset === item} onClick={() => setPresetRange(item)} className={"shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " + (preset === item ? "gf-glass-button text-white" : "text-gf-text-muted hover:text-gf-text")}>{t("opportunities.preset." + item)}</button>)}
              <button type="button" aria-pressed={preset === "custom"} onClick={() => setPreset("custom")} className={"shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " + (preset === "custom" ? "gf-glass-button text-white" : "text-gf-text-muted hover:text-gf-text")}>{t("opportunities.preset.custom")}</button>
            </div>
          </div>
          {preset === "custom" && rangeStart && rangeEnd && <div className="mt-3"><TimeRange startDateValue={rangeStart} endDateValue={rangeEnd} rpDate={applyRange} /></div>}
          {!completeHistory && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/90"><IoInformationCircleOutline className="mt-0.5 shrink-0" />{t("opportunities.partial")}</div>}

          {!advanced ? (
            <div className="mt-6" data-tour="opp-sources">
              <TitleWithHelp as="h2" title={t("opportunities.src.title")} info={info("fuentes_de_oportunidad")} titleClassName="text-lg font-semibold text-gf-text" />
              <p className="mt-1 text-xs text-gf-text-muted">{t("opportunities.src.sub")}</p>
              <div className="mt-3 flex flex-col gap-2.5">
                <button type="button" aria-pressed={source === "all"} onClick={() => pickSource("all", "10")} className={sourceButton(source === "all")}>
                  <span className="block font-semibold text-gf-text">{t("opportunities.src.allTitle")}</span>
                  <span className="mt-1 block text-xs">{t("opportunities.src.allLine", { p1: (source === "all" ? share : 10) + "%", p2: formatMoneyMinor(allSpendMinor, currency), p3: formatMoneyMinor(opportunityPrincipal(allSpendMinor, (source === "all" ? share : 10) / 100) || 0, currency) })}</span>
                  <span className="mt-2.5 block"><Bar ratio={(source === "all" ? share : 10) / 100} from="from-cyan-300" to="to-purple-400" label={t("opportunities.src.share", { p1: source === "all" ? share : 10 })} /></span>
                </button>
                <button type="button" disabled={budgetOverage.amountMinor <= 0} aria-pressed={source === "overage"} onClick={() => pickSource("overage", "100")} className={sourceButton(source === "overage") + (budgetOverage.amountMinor <= 0 ? " cursor-not-allowed opacity-60" : "")}>
                  <span className="block font-semibold text-gf-text">{t("opportunities.src.overageTitle")}</span>
                  <span className="mt-1 block text-xs">{budgetOverage.amountMinor > 0 ? t("opportunities.src.overageLine", { p1: formatMoneyMinor(budgetOverage.amountMinor, currency), p2: budgetOverage.cycles.length }) : t("opportunities.src.overageNone")}</span>
                  {budgetOverage.amountMinor > 0 && <span className="mt-2.5 block"><Bar ratio={1} from="from-rose-300" to="to-orange-300" label={t("opportunities.src.overageTitle")} /></span>}
                </button>
                {categorySources.map((item) => {
                  const active = source === "cat:" + item.id;
                  const shown = active ? share : item.share;
                  return (
                    <button key={item.id} type="button" aria-pressed={active} onClick={() => pickSource(("cat:" + item.id) as SourceId, String(item.share))} className={sourceButton(active)}>
                      <span className="block font-semibold text-gf-text">{t(item.chosen ? "opportunities.src.yourCategory" : "opportunities.src.suggested", { p1: item.name })}</span>
                      <span className="mt-1 block text-xs">{t("opportunities.src.categoryLine", { p1: formatMoneyMinor(item.amountMinor, currency), p2: shown + "%", p3: formatMoneyMinor(opportunityPrincipal(item.amountMinor, shown / 100) || 0, currency) })}</span>
                      {!item.chosen && item.hint && <span className="mt-0.5 block text-[11px] text-gf-text-muted">{t("opportunities.src.hint." + item.hint)}</span>}
                      <span className="mt-2.5 block"><Bar ratio={shown / 100} from="from-amber-300" to="to-pink-400" label={t("opportunities.src.share", { p1: shown })} /></span>
                    </button>
                  );
                })}
                <Link href="/dashboard/categories" className="flex items-center justify-center rounded-xl border border-dashed border-gf-border p-2.5 text-center text-xs text-purple-200 hover:border-purple-300/50">{t("opportunities.src.manage")}</Link>
              </div>
            </div>
          ) : (
            <div className="mt-6" data-tour="opp-advanced">
              <TitleWithHelp as="h2" title={t("opportunities.adv.title")} info={info("modo_avanzado_oportunidades")} titleClassName="text-lg font-semibold text-gf-text" />
              <p className="mt-1 text-xs text-gf-text-muted">{t("opportunities.adv.intro")}</p>
              <div className="form-trans-edit mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1.5"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gf-text-muted">{t("opportunities.dimension")}<InfoTip info={info("filtros_de_oportunidades")} /></span>
                  <select value={dimension} onChange={(event) => { setDimension(event.target.value as OpportunityDimension); setSelectedId(""); }} className="etm-selector">
                    <option value="all">{t("opportunities.adv.byAll")}</option><option value="category">{t("opportunities.category")}</option><option value="subcategory">{t("opportunities.subcategory")}</option><option value="tag">{t("opportunities.tag")}</option><option value="concept">{t("opportunities.concept")}</option>
                  </select></label>
                {dimension === "all" ? null : dimension === "concept"
                  ? <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-semibold text-gf-text-muted">{t("opportunities.adv.concept")}</span><input value={concept} onChange={(event) => setConcept(event.target.value)} placeholder={t("opportunities.search")} /></label>
                  : <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-semibold text-gf-text-muted">{t("opportunities.adv.pick")}</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="etm-selector"><option value="">{t("opportunities.adv.pick")}</option>{selectedChoices.filter((item) => item.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-purple-300/20 bg-purple-300/[.05] p-4 sm:p-5" data-tour="opp-share">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-gf-text-muted">{advanced ? t("opportunities.adv.total") : t("opportunities.base.observed")}</p><p className="mt-1 text-2xl font-bold tracking-tight text-gf-text sm:text-3xl">{formatMoneyMinor(scan.amountMinor, currency)}</p></div>
              <span className="rounded-full border border-gf-border px-3 py-1 text-xs text-gf-text-muted">{t("opportunities.count", { p1: scan.count })}</span>
            </div>
            {!overageSelected && <div className="mt-5">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-gf-text">{t("opportunities.share.label")}<InfoTip info={info("parte_del_gasto")} /></p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(advanced ? [10, 25, 50, 100] : [5, 10]).map((value) => (
                  <button key={value} type="button" aria-pressed={share === value} onClick={() => setShareInput(String(value))} className={"rounded-full border px-4 py-2 text-sm font-bold transition-colors " + (share === value ? "border-purple-300/70 bg-purple-300/15 text-gf-text" : "border-gf-border bg-gf-surface/20 text-gf-text-muted hover:border-purple-300/40")}>{value}%</button>
                ))}
                <label className="form-trans-edit ml-1 flex items-center gap-2 text-xs text-gf-text-muted"><span>{t("opportunities.share.other")}</span><input type="number" inputMode="decimal" min="0" max="100" step="1" value={shareInput} onChange={(event) => setShareInput(event.target.value)} className="w-20" /></label>
              </div>
            </div>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gf-border/70 pt-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-gf-text-muted">{t("opportunities.base.title")}</span>
              <strong className="text-lg text-purple-200 sm:text-xl">{money(principal)}</strong>
            </div>
            <p className="mt-1 text-[11px] text-gf-text-muted">{t("opportunities.base.hint")}</p>
          </div>

          {scan.count === 0 && <p className="mt-4 rounded-xl border border-gf-border p-3 text-sm text-gf-text-muted">{t("opportunities.noSpend")}</p>}
          {scan.unmatchedRefundCount > 0 && <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/90">{t("opportunities.refunds", { p1: scan.unmatchedRefundCount })} · {formatMoneyMinor(scan.refundMinor, currency)}</p>}
          {scan.feeMinor > 0 && <p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.fees", { p1: formatMoneyMinor(scan.feeMinor, currency) })}</p>}
          {(scan.excludedCount > 0 || scan.missingFxCount > 0) && <p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.exclude", { p1: scan.excludedCount + scan.missingFxCount })}</p>}
          {scan.staleFxCount > 0 && <p className="mt-2 text-xs text-amber-200">{t("opportunities.staleFx", { p1: scan.staleFxCount })}</p>}

          {overageSelected && budgetOverage.cycles.length > 0 && <details className="mt-3 rounded-2xl border border-gf-border bg-gf-surface/25 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-gf-text">{t("opportunities.overageBreakdown")}</summary>
            <p className="mt-2 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.overageBreakdownHelp")}</p>
            <ul className="mt-3 divide-y divide-gf-border/70">{budgetOverage.cycles.map((cycle) => <li key={cycle.key} className="py-2 text-xs"><div className="flex items-center justify-between gap-2"><strong className="text-gf-text">{cycle.name || t("budgets.kind.spending")}</strong><strong className="text-rose-200">+{formatMoneyMinor(cycle.overageMinor, currency)}</strong></div><p className="mt-1 text-gf-text-muted">{cycle.periodStart} – {cycle.periodEnd} · {t("opportunities.overageSpentAndLimit", { p1: formatMoneyMinor(cycle.spentMinor, currency), p2: formatMoneyMinor(cycle.limitMinor, currency) })}</p></li>)}</ul>
            {budgetOverage.conflictCount > 0 && <p className="mt-2 text-xs text-amber-200">{t("opportunities.overageConflicts", { p1: budgetOverage.conflictCount })}</p>}
          </details>}

          {scan.count > 0 && <details className="mt-4 rounded-2xl border border-gf-border bg-gf-surface/30 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-gf-text">{t("opportunities.movements", { p1: scan.count })}</summary>
            {overageSelected && <p className="mt-2 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.overageMovementsNote")}</p>}
            <ul className="mt-3 divide-y divide-gf-border/70">
              {matchedTransactions.slice(0, movementLimit).map((tx) => {
                const amount = resolveOpportunityMoney(tx, currency);
                const date = tx.date ? new Date(tx.date) : null;
                return <li key={idOf(tx)} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <span className="min-w-0"><strong className="block truncate text-gf-text">{tx.name || t("opportunities.concept")}</strong><span className="text-gf-text-muted">{labelOf(tx.category) || t("history.noCategory")}{date && !Number.isNaN(date.getTime()) ? " · " + new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "medium" }).format(date) : ""}</span></span>
                  <span className="shrink-0 text-gf-text">{amount && amount.currency === currency ? formatMoneyMinor(amount.amountMinor, currency) : "—"}</span>
                </li>;
              })}
            </ul>
            {matchedTransactions.length > movementLimit && <button type="button" onClick={() => setMovementLimit((current) => Math.min(current + 20, matchedTransactions.length))} className="mt-2 text-xs font-semibold text-purple-200">{t("opportunities.showMore", { p1: Math.min(20, matchedTransactions.length - movementLimit) })}</button>}
          </details>}

          <div className="mt-auto pt-5">
            <button type="button" onClick={() => { setAdvanced(!advanced); if (advanced) { setSource("all"); setShareInput("10"); } }} className="rounded-full border border-gf-border px-4 py-2 text-xs font-semibold text-purple-200">{advanced ? t("opportunities.simple") : t("opportunities.advanced")}</button>
          </div>
        </div>

        <div className={card} data-tour="opp-results">
          <TitleWithHelp as="h2" title={t("opportunities.right.title", { p1: money(principal) })} info={info("tres_alternativas_de_ese_monto")} titleClassName="text-lg font-semibold text-gf-text" />
          <p className="mt-1 text-xs text-gf-text-muted">{t("opportunities.right.sub")}</p>

          <div className="mt-4 flex flex-1 flex-col gap-3">
            <article className={row} data-tour="opp-goal">
              <div className="flex items-center gap-2"><GiArcheryTarget className="text-purple-300" aria-hidden="true" /><h3 className="font-semibold text-gf-text">{selectedGoal ? t("opportunities.row.goalTitle", { p1: selectedGoal.name || t('goals.untitled') }) : t("goals.title")}</h3><InfoTip info={info("metas_en_oportunidades")} /></div>
              {availableGoals.length > 1 && <label className="form-trans-edit mt-2 block text-xs font-medium text-gf-text-muted"><select aria-label={t("opportunities.growthPath.target")} value={selectedGoal?._id || ""} onChange={(event) => setSelectedGoalId(event.target.value)} className="etm-selector">{availableGoals.map((goal) => <option key={goal._id} value={goal._id}>{goal.name}</option>)}</select></label>}
              {selectedGoal ? (
                goalIncomplete ? <p className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/5 p-2 text-xs text-amber-200">{goalConflict?.accountIds.length ? t("goals.sharedAccounts", { p1: goalConflict.otherNames.join(", ") }) : goalMissingAccounts.length ? t("goals.missingAccounts") : t("goals.partialFx")}</p>
                : goalComparison && <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
                  <p className="text-sm text-gf-text md:flex-1">{goalComparison.simulatedRemainingMinor <= 0 ? t("opportunities.row.goalDone") : t("opportunities.row.goalLine", { p1: money(minorToMajor(goalComparison.simulatedSavedMinor, currency)), p2: money(goalTarget), p3: percent(goalComparison.targetCoverage) })}</p>
                  <div className="md:w-[45%]"><Bar ratio={goalComparison.targetCoverage} from="from-purple-400" to="to-fuchsia-300" label={t("opportunities.progressBarLabel")} /></div>
                </div>
              ) : <p className="mt-2 text-sm text-gf-text-muted">{t("opportunities.row.goalNone")}</p>}
              <Link href={selectedGoal ? "/dashboard/goals" : "/dashboard/goals?new=1"} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-200 underline decoration-purple-200/30 underline-offset-4">{selectedGoal ? t("opportunities.row.goalOpen") : t("opportunities.row.goalCreate")}<IoArrowForward aria-hidden="true" /></Link>
            </article>

            <article className={row} data-tour="opp-invest">
              <div className="flex items-center gap-2"><IoTrendingUpOutline className="text-emerald-300" aria-hidden="true" /><h3 className="font-semibold text-gf-text">{t("opportunities.row.investTitle")}</h3><InfoTip info={info("inversion_ilustrativa")} /></div>
              <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
                <p className="text-sm text-gf-text md:flex-1">{t("opportunities.row.investLine", { p1: String(rate ?? 12), p2: yearsText, p3: money(minorToMajor(investment?.valueMinor || 0, currency)), p4: money(minorToMajor(investment?.returnMinor || 0, currency)) })}</p>
                <div className="form-trans-edit flex gap-3 md:w-[45%]">
                  <label className="min-w-0 flex-1 text-xs font-medium text-gf-text-muted"><span>{t("opportunities.row.investRate")}</span><input type="number" inputMode="decimal" min="-99" max="100" step="0.5" value={rateInput} placeholder="12" onChange={(event) => setRateInput(event.target.value)} className={numberBox} /></label>
                  <label className="min-w-0 flex-1 text-xs font-medium text-gf-text-muted"><span>{t("opportunities.row.investYears")}</span><input type="number" inputMode="decimal" min="0" max="60" step="0.5" value={yearsInput} placeholder="1" onChange={(event) => setYearsInput(event.target.value)} className={numberBox} /></label>
                </div>
              </div>
            </article>

            <article className={row} data-tour="opp-trip">
              <div className="flex items-center gap-2"><IoAirplaneOutline className="text-cyan-300" aria-hidden="true" /><h3 className="font-semibold text-gf-text">{t("opportunities.row.tripTitle")}</h3><InfoTip info={info("viaje_en_oportunidades")} /></div>
              {isMxn && trips ? (
                <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
                  <div className="md:flex-1">
                    {customTrip && customTrip > 0
                      ? <p className="text-sm text-gf-text">{t("opportunities.row.tripCustomLine", { p1: percent(principal / customTrip) })}</p>
                      : <>
                        {trips.reachable && <p className="text-sm text-gf-text">{t("opportunities.row.tripReach", { p1: itemName(trips.reachable) })}</p>}
                        {trips.next && <p className="mt-1 text-xs text-gf-text-muted">{trips.reachable ? t("opportunities.row.tripNext", { p1: itemName(trips.next), p2: percent(trips.nextCoverage) }) : t("opportunities.row.tripNone", { p1: itemName(trips.next), p2: percent(trips.nextCoverage) })}</p>}
                      </>}
                  </div>
                  <div className="md:w-[45%]">
                    <Bar ratio={customTrip && customTrip > 0 ? principal / customTrip : trips.next ? trips.nextCoverage : 1} from="from-cyan-400" to="to-teal-300" label={t("opportunities.progressBarLabel")} />
                    <label className="form-trans-edit mt-2 block text-xs font-medium text-gf-text-muted"><span>{t("opportunities.row.tripCustom")} ({currency})</span><input type="number" inputMode="decimal" min="0" value={tripInput} placeholder={t("opportunities.row.tripPlaceholder")} onChange={(event) => setTripInput(event.target.value)} className={numberBox} /></label>
                  </div>
                </div>
              ) : <p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.row.carOnlyMxn")}</p>}
            </article>

            <article className={row} data-tour="opp-car">
              <div className="flex items-center gap-2"><IoCarSportOutline className="text-amber-300" aria-hidden="true" /><h3 className="font-semibold text-gf-text">{t("opportunities.row.carTitle")}</h3><InfoTip info={info("enganche_de_carro")} /></div>
              {isMxn && cars ? (
                <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
                  <div className="md:flex-1">
                    {cars.downPayment && <p className="text-sm text-gf-text">{t("opportunities.row.carDown", { p1: itemName(cars.downPayment) })}</p>}
                    {cars.cash && <p className="mt-1 text-sm text-gf-text">{t("opportunities.row.carCash", { p1: itemName(cars.cash) })}</p>}
                    {cars.nextDownPayment && <p className="mt-1 text-xs text-gf-text-muted">{cars.downPayment ? t("opportunities.row.carNext", { p1: itemName(cars.nextDownPayment), p2: percent(cars.nextDownPaymentCoverage) }) : t("opportunities.row.carNone", { p1: itemName(cars.nextDownPayment), p2: percent(cars.nextDownPaymentCoverage) })}</p>}
                  </div>
                  <div className="md:w-[45%]"><Bar ratio={cars.nextDownPayment ? cars.nextDownPaymentCoverage : 1} from="from-amber-300" to="to-orange-400" label={t("opportunities.progressBarLabel")} /><p className="mt-1 text-[11px] text-gf-text-muted">{t("opportunities.row.carDownNote", { p1: Math.round(DOWN_PAYMENT_FRACTION * 100) })}</p></div>
                </div>
              ) : <p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.row.carOnlyMxn")}</p>}
            </article>
          </div>
          {isMxn && <p className="mt-3 text-[11px] leading-relaxed text-gf-text-muted">{t("opportunities.examplesNote", { p1: String(ILLUSTRATIVE_REFERENCE_YEAR) })}</p>}
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-purple-300/15 bg-purple-300/[.04] p-3 text-xs leading-relaxed text-gf-text-muted"><span className="font-semibold text-gf-text">{t("opportunities.disclaimerTitle")}:</span><span>{t("opportunities.disclaimerBody")}</span></p>
        </div>
      </section>
    </main>
  );
}
