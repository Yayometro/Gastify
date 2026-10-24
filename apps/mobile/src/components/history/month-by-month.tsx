import { usePeriodLabels } from '@/hooks/use-period-labels';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { CompactTimeFilter } from '@/components/compact-time-filter';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { historyRange, summarizePeriod, type HistoryPreset, type MonthBar, type PeriodSummary } from '@gastify/core/history/periodComparison';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { topSpendingCategories } from '@gastify/core/transactions/monthSummary';

import { useT, useInfo } from "@/i18n/client";

const BAR_AREA = 150;
const TABLET_BAR_AREA = 230;

// Month by month, as bars you can read: each month has its income (green) and spending (red) bar with the
// figure written above it, the month's name below, and a tap opens that month in full. When another period is
// compared, its months appear next to each one in a fainter tone.
export function MonthByMonth({ summary, compareSummary, currency, movements }: { summary: PeriodSummary; compareSummary: PeriodSummary | null; currency: string; movements: TransactionData[] }) {
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  // Its own time filter, like the category widgets: it follows the screen's period (and comparison) until another one is chosen.
  const now = useMemo(() => new Date(), []);
  const labels = usePeriodLabels();
  const [own, setOwn] = useState<'dashboard' | HistoryPreset>('dashboard');
  const [ownMonth, setOwnMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));
  const ownSummary = useMemo(
    () => (own === 'dashboard' ? summary : summarizePeriod(movements, historyRange(own, now, { from: parseDateText(customFrom), to: parseDateText(customTo) }, ownMonth), labels)),
    [own, summary, movements, now, customFrom, customTo, ownMonth, labels]
  );
  const months: MonthBar[] = ownSummary.months;
  const start = ownSummary.range.start;
  const compare: MonthBar[] | null = own === 'dashboard' && compareSummary ? compareSummary.months : null;
  const compareStart = own === 'dashboard' && compareSummary ? compareSummary.range.start : undefined;
  const [open, setOpen] = useState<number | null>(null);
  const max = Math.max(1, ...months.flatMap((m) => [m.incomes, m.spending]), ...(compare ?? []).flatMap((m) => [m.incomes, m.spending]));
  const short = (value: number) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(Math.round(value)));
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const barArea = tablet ? TABLET_BAR_AREA : BAR_AREA;
  const many = months.length > 6 && !tablet;
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

  const leaderPrev = useMemo(() => {
    if (open === null || !compareStart || !previous) return null;
    const monthStart = new Date(compareStart.getFullYear(), compareStart.getMonth() + open, 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    return topSpendingCategories(movements.filter((tx) => isInRange(tx, { start: monthStart, end: monthEnd })), 1)[0] ?? null;
  }, [open, compareStart, previous, movements]);

  return (
    <Card title={t("mobile.mes.a.mes")} info={APP_INFO.mes_a_mes_2}>
      <CompactTimeFilter preset={own} onPreset={setOwn} month={ownMonth} onMonth={setOwnMonth} latest={now} customFrom={customFrom} onCustomFrom={setCustomFrom} customTo={customTo} onCustomTo={setCustomTo} includeDashboard periodSelect />
      {compare && compareStart && <Text className="font-inter-semibold text-xs text-gf-text-muted">{t("mobile.actual.p1.comparado.p2", { p1: labelAt(start, 0, months[0]?.label ?? ''), p2: labelAt(compareStart, 0, compare[0]?.label ?? '') })}</Text>}
      <View className="flex-row items-end gap-1.5" style={{ height: barArea + 48 }}>
        {months.map((month, index) => {
          const other = compare?.[index];
          const bar = (value: number, color: string, faint = false) => (
            <View className="items-center justify-end" style={{ height: barArea + 18 }}>
              {!many && <Text className="font-inter text-[9px] text-gf-text-muted">{short(value)}</Text>}
              <View style={{ width: tablet ? (months.length > 6 ? 22 : 34) : many ? 7 : 11, height: Math.max(3, (value / max) * barArea), borderRadius: 4, backgroundColor: color, opacity: faint ? 0.38 : 1 }} />
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
        <Text className="font-inter text-xs" style={{ color: colors.income }}>{t("mobile.ingresos.2")}</Text>
        <Text className="font-inter text-xs" style={{ color: colors.expense }}>{t("mobile.gastos.2")}</Text>
        {compare && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.tenue.p1", { p1: compareStart ? labelAt(compareStart, 0, compare[0]?.label ?? '') : 'periodo comparado' })}</Text>}
      </View>

      <DetailSheet
        visible={current !== null}
        onClose={() => setOpen(null)}
        title={currentLabel}
        subtitle={previous ? `Comparado con ${previousLabel}` : undefined}
        info={APP_INFO.detalle_del_mes(Boolean(previous))}>
        {current && (() => {
          const rowsData = [
            { label: t("mobile.ingresos"), a: money(current.incomes), b: previous ? money(previous.incomes) : null, tone: colors.income },
            { label: t("mobile.gastos"), a: money(current.spending), b: previous ? money(previous.spending) : null, tone: colors.expense },
            { label: t("mobile.balance"), a: money(current.incomes - current.spending), b: previous ? money(previous.incomes - previous.spending) : null, tone: colors.text },
            { label: t("mobile.categoria.lider.2"), a: leader ? `${leader.name}\n${money(leader.value)}` : '—', b: previous ? (leaderPrev ? `${leaderPrev.name}\n${money(leaderPrev.value)}` : '—') : null, tone: colors.text },
          ];
          return (
            <View>
              <View className="flex-row items-center gap-3 pb-2">
                <Text className="w-28 font-inter-semibold text-xs uppercase text-gf-text-muted"> </Text>
                <Text className="flex-1 font-inter-semibold text-sm text-gf-text">{currentLabel}</Text>
                {previous && <Text className="flex-1 font-inter-semibold text-sm text-gf-text-muted">{previousLabel}</Text>}
              </View>
              {rowsData.map((row) => (
                <View key={row.label} className="flex-row items-start gap-3 border-t border-gf-border py-3">
                  <Text className="w-28 font-inter-medium text-sm text-gf-text-muted">{row.label}</Text>
                  <Text className="flex-1 font-inter-semibold text-base" style={{ color: row.tone }}>{row.a}</Text>
                  {row.b !== null && <Text className="flex-1 font-inter-semibold text-base" style={{ color: row.tone, opacity: 0.6 }}>{row.b}</Text>}
                </View>
              ))}
            </View>
          );
        })()}
      </DetailSheet>
    </Card>
  );
}
