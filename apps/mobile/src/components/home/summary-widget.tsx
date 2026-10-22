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
import { categoryBreakdown, groupSmallSlices, NO_SUBCATEGORY_NAME } from '@gastify/core/history/categoryBreakdown';
import { historyRange, summarizePeriod, type HistoryPreset, type PeriodSummary } from '@gastify/core/history/periodComparison';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { TransactionLike } from '@gastify/core/transformers/transactionsChange';

type Kind = 'spending' | 'incomes';

const MAX_ARCS = 7;

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
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [kind, setKind] = useState<Kind>('spending');
  // This chart can look at its own period; by default it follows the dashboard's.
  const [preset, setPreset] = useState<'dashboard' | HistoryPreset>('dashboard');
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));
  const { summary, movements } = useMemo(() => {
    if (preset === 'dashboard') return { summary: dashboardSummary, movements: dashboardMovements };
    const range = historyRange(preset, now, { from: parseDateText(customFrom), to: parseDateText(customTo) }, month);
    return { summary: summarizePeriod(allMovements, range), movements: allMovements.filter((movement) => isInRange(movement, range)) };
  }, [preset, month, now, customFrom, customTo, allMovements, dashboardSummary, dashboardMovements]);
  const [selected, setSelected] = useState<string | null>(null);
  // The chart type, as the web's selector: the nested ring, the bubbles or the treemap.
  const [chart, setChart] = useState<'ring' | 'bubbles' | 'treemap'>('ring');
  const total = kind === 'spending' ? summary.totals.spending : summary.totals.incomes;

  // The chart groups the small slices; the table lists every category.
  const allRows = useMemo(() => categoryBreakdown(movements, kind), [movements, kind]);
  const categories = useMemo(() => groupSmallSlices(allRows, MAX_ARCS), [allRows]);
  const chosen = allRows.find((slice) => slice.key === selected) ?? categories.find((slice) => slice.key === selected) ?? null;
  // Zoomed into a category the donut shows its subcategories; "Otras" shows the categories it merged. A
  // category with no subcategory of its own has nothing to zoom into: it is only highlighted.
  const zoomed = chosen !== null && chosen.children.some((child) => child.name !== NO_SUBCATEGORY_NAME);
  const shown = zoomed && chosen ? chosen.children : categories;
  const tableRows = zoomed && chosen ? chosen.children : allRows;
  const shownTotal = chosen ? chosen.value : total;
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const [detailOpen, setDetailOpen] = useState(false);

  // Another kind or period: the chosen slice may not exist any more.
  useEffect(() => setSelected(null), [kind, movements]);

  const select = (key: string) => (zoomed ? undefined : setSelected((current) => (current === key ? null : key)));

  // The chart and the zoom controls. On the phone the card only shows it as a preview (a tap opens the sheet); the sheet and the tablet make it interactive.
  const chartBlock = (interactive: boolean) => (
    <View className="gap-3">
      {chart !== 'ring' && chosen && interactive && (
        <Pressable accessibilityRole="button" accessibilityLabel="Regresar a todas las categorías" onPress={() => setSelected(null)} className="self-start flex-row items-center gap-1 py-1">
          <Ionicons name="arrow-back" size={18} color={colors.accent} />
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Todas las categorías</Text>
        </Pressable>
      )}
      {chart === 'bubbles' && <CategoryBubbles slices={shown} selectedKey={zoomed ? null : selected} onSelect={interactive ? select : () => setDetailOpen(true)} total={shownTotal} />}
      {chart === 'treemap' && <CategoryTreemap slices={shown} selectedKey={zoomed ? null : selected} onSelect={interactive ? select : () => setDetailOpen(true)} total={shownTotal} />}
      {chart === 'ring' && (
        <CategoryDonut
          slices={shown}
          selectedKey={zoomed ? null : selected}
          onSelect={interactive ? select : () => setDetailOpen(true)}
          centerTitle={chosen ? chosen.name : kind === 'spending' ? 'Gastos' : 'Ingresos'}
          centerValue={formatMoneyMajor(shownTotal, currency)}
          centerHint={interactive ? (zoomed ? '‹ Toca para volver' : chosen ? undefined : 'Toca una sección ›') : 'Toca para ver el detalle ›'}
          centerIcon={chosen && chosen.icon ? { icon: chosen.icon, color: chosen.color } : null}
          onCenterPress={interactive ? (chosen ? () => setSelected(null) : undefined) : () => setDetailOpen(true)}
          trackColor={scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,16,61,0.06)'}
        />
      )}
      {chart !== 'ring' && chosen && interactive && (
        <Pressable accessibilityRole="button" onPress={() => setSelected(null)} className="items-center">
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{chosen.name}: {formatMoneyMajor(chosen.value, currency)} · quitar selección</Text>
        </Pressable>
      )}
    </View>
  );

  const table = (limit?: number) => (
    <CategoryTable rows={tableRows} total={shownTotal} currency={currency} selectedKey={zoomed ? null : selected} disabled={zoomed} firstColumn={zoomed && chosen ? `${chosen.name} · subcategorías` : 'Categoría'} limit={limit} onPressRow={select} />
  );

  const filters = (
    <>
      <CompactTimeFilter preset={preset} onPreset={setPreset} month={month} onMonth={setMonth} latest={now} customFrom={customFrom} onCustomFrom={setCustomFrom} customTo={customTo} onCustomTo={setCustomTo} includeDashboard />
      <Segmented options={[{ value: 'spending', label: 'Gastos' }, { value: 'incomes', label: 'Ingresos' }]} value={kind} onChange={setKind} />
    </>
  );
  const totalText = <Text className="text-center font-inter-bold text-3xl" style={{ color: kind === 'spending' ? colors.expense : colors.income }}>{formatMoneyMajor(total, currency)}</Text>;
  const chartPicker = categories.length > 0 ? <Segmented options={[{ value: 'ring', label: 'Anillo' }, { value: 'bubbles', label: 'Burbujas' }, { value: 'treemap', label: 'Mapa' }]} value={chart} onChange={setChart} /> : null;
  const MAX_ROWS = 15;
  const seeMore = (
    <Pressable accessibilityRole="button" onPress={() => setDetailOpen(true)} className="items-center rounded-full py-3" style={{ backgroundColor: colors.accentSoft }}>
      <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Ver las {allRows.length} {allRows.length === 1 ? 'categoría' : 'categorías'} ›</Text>
    </Pressable>
  );
  // The big sheet: the filters and every category (1 to 50), no chart; the table scrolls and each row can be opened.
  const sheet = (
    <DetailSheet tall visible={detailOpen} onClose={() => setDetailOpen(false)} title="Resumen de transacciones" subtitle={`${allRows.length} ${allRows.length === 1 ? 'categoría' : 'categorías'} · ${kind === 'spending' ? 'gastos' : 'ingresos'}`}>
      {filters}
      {totalText}
      {zoomed && chosen && (
        <Pressable accessibilityRole="button" onPress={() => setSelected(null)} className="self-start flex-row items-center gap-1 py-1">
          <Ionicons name="arrow-back" size={18} color={colors.accent} />
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Todas las categorías</Text>
        </Pressable>
      )}
      {table()}
    </DetailSheet>
  );

  return (
    <Card title="Resumen de transacciones" info={{ title: 'Resumen de transacciones', text: 'Muestra cómo se reparten tus gastos (o ingresos) entre categorías: cada porción es la suma de la categoría ÷ el total del periodo. Anillo, burbujas y mapa son tres formas de ver la misma distribución, y la tabla lista las categorías con su porcentaje y su monto (hasta 15 aquí; si hay más, «Ver las N categorías» abre una ventana grande con todas). Toca una categoría para ver sus subcategorías y usa la flecha para regresar. Filtros: tiene su propio periodo, que puede ser distinto al de Inicio; abre Más filtros para cambiarlo.' }}>
      {categories.length === 0 ? (
        <>
          {filters}
          <Text className="font-inter text-sm text-gf-text-muted">Sin {kind === 'spending' ? 'gastos' : 'ingresos'} en este periodo.</Text>
        </>
      ) : tablet ? (
        <View className="flex-row items-start gap-6">
          <View style={{ flex: 1 }} className="gap-3">
            {filters}
            {chartPicker}
            {totalText}
            {chartBlock(true)}
          </View>
          <View style={{ flex: 1 }} className="gap-3">
            {table(MAX_ROWS)}
            {allRows.length > MAX_ROWS && !zoomed && seeMore}
          </View>
        </View>
      ) : (
        <>
          {filters}
          {chartPicker}
          {totalText}
          {chartBlock(false)}
          {table(5)}
          {seeMore}
        </>
      )}
      {sheet}

      {summary.months.length > 1 && (
        <View className="gap-2 pt-1">
          <Text className="font-inter-medium text-sm text-gf-text-muted">Mes a mes</Text>
          <MonthlyBars months={summary.months} show={kind} />
        </View>
      )}
    </Card>
  );
}
