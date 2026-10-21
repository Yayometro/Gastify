import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { MonthSwitcher } from '@/components/month-switcher';
import { BudgetsComparative } from '@/components/history/budgets-comparative';
import { HistoryExtraInsights } from '@/components/history/extra-insights';
import { MonthByMonth } from '@/components/history/month-by-month';
import { OwnPeriodCategories } from '@/components/history/own-period-categories';
import { ProjectionsTeaser } from '@/components/history/projections-teaser';
import { TopRanking } from '@/components/top-ranking';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import type { RootState } from '@/store';
import { GfSwitch } from '@/components/ui/switch';
import { rangeLabelEs } from '@gastify/core/format/spanishDates';
import {
  COMPARE_PRESETS,
  HISTORY_PRESETS,
  compareRange,
  historyRange,
  percentChange,
  summarizePeriod,
  type ComparePreset,
  type HistoryPreset,
  type PeriodSummary,
} from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';

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
  // The month of the "Un mes" period (arrows, or tap it to pick any month).
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [from, setFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(() => dateText(now));
  const [compareOn, setCompareOn] = useState(false);
  const [comparePreset, setComparePreset] = useState<ComparePreset>('yearAgo');
  const [compareFrom, setCompareFrom] = useState(() => dateText(new Date(now.getFullYear() - 1, now.getMonth(), 1)));
  const [compareTo, setCompareTo] = useState(() => dateText(new Date(now.getFullYear() - 1, now.getMonth(), 28)));

  const rangeA = useMemo(() => historyRange(preset, now, { from: parseDateText(from), to: parseDateText(to) }, month), [preset, now, from, to, month]);
  const rangeB = useMemo(() => compareRange(comparePreset, rangeA, { from: parseDateText(compareFrom), to: parseDateText(compareTo) }), [comparePreset, rangeA, compareFrom, compareTo]);

  const a = useMemo<PeriodSummary<TransactionData>>(() => summarizePeriod(transactions, rangeA), [transactions, rangeA]);
  const b = useMemo<PeriodSummary<TransactionData> | null>(() => (compareOn ? summarizePeriod(transactions, rangeB) : null), [compareOn, transactions, rangeB]);

  const partial = historyStatus !== 'complete';

  const labelA = rangeLabelEs(rangeA.start, rangeA.end);
  const labelB = rangeLabelEs(rangeB.start, rangeB.end);
  const cell = (value: number) => formatMoneyMajor(value, currency);

  return (
    <Screen title="Historial" subtitle={labelA} backLabel="Más" onBack={() => router.back()}>
      <Card title="Periodo" info={{ title: 'Periodo', text: 'Elige qué tramo de tiempo analizar; todas las tarjetas de abajo que dicen «Igual que arriba» lo siguen. Al comparar con otro periodo (el mismo tramo del año anterior, el periodo inmediato anterior de la misma duración o uno que elijas) cada cifra muestra cuánto cambió. Por defecto se analizan los últimos 3 meses.' }}>
        <ChipPicker items={HISTORY_PRESETS.map((p) => ({ id: p.value, label: p.label }))} value={preset} onChange={(id) => setPreset(id as HistoryPreset)} moreAfter={99} />
        {preset === 'month' && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
        {preset === 'custom' && (
          <View className="gap-3">
            <DateField label="Desde" value={from} onChange={setFrom} />
            <DateField label="Hasta" value={to} onChange={setTo} />
          </View>
        )}
        <View className="flex-row items-center justify-between gap-3 border-t border-gf-border pt-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">Comparar con otro periodo</Text>
          <GfSwitch value={compareOn} onValueChange={setCompareOn} accessibilityLabel="Comparar con otro periodo" />
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

      <Card title="Resumen" info={{ title: 'Resumen', text: 'Ingresos = suma de lo que entró en el periodo; gastos = suma de lo que salió; balance = ingresos − gastos. Las transferencias entre tus cuentas no cuentan. Con una comparación activa, la columna derecha es el otro periodo y el porcentaje es (periodo − comparado) ÷ comparado; en gastos, que suba es malo (rojo) y que baje es bueno (verde).' }}>
        {[
          { label: 'Ingresos', av: a.totals.incomes, bv: b?.totals.incomes, color: colors.income, invert: false },
          { label: 'Gastos', av: a.totals.spending, bv: b?.totals.spending, color: colors.expense, invert: true },
          { label: 'Balance', av: a.totals.balance, bv: b?.totals.balance, color: colors.text, invert: false },
        ].map((row) => (
          <View key={row.label} className="gap-1">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{row.label}</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                {b && <Text className="font-inter text-xs text-gf-text-muted">Periodo</Text>}
                <Text className="font-inter-bold text-lg" numberOfLines={1} adjustsFontSizeToFit style={{ color: row.color }}>{cell(row.av)}</Text>
              </View>
              {b && row.bv !== undefined && (
                <View className="flex-1">
                  <Text className="font-inter text-xs text-gf-text-muted">Comparado</Text>
                  <Text className="font-inter-semibold text-lg text-gf-text-muted" numberOfLines={1} adjustsFontSizeToFit>{cell(row.bv)}</Text>
                  <Delta current={row.av} previous={row.bv} invert={row.invert} />
                </View>
              )}
            </View>
          </View>
        ))}
      </Card>

      <MonthByMonth summary={a} compareSummary={b} currency={currency} movements={transactions} />

      <OwnPeriodCategories
        kind="spending"
        title="Gastos por categoría"
        info={{ title: 'Gastos por categoría', text: 'Suma de los gastos de cada categoría en el periodo, de mayor a menor; la barra es la categoría ÷ la mayor de la lista. Filtro: tiene su propio periodo (por defecto «Igual que arriba», con su comparación si la activaste), pero puedes elegir otro sin cambiar el resto de la pantalla. Sirve para ver en qué se fue tu dinero. Toca una categoría para ver sus movimientos.' }}
        movements={transactions}
        summary={a}
        compareSummary={b}
        currency={currency}
      />

      <OwnPeriodCategories
        kind="incomes"
        title="Ingresos por categoría"
        info={{ title: 'Ingresos por categoría', text: 'Suma de los ingresos de cada categoría en el periodo, de mayor a menor; la barra es la categoría ÷ la mayor de la lista. Filtro: tiene su propio periodo, igual que los gastos. Sirve para ver de dónde viene tu dinero. Toca una categoría para ver sus movimientos.' }}
        movements={transactions}
        summary={a}
        compareSummary={b}
        currency={currency}
      />

      <HistoryExtraInsights movements={transactions} currency={currency} end={rangeA.end} />

      <BudgetsComparative start={rangeA.start} end={rangeA.end} compareStart={compareOn ? rangeB.start : undefined} compareEnd={compareOn ? rangeB.end : undefined} />

      <ProjectionsTeaser />

      <TopRanking movements={transactions} currency={currency} defaultPreset="last3" returnTo="/more/history" showComparison />
    </Screen>
  );
}
