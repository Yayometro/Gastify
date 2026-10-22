import { router } from 'expo-router';
import { BUDGET_FACES_SECTIONS } from '@/lib/info-sections';
import { useMemo } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { Card } from '@/components/ui/card';
import { BudgetCard } from '@/components/budgets/budget-card';
import { InfoTip } from '@/components/info-tip';
import { Colors } from '@/constants/theme';
import { sortBudgetRows } from '@/lib/budget-sort';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { monthBounds } from '@gastify/core/transactions/monthSummary';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { getBudgetActualSpend } from '@gastify/core/transformers/projectionsChange';

// The most budgets the dashboard shows; the rest are one tap away on «Ver todos».
export const MAX_DASHBOARD_BUDGETS = 10;

// The spending budgets of this month, the closest to (or past) their limit first, as the Budgets screen lists them by default.
export function useDashboardBudgetRows() {
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const currency = usePrimaryCurrency();
  const rates = useRatesToPrimary(budgets.map((budget) => budget.currency), currency);
  const bounds = useMemo(() => {
    const now = new Date();
    return monthBounds(now.getFullYear(), now.getMonth());
  }, []);

  const rows = useMemo(() => {
    const spending = convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates)
      .filter(isSpendingBudget)
      .map((budget) => {
        const goal = Number(budget.goalAmount) || 0;
        const spent = getBudgetActualSpend(budget, transactions, bounds.start, bounds.end);
        return { budget, goal, spent, ratio: goal > 0 ? spent / goal : 0 };
      });
    return sortBudgetRows(spending, 'ratio');
  }, [budgets, transactions, currency, rates, bounds]);

  return { rows, currency };
}

export function BudgetsWidget() {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { rows, currency } = useDashboardBudgetRows();
  const shown = rows.slice(0, MAX_DASHBOARD_BUDGETS);
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3 px-1">
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/budgets')} hitSlop={8} className="flex-1">
          <Text className="font-inter-semibold text-lg text-gf-text">Presupuestos</Text>
        </Pressable>
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/budgets')} hitSlop={8}><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{rows.length > shown.length ? `Ver todos (${rows.length})` : 'Ver todos'}</Text></Pressable>
          <InfoTip info={{ title: 'Presupuestos', text: 'Cada barra es lo gastado en el periodo del presupuesto ÷ su límite; el círculo marca el porcentaje y la carita cambia de ánimo según qué tan cerca estés del límite (verde tranquilo, naranja cerca, rojo excedido). Se ordenan igual que en Presupuestos: primero la barra más llena o pasada del límite, y así hasta la más vacía. Aquí se ven hasta 10; «Ver todos» abre todos. Toca uno para ver sus movimientos.', sections: BUDGET_FACES_SECTIONS }} />
        </View>
      </View>
      {rows.length === 0 && <Card><Text className="font-inter text-sm text-gf-text-muted">Todavía no tienes presupuestos de gasto.</Text></Card>}
      {shown.map((row) => <BudgetCard key={idOf(row.budget)} row={row} currency={currency} saving={false} />)}
    </View>
  );
}
