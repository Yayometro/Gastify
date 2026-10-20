import { useMemo, useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { MonthlyBars } from '@/components/charts/monthly-bars';
import { CategoryBadge } from '@/components/category-badge';
import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import type { PeriodSummary } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { CategoryTotal } from '@gastify/core/transactions/monthSummary';

type Kind = 'spending' | 'incomes';

// Gastos / Ingresos of the period: the total, how it splits across categories (a stacked bar and the
// list), and the months side by side — the phone's version of the web's summary tabs.
export function SummaryWidget({ summary, currency }: { summary: PeriodSummary; currency: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [kind, setKind] = useState<Kind>('spending');
  const rows = (kind === 'spending' ? summary.spendingByCategory : (summary.incomeByCategory as CategoryTotal[])).filter((row) => row.value > 0);
  const total = kind === 'spending' ? summary.totals.spending : summary.totals.incomes;
  const shown = rows.slice(0, 6);
  const rest = rows.slice(6).reduce((sum, row) => sum + row.value, 0);
  const segments = useMemo(() => [...shown.map((row) => ({ name: row.name, value: row.value, color: row.color || '#888888' })), ...(rest > 0 ? [{ name: 'Otras', value: rest, color: '#9ca3af' }] : [])], [shown, rest]);

  return (
    <Card title="Resumen">
      <Segmented options={[{ value: 'spending', label: 'Gastos' }, { value: 'incomes', label: 'Ingresos' }]} value={kind} onChange={setKind} />
      <Text className="font-inter-bold text-3xl" style={{ color: kind === 'spending' ? colors.expense : colors.income }}>{formatMoneyMajor(total, currency)}</Text>

      {segments.length > 0 && (
        <View className="h-3 flex-row overflow-hidden rounded-full">
          {segments.map((segment) => (
            <View key={segment.name} style={{ flex: Math.max(segment.value, 0.0001), backgroundColor: segment.color }} />
          ))}
        </View>
      )}

      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin {kind === 'spending' ? 'gastos' : 'ingresos'} en este periodo.</Text>}
      {shown.map((row) => (
        <View key={row.name} className="flex-row items-center gap-3">
          <CategoryBadge icon={row.icon} color={row.color} size={32} />
          <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">{total > 0 ? Math.round((row.value / total) * 100) : 0}%</Text>
          <Text className="w-28 text-right font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
        </View>
      ))}
      {rest > 0 && <Text className="font-inter text-sm text-gf-text-muted">Y otras categorías: {formatMoneyMajor(rest, currency)}</Text>}

      {summary.months.length > 1 && (
        <View className="gap-2 pt-1">
          <Text className="font-inter-medium text-sm text-gf-text-muted">Mes a mes</Text>
          <MonthlyBars months={summary.months} show={kind} />
        </View>
      )}
    </Card>
  );
}
