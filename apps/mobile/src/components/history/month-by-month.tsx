import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthBar } from '@gastify/core/history/periodComparison';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { topSpendingCategories } from '@gastify/core/transactions/monthSummary';

const BAR_AREA = 150;

// Month by month, as bars you can read: each month has its income (green) and spending (red) bar with the
// figure written above it, the month's name below, and a tap opens that month in full. When another period is
// compared, its months appear next to each one in a fainter tone.
export function MonthByMonth({ months, compare, currency, start, compareStart, movements }: { months: MonthBar[]; compare?: MonthBar[] | null; currency: string; start: Date; compareStart?: Date; movements: TransactionData[] }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = useState<number | null>(null);
  const max = Math.max(1, ...months.flatMap((m) => [m.incomes, m.spending]), ...(compare ?? []).flatMap((m) => [m.incomes, m.spending]));
  const short = (value: number) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(Math.round(value)));
  const many = months.length > 6;
  const money = (value: number) => formatMoneyMajor(value, currency);
  const current = open !== null ? months[open] : null;
  const previous = open !== null ? compare?.[open] : undefined;
  const labelAt = (anchor: Date, index: number, label: string) => `${label} ${new Date(anchor.getFullYear(), anchor.getMonth() + index, 1).getFullYear()}`;
  const currentLabel = current && open !== null ? labelAt(start, open, current.label) : '';
  const previousLabel = previous && open !== null && compareStart ? labelAt(compareStart, open, previous.label) : '';
  const leader = useMemo(() => {
    if (open === null) return null;
    const monthStart = new Date(start.getFullYear(), start.getMonth() + open, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    return topSpendingCategories(movements.filter((tx) => isInRange(tx, { start: monthStart, end: monthEnd })), 1)[0] ?? null;
  }, [open, start, movements]);

  return (
    <Card title="Mes a mes" info={{ title: 'Mes a mes', text: 'Ingresos (verde) y gastos (rojo) de cada mes del periodo, con la cifra sobre cada barra. Toca un mes para ver su detalle y su categoría líder. Si comparas, las barras tenues corresponden al mes y año indicados abajo.' }}>
      {compare && compareStart && <Text className="font-inter-semibold text-xs text-gf-text-muted">Actual: {labelAt(start, 0, months[0]?.label ?? '')} · Comparado: {labelAt(compareStart, 0, compare[0]?.label ?? '')}</Text>}
      <View className="flex-row items-end gap-1.5" style={{ height: BAR_AREA + 48 }}>
        {months.map((month, index) => {
          const other = compare?.[index];
          const bar = (value: number, color: string, faint = false) => (
            <View className="items-center justify-end" style={{ height: BAR_AREA + 18 }}>
              {!many && <Text className="font-inter text-[9px] text-gf-text-muted">{short(value)}</Text>}
              <View style={{ width: many ? 7 : 11, height: Math.max(3, (value / max) * BAR_AREA), borderRadius: 4, backgroundColor: color, opacity: faint ? 0.38 : 1 }} />
            </View>
          );
          return (
            <Pressable
              key={`${month.label}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${labelAt(start, index, month.label)}: ingresos ${money(month.incomes)}, gastos ${money(month.spending)}${other && compareStart ? `; comparado con ${labelAt(compareStart, index, other.label)}` : ''}`}
              onPress={() => setOpen(index)}
              className="flex-1 items-center justify-end gap-1">
              <View className="flex-row items-end gap-0.5">
                {bar(month.incomes, colors.income)}
                {bar(month.spending, colors.expense)}
                {other && bar(other.incomes, colors.income, true)}
                {other && bar(other.spending, colors.expense, true)}
              </View>
              <Text className="text-center font-inter text-[10px] text-gf-text-muted">{month.label}{compareStart ? `\n${new Date(start.getFullYear(), start.getMonth() + index, 1).getFullYear()}` : ''}</Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="font-inter text-xs" style={{ color: colors.income }}>● Ingresos</Text>
        <Text className="font-inter text-xs" style={{ color: colors.expense }}>● Gastos</Text>
        {compare && <Text className="font-inter text-xs text-gf-text-muted">○ Tenue: {compareStart ? labelAt(compareStart, 0, compare[0]?.label ?? '') : 'periodo comparado'}</Text>}
      </View>

      <DetailSheet visible={current !== null} onClose={() => setOpen(null)} title={currentLabel}>
        {current && (
          <>
            <Text className="font-inter text-base" style={{ color: colors.income }}>Ingresos: {money(current.incomes)}</Text>
            <Text className="font-inter text-base" style={{ color: colors.expense }}>Gastos: {money(current.spending)}</Text>
            <Text className="font-inter-semibold text-base text-gf-text">Balance: {money(current.incomes - current.spending)}</Text>
            {leader && <View className="gap-1 border-t border-gf-border pt-3"><Text className="font-inter-semibold text-sm text-gf-text">Categoría líder: {leader.name}</Text><Text className="font-inter text-sm text-gf-text-muted">{money(leader.value)} del gasto de {currentLabel}</Text></View>}
            {previous && (
              <View className="gap-1 border-t border-gf-border pt-3">
                <Text className="font-inter-medium text-sm text-gf-text-muted">Comparado con {previousLabel}</Text>
                <Text className="font-inter text-sm text-gf-text-muted">Ingresos: {money(previous.incomes)}</Text>
                <Text className="font-inter text-sm text-gf-text-muted">Gastos: {money(previous.spending)}</Text>
              </View>
            )}
          </>
        )}
      </DetailSheet>
    </Card>
  );
}
