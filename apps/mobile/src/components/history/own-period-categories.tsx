import { usePeriodLabels } from '@/hooks/use-period-labels';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { CategoryDetailSheet } from '@/components/category-detail-sheet';
import { CategoryBadge } from '@/components/category-badge';
import { CompactTimeFilter } from '@/components/compact-time-filter';
import { MovementRow } from '@/components/movements/movement-row';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';
import { rangeLabel } from "@gastify/core/i18n/dates";
import { compareCategories, historyRange, summarizePeriod, type CompareRow, type HistoryPreset, type PeriodSummary } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { CategoryTotal } from '@gastify/core/transactions/monthSummary';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { useT, useLocale } from "@/i18n/client";

type Own = 'dashboard' | HistoryPreset;

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
  movements: TransactionData[];
  summary: PeriodSummary;
  compareSummary: PeriodSummary | null;
  currency: string;
}) {
  const locale = useLocale();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const now = useMemo(() => new Date(), []);
  const [own, setOwn] = useState<Own>('dashboard');
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const labels = usePeriodLabels();
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const ownRange = useMemo(() => own === 'dashboard' ? summary.range : historyRange(own, now, { from: parseDateText(customFrom), to: parseDateText(customTo) }, month), [own, summary.range, now, customFrom, customTo, month]);

  const { rows, compare } = useMemo(() => {
    const pick = (s: PeriodSummary) => (kind === 'spending' ? s.spendingByCategory : (s.incomeByCategory as CategoryTotal[]));
    if (own === 'dashboard') return { rows: compareCategories(pick(summary), compareSummary ? pick(compareSummary) : []), compare: Boolean(compareSummary) };
    const mine = summarizePeriod(movements, ownRange, labels);
    return { rows: compareCategories(pick(mine), []), compare: false };
  }, [own, ownRange, movements, summary, compareSummary, kind, labels]);

  const max = Math.max(1, ...rows.map((row) => Math.max(row.a, row.b)));
  const selectedRow = rows.find((row) => row.name === selectedCategory);
  const comparing = compare && compareSummary !== null && own === 'dashboard';
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const selectedMovements = useMemo(() => {
    if (!selectedCategory) return [];
    return movements.filter((tx) => isInRange(tx, ownRange) && (kind === 'spending' ? tx.isBill && !tx.isIncome : tx.isIncome) && (tx.category?.name || 'Sin categoría') === selectedCategory)
      .sort((a, b) => order === 'desc' ? getPrimaryAmount(b) - getPrimaryAmount(a) : getPrimaryAmount(a) - getPrimaryAmount(b));
  }, [movements, ownRange, kind, selectedCategory, order]);

  const comparedMovements = useMemo(() => {
    if (!selectedCategory || !comparing || !compareSummary) return [];
    return movements.filter((tx) => isInRange(tx, compareSummary.range) && (kind === 'spending' ? tx.isBill && !tx.isIncome : tx.isIncome) && (tx.category?.name || 'Sin categoría') === selectedCategory)
      .sort((x, y) => order === 'desc' ? getPrimaryAmount(y) - getPrimaryAmount(x) : getPrimaryAmount(x) - getPrimaryAmount(y));
  }, [movements, compareSummary, comparing, kind, selectedCategory, order]);
  const open = (tx: TransactionData) => { setSelectedCategory(null); router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/history' } }); };
  const column = (label: string, total: number, list: TransactionData[]) => (
    <View className="flex-1 gap-1" key={label}>
      <Text className="font-inter-semibold text-sm text-gf-text">{label}</Text>
      <Text className="font-inter-bold text-lg text-gf-text">{formatMoneyMajor(total, currency)}</Text>
      <Text className="pb-1 font-inter text-xs text-gf-text-muted">{list.length} {list.length === 1 ? 'movimiento' : 'movimientos'}</Text>
      {list.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.movimientos.en.este.periodo")}</Text>}
      {list.map((tx) => <MovementRow divider key={String(tx._id)} movement={tx} currency={currency} onPress={() => open(tx)} />)}
    </View>
  );

  return (
    <Card title={title} info={info}>
      <CompactTimeFilter preset={own} onPreset={setOwn} month={month} onMonth={setMonth} latest={now} customFrom={customFrom} onCustomFrom={setCustomFrom} customTo={customTo} onCustomTo={setCustomTo} includeDashboard periodSelect />
      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.movimientos.en.este.periodo")}</Text>}
      {rows.slice(0, 12).map((row: CompareRow) => (
        <Pressable key={row.name} accessibilityRole="button" accessibilityLabel={`Ver movimientos de ${row.name}`} onPress={() => setSelectedCategory(row.name)} className="gap-1.5">
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
        </Pressable>
      ))}
      {comparing && compareSummary ? (
      <DetailSheet tall visible={selectedRow !== undefined} onClose={() => setSelectedCategory(null)} title={selectedRow?.name ?? ''} subtitle={`${selectedMovements.length} movimientos · ${formatMoneyMajor(selectedRow?.a ?? 0, currency)}`}>
        <View className="flex-row gap-2">
          <Pressable accessibilityRole="button" accessibilityState={{ selected: order === 'desc' }} onPress={() => setOrder('desc')} className="rounded-full border border-gf-border px-3 py-2" style={{ backgroundColor: order === 'desc' ? colors.accentSoft : undefined }}><Text className="font-inter-medium text-xs text-gf-text">{t("mobile.mayor.primero")}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: order === 'asc' }} onPress={() => setOrder('asc')} className="rounded-full border border-gf-border px-3 py-2" style={{ backgroundColor: order === 'asc' ? colors.accentSoft : undefined }}><Text className="font-inter-medium text-xs text-gf-text">{t("mobile.menor.primero")}</Text></Pressable>
        </View>
        {comparing && compareSummary ? (
          <>
            <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.izquierda.el.periodo.elegido.derecha")}</Text>
            <View className={tablet ? 'flex-row items-start gap-4' : 'gap-5'}>
              {column(`Periodo · ${rangeLabel(summary.range.start, summary.range.end, locale)}`, selectedRow?.a ?? 0, selectedMovements)}
              {column(`Comparado · ${rangeLabel(compareSummary.range.start, compareSummary.range.end, locale)}`, selectedRow?.b ?? 0, comparedMovements)}
            </View>
          </>
        ) : selectedMovements.map((tx) => <MovementRow divider key={String(tx._id)} movement={tx} currency={currency} onPress={() => open(tx)} />)}
      </DetailSheet>
      ) : (
        <CategoryDetailSheet
          visible={selectedRow !== undefined}
          name={selectedRow?.name ?? ''}
          movements={selectedMovements}
          currency={currency}
          onOpenMovement={open}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </Card>
  );
}
