import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { buildBudgetHistoricalComparative } from '@gastify/core/transformers/budgetHistoricalComparative';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';

// Budgets against the period, month by month: how many months each one stayed within its limit (the web's
// "compliance"), with a small strip of months (green kept, red exceeded) and a tap for each month's figures.
export function BudgetsComparative({ start, end }: { start: Date; end: Date }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const rates = useRatesToPrimary(budgets.map((budget) => budget.currency), currency);
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      buildBudgetHistoricalComparative({
        budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates),
        transactions,
        startDate: start,
        endDate: end,
      }),
    [budgets, transactions, currency, rates, start, end]
  );
  const money = (value: number) => formatMoneyMajor(value, currency);
  const chosen = rows.find((row) => idOf(row.budget as never) === open);

  return (
    <Card title="Presupuestos del periodo" info={{ title: 'Presupuestos del periodo', text: 'Para cada presupuesto de gasto, cuántos meses del periodo se mantuvo dentro de su límite. Verde: cumplido. Rojo: excedido. Los meses marcados con ≈ usan una meta estimada porque el presupuesto aún no existía.' }}>
      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No hay presupuestos de gasto en este periodo.</Text>}
      {rows.map((row) => {
        const id = idOf(row.budget as never);
        return (
          <Pressable key={id} accessibilityRole="button" onPress={() => setOpen(id)} className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{String(row.budget.name ?? 'Presupuesto')}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">
                {row.monthsMet}/{row.monthsTracked}
                {row.complianceRate !== null ? ` · ${Math.round(row.complianceRate * 100)}%` : ''}
              </Text>
            </View>
            <View className="flex-row gap-1">
              {row.monthlySeries.map((month, index) => (
                <View key={`${month.label}-${index}`} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: month.met ? colors.income : colors.expense, opacity: month.estimated ? 0.5 : 1 }} />
              ))}
            </View>
          </Pressable>
        );
      })}

      <DetailSheet visible={Boolean(chosen)} onClose={() => setOpen(null)} title={String(chosen?.budget.name ?? '')} subtitle={chosen ? `${chosen.monthsMet} de ${chosen.monthsTracked} meses dentro del límite` : undefined}>
        {chosen?.monthlySeries.map((month, index) => (
          <View key={`${month.label}-${index}`} className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter text-base text-gf-text">{month.label}{month.estimated ? ' ≈' : ''}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">{money(month.actual)} de {money(month.goal)}</Text>
            <Text className="font-inter-semibold text-sm" style={{ color: month.met ? colors.income : colors.expense }}>{month.met ? 'Cumplido' : 'Excedido'}</Text>
          </View>
        ))}
      </DetailSheet>
    </Card>
  );
}
