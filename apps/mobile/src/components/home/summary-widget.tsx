import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { CategoryDonut } from '@/components/charts/category-donut';
import { ChipPicker } from '@/components/chip-picker';
import { MonthSwitcher } from '@/components/month-switcher';
import { MonthlyBars } from '@/components/charts/monthly-bars';
import { CategoryBadge } from '@/components/category-badge';
import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { categoryBreakdown, groupSmallSlices, NO_SUBCATEGORY_NAME } from '@gastify/core/history/categoryBreakdown';
import { HISTORY_PRESETS, historyRange, summarizePeriod, type HistoryPreset, type PeriodSummary } from '@gastify/core/history/periodComparison';
import { isInRange } from '@gastify/core/transactions/movementFilters';
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
  const { summary, movements } = useMemo(() => {
    if (preset === 'dashboard') return { summary: dashboardSummary, movements: dashboardMovements };
    const range = historyRange(preset, now, { from: null, to: null }, month);
    return { summary: summarizePeriod(allMovements, range), movements: allMovements.filter((movement) => isInRange(movement, range)) };
  }, [preset, month, now, allMovements, dashboardSummary, dashboardMovements]);
  const [selected, setSelected] = useState<string | null>(null);
  const total = kind === 'spending' ? summary.totals.spending : summary.totals.incomes;

  const categories = useMemo(() => groupSmallSlices(categoryBreakdown(movements, kind), MAX_ARCS), [movements, kind]);
  const chosen = categories.find((slice) => slice.key === selected) ?? null;
  // Zoomed into a category the donut shows its subcategories; "Otras" shows the categories it merged. A
  // category with no subcategory of its own has nothing to zoom into: it is only highlighted.
  const zoomed = chosen !== null && chosen.children.some((child) => child.name !== NO_SUBCATEGORY_NAME);
  const shown = zoomed && chosen ? chosen.children : categories;
  const shownTotal = chosen ? chosen.value : total;

  // Another kind or period: the chosen slice may not exist any more.
  useEffect(() => setSelected(null), [kind, movements]);

  return (
    <Card title="Resumen">
      <ChipPicker
        items={[{ id: 'dashboard', label: 'Igual que arriba' }, ...HISTORY_PRESETS.filter((p) => p.value !== 'custom').map((p) => ({ id: p.value, label: p.label }))]}
        value={preset}
        onChange={(id) => setPreset(id as 'dashboard' | HistoryPreset)}
        moreAfter={99}
      />
      {preset === 'month' && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
      <Segmented options={[{ value: 'spending', label: 'Gastos' }, { value: 'incomes', label: 'Ingresos' }]} value={kind} onChange={setKind} />
      <Text className="text-center font-inter-bold text-3xl" style={{ color: kind === 'spending' ? colors.expense : colors.income }}>{formatMoneyMajor(total, currency)}</Text>

      {categories.length === 0 ? (
        <Text className="font-inter text-sm text-gf-text-muted">Sin {kind === 'spending' ? 'gastos' : 'ingresos'} en este periodo.</Text>
      ) : (
        <>
          <CategoryDonut
            slices={shown}
            selectedKey={zoomed ? null : selected}
            onSelect={(key) => (zoomed ? undefined : setSelected((current) => (current === key ? null : key)))}
            centerTitle={chosen ? chosen.name : kind === 'spending' ? 'Gastos' : 'Ingresos'}
            centerValue={formatMoneyMajor(shownTotal, currency)}
            centerHint={zoomed ? '‹ Toca para volver' : chosen ? undefined : 'Toca una sección ›'}
            centerIcon={chosen && chosen.icon ? { icon: chosen.icon, color: chosen.color } : null}
            onCenterPress={chosen ? () => setSelected(null) : undefined}
            trackColor={scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,16,61,0.06)'}
          />
          {shown.map((row) => (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              accessibilityLabel={`${row.name}, ${formatMoneyMajor(row.value, currency)}`}
              disabled={zoomed}
              onPress={() => setSelected((current) => (current === row.key ? null : row.key))}
              className="flex-row items-center gap-3"
              style={{ opacity: selected !== null && !zoomed && selected !== row.key ? 0.45 : 1 }}>
              {row.icon ? <CategoryBadge icon={row.icon} color={row.color} size={32} /> : <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: row.color }} />}
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
              <Text className="font-inter text-sm text-gf-text-muted">{shownTotal > 0 ? Math.round((row.value / shownTotal) * 100) : 0}%</Text>
              <Text className="w-28 text-right font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
            </Pressable>
          ))}
        </>
      )}

      {summary.months.length > 1 && (
        <View className="gap-2 pt-1">
          <Text className="font-inter-medium text-sm text-gf-text-muted">Mes a mes</Text>
          <MonthlyBars months={summary.months} show={kind} />
        </View>
      )}
    </Card>
  );
}
