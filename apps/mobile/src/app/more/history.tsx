import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import type { RootState } from '@/store';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { monthlySeries } from '@gastify/core/history/monthlySeries';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { movementsInMonth, topSpendingCategories, monthTotals } from '@gastify/core/transactions/monthSummary';

const BAR_HEIGHT = 120;

// The last twelve months side by side (income and spending), and what the chosen month was spent on,
// category by category. Tap a month to open its breakdown.
export default function HistoryScreen() {
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const cutoff = useSelector((state: RootState) => state.transacctionsReducer.historyCutoff);
  const historyStatus = useSelector((state: RootState) => state.transacctionsReducer.historyStatus);
  const currency = usePrimaryCurrency();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const now = useMemo(() => new Date(), []);
  const series = useMemo(() => monthlySeries(transactions, now, 12), [transactions, now]);
  const [picked, setPicked] = useState<number | null>(null);
  const index = picked ?? series.length - 1;
  const selected = series[index];
  const maxValue = Math.max(1, ...series.map((point) => Math.max(point.incomes, point.spending)));

  const monthItems = useMemo(
    () => (selected ? movementsInMonth(transactions, selected.bounds) : []),
    [transactions, selected]
  );
  const breakdown = useMemo(() => topSpendingCategories(monthItems, 50), [monthItems]);
  const spent = useMemo(() => monthTotals(monthItems).spending, [monthItems]);
  const cutoffTime = cutoff ? new Date(cutoff).getTime() : null;
  const partial = historyStatus !== 'complete' && cutoffTime !== null && selected && selected.bounds.start.getTime() < cutoffTime;

  return (
    <Screen title="Historial" subtitle="Los últimos doce meses" backLabel="Más" onBack={() => router.back()}>
      <Card title="Ingresos y gastos">
        <View className="flex-row items-end justify-between gap-1" style={{ height: BAR_HEIGHT + 24 }}>
          {series.map((point, i) => {
            const isSelected = i === index;
            return (
              <Pressable
                key={point.label + i}
                accessibilityRole="button"
                accessibilityLabel={`${point.label}: ingresos ${formatMoneyMajor(point.incomes, currency)}, gastos ${formatMoneyMajor(point.spending, currency)}`}
                onPress={() => setPicked(i)}
                className="flex-1 items-center gap-1 rounded-xl py-1"
                style={{ backgroundColor: isSelected ? colors.accentSoft : 'transparent' }}>
                <View className="flex-row items-end gap-0.5" style={{ height: BAR_HEIGHT }}>
                  <View style={{ width: 6, height: Math.max(2, (point.incomes / maxValue) * BAR_HEIGHT), borderRadius: 3, backgroundColor: colors.income }} />
                  <View style={{ width: 6, height: Math.max(2, (point.spending / maxValue) * BAR_HEIGHT), borderRadius: 3, backgroundColor: colors.expense }} />
                </View>
                <Text className={`font-inter text-xs ${isSelected ? 'font-inter-semibold text-gf-text' : 'text-gf-text-muted'}`}>{point.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.income }} />
            <Text className="font-inter text-xs text-gf-text-muted">Ingresos</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.expense }} />
            <Text className="font-inter text-xs text-gf-text-muted">Gastos</Text>
          </View>
        </View>
      </Card>

      {selected && (
        <Card title={monthTitleEs(selected.bounds.start)}>
          {partial && (
            <Text className="font-inter text-sm text-gf-text-muted">Todavía llegan movimientos de este mes; las cifras pueden crecer.</Text>
          )}
          <View className="flex-row justify-between">
            <Text className="font-inter text-base text-gf-text-muted">Ingresos</Text>
            <Text className="font-inter-semibold text-base" style={{ color: colors.income }}>+{formatMoneyMajor(selected.incomes, currency)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-inter text-base text-gf-text-muted">Gastos</Text>
            <Text className="font-inter-semibold text-base" style={{ color: colors.expense }}>-{formatMoneyMajor(selected.spending, currency)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-inter-semibold text-base text-gf-text">Balance</Text>
            <Text className="font-inter-bold text-base text-gf-text">{formatMoneyMajor(selected.balance, currency)}</Text>
          </View>
        </Card>
      )}

      <Card title="Gastos por categoría">
        {breakdown.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin gastos en este mes.</Text>}
        {breakdown.map((row) => {
          const share = spent > 0 ? row.value / spent : 0;
          return (
            <View key={row.name} className="gap-2">
              <View className="flex-row items-center gap-3">
                <CategoryBadge icon={row.icon} color={row.color} size={36} />
                <View className="flex-1">
                  <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{Math.round(share * 100)}% · {row.count} {row.count === 1 ? 'movimiento' : 'movimientos'}</Text>
                </View>
                <Text className="font-inter-semibold text-base text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
              </View>
              <ProgressBar ratio={share} color={row.color || colors.accent} />
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
