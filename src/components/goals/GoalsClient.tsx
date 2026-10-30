"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd, IoArrowForward, IoCheckmarkCircle, IoPause, IoPlay, IoTrash } from "react-icons/io5";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import BudgetEditModal, { type BudgetModalItem } from "@/components/multiUsedComp/Budgets/BudgetEditModal";
import { useLinkedAccountsTotal } from "@/helpers/hooks/useLinkedAccountsTotal";
import { updateBudget, removeBudget, type BudgetData } from "@/lib/features/budgetSlice";
import { isSavingBudget, BUDGET_TYPES } from "@/helpers/transformers/budgetTypes";
import type { RootState, AppDispatch } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import { formatMoneyMajor, majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import { calculateGoalSchedule } from "@gastify/core/goals/schedule";
import { findOverlappingSavingAccounts, isEligibleGoalFundingAccountType } from "@gastify/core/goals/progress";
import { useLocale, useT } from "@/i18n/client";
import { useInfo } from "@/i18n/client";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import type { InfoText } from "@gastify/core/info/createInfo";
import { getBudgetBarColor, getBudgetBarGradient, getBudgetMoodEmoji } from "@/helpers/transformers/budgetHistory";
import GoalDetailModal from "@/components/goals/GoalDetailModal";

function GoalCard({ budget, currency, fundingConflict, onEdit, onOpenDetail, onUpdate, onArchive }: {
  budget: BudgetData;
  currency: string;
  fundingConflict?: { accountIds: string[]; otherNames: string[] };
  onEdit: () => void;
  onOpenDetail: () => void;
  onUpdate: (changes: Partial<BudgetData>) => void;
  onArchive: () => void;
}): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const accounts = useSelector((state: RootState) => state.accountsReducer?.data || []);
  const linkedIds = (budget.linkedAccounts || []).map((item) => String((item as { _id?: unknown })?._id ?? item));
  const linkedAccounts = accounts.filter((account) => linkedIds.includes(String(account._id)));
  const goalCurrency = budget.currency || currency;
  const linkedTotal = useLinkedAccountsTotal(linkedAccounts, goalCurrency);
  const availableCurrencies = new Set(linkedTotal.breakdown.breakdown.map((item) => item.currency));
  const missingCurrencies = [...new Set(linkedAccounts.map((account) => account.currency || goalCurrency))].filter((code) => !availableCurrencies.has(code));
  const missingLinkedAccounts = linkedIds.filter((id) => !linkedAccounts.some((account) => String(account._id) === id));
  const ineligibleAccounts = linkedAccounts.filter((account) => !isEligibleGoalFundingAccountType(account.accountType));
  const accountBalancesComplete = !missingLinkedAccounts.length && !missingCurrencies.length && !ineligibleAccounts.length && !budget.conversionUnavailable;
  const hasSharedAccounts = Boolean(fundingConflict?.accountIds.length);
  const fundingIncomplete = hasSharedAccounts || !accountBalancesComplete;
  const showProvisionalProgress = hasSharedAccounts && accountBalancesComplete;
  const canShowProgress = !fundingIncomplete || showProvisionalProgress;
  const target = Math.max(0, Number(budget.goalAmount) || 0);
  const manualSaved = Math.max(0, Number(budget.savingAmount) || 0);
  const saved = linkedIds.length ? linkedTotal.total : manualSaved;
  const ratio = target > 0 ? saved / target : 0;
  const displayRatio = canShowProgress ? ratio : 0;
  const progressColor = getBudgetBarColor(displayRatio, true);
  const progressGradient = getBudgetBarGradient(displayRatio, true);
  const progressPercentage = Math.round(Math.min(100, Math.max(0, displayRatio * 100)));
  const progressMarkerLeft = `clamp(0px, calc(${progressPercentage}% - 20px), calc(100% - 40px))`;
  const date = budget.goalDetails?.targetDate;
  const status = budget.goalDetails?.status || "active";
  // Earlier builds used a Fluent `flag` slug that is not shipped in the icon set.
  // Keep existing goals visible and use the real bullseye icon as the default.
  const icon = !budget.icon || budget.icon === "fluent/flag" ? "fluent/bullseye" : budget.icon;
  const color = budget.color || "#9B7CFF";
  const schedule = !fundingIncomplete && budget.goalDetails?.schedule && budget.goalDetails.targetDate
    ? calculateGoalSchedule({
        targetMinor: majorToMinor(target, goalCurrency),
        savedMinor: majorToMinor(saved, goalCurrency),
        today: new Intl.DateTimeFormat("en-CA", { timeZone: budget.goalDetails.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
        details: budget.goalDetails,
      })
    : null;
  const templateLabel = budget.goalDetails ? t("goals.template." + budget.goalDetails.template) : t("goals.legacySavings");
  const toggleStatus = () => {
    if (!budget.goalDetails) { onEdit(); return; }
    onUpdate({ goalDetails: { ...budget.goalDetails, status: status === "paused" ? "active" : "paused" } });
  };
  const markPurposeDone = () => {
    if (!budget.goalDetails) return;
    onUpdate({ goalDetails: { ...budget.goalDetails, status: "completed", purposeCompletedAt: new Date().toISOString() } });
  };

  return (
    <article className="gf-glass-card rounded-3xl border border-gf-border p-4 sm:p-5" style={{ borderColor: color + "55" }}>
      <button type="button" onClick={onOpenDetail} aria-label={t("goals.openNamed", { p1: budget.name || t("goals.untitled") })} className="block w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ color, backgroundColor: color + "22" }}><UniversalCategoIcon type={icon} siz={24} /></span>
          <span className="min-w-0"><span className="block truncate text-lg font-semibold text-gf-text">{budget.name || t("goals.untitled")}</span><span className="mt-1 block text-xs text-gf-text-muted">{templateLabel} · {t("goals.status." + status)}</span></span>
            </span>
          <span className="flex shrink-0 items-center gap-2">{canShowProgress ? <><span className="text-4xl" title={t("budgets.howDoing")}>{getBudgetMoodEmoji(displayRatio, true)}</span><span className="rounded-full border border-gf-border px-2.5 py-1 text-xs font-bold text-gf-text">{progressPercentage}%</span></> : <span className="rounded-full border border-gf-border px-2.5 py-1 text-xs font-bold text-gf-text">—</span>}</span>
        </div>
        <div className="relative my-4 h-5 rounded-full bg-gf-surface-2" role="progressbar" aria-label={showProvisionalProgress ? t("goals.linkedBalanceShared") : t("goals.progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={canShowProgress ? progressPercentage : 0}>
          <span className="block h-full rounded-full transition-all" style={{ width: canShowProgress ? Math.min(100, Math.max(0, ratio * 100)) + "%" : "0%", background: progressGradient }} />
          {canShowProgress && <span aria-hidden="true" className="absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-[3px] bg-gf-surface text-[10px] font-extrabold text-gf-text shadow-md" style={{ left: progressMarkerLeft, borderColor: progressColor }}>{progressPercentage}%</span>}
        </div>
        <div className="flex items-start justify-between gap-3 text-xs"><span className="font-semibold text-gf-text">{canShowProgress ? formatMoneyMajor(saved, goalCurrency) : "—"}<span className="mt-1 block font-normal text-gf-text-muted">{showProvisionalProgress ? t("goals.linkedBalanceShared") : t("goals.progress")}</span></span><span className="text-right font-semibold text-gf-text">{formatMoneyMajor(target, goalCurrency)}<span className="mt-1 block font-normal text-gf-text-muted">{t("goals.target")}</span></span></div>
        {fundingConflict?.accountIds.length ? <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/5 px-3 py-2 text-xs text-amber-100">{t("goals.sharedAccounts", { p1: fundingConflict.otherNames.join(", ") })}</p> : null}
        {missingLinkedAccounts.length > 0 && <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/5 px-3 py-2 text-xs text-amber-100">{t("goals.missingAccounts")}</p>}
        {ineligibleAccounts.length > 0 && <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/5 px-3 py-2 text-xs text-amber-100">{t("goals.ineligibleAccounts")}</p>}
        {schedule?.status === "ready" && schedule.contributionMinor !== null && <p className="mt-2 text-xs text-gf-text-muted">{t("goals.perPayment", { p1: formatMoneyMajor(minorToMajor(schedule.contributionMinor, goalCurrency), goalCurrency), p2: schedule.paymentDates.length })}</p>}
        {schedule?.status === "underfunded" && <p className="mt-2 text-xs text-amber-200">{t("goals.underfundedPlan")}</p>}
        {schedule?.status === "past_due" && <p className="mt-2 text-xs text-amber-200">{t("goals.pastDue")}</p>}
        {linkedIds.length > 0 && missingCurrencies.length > 0 && <p className="mt-2 text-xs text-amber-200">{t("goals.partialFx")}</p>}
        {date && <p className="mt-2 text-xs text-gf-text-muted">{t("goals.targetDate")}: {new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"))}</p>}
        {linkedIds.length > 0 && <p className="mt-2 text-[11px] text-gf-text-muted">{t("goals.accountsSource")}{linkedTotal.breakdown.breakdown.length < new Set(linkedAccounts.map((account) => account.currency || goalCurrency)).size ? " · " + t("goals.partialFx") : ""}</p>}
        {!budget.goalDetails && <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs text-amber-100/80">{t("goals.legacySavingsHelp")}</p>}
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {budget.goalDetails && <button type="button" onClick={toggleStatus} className="inline-flex items-center gap-1.5 rounded-full border border-gf-border px-3 py-1.5 text-xs text-gf-text">{status === "paused" ? <IoPlay /> : <IoPause />}{status === "paused" ? t("goals.resume") : t("goals.pause")}</button>}
        {budget.goalDetails && status !== "completed" && <button type="button" onClick={markPurposeDone} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-200"><IoCheckmarkCircle />{t("goals.markDone")}</button>}
        <button type="button" onClick={onEdit} className="rounded-full border border-gf-border px-3 py-1.5 text-xs font-semibold text-gf-text">{t("goals.edit")}</button>
        <button type="button" onClick={onArchive} aria-label={t("goals.archive")} className="rounded-full border border-red-300/25 px-2.5 py-1.5 text-red-300"><IoTrash aria-hidden="true" /></button>
        <Link href="/dashboard/opportunities" className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gf-accent-soft-bg px-3 py-1.5 text-xs font-semibold text-purple-100">{t("opportunities.open")}<IoArrowForward /></Link>
      </div>
    </article>
  );
}

export default function GoalsClient({ initialGoalId }: { initialGoalId?: string }): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const goalInfo = APP_INFO.objetivos_de_ahorro as InfoText;
  const searchParams = useSearchParams();
  const wantsNew = searchParams.get("new") === "1";
  const budgetsState = useSelector((state: RootState) => state.budgetReducer);
  const currency = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const goals = useMemo(() => budgetsState.data.filter((budget) => !budget.archived && isSavingBudget(budget as never)).sort((a, b) => (a.goalDetails?.priority ?? 3) - (b.goalDetails?.priority ?? 3)), [budgetsState.data]);
  const initialGoal = initialGoalId && budgetsState.status !== "idle" && budgetsState.status !== "loading"
    ? goals.find((budget) => String(budget._id) === initialGoalId) as BudgetModalItem | undefined
    : undefined;
  const fundingConflicts = useMemo(() => findOverlappingSavingAccounts(goals.map((budget) => ({
    id: String(budget._id), name: budget.name,
    linkedAccountIds: (budget.linkedAccounts || []).map((item) => String((item as { _id?: unknown })?._id ?? item)),
  }))), [goals]);
  const dispatch = useDispatch<AppDispatch>();
  const [modalSelection, setModalSelection] = useState<"new" | "closed" | BudgetModalItem | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<string | null | "closed">(null);
  const modal = modalSelection === "closed" ? null : modalSelection || (wantsNew ? "new" : null);
  const detailGoal = detailGoalId === "closed" ? null : detailGoalId ? goals.find((budget) => String(budget._id) === detailGoalId) as BudgetData | undefined : initialGoal as BudgetData | undefined;
  const setModal = (value: "new" | BudgetModalItem | null): void => setModalSelection(value ?? "closed");
  const toFetch = fetcher();

  const saveChanges = async (budget: BudgetData, changes: Partial<BudgetData>) => {
    try {
      const response = await toFetch.post("general-data/budget/update", { id: budget._id, ...changes, expectedRevision: budget.revision });
      if (!response?.ok || !response.data) throw new Error(response?.message || t("web.operation.failed"));
      dispatch(updateBudget(response.data));
      runNotify("ok", response.message || t("goals.updated"));
    } catch (error) {
      runNotify("error", error instanceof Error ? error.message : String(error));
    }
  };
  const archive = async (budget: BudgetData) => {
    if (!window.confirm(t("goals.archiveConfirm", { p1: budget.name || t("goals.untitled") }))) return;
    try {
      const response = await toFetch.post("general-data/budget/remove", { id: budget._id });
      if (!response?.ok) throw new Error(response?.message || t("web.operation.failed"));
      if (budget._id) dispatch(removeBudget(budget._id));
      runNotify("ok", response.message || t("goals.archived"));
    } catch (error) {
      runNotify("error", error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main className="min-h-[calc(100vh-70px)] w-full px-3 pb-16 pt-5 sm:px-6 xl:px-8">
      <header className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="text-3xl font-semibold text-gf-text sm:text-4xl">{t("goals.title")}</h1><InfoTip info={goalInfo} /></div><p className="mt-2 max-w-3xl text-sm text-gf-text-muted">{t("goals.subtitle")}</p></div>
        <button type="button" onClick={() => setModal("new")} className="gf-glass-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"><IoAdd size={19} />{t("goals.new")}</button>
      </header>
      <section className="mx-auto mt-6 grid w-full max-w-[1800px] gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-300/15 bg-purple-300/[.04] p-4">
          <p className="text-sm text-gf-text-muted">{t("goals.savingsRule")}</p>
          <Link href="/dashboard/budgets" className="text-xs font-semibold text-purple-200 underline decoration-purple-200/30 underline-offset-4">{t("goals.backToBudgets")}</Link>
        </div>
        {goals.length === 0 ? <div className="gf-glass-card rounded-3xl p-8 text-center"><h2 className="text-xl font-semibold text-gf-text">{t("goals.emptyTitle")}</h2><p className="mx-auto mt-2 max-w-lg text-sm text-gf-text-muted">{t("goals.emptyText")}</p><button type="button" onClick={() => setModal("new")} className="gf-glass-button mt-5 rounded-full px-5 py-2.5 text-sm text-white">{t("goals.new")}</button></div> : goals.map((budget) => <GoalCard key={budget._id} budget={budget as BudgetData} currency={currency} fundingConflict={fundingConflicts.get(String(budget._id))} onOpenDetail={() => setDetailGoalId(String(budget._id))} onEdit={() => { setDetailGoalId("closed"); setModal(budget as BudgetModalItem); }} onUpdate={(changes) => void saveChanges(budget as BudgetData, changes)} onArchive={() => void archive(budget as BudgetData)} />)}
        <Link href="/dashboard/opportunities" className="gf-glass-card flex items-center justify-between gap-3 rounded-2xl p-4 text-sm font-semibold text-purple-100"><span>{t("opportunities.title")}</span><IoArrowForward /></Link>
      </section>
      {modal && <BudgetEditModal mode={modal === "new" ? "creation" : "edition"} budget={modal === "new" ? null : modal} initialType={BUDGET_TYPES.SAVING} initialGoal={modal === "new"} onClose={() => setModal(null)} />}
      {detailGoal && <GoalDetailModal budget={detailGoal} currency={currency} fundingConflict={fundingConflicts.get(String(detailGoal._id))} onClose={() => setDetailGoalId("closed")} onEdit={() => { setDetailGoalId("closed"); setModal(detailGoal as BudgetModalItem); }} />}
    </main>
  );
}
