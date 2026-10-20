import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { CategoryBadge } from '@/components/category-badge';
import { MovementRow } from '@/components/movements/movement-row';
import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import type { InfoText } from '@/components/info-tip';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { HISTORY_PRESETS, historyRange, type HistoryPreset } from '@gastify/core/history/periodComparison';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { filterBillsOrIncomes, getPrimaryAmount, orderByHighestValue, reduceTransCategoriesSliced } from '@gastify/core/transformers/transactionsChange';

// The web's "Top" sizes (the switch 3 / 6 / 12 / 24).
export const TOP_SIZES = [3, 6, 12, 24] as const;
export type TopSize = (typeof TOP_SIZES)[number];

// The biggest elements of a period, with its own time filter and size, like the web's Top modules:
// gastos or ingresos, by category or movement by movement. Each tap opens the movement.
export function TopRanking({
  movements,
  currency,
  title,
  info,
  defaultPreset,
  returnTo,
}: {
  movements: TransactionData[];
  currency: string;
  title: string;
  info?: InfoText;
  defaultPreset: HistoryPreset;
  returnTo?: string;
}) {
  const [preset, setPreset] = useState<HistoryPreset>(defaultPreset);
  const [size, setSize] = useState<TopSize>(6);
  const [kind, setKind] = useState<'bills' | 'incomes'>('bills');
  const [by, setBy] = useState<'categories' | 'movements'>('categories');
  const now = useMemo(() => new Date(), []);

  const range = useMemo(() => historyRange(preset, now, { from: null, to: null }), [preset, now]);
  const { bills, incomes } = useMemo(() => filterBillsOrIncomes(movements.filter((movement) => isInRange(movement, range))), [movements, range]);
  const list = kind === 'bills' ? bills : incomes;
  const categories = useMemo(() => orderByHighestValue(reduceTransCategoriesSliced(list)).slice(0, size), [list, size]);
  const biggest = useMemo(() => [...list].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)).slice(0, size), [list, size]);
  const sizeOptions = TOP_SIZES.map((n) => ({ value: String(n) as `${TopSize}`, label: String(n) }));

  return (
    <Card title={title} info={info}>
      <ChipPicker items={HISTORY_PRESETS.map((p) => ({ id: p.value, label: p.label }))} value={preset} onChange={(id) => setPreset(id as HistoryPreset)} moreAfter={99} />
      <Segmented options={sizeOptions} value={String(size) as `${TopSize}`} onChange={(next) => setSize(Number(next) as TopSize)} />
      <Segmented options={[{ value: 'bills', label: 'Gastos' }, { value: 'incomes', label: 'Ingresos' }]} value={kind} onChange={setKind} />
      <Segmented options={[{ value: 'categories', label: 'Por categoría' }, { value: 'movements', label: 'Movimientos' }]} value={by} onChange={setBy} />
      {list.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin movimientos en este periodo.</Text>}
      {by === 'categories'
        ? categories.map((row) => (
            <View key={row.type} className="flex-row items-center gap-3">
              <CategoryBadge icon={row.icon} color={row.color} size={36} />
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.type === 'No category' ? 'Sin categoría' : row.type}</Text>
              <Text className="font-inter-semibold text-base text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
            </View>
          ))
        : biggest.map((movement) => (
            <MovementRow
              key={String(movement._id)}
              movement={movement}
              currency={currency}
              onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } })}
            />
          ))}
    </Card>
  );
}
