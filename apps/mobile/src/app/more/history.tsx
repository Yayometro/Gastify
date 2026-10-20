import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Switch, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import type { RootState } from '@/store';
import { rangeLabelEs } from '@gastify/core/format/spanishDates';
import {
  COMPARE_PRESETS,
  HISTORY_PRESETS,
  compareCategories,
  compareRange,
  historyRange,
  percentChange,
  summarizePeriod,
  type CompareRow,
  type ComparePreset,
  type HistoryPreset,
  type PeriodSummary,
} from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import type { CategoryTotal } from '@gastify/core/transactions/monthSummary';

const BAR_HEIGHT = 110;

function Delta({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const change = percentChange(current, previous);
  if (change === null) return <Text className="font-inter text-xs text-gf-text-muted">—</Text>;
  // For spending, going up is the bad direction.
  const good = invert ? change <= 0 : change >= 0;
  return (
    <Text className="font-inter-semibold text-xs" style={{ color: good ? colors.income : colors.expense }}>
      {change >= 0 ? '+' : ''}
      {Math.round(change * 100)}%
    </Text>
  );
}

function CategoryRows({ rows, compare, currency }: { rows: CompareRow[]; compare: boolean; currency: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const max = Math.max(1, ...rows.map((row) => Math.max(row.a, row.b)));
  if (rows.length === 0) return <Text className="font-inter text-sm text-gf-text-muted">Sin movimientos en este periodo.</Text>;
  return (
    <>
      {rows.slice(0, 12).map((row) => (
        <View key={row.name} className="gap-1.5">
          <View className="flex-row items-center gap-3">
            <CategoryBadge icon={row.icon} color={row.color} size={34} />
            <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
            <View className="items-end">
              <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.a, currency)}</Text>
              {compare && (
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.b, currency)}</Text>
                  <Delta current={row.a} previous={row.b} invert />
                </View>
              )}
            </View>
          </View>
          <ProgressBar ratio={row.a / max} color={row.color || colors.accent} />
          {compare && <ProgressBar ratio={row.b / max} color={`${row.color || '#888888'}66`} />}
        </View>
      ))}
    </>
  );
}

// History by period, like the web's History page: choose the period (the last 3 months by default),
// optionally compare it with another (the same stretch a year earlier by default), and see the totals, the
// months side by side, the categories and the biggest expenses of each.
export default function HistoryScreen() {
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const historyStatus = useSelector((state: RootState) => state.transacctionsReducer.historyStatus);
  const currency = usePrimaryCurrency();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const now = useMemo(() => new Date(), []);
  const [preset, setPreset] = useState<HistoryPreset>('last3');
  const [from, setFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(() => dateText(now));
  const [compareOn, setCompareOn] = useState(false);
  const [comparePreset, setComparePreset] = useState<ComparePreset>('yearAgo');
  const [compareFrom, setCompareFrom] = useState(() => dateText(new Date(now.getFullYear() - 1, now.getMonth(), 1)));
  const [compareTo, setCompareTo] = useState(() => dateText(new Date(now.getFullYear() - 1, now.getMonth(), 28)));

  const rangeA = useMemo(() => historyRange(preset, now, { from: parseDateText(from), to: parseDateText(to) }), [preset, now, from, to]);
  const rangeB = useMemo(() => compareRange(comparePreset, rangeA, { from: parseDateText(compareFrom), to: parseDateText(compareTo) }), [comparePreset, rangeA, compareFrom, compareTo]);

  const a = useMemo<PeriodSummary<TransactionData>>(() => summarizePeriod(transactions, rangeA), [transactions, rangeA]);
  const b = useMemo<PeriodSummary<TransactionData> | null>(() => (compareOn ? summarizePeriod(transactions, rangeB) : null), [compareOn, transactions, rangeB]);

  const spendingRows = useMemo(() => compareCategories(a.spendingByCategory, b?.spendingByCategory ?? []), [a, b]);
  const incomeRows = useMemo(() => compareCategories(a.incomeByCategory as CategoryTotal[], b?.incomeByCategory as CategoryTotal[] ?? []), [a, b]);
  const monthCount = Math.max(a.months.length, b?.months.length ?? 0);
  const maxValue = Math.max(1, ...a.months.flatMap((m) => [m.incomes, m.spending]), ...(b?.months.flatMap((m) => [m.incomes, m.spending]) ?? []));
  const partial = historyStatus !== 'complete';

  const labelA = rangeLabelEs(rangeA.start, rangeA.end);
  const labelB = rangeLabelEs(rangeB.start, rangeB.end);
  const cell = (value: number) => formatMoneyMajor(value, currency);

  return (
    <Screen title="Historial" subtitle={labelA} backLabel="Más" onBack={() => router.back()}>
      <Card title="Periodo">
        <ChipPicker items={HISTORY_PRESETS.map((p) => ({ id: p.value, label: p.label }))} value={preset} onChange={(id) => setPreset(id as HistoryPreset)} moreAfter={99} />
        {preset === 'custom' && (
          <View className="gap-3">
            <DateField label="Desde" value={from} onChange={setFrom} />
            <DateField label="Hasta" value={to} onChange={setTo} />
          </View>
        )}
        <View className="flex-row items-center justify-between gap-3 border-t border-gf-border pt-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">Comparar con otro periodo</Text>
          <Switch value={compareOn} onValueChange={setCompareOn} trackColor={{ true: colors.accent }} />
        </View>
        {compareOn && (
          <>
            <ChipPicker items={COMPARE_PRESETS.map((p) => ({ id: p.value, label: p.label }))} value={comparePreset} onChange={(id) => setComparePreset(id as ComparePreset)} moreAfter={99} />
            {comparePreset === 'custom' && (
              <View className="gap-3">
                <DateField label="Comparar desde" value={compareFrom} onChange={setCompareFrom} />
                <DateField label="Comparar hasta" value={compareTo} onChange={setCompareTo} />
              </View>
            )}
            <Text className="font-inter text-sm text-gf-text-muted">Se compara con {labelB}.</Text>
          </>
        )}
        {partial && <Text className="font-inter text-sm text-gf-text-muted">Todavía llegan movimientos antiguos; las cifras de periodos viejos pueden crecer.</Text>}
      </Card>

      <Card title="Resumen">
        <View className="flex-row">
          <Text className="flex-1 font-inter-semibold text-xs text-gf-text-muted" />
          <Text className="w-28 text-right font-inter-semibold text-xs text-gf-text-muted">Periodo</Text>
          {b && <Text className="w-28 text-right font-inter-semibold text-xs text-gf-text-muted">Comparado</Text>}
        </View>
        {[
          { label: 'Ingresos', av: a.totals.incomes, bv: b?.totals.incomes, color: colors.income, invert: false },
          { label: 'Gastos', av: a.totals.spending, bv: b?.totals.spending, color: colors.expense, invert: true },
          { label: 'Balance', av: a.totals.balance, bv: b?.totals.balance, color: colors.text, invert: false },
        ].map((row) => (
          <View key={row.label} className="flex-row items-center">
            <Text className="flex-1 font-inter text-base text-gf-text-muted">{row.label}</Text>
            <Text className="w-28 text-right font-inter-semibold text-sm" style={{ color: row.color }}>{cell(row.av)}</Text>
            {b && row.bv !== undefined && (
              <View className="w-28 items-end">
                <Text className="font-inter text-sm text-gf-text-muted">{cell(row.bv)}</Text>
                <Delta current={row.av} previous={row.bv} invert={row.invert} />
              </View>
            )}
          </View>
        ))}
      </Card>

      <Card title="Mes a mes">
        <View className="flex-row items-end justify-between gap-1" style={{ height: BAR_HEIGHT + 24 }}>
          {Array.from({ length: monthCount }).map((_, i) => {
            const ma = a.months[i];
            const mb = b?.months[i];
            return (
              <View key={i} className="flex-1 items-center gap-1">
                <View className="flex-row items-end gap-0.5" style={{ height: BAR_HEIGHT }}>
                  <View style={{ width: 5, height: Math.max(2, ((ma?.incomes ?? 0) / maxValue) * BAR_HEIGHT), borderRadius: 3, backgroundColor: colors.income }} />
                  <View style={{ width: 5, height: Math.max(2, ((ma?.spending ?? 0) / maxValue) * BAR_HEIGHT), borderRadius: 3, backgroundColor: colors.expense }} />
                  {mb && (
                    <>
                      <View style={{ width: 5, height: Math.max(2, (mb.incomes / maxValue) * BAR_HEIGHT), borderRadius: 3, backgroundColor: colors.income, opacity: 0.4 }} />
                      <View style={{ width: 5, height: Math.max(2, (mb.spending / maxValue) * BAR_HEIGHT), borderRadius: 3, backgroundColor: colors.expense, opacity: 0.4 }} />
                    </>
                  )}
                </View>
                <Text className="font-inter text-xs text-gf-text-muted">{ma?.label ?? mb?.label}</Text>
              </View>
            );
          })}
        </View>
        <Text className="font-inter text-xs text-gf-text-muted">
          Verde: ingresos. Rojo: gastos.{compareOn ? ' Las barras tenues son del periodo comparado, mes contra mes.' : ''}
        </Text>
      </Card>

      <Card title="Gastos por categoría">
        <CategoryRows rows={spendingRows} compare={compareOn} currency={currency} />
      </Card>

      <Card title="Ingresos por categoría">
        <CategoryRows rows={incomeRows} compare={compareOn} currency={currency} />
      </Card>

      <Card title="Gastos más grandes">
        {a.biggest.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin gastos en este periodo.</Text>}
        {a.biggest.map((movement) => (
          <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id) } })} />
        ))}
      </Card>
    </Screen>
  );
}
