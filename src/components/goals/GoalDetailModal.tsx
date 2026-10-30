"use client";

import React, { useMemo } from "react";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { useLinkedAccountsTotal } from "@/helpers/hooks/useLinkedAccountsTotal";
import { getBudgetBarColor, getBudgetBarGradient, getBudgetMoodEmoji } from "@/helpers/transformers/budgetHistory";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { RootState } from "@/lib/store";
import { useSelector } from "react-redux";
import { calculateGoalSchedule } from "@gastify/core/goals/schedule";
import { isEligibleGoalFundingAccountType } from "@gastify/core/goals/progress";
import { idOf } from "@gastify/core/categories/categoryForm";
import { formatMoneyMajor, majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import { getExplicitBudgetId } from "@gastify/core/transformers/budgetTypes";
import { useLocale, useT } from "@/i18n/client";
import { useInfo } from "@/i18n/client";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import type { InfoText } from "@gastify/core/info/createInfo";

type FundingConflict = { accountIds: string[]; otherNames: string[] };

export default function GoalDetailModal({
  budget,
  currency,
  fundingConflict,
  onClose,
  onEdit,
}: {
  budget: BudgetData;
  currency: string;
  fundingConflict?: FundingConflict;
  onClose: () => void;
  onEdit: () => void;
}): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const goalInfo = APP_INFO.objetivos_de_ahorro as InfoText;
  const accounts = useSelector((state: RootState) => state.accountsReducer?.data || []);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data || []);
  const goalCurrency = budget.currency || currency;
  const target = Math.max(0, Number(budget.goalAmount) || 0);
  const linkedIds = (budget.linkedAccounts || []).map(idOf).filter(Boolean);
  const linkedAccounts = accounts.filter((account) => linkedIds.includes(idOf(account)));
  const linkedTotal = useLinkedAccountsTotal(linkedAccounts, goalCurrency);
  const availableCurrencies = new Set(linkedTotal.breakdown.breakdown.map((item) => item.currency));
  const missingCurrencies = [...new Set(linkedAccounts.map((account) => account.currency || goalCurrency))].filter((code) => !availableCurrencies.has(code));
  const missingAccounts = linkedIds.filter((id) => !linkedAccounts.some((account) => idOf(account) === id));
  const ineligibleAccounts = linkedAccounts.filter((account) => !isEligibleGoalFundingAccountType(account.accountType));
  const balanceComplete = !missingAccounts.length && !missingCurrencies.length && !ineligibleAccounts.length && !budget.conversionUnavailable;
  const hasSharedAccounts = Boolean(fundingConflict?.accountIds.length);
  const showProvisional = hasSharedAccounts && balanceComplete;
  const fundingIncomplete = hasSharedAccounts || !balanceComplete;
  const canShowProgress = !fundingIncomplete || showProvisional;
  const saved = linkedIds.length ? linkedTotal.total : Math.max(0, Number(budget.savingAmount) || 0);
  const ratio = target > 0 ? saved / target : 0;
  const percentage = Math.round(Math.min(100, Math.max(0, ratio * 100)));
  const barColor = getBudgetBarColor(ratio, true);
  const barGradient = getBudgetBarGradient(ratio, true);
  const details = budget.goalDetails;
  const schedule = useMemo(() => {
    if (!details?.schedule || !details.targetDate || !canShowProgress) return null;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: details.timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return calculateGoalSchedule({
      targetMinor: majorToMinor(target, goalCurrency),
      savedMinor: majorToMinor(saved, goalCurrency),
      today,
      details,
    });
  }, [details, canShowProgress, target, goalCurrency, saved]);

  const contextual = useMemo(() => {
    const context = details?.context;
    const categoryIds = new Set(context?.categoryIds || []);
    const subCategoryIds = new Set(context?.subCategoryIds || []);
    const tagIds = new Set(context?.tagIds || []);
    const budgetIds = new Set([...(context?.spendingBudgetIds || []), ...(context?.projectBudgetIds || [])]);
    if (!categoryIds.size && !subCategoryIds.size && !tagIds.size && !budgetIds.size) {
      return { movements: [] as TransactionData[], groups: [] as { name: string; color: string; amount: number }[], total: 0 };
    }
    const movements = (transactions as TransactionData[])
      .filter((tx) => {
        const isExpense = tx.kind === "expense" || (!tx.kind && tx.isBill === true && tx.isIncome !== true);
        if (!isExpense || tx.state === "pending" || tx.state === "failed" || tx.state === "reverted") return false;
        const tags = (tx.tags || []).map(idOf);
        return categoryIds.has(idOf(tx.category)) || subCategoryIds.has(idOf(tx.subCategory)) || tags.some((id) => tagIds.has(id)) || budgetIds.has(getExplicitBudgetId(tx));
      })
      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
    const groupsByName = new Map<string, { name: string; color: string; amount: number }>();
    for (const tx of movements) {
      const name = tx.subCategory?.name || tx.category?.name || t("history.noCategory");
      const group = groupsByName.get(name) || { name, color: tx.subCategory?.color || tx.category?.color || "#9B7CFF", amount: 0 };
      group.amount += Math.max(0, getPrimaryAmount(tx));
      groupsByName.set(name, group);
    }
    const allGroups = [...groupsByName.values()].sort((a, b) => b.amount - a.amount);
    const topGroups = allGroups.slice(0, 5);
    const remaining = allGroups.slice(5).reduce((sum, item) => sum + item.amount, 0);
    const groups = remaining > 0
      ? [...topGroups, { name: t("goals.detail.otherCategories"), color: "#76658f", amount: remaining }]
      : topGroups;
    return { movements, groups, total: allGroups.reduce((sum, item) => sum + item.amount, 0) };
  }, [transactions, details, t]);

  const contextTotal = contextual.total;
  const dateLabel = details?.targetDate
    ? new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(details.targetDate + "T12:00:00Z"))
    : t("goals.noDate");
  const percentLeft = `clamp(0px, calc(${percentage}% - 20px), calc(100% - 40px))`;

  return (
    <BasicModal
      close={onClose}
      renderContent={
        <section aria-labelledby="goal-detail-title" className="content absolute gf-glass-violet max-h-[92vh] w-[94vw] max-w-[860px] overflow-y-auto overscroll-contain rounded-3xl border border-gf-border shadow-2xl">
          <div className="pointer-events-none sticky top-0 z-20 -mb-10 flex justify-end overflow-visible px-4 pt-3">
            <button type="button" aria-label={t("mobile.cerrar")} onClick={onClose} className="pointer-events-auto rounded-full gf-glass-card p-2 text-purple-100 transition-colors hover:text-white">
              <UniversalCategoIcon type="md/MdClose" siz={18} />
            </button>
          </div>
          <header className="relative px-5 pb-5 pt-6 text-white sm:px-7">
            <div className="flex items-center gap-3 pr-12">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gf-surface/20" style={{ color: budget.color || "#b38cff" }}><UniversalCategoIcon type={budget.icon || "fluent/bullseye"} siz={25} /></span>
              <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-purple-200">{details ? t("goals.template." + details.template) : t("goals.legacySavings")} · {goalCurrency}</p><div className="flex items-center gap-1.5"><h2 id="goal-detail-title" className="truncate text-2xl font-bold">{budget.name || t("goals.untitled")}</h2><InfoTip info={goalInfo} className="shrink-0" /></div></div>
            </div>
            <p className="mt-2 text-xs text-purple-100">{t("goals.detail.targetDate", { p1: dateLabel })}</p>
          </header>

          <div className="space-y-5 rounded-t-[34px] bg-gf-surface-2 px-4 py-5 sm:px-7 sm:py-6">
            <section aria-label={t("goals.detail.progressTitle")} className="rounded-2xl border border-gf-border bg-gf-surface p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-gf-text-muted">{showProvisional ? t("goals.linkedBalanceShared") : linkedIds.length ? t("goals.accountsSource") : t("goals.manual")}</p><p className="mt-1 break-words text-2xl font-bold text-gf-text">{canShowProgress ? formatMoneyMajor(saved, goalCurrency) : "—"}</p></div>
                <div className="flex items-center gap-2">{canShowProgress ? <><span className="text-4xl" aria-label={t("budgets.howDoing")}>{getBudgetMoodEmoji(ratio, true)}</span><span className="text-sm font-bold text-gf-text">{percentage}%</span></> : <span className="text-sm font-bold text-gf-text">—</span>}</div>
              </div>
              <div className="relative my-4 h-5 rounded-full bg-gf-surface-2">
                <div className="h-full rounded-full" style={{ width: canShowProgress ? Math.min(100, Math.max(0, ratio * 100)) + "%" : "0%", background: barGradient }} />
                {canShowProgress && <span className="absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-[3px] bg-gf-surface text-[10px] font-extrabold text-gf-text shadow-md" style={{ left: percentLeft, borderColor: barColor }}>{percentage}%</span>}
              </div>
              <div className="flex items-start justify-between gap-4 text-xs"><span className="font-semibold text-gf-text">{canShowProgress ? formatMoneyMajor(saved, goalCurrency) : "—"}<span className="mt-1 block font-normal text-gf-text-muted">{t("goals.progress")}</span></span><span className="text-right font-semibold text-gf-text">{formatMoneyMajor(target, goalCurrency)}<span className="mt-1 block font-normal text-gf-text-muted">{t("goals.target")}</span></span></div>
              {showProvisional && <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/5 px-3 py-2 text-xs leading-relaxed text-amber-100">{t("goals.sharedAccounts", { p1: fundingConflict?.otherNames.join(", ") || "" })}</p>}
              {missingAccounts.length > 0 && <p className="mt-3 text-xs text-amber-200">{t("goals.missingAccounts")}</p>}
              {ineligibleAccounts.length > 0 && <p className="mt-3 text-xs text-amber-200">{t("goals.ineligibleAccounts")}</p>}
              {missingCurrencies.length > 0 && <p className="mt-3 text-xs text-amber-200">{t("goals.partialFx")}</p>}
              {fundingIncomplete && !showProvisional && <p className="mt-3 text-xs text-amber-200">{t("goals.fundingNeedsReview")}</p>}
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gf-border bg-gf-surface p-4"><p className="text-xs text-gf-text-muted">{t("goals.detail.saved")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{canShowProgress ? formatMoneyMajor(saved, goalCurrency) : "—"}</p></div>
              <div className="rounded-2xl border border-gf-border bg-gf-surface p-4"><p className="text-xs text-gf-text-muted">{t("goals.detail.target")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMajor(target, goalCurrency)}</p></div>
              <div className="rounded-2xl border border-gf-border bg-gf-surface p-4"><p className="text-xs text-gf-text-muted">{t("goals.detail.remaining")}</p><p className="mt-1 break-words text-lg font-bold text-gf-text">{canShowProgress ? formatMoneyMajor(Math.max(0, target - saved), goalCurrency) : "—"}</p></div>
            </section>

            <section className="rounded-2xl border border-gf-border bg-gf-surface p-4 sm:p-5">
              <h3 className="text-base font-semibold text-gf-text">{t("goals.detail.planTitle")}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gf-surface-2 p-3"><p className="text-xs text-gf-text-muted">{t("goals.detail.step", { p1: 1 })}</p><p className="mt-1 text-sm font-semibold text-gf-text">{t("goals.detail.stepSaved")}</p><p className="mt-1 text-xs text-gf-text-muted">{canShowProgress ? formatMoneyMajor(saved, goalCurrency) : t("goals.fundingNeedsReview")}</p></div>
                <div className="rounded-xl bg-gf-surface-2 p-3"><p className="text-xs text-gf-text-muted">{t("goals.detail.step", { p1: 2 })}</p><p className="mt-1 text-sm font-semibold text-gf-text">{t("goals.detail.stepTarget")}</p><p className="mt-1 text-xs text-gf-text-muted">{formatMoneyMajor(target, goalCurrency)} · {dateLabel}</p></div>
                <div className="rounded-xl bg-gf-surface-2 p-3"><p className="text-xs text-gf-text-muted">{t("goals.detail.step", { p1: 3 })}</p><p className="mt-1 text-sm font-semibold text-gf-text">{t("goals.detail.stepNext")}</p><p className="mt-1 text-xs text-gf-text-muted">{schedule?.status === "ready" && schedule.contributionMinor !== null ? t("goals.perPayment", { p1: formatMoneyMajor(minorToMajor(schedule.contributionMinor, goalCurrency), goalCurrency), p2: schedule.paymentDates.length }) : details?.schedule ? t("goals.noPayments") : t("goals.schedule.off")}</p></div>
              </div>
              {schedule?.status === "underfunded" && <p className="mt-3 text-xs text-amber-200">{t("goals.underfundedPlan")}</p>}
              {schedule?.status === "past_due" && <p className="mt-3 text-xs text-amber-200">{t("goals.pastDue")}</p>}
              {schedule?.paymentDates[0] && <p className="mt-3 text-xs text-gf-text-muted">{t("goals.detail.nextPayment", { p1: new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(schedule.paymentDates[0] + "T12:00:00Z")) })}</p>}
            </section>

            {linkedAccounts.length > 0 && <section className="rounded-2xl border border-gf-border bg-gf-surface p-4 sm:p-5">
              <h3 className="text-base font-semibold text-gf-text">{t("goals.detail.fundingAccounts")}</h3>
              <div className="mt-3 space-y-2">{linkedAccounts.map((account) => <div key={idOf(account)} className="flex items-center justify-between gap-3 rounded-xl bg-gf-surface-2 px-3 py-2"><span className="min-w-0 truncate text-sm text-gf-text">{account.name || t("goals.accounts")}</span><strong className="shrink-0 text-sm text-gf-text">{formatMoneyMajor(Number(account.amount) || 0, account.currency || goalCurrency)} <span className="text-xs font-normal text-gf-text-muted">{account.currency || goalCurrency}</span></strong></div>)}</div>
            </section>}

            <section className="rounded-2xl border border-gf-border bg-gf-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-base font-semibold text-gf-text">{t("goals.detail.contextTitle")}</h3><p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("goals.detail.contextWarning")}</p></div><span className="rounded-full border border-gf-border px-2.5 py-1 text-xs text-gf-text-muted">{contextual.movements.length}</span></div>
              {contextual.movements.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-gf-border p-4 text-sm text-gf-text-muted">{t("goals.detail.noContextMovements")}</p> : <>
                <div className="mt-4"><p className="text-xs text-gf-text-muted">{t("goals.detail.contextSpend", { p1: currency })}</p><p className="mt-1 text-xl font-bold text-gf-text">{formatMoneyMajor(contextTotal, currency)}</p><div aria-label={t("goals.detail.categoryChart")} className="mt-3 flex h-4 overflow-hidden rounded-full bg-gf-surface-2">{contextual.groups.map((group) => <span key={group.name} title={group.name} style={{ width: contextTotal > 0 ? `${(group.amount / contextTotal) * 100}%` : "0%", backgroundColor: group.color }} />)}</div></div>
                <div className="mt-3 space-y-2">{contextual.groups.map((group) => <div key={group.name} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-gf-text-muted">{group.name}</span><strong className="shrink-0 text-gf-text">{formatMoneyMajor(group.amount, currency)}</strong></div>)}</div>
                <div className="mt-4 divide-y divide-gf-border/70">{contextual.movements.slice(0, 8).map((tx) => {
                  const date = tx.date ? new Date(tx.date) : null;
                  const category = tx.subCategory?.name || tx.category?.name || t("history.noCategory");
                  return <div key={idOf(tx)} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium text-gf-text">{tx.name || t("opportunities.concept")}</p><p className="text-xs text-gf-text-muted">{category}{date && !Number.isNaN(date.getTime()) ? " · " + new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", { dateStyle: "medium" }).format(date) : ""}</p></div><strong className="shrink-0 text-sm text-gf-text">{formatMoneyMajor(getPrimaryAmount(tx), currency)}</strong></div>;
                })}</div>
              </>}
            </section>

            <p className="text-center text-[11px] leading-relaxed text-gf-text-muted">{t("goals.detail.noLedgerNote")}</p>
            <div className="flex justify-end"><button type="button" onClick={onEdit} className="gf-glass-button rounded-full px-5 py-2.5 text-sm font-semibold text-white">{t("goals.edit")}</button></div>
          </div>
        </section>
      }
    />
  );
}
