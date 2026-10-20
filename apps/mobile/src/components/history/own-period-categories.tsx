import { useMemo, useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { ChipPicker } from '@/components/chip-picker';
import { MonthSwitcher } from '@/components/month-switcher';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { compareCategories, HISTORY_PRESETS, historyRange, summarizePeriod, type CompareRow, type HistoryPreset, type PeriodSummary } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { CategoryTotal } from '@gastify/core/transactions/monthSummary';
import type { TransactionLike } from '@gastify/core/transformers/transactionsChange';

type Own = 'screen' | HistoryPreset;

// Spending or income by category with a time filter of its own: it follows the screen's period (and its comparison)
// until a different one is chosen here. Each row is a bar; with a comparison, a second fainter bar is the other period.
export function OwnPeriodCategories({
  kind,
  title,
  info,
  movements,
  summary,
  compareSummary,
  currency,
}: {
  kind: 'spending' | 'incomes';
  title: string;
  info: { title: string; text: string };
  movements: TransactionLike[];
  summary: PeriodSummary;
  compareSummary: PeriodSummary | null;
  currency: string;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const now = useMemo(() => new Date(), []);
  const [own, setOwn] = useState<Own>('screen');
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  const { rows, compare } = useMemo(() => {
    const pick = (s: PeriodSummary) => (kind === 'spending' ? s.spendingByCategory : (s.incomeByCategory as CategoryTotal[]));
    if (own === 'screen') return { rows: compareCategories(pick(summary), compareSummary ? pick(compareSummary) : []), compare: Boolean(compareSummary) };
    const mine = summarizePeriod(movements, historyRange(own, now, { from: null, to: null }, month));
    return { rows: compareCategories(pick(mine), []), compare: false };
  }, [own, month, now, movements, summary, compareSummary, kind]);

  const max = Math.max(1, ...rows.map((row) => Math.max(row.a, row.b)));

  return (
    <Card title={title} info={info}>
      <ChipPicker
        items={[{ id: 'screen', label: 'Igual que arriba' }, ...HISTORY_PRESETS.filter((p) => p.value !== 'custom').map((p) => ({ id: p.value, label: p.label }))]}
        value={own}
        onChange={(id) => setOwn(id as Own)}
        moreAfter={99}
      />
      {own === 'month' && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin movimientos en este periodo.</Text>}
      {rows.slice(0, 12).map((row: CompareRow) => (
        <View key={row.name} className="gap-1.5">
          <View className="flex-row items-center gap-3">
            <CategoryBadge icon={row.icon} color={row.color} size={34} />
            <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
            <View className="items-end">
              <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.a, currency)}</Text>
              {compare && <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.b, currency)}</Text>}
            </View>
          </View>
          <ProgressBar ratio={row.a / max} color={row.color || colors.accent} />
          {compare && <ProgressBar ratio={row.b / max} color={`${row.color || '#888888'}66`} />}
        </View>
      ))}
    </Card>
  );
}
