import { router } from 'expo-router';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { BudgetMood, BudgetProgress } from '@/components/budget-progress';
import { CategoryBadge } from '@/components/category-badge';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { lookOf, periodSuffix } from '@/lib/budget-look';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { BudgetData } from '@gastify/core/features/budgetSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { ConvertedBudget } from '@gastify/core/transformers/budgetCurrency';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import { isProjectBudget } from '@gastify/core/transformers/budgetTypes';

export type BudgetRow = { budget: ConvertedBudget<BudgetData>; spent: number; goal: number; ratio: number };

// One budget as a card: its icon and name, the mood face on the right, the bar against its limit and how much is left.
// The Budgets screen and the dashboard use this same card.
export function BudgetCard({ row, currency, saving }: { row: BudgetRow; currency: string; saving: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { budget, spent, goal, ratio } = row;
  const diff = spent - goal;
  const exceeded = !saving && goal > 0 && diff > 0;
  const look = lookOf(budget, colors.accentSoft);
  const kind = isProjectBudget(budget) ? 'Proyecto' : saving ? 'Meta de ahorro' : 'Presupuesto de gasto';
  const status = exceeded
    ? `Excedido por ${formatMoneyMajor(diff, currency)}`
    : saving
      ? diff < 0
        ? `Faltan ${formatMoneyMajor(-diff, currency)}`
        : 'Meta alcanzada 🎉'
      : `Quedan ${formatMoneyMajor(Math.max(-diff, 0), currency)}`;
  const statusColor = exceeded ? colors.expense : saving ? (diff >= 0 ? '#60a5fa' : colors.textSecondary) : colors.income;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${budget.name || 'presupuesto'}`}
      onPress={() => router.push({ pathname: '/budgets/[id]', params: { id: idOf(budget) } })}>
      <Card>
        <View className="flex-row items-center gap-3">
          <CategoryBadge icon={look.icon} color={look.color} size={40} />
          <View className="flex-1">
            <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>
              {budget.name || 'Presupuesto'}
            </Text>
            <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{kind} · {periodSuffix(budget).replace('/', '')}</Text>
          </View>
          {goal > 0 && <BudgetMood ratio={ratio} saving={saving} size={40} />}
        </View>
        {goal > 0 && <BudgetProgress ratio={ratio} color={getBudgetBarColor(ratio, saving)} saving={saving} spent={spent} goal={goal} currency={currency} suffix={periodSuffix(budget)} />}
        {goal > 0 && <Text className="font-inter-semibold text-sm" style={{ color: statusColor }}>{status}</Text>}
      </Card>
    </Pressable>
  );
}

