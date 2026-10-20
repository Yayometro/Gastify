import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { monthBounds } from '@gastify/core/transactions/monthSummary';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import { isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { getBudgetActualSpend } from '@gastify/core/transformers/projectionsChange';

// The spending budgets that are closest to their limit this month, with a link to all of them.
export function BudgetsWidget() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const currency = usePrimaryCurrency();
  const rates = useRatesToPrimary(budgets.map((budget) => budget.currency), currency);
  const bounds = useMemo(() => {
    const now = new Date();
    return monthBounds(now.getFullYear(), now.getMonth());
  }, []);

  const rows = useMemo(
    () =>
      convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates)
        .filter(isSpendingBudget)
        .map((budget) => {
          const goal = Number(budget.goalAmount) || 0;
          const spent = getBudgetActualSpend(budget, transactions, bounds.start, bounds.end);
          return { budget, goal, spent, ratio: goal > 0 ? spent / goal : 0 };
        })
        .sort((a, b) => b.ratio - a.ratio),
    [budgets, transactions, currency, rates, bounds]
  );

  return (
    <Card title="Presupuestos" action={<Pressable accessibilityRole="link" onPress={() => router.navigate('/budgets')} hitSlop={8}><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Ver todos</Text></Pressable>}>
      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no tienes presupuestos de gasto.</Text>}
      <ScrollView nestedScrollEnabled style={{ maxHeight: 330 }} contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator>
      {rows.map(({ budget, goal, spent, ratio }) => (
        <Pressable key={idOf(budget)} accessibilityRole="button" onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: idOf(budget) } })} className="gap-1.5">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{budget.name}</Text>
            <Text className="font-inter-semibold text-sm text-gf-text">{Math.round(ratio * 100)}%</Text>
          </View>
          <ProgressBar ratio={ratio} color={getBudgetBarColor(ratio, false)} />
          <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(spent, currency)} de {formatMoneyMajor(goal, currency)}</Text>
        </Pressable>
      ))}
      </ScrollView>
    </Card>
  );
}
