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

const EMPTY: never[] = [];
// The notices the person dismissed stay dismissed for this device (a notice is about one budget and one period).
const STORE_KEY = "gf-budget-alerts-dismissed";

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
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY;
  const storedBudgets = useSelector((state: RootState) => state.budgetReducer?.data) || EMPTY;
  const accounts = useSelector((state: RootState) => state.accountsReducer?.data) || EMPTY;
  const primary = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
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
        // Accounts in the wallet's currency count as they are; accounts in other currencies are not converted here yet.
        value = linked.length > 0
          ? accounts
              .filter((account) => linked.includes(idOf(account)) && account.currency === primary)
              .reduce((sum, account) => sum + (Number(account.amount) || 0), 0)
          : Number(budget.savingAmount) || 0;
      } else if (isProjectBudget(budget as never)) {
        kind = "project";
        value = transactions
          .filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx as never) === id)
          .reduce((sum, tx) => sum + getPrimaryAmount(tx as never), 0);
      } else {
        value = getBudgetActualSpend(budget as never, transactions as never, bounds.start, bounds.end);
      }
      const alert = currentBudgetAlert({ budgetId: id, name: budget.name || "Presupuesto", kind, ratio: value / goal, dayOfPeriod: now.getDate(), periodKey });
      if (alert) out.push(alert);
    }
    return out;
  }, [budgets, transactions, accounts, primary]);

  const visible = useMemo(() => alerts.filter((alert) => !dismissed.includes(alert.key)), [alerts, dismissed]);

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

  return { alerts: visible, dismiss, dismissAll };
}
