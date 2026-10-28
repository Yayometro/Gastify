import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useToast } from '@/components/toast';
import { useDismissedAlertKeys } from '@/lib/alert-dismissals';
import { useAlertDates } from '@/lib/alert-times';
import { alertMood } from '@/lib/alert-presentation';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { currentBudgetAlert, type BudgetAlert } from '@gastify/core/budgets/budgetAlerts';
import { idOf } from '@gastify/core/categories/categoryForm';
import { monthBounds } from '@gastify/core/transactions/monthSummary';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { getExplicitBudgetId, isProjectBudget, isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { getBudgetActualSpend } from '@gastify/core/transformers/projectionsChange';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { useT } from '@/i18n/client';

const STORE_KEY = 'budget_alerts_shown';

async function readShown(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

// In-app notices about the budgets, saving goals and projects (70 / 80 / 90 / 100 %, congratulations, savings progress).
// Each notice is shown once per budget and period. Delivering them as push notifications while the app is closed needs
// the server to send them; this is the part that lives in the app.
// The notices that apply right now: one per budget, saving goal or project that reached a level this period. The toasts
// show them as they appear, and the Notifications screen lists the same ones.
export function useBudgetAlertList(): BudgetAlert[] {
  const t = useT();
  const dismissed = useDismissedAlertKeys();
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const ready = useSelector((state: RootState) => state.transacctionsReducer.status === 'succeeded' && state.budgetReducer.status === 'succeeded');
  const currency = usePrimaryCurrency();
  const rates = useRatesToPrimary([...budgets.map((budget) => budget.currency), ...accounts.map((account) => account.currency)], currency);

  const all = useMemo<BudgetAlert[]>(() => {
    if (!ready) return [];
    const now = new Date();
    const bounds = monthBounds(now.getFullYear(), now.getMonth());
    const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const out: BudgetAlert[] = [];
    for (const budget of convertBudgetsToPrimary(budgets.filter((b) => !b.archived), currency, rates)) {
      const goal = Number(budget.goalAmount) || 0;
      if (goal <= 0) continue;
      const id = idOf(budget);
      let kind: 'spending' | 'saving' | 'project' = 'spending';
      let value = 0;
      if (isSavingBudget(budget)) {
        kind = 'saving';
        const linked = (budget.linkedAccounts || []).map(idOf).filter(Boolean);
        value = linked.length > 0 ? totalInPrimary(accounts.filter((account) => linked.includes(idOf(account))), currency, rates).total : Number(budget.savingAmount) || 0;
      } else if (isProjectBudget(budget)) {
        kind = 'project';
        value = transactions.filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx) === id).reduce((sum, tx) => sum + getPrimaryAmount(tx), 0);
      } else {
        value = getBudgetActualSpend(budget, transactions, bounds.start, bounds.end);
      }
      const alert = currentBudgetAlert({ budgetId: id, name: budget.name || t('budgets.alert.defaultName'), kind, ratio: value / goal, dayOfPeriod: now.getDate(), periodKey }, t);
      if (alert) out.push(alert);
    }
    return out;
  }, [ready, budgets, transactions, accounts, currency, rates, t]);
  // The notices the person swiped away stay away (for this budget and period).
  const visible = useMemo(() => all.filter((alert) => !dismissed.includes(alert.key)), [all, dismissed]);
  // The date of each notice: the moment this phone first saw it (see lib/alert-times.ts).
  const dateOf = useAlertDates(visible.map((alert) => alert.key));
  return useMemo(() => visible.map((alert) => ({ ...alert, createdAt: dateOf(alert.key) })), [visible, dateOf]);
}

// In-app notices about the budgets, saving goals and projects (70 / 80 / 90 / 100 %, congratulations, savings progress).
// Each notice is shown once per budget and period. Delivering them as push notifications while the app is closed needs
// the server to send them; this is the part that lives in the app.
export function useBudgetAlerts() {
  const toast = useToast();
  const alerts = useBudgetAlertList();
  const busy = useRef(false);

  useEffect(() => {
    if (alerts.length === 0 || busy.current) return;
    busy.current = true;
    (async () => {
      const shown = await readShown();
      const fresh = alerts.filter((alert) => !shown.includes(alert.key)).slice(0, 3);
      for (let index = 0; index < fresh.length; index += 1) {
        const alert = fresh[index];
        toast.show(alert.message, alertMood(alert), { title: alert.title, href: `/budgets/${alert.key.split(':')[0]}` });
        shown.push(alert.key);
        try {
          await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(shown.slice(-200)));
        } catch {
          // Not being able to remember it only means it may be shown again.
        }
        await new Promise((resolve) => setTimeout(resolve, 5600));
      }
      busy.current = false;
    })();
  }, [alerts, toast]);
}
