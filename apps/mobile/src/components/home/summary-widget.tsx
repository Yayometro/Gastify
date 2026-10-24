import { usePeriodLabels } from '@/hooks/use-period-labels';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { CategoryBubbles } from '@/components/charts/category-bubbles';
import { CategoryDonut } from '@/components/charts/category-donut';
import { CategoryTreemap } from '@/components/charts/category-treemap';
import { CompactTimeFilter } from '@/components/compact-time-filter';
import { MonthlyBars } from '@/components/charts/monthly-bars';
import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import { CategoryTable } from '@/components/home/category-table';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';
import { categoryBreakdown } from '@gastify/core/history/categoryBreakdown';
import { ALL_MOVEMENTS, backOne, drillView, openSlice, type DrillState } from '@gastify/core/history/categoryDrill';
import { historyRange, summarizePeriod, type HistoryPreset, type PeriodSummary } from '@gastify/core/history/periodComparison';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { TransactionLike } from '@gastify/core/transformers/transactionsChange';

import { useT, useInfo } from "@/i18n/client";

type Kind = 'spending' | 'incomes';

// Gastos / Ingresos of the period: the total, a donut of how it splits across categories (tap a slice to
// see its subcategories, like the web's sunburst), the list, and the months side by side.
export function SummaryWidget({
  summary: dashboardSummary,
  movements: dashboardMovements,
  allMovements,
  currency,
}: {
  summary: PeriodSummary;
  movements: TransactionLike[];
  allMovements: TransactionLike[];
  currency: string;
}) {
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [kind, setKind] = useState<Kind>('spending');
  // This chart can look at its own period; by default it follows the dashboard's.
  const labels = usePeriodLabels();
  const [preset, setPreset] = useState<'dashboard' | HistoryPreset>('dashboard');
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));
  const { summary, movements } = useMemo(() => {
    if (preset === 'dashboard') return { summary: dashboardSummary, movements: dashboardMovements };
    const range = historyRange(preset, now, { from: parseDateText(customFrom), to: parseDateText(customTo) }, month);
    return { summary: summarizePeriod(allMovements, range, labels), movements: allMovements.filter((movement) => isInRange(movement, range)) };
  }, [preset, month, now, customFrom, customTo, allMovements, dashboardSummary, dashboardMovements, labels]);
  // The chart type, as the web's selector: the nested ring, the bubbles or the treemap.
  const [chart, setChart] = useState<'ring' | 'bubbles' | 'treemap'>('ring');
  const total = kind === 'spending' ? summary.totals.spending : summary.totals.incomes;

  // The chart groups the small slices; the table lists every category.
  const allRows = useMemo(() => categoryBreakdown(movements, kind), [movements, kind]);
  // The chart shows every category (the phone's table is the one that is cut short, not the chart).
  const categories = allRows;
  // The drill-down path: the category opened, then the subcategory opened inside it. Each level is drawn by the chart and
  // the table alike (see drillView in core): categories, then subcategories, then the movements of a subcategory.
  const [path, setPath] = useState<DrillState>({ path: [] });
  const view = useMemo(() => drillView(allRows, path, total), [allRows, path, total]);
  const chosen = view.current;
  const level = view.level;
  const zoomed = level > 0;
  const shown = zoomed ? view.slices : categories;
  const tableRows = zoomed ? view.slices : allRows;
  const shownTotal = chosen ? chosen.value : total;
  // Nothing is highlighted: the opened slice is the level itself, and the chart shows its children.
  const selected: string | null = null;
  const windowWidth = useWindowDimensions().width;
  const tablet = windowWidth >= TABLET_MIN_WIDTH;
  // On a tablet the ring takes the room of its column (about 60 % of the card).
  const bigChart = Math.max(280, Math.min(560, Math.round((windowWidth - 160) * 0.6 - 60)));
  const [detailOpen, setDetailOpen] = useState(false);

  // A different kind (gastos / ingresos) or period starts the drill-down from the top. Only those reset it: a data refresh
  // must not, or the chart jumps back to the first level while the person is inside it.
  const periodKey = `${preset}|${month.getTime()}|${customFrom}|${customTo}`;
  useEffect(() => setPath({ path: [] }), [kind, periodKey]);

  // Tapping a slice opens it one level deeper; tapping the open one again closes it. The deepest level (movements) is not opened further.
  const select = (key: string) => {
    if (level >= 2) return;
    setPath((current) => openSlice(current, key));
  };
  const back = () => setPath((current) => backOne(current));

  // The way back up one level, shown above the chart on the card and in the sheet alike.
  // Above the chart: back up one level on the left; inside a category, also the way down to its movements on the right.
  const backRow = zoomed && chosen ? (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable accessibilityRole="button" onPress={back} className="flex-row items-center gap-1 py-1">
        <Ionicons name="arrow-back" size={18} color={colors.accent} />
        <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{level === 1 ? 'Todas las categorías' : `Volver a ${chosen.name}`}</Text>
      </Pressable>
      {level === 1 && (
        <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.home.seeTransactionsOf", { p1: chosen.name })} onPress={() => setPath((current) => ({ path: [...current.path, ALL_MOVEMENTS] }))} className="flex-row items-center gap-1 py-1">
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ver.transacciones")}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </Pressable>
      )}
    </View>
  ) : null;

  // The chart, the same on the card and in the sheet: a tap on a slice opens the next level right here (its
  // subcategories, then its movements). Only "Ver las N categorías" opens the sheet.
  const chartBlock = () => (
    <View className="gap-3">
      {chart === 'bubbles' && <CategoryBubbles slices={shown} selectedKey={zoomed ? null : selected} onSelect={select} total={shownTotal} height={tablet ? bigChart : undefined} />}
      {chart === 'treemap' && <CategoryTreemap slices={shown} selectedKey={zoomed ? null : selected} onSelect={select} total={shownTotal} height={tablet ? bigChart : undefined} />}
      {chart === 'ring' && (
        <CategoryDonut
          slices={shown}
          selectedKey={zoomed ? null : selected}
          onSelect={select}
          centerTitle={chosen ? chosen.name : kind === 'spending' ? 'Gastos' : 'Ingresos'}
          centerValue={formatMoneyMajor(shownTotal, currency)}
          centerHint={zoomed ? '‹ Toca para volver' : 'Toca una sección ›'}
          centerIcon={chosen && chosen.icon ? { icon: chosen.icon, color: chosen.color } : null}
          onCenterPress={zoomed ? back : undefined}
          trackColor={scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,16,61,0.06)'}
          size={tablet ? bigChart : undefined}
        />
      )}
    </View>
  );

  const table = (limit?: number) => (
    <CategoryTable rows={tableRows} total={shownTotal} currency={currency} selectedKey={zoomed ? null : selected} disabled={false} firstColumn={zoomed && chosen ? (level === 1 ? `${chosen.name} · subcategorías` : `${chosen.name} · movimientos`) : 'Categoría'} limit={limit} onPressRow={select} drillLabel={level === 0 ? 'Ver subcategorías' : level === 1 ? 'Ver transacciones' : undefined} />
  );

  const filters = (
    <>
      <CompactTimeFilter preset={preset} onPreset={setPreset} month={month} onMonth={setMonth} latest={now} customFrom={customFrom} onCustomFrom={setCustomFrom} customTo={customTo} onCustomTo={setCustomTo} includeDashboard />
      <Segmented options={[{ value: 'spending', label: t("mobile.gastos") }, { value: 'incomes', label: t("mobile.ingresos") }]} value={kind} onChange={setKind} />
    </>
  );
  const totalText = <Text className="text-center font-inter-bold text-3xl" style={{ color: kind === 'spending' ? colors.expense : colors.income }}>{formatMoneyMajor(total, currency)}</Text>;
  const chartPicker = categories.length > 0 ? <Segmented options={[{ value: 'ring', label: t("mobile.anillo") }, { value: 'bubbles', label: t("mobile.burbujas") }, { value: 'treemap', label: t("mobile.mapa") }]} value={chart} onChange={setChart} /> : null;
  const MAX_ROWS = 15;
  const seeMore = (
    <Pressable accessibilityRole="button" onPress={() => setDetailOpen(true)} className="items-center rounded-full py-3" style={{ backgroundColor: colors.accentSoft }}>
      <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ver.las.p1.p2", { p1: allRows.length, p2: allRows.length === 1 ? 'categoría' : 'categorías' })}</Text>
    </Pressable>
  );
  // The big sheet: the filters, the same chart as the card (it drills down the same way) and every category, each row can be opened.
  const sheet = (
    <DetailSheet tall visible={detailOpen} onClose={() => setDetailOpen(false)} title={t("mobile.resumen.de.transacciones")} subtitle={t("mobile.home.categoryCountSubtitle", { count: allRows.length, p1: allRows.length, p2: kind === 'spending' ? t("mobile.home.spendingWord") : t("mobile.home.incomeWord") })}>
      {filters}
      {chartPicker}
      {totalText}
      {backRow}
      {chartBlock()}
      {table()}
    </DetailSheet>
  );

  return (
    <Card title={t("mobile.resumen.de.transacciones")} info={APP_INFO.resumen_de_transacciones}>
      {categories.length === 0 ? (
        <>
          {filters}
          <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.p1.en.este.periodo", { p1: kind === 'spending' ? 'gastos' : 'ingresos' })}</Text>
        </>
      ) : tablet ? (
        <View className="flex-row items-start gap-6">
          <View style={{ flex: 3 }} className="gap-3">
            {filters}
            {chartPicker}
            {totalText}
            {backRow}
            {chartBlock()}
          </View>
          <View style={{ flex: 2 }} className="gap-3">
            {table(MAX_ROWS)}
            {allRows.length > MAX_ROWS && !zoomed && seeMore}
          </View>
        </View>
      ) : (
        <>
          {filters}
          {chartPicker}
          {totalText}
          {backRow}
          {chartBlock()}
          {table(5)}
          {seeMore}
        </>
      )}
      {sheet}

      {summary.months.length > 1 && (
        <View className="gap-2 pt-1">
          <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.mes.a.mes")}</Text>
          <MonthlyBars months={summary.months} show={kind} />
        </View>
      )}
    </Card>
  );
}
