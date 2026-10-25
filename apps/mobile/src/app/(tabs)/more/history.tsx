import { usePeriodLabels } from '@/hooks/use-period-labels';
import type { TranslateFn } from "@gastify/core/i18n/translate";
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { MonthSwitcher } from '@/components/month-switcher';
import { BudgetsComparative } from '@/components/history/budgets-comparative';
import { HistoryExtraInsights } from '@/components/history/extra-insights';
import { MonthByMonth } from '@/components/history/month-by-month';
import { OwnPeriodCategories } from '@/components/history/own-period-categories';
import { ProjectionsTeaser } from '@/components/history/projections-teaser';
import { PeriodBar, shiftRange } from '@/components/history/period-bar';
import { TopRanking } from '@/components/top-ranking';
import { Screen } from '@/components/screen';
import { Card, PairedColumn } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH, WIDE_MIN_WIDTH } from '@/hooks/use-device-class';

import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import type { RootState } from '@/store';
import { GfSwitch } from '@/components/ui/switch';
import { rangeLabel } from "@gastify/core/i18n/dates";
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
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';

import { useT, useInfo, useLocale } from "@/i18n/client";
import { tNow } from '@/i18n/now';

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

// The readings of «Datos del periodo»; with a comparison the same readings are made for the other period, in the same order.
function periodFacts(t: TranslateFn, x: PeriodSummary<TransactionData>, cell: (value: number) => string): { label: string; value: string; detail: string }[] {
  const top = x.spendingByCategory[0];
  return [
    { label: t("mobile.movimientos"), value: String(x.totals.count), detail: t("mobile.en.el.periodo") },
    { label: t("mobile.lo.que.conservaste"), value: x.totals.incomes > 0 ? `${Math.round(((x.totals.incomes - x.totals.spending) / x.totals.incomes) * 100)}%` : '—', detail: t("mobile.de.tus.ingresos") },
    { label: t("mobile.gasto.promedio.por.mes"), value: cell(x.months.length ? x.totals.spending / x.months.length : 0), detail: tNow("mobile.meses.conteo", { count: x.months.length, p1: x.months.length }) },
    { label: t("mobile.lo.que.mas.pesa"), value: top?.name ?? '—', detail: top ? cell(top.value) : t("mobile.sin.gastos") },
    { label: t("mobile.gasto.mas.grande"), value: x.biggest[0] ? cell(Math.abs(getPrimaryAmount(x.biggest[0]))) : '—', detail: x.biggest[0]?.name ?? t("mobile.sin.gastos") },
  ];
}

// History by period, like the web's History page: choose the period (the last 3 months by default),
// optionally compare it with another (the same stretch a year earlier by default), and see the totals, the
// months side by side, the categories and the biggest expenses of each.
export default function HistoryScreen() {
  const locale = useLocale();
  const { APP_INFO, HISTORY_INFO } = useInfo();
  const t = useT();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const historyStatus = useSelector((state: RootState) => state.transacctionsReducer.historyStatus);
  const currency = usePrimaryCurrency();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const width = useWindowDimensions().width;
  const tablet = width >= TABLET_MIN_WIDTH;
  const wide = width >= WIDE_MIN_WIDTH;
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

  const labels = usePeriodLabels();
  const a = useMemo<PeriodSummary<TransactionData>>(() => summarizePeriod(transactions, rangeA, labels), [transactions, rangeA, labels]);
  const b = useMemo<PeriodSummary<TransactionData> | null>(() => (compareOn ? summarizePeriod(transactions, rangeB, labels) : null), [compareOn, transactions, rangeB, labels]);

  const partial = historyStatus !== 'complete';

  const labelA = rangeLabel(rangeA.start, rangeA.end, locale);
  const labelB = rangeLabel(rangeB.start, rangeB.end, locale);
  const cell = (value: number) => formatMoneyMajor(value, currency);

  return (
    <Screen title={t("mobile.historial")} subtitle={labelA} backLabel={t("mobile.mas")} onBack={() => router.back()} titleInfo={HISTORY_INFO}>
      <Card title={t("mobile.periodo")} info={APP_INFO.periodo}>
        {tablet ? (
          <PeriodBar
            preset={preset}
            range={rangeA}
            onPreset={setPreset}
            canGoForward={rangeA.end.getTime() < now.getTime()}
            onShift={(direction) => {
              const next = shiftRange(rangeA, direction);
              setFrom(dateText(next.from));
              setTo(dateText(next.to));
              setPreset('custom');
            }}
          />
        ) : (
          <>
          <ChipPicker items={HISTORY_PRESETS.map((p) => ({ id: p.value, label: t(p.label) }))} value={preset} onChange={(id) => setPreset(id as HistoryPreset)} moreAfter={99} />
          {preset === 'month' && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
          {preset === 'custom' && (
            <View className="gap-3">
              <DateField label={t("mobile.desde")} value={from} onChange={setFrom} />
              <DateField label={t("mobile.hasta")} value={to} onChange={setTo} />
            </View>
          )}
          </>
        )}
        <View className="flex-row items-center justify-between gap-3 border-t border-gf-border pt-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">{t("mobile.comparar.con.otro.periodo")}</Text>
          <GfSwitch value={compareOn} onValueChange={setCompareOn} accessibilityLabel={t("mobile.comparar.con.otro.periodo")} />
        </View>
        {compareOn && (
          <>
            <ChipPicker items={COMPARE_PRESETS.map((p) => ({ id: p.value, label: t(p.label) }))} value={comparePreset} onChange={(id) => setComparePreset(id as ComparePreset)} moreAfter={99} />
            {comparePreset === 'custom' && (
              <View className="gap-3">
                <DateField label={t("mobile.comparar.desde")} value={compareFrom} onChange={setCompareFrom} />
                <DateField label={t("mobile.comparar.hasta")} value={compareTo} onChange={setCompareTo} />
              </View>
            )}
            <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.se.compara.con.p1", { p1: labelB })}</Text>
          </>
        )}
        {partial && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.todavia.llegan.movimientos.antiguos.las")}</Text>}
      </Card>

      {tablet ? (
        <View className="flex-row items-stretch gap-4">
          <PairedColumn>
      <Card title={t("mobile.resumen")} info={APP_INFO.resumen}>
        {[
          { label: t("mobile.ingresos"), av: a.totals.incomes, bv: b?.totals.incomes, color: colors.income, invert: false },
          { label: t("mobile.gastos"), av: a.totals.spending, bv: b?.totals.spending, color: colors.expense, invert: true },
          { label: t("mobile.balance"), av: a.totals.balance, bv: b?.totals.balance, color: colors.text, invert: false },
        ].map((row) => (
          <View key={row.label} className={tablet ? 'gap-2 py-2' : 'gap-1'}>
            <Text className={`font-inter-medium text-gf-text-muted ${tablet ? 'text-lg' : 'text-sm'}`}>{row.label}</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                {b && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.periodo")}</Text>}
                <Text className={`font-inter-bold ${tablet ? 'text-4xl' : 'text-lg'}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: row.color }}>{cell(row.av)}</Text>
              </View>
              {b && row.bv !== undefined && (
                <View className="flex-1">
                  <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.comparado")}</Text>
                  <Text className={`font-inter-bold ${tablet ? 'text-4xl' : 'text-lg'}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: row.color, opacity: 0.5 }}>{cell(row.bv)}</Text>
                  <Delta current={row.av} previous={row.bv} invert={row.invert} />
                </View>
              )}
            </View>
          </View>
        ))}
      </Card>
          </PairedColumn>
          <PairedColumn>
      <Card title={t("mobile.datos.del.periodo")} info={APP_INFO.datos_del_periodo}>
        <View className="flex-row flex-wrap gap-3">
          {periodFacts(t, a, cell).map((fact, index) => ({ ...fact, versus: b ? periodFacts(t, b, cell)[index].value : null })).map((tile) => (
            <View key={tile.label} className="gap-1 rounded-2xl p-4" style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Text className="font-inter text-sm text-gf-text-muted">{tile.label}</Text>
              <Text className="font-inter-bold text-xl text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{tile.value}</Text>
              <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tile.detail}</Text>
              {tile.versus !== null && <Text className="font-inter-semibold text-sm text-gf-text-muted" numberOfLines={1}>{t("mobile.vs.p1.comparado", { p1: tile.versus })}</Text>}
            </View>
          ))}
        </View>
      </Card>
          </PairedColumn>
        </View>
      ) : (
      <Card title={t("mobile.resumen")} info={APP_INFO.resumen_2}>
        {[
          { label: t("mobile.ingresos"), av: a.totals.incomes, bv: b?.totals.incomes, color: colors.income, invert: false },
          { label: t("mobile.gastos"), av: a.totals.spending, bv: b?.totals.spending, color: colors.expense, invert: true },
          { label: t("mobile.balance"), av: a.totals.balance, bv: b?.totals.balance, color: colors.text, invert: false },
        ].map((row) => (
          <View key={row.label} className="gap-1">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{row.label}</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                {b && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.periodo")}</Text>}
                <Text className="font-inter-bold text-lg" numberOfLines={1} adjustsFontSizeToFit style={{ color: row.color }}>{cell(row.av)}</Text>
              </View>
              {b && row.bv !== undefined && (
                <View className="flex-1">
                  <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.comparado")}</Text>
                  <Text className={`font-inter-bold ${tablet ? 'text-4xl' : 'text-lg'}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: row.color, opacity: 0.5 }}>{cell(row.bv)}</Text>
                  <Delta current={row.av} previous={row.bv} invert={row.invert} />
                </View>
              )}
            </View>
          </View>
        ))}
      </Card>
      )}

      <MonthByMonth summary={a} compareSummary={b} currency={currency} movements={transactions} />

      {wide ? (
        <View className="flex-row items-stretch gap-4">
          <PairedColumn>
      <OwnPeriodCategories
        kind="spending"
        title={t("mobile.gastos.por.categoria")}
        info={APP_INFO.gastos_por_categor_a}
        movements={transactions}
        summary={a}
        compareSummary={b}
        currency={currency}
      />
          </PairedColumn>
          <PairedColumn>
      <OwnPeriodCategories
        kind="incomes"
        title={t("mobile.ingresos.por.categoria")}
        info={APP_INFO.ingresos_por_categor_a}
        movements={transactions}
        summary={a}
        compareSummary={b}
        currency={currency}
      />
          </PairedColumn>
        </View>
      ) : (
        <>
      <OwnPeriodCategories
        kind="spending"
        title={t("mobile.gastos.por.categoria")}
        info={APP_INFO.gastos_por_categor_a_2}
        movements={transactions}
        summary={a}
        compareSummary={b}
        currency={currency}
      />

      <OwnPeriodCategories
        kind="incomes"
        title={t("mobile.ingresos.por.categoria")}
        info={APP_INFO.ingresos_por_categor_a_2}
        movements={transactions}
        summary={a}
        compareSummary={b}
        currency={currency}
      />
        </>
      )}

      <HistoryExtraInsights movements={transactions} currency={currency} end={rangeA.end} compareEnd={b ? rangeB.end : undefined} />

      <BudgetsComparative start={rangeA.start} end={rangeA.end} compareStart={compareOn ? rangeB.start : undefined} compareEnd={compareOn ? rangeB.end : undefined} />

      <ProjectionsTeaser />

      <TopRanking movements={transactions} currency={currency} defaultPreset="last3" returnTo="/more/history" showComparison />
    </Screen>
  );
}
