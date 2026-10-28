"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import useBudgetsInPrimaryCurrency from "@/hooks/money/useBudgetsInPrimaryCurrency";
import { currentBudgetAlert, type BudgetAlert } from "@gastify/core/budgets/budgetAlerts";
import { getBudgetActualSpend } from "@gastify/core/transformers/projectionsChange";
import { getExplicitBudgetId, isProjectBudget, isSavingBudget } from "@gastify/core/transformers/budgetTypes";
import { getPrimaryAmount } from "@gastify/core/transformers/transactionsChange";
import { monthBounds } from "@gastify/core/transactions/monthSummary";
import { idOf } from "@gastify/core/categories/categoryForm";
import { alertDate, seeNotices, type AlertTimes } from "@gastify/core/budgets/alertTimes";
import { useT } from "@/i18n/client";
import { useRatesToPrimary } from "@/hooks/money/useRatesToPrimary";
import { totalInPrimary } from "@gastify/core/accounts/accountTotals";
import { majorToMinor } from "@gastify/core/money/currencies";
import { goalScheduleReminder } from "@gastify/core/goals/reminders";
import { findOverlappingSavingAccounts, isEligibleGoalFundingAccountType } from "@gastify/core/goals/progress";

const EMPTY: never[] = [];
// The notices the person dismissed stay dismissed for this device (a notice is about one budget and one period).
const STORE_KEY = "gf-budget-alerts-dismissed";
// When each notice first showed up on this device (the rule is in packages/core alertTimes.ts). Null when there is no record yet.
const TIMES_KEY = "gf-budget-alert-times";

function readTimes(): AlertTimes | null {
  try {
    const raw = window.localStorage.getItem(TIMES_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as AlertTimes) : {};
  } catch {
    return {};
  }
}

function writeTimes(times: AlertTimes): void {
  try {
    window.localStorage.setItem(TIMES_KEY, JSON.stringify(times));
  } catch {
    // Not being able to remember it only means the date may not survive a reload.
  }
}

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeDismissed(keys: string[]): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(keys.slice(-200)));
  } catch {
    // Not being able to remember it only means it may be shown again.
  }
}

// The notices about budgets, saving goals and projects (70 / 80 / 90 / 100 %, congratulations, saving progress): the same
// rules as the app's, so both show the same notices. Budgets are converted to the wallet's currency first.
export default function useBudgetAlertList(): { alerts: BudgetAlert[]; dismiss: (key: string) => void; dismissAll: () => void } {
  const t = useT();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY;
  const storedBudgets = useSelector((state: RootState) => state.budgetReducer?.data) || EMPTY;
  const accounts = useSelector((state: RootState) => state.accountsReducer?.data) || EMPTY;
  const primary = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const currencies = useMemo(() => [...new Set([...accounts.map((account) => account.currency || primary), ...storedBudgets.map((budget) => budget.currency || primary)])], [accounts, storedBudgets, primary]);
  const rates = useRatesToPrimary(currencies, primary);
  const budgets = useBudgetsInPrimaryCurrency(storedBudgets, primary);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const alerts = useMemo<BudgetAlert[]>(() => {
    const now = new Date();
    const bounds = monthBounds(now.getFullYear(), now.getMonth());
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const out: BudgetAlert[] = [];
    const savingBudgets = budgets.filter((budget) => !budget.archived && isSavingBudget(budget as never));
    const fundingConflicts = findOverlappingSavingAccounts(savingBudgets.map((budget) => ({
      id: idOf(budget), name: budget.name,
      linkedAccountIds: ((budget as { linkedAccounts?: unknown[] }).linkedAccounts ?? []).map((item) => idOf(item)).filter(Boolean),
    })));
    for (const budget of budgets) {
      if (budget.archived) continue;
      const goal = Number(budget.goalAmount) || 0;
      if (goal <= 0) continue;
      const id = idOf(budget);
      let kind: "spending" | "saving" | "project" = "spending";
      let value = 0;
      if (isSavingBudget(budget as never)) {
        kind = "saving";
        const linked = ((budget as { linkedAccounts?: unknown[] }).linkedAccounts ?? []).map((item) => idOf(item)).filter(Boolean);
        if (fundingConflicts.has(id) || budget.conversionUnavailable) continue;
        const linkedAccounts = accounts.filter((account) => linked.includes(idOf(account)));
        if (linkedAccounts.some((account) => !isEligibleGoalFundingAccountType(account.accountType))) continue;
        const linkedTotal = totalInPrimary(linkedAccounts, primary, rates);
        if (linked.length > 0 && linkedTotal.missingCurrencies.length > 0) continue;
        value = linked.length > 0 ? linkedTotal.total : Number(budget.savingAmount) || 0;
        if (budget.goalDetails && id) {
          const reminder = goalScheduleReminder({
            budgetId: id,
            name: budget.name || t("budgets.alert.defaultName"),
            targetMinor: majorToMinor(goal, primary),
            savedMinor: majorToMinor(value, primary),
            currency: primary,
            details: budget.goalDetails,
            revision: budget.revision,
            t,
          });
          if (reminder) out.push(reminder);
        }
      } else if (isProjectBudget(budget as never)) {
        kind = "project";
        value = transactions
          .filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx as never) === id)
          .reduce((sum, tx) => sum + getPrimaryAmount(tx as never), 0);
      } else {
        value = getBudgetActualSpend(budget as never, transactions as never, bounds.start, bounds.end);
      }
      const alert = currentBudgetAlert({ budgetId: id, name: budget.name || t("budgets.alert.defaultName"), kind, ratio: value / goal, dayOfPeriod: now.getDate(), periodKey }, t);
      if (alert) out.push(alert);
    }
    return out;
  }, [budgets, transactions, accounts, primary, rates, t]);

  const visible = useMemo(() => alerts.filter((alert) => !dismissed.includes(alert.key)), [alerts, dismissed]);

  // The date of each notice: the moment this device first saw it. Read once, then kept up to date as notices appear.
  const [times, setTimes] = useState<AlertTimes | null | undefined>(undefined);
  useEffect(() => {
    setTimes(readTimes());
  }, []);
  const visibleKeys = visible.map((alert) => alert.key);
  const joinedKeys = visibleKeys.join("|");
  useEffect(() => {
    if (times === undefined) return;
    const next = seeNotices(times, visibleKeys, new Date().toISOString());
    if (JSON.stringify(next) === JSON.stringify(times)) return;
    writeTimes(next);
    setTimes(next);
    // Keyed by the joined keys: the array itself changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [times, joinedKeys]);
  const withDates = useMemo(() => visible.map((alert) => ({ ...alert, createdAt: alertDate(times ?? null, alert.key) })), [visible, times]);

  const dismiss = useCallback((key: string) => {
    setDismissed((current) => {
      const next = [...current, key];
      writeDismissed(next);
      return next;
    });
  }, []);

  // Clears every notice that shows now.
  const dismissAll = useCallback(() => {
    setDismissed((current) => {
      const next = [...current, ...alerts.map((alert) => alert.key)];
      writeDismissed(next);
      return next;
    });
  }, [alerts]);

  return { alerts: withDates, dismiss, dismissAll };
}
