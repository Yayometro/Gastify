import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import type { MonthBar } from '@gastify/core/history/periodComparison';

const BAR_HEIGHT = 110;

// Months side by side: income (green) and spending (red), optionally with the months of another period
// next to them in a fainter tone. `show` limits the bars to one of the two.
export function MonthlyBars({ months, compare, show = 'both' }: { months: MonthBar[]; compare?: MonthBar[] | null; show?: 'both' | 'incomes' | 'spending' }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const count = Math.max(months.length, compare?.length ?? 0);
  const pick = (m: MonthBar | undefined) => ({ incomes: show === 'spending' ? 0 : m?.incomes ?? 0, spending: show === 'incomes' ? 0 : m?.spending ?? 0 });
  const values = [...months, ...(compare ?? [])].flatMap((m) => [pick(m).incomes, pick(m).spending]);
  const max = Math.max(1, ...values);
  const bar = (value: number, color: string, opacity = 1) => (
    <View style={{ width: show === 'both' ? 5 : 9, height: Math.max(2, (value / max) * BAR_HEIGHT), borderRadius: 3, backgroundColor: color, opacity }} />
  );

  return (
    <View className="flex-row items-end justify-between gap-1" style={{ height: BAR_HEIGHT + 24 }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = pick(months[i]);
        const b = compare ? pick(compare[i]) : null;
        return (
          <View key={i} className="flex-1 items-center gap-1">
            <View className="flex-row items-end gap-0.5" style={{ height: BAR_HEIGHT }}>
              {show !== 'spending' && bar(a.incomes, colors.income)}
              {show !== 'incomes' && bar(a.spending, colors.expense)}
              {b && show !== 'spending' && bar(b.incomes, colors.income, 0.4)}
              {b && show !== 'incomes' && bar(b.spending, colors.expense, 0.4)}
            </View>
            <Text className="font-inter text-xs text-gf-text-muted">{months[i]?.label ?? compare?.[i]?.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
