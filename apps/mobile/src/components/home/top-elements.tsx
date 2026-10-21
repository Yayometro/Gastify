import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { MovementRow } from '@/components/movements/movement-row';
import { CategoryBadge } from '@/components/category-badge';
import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { filterBillsOrIncomes, getPrimaryAmount, orderByHighestValue, reduceTransCategoriesSliced } from '@gastify/core/transformers/transactionsChange';
import type { MonthBounds } from '@gastify/core/transactions/monthSummary';

// The biggest of the period, as the web's "Top" modules: gastos or ingresos, by category or one by one.
export function TopElements({ movements, range, currency }: { movements: TransactionData[]; range: MonthBounds; currency: string }) {
  const [kind, setKind] = useState<'bills' | 'incomes'>('bills');
  const [by, setBy] = useState<'categories' | 'movements'>('categories');
  const { bills, incomes } = filterBillsOrIncomes(movements.filter((movement) => isInRange(movement, range)));
  const list = kind === 'bills' ? bills : incomes;
  const categories = orderByHighestValue(reduceTransCategoriesSliced(list)).slice(0, 5);
  const biggest = [...list].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)).slice(0, 5);

  return (
    <Card title="Los más grandes" info={{ title: 'Los más grandes', text: 'Para qué sirve: ver en qué se fue la mayor parte de tu dinero. Cómo se calcula: se toman los gastos (o ingresos) del periodo, se agrupan por categoría y se ordenan de mayor a menor suma; en «Movimientos» se ordenan uno por uno por monto. Filtro: el periodo y el tipo (gastos o ingresos) que elijas en esta tarjeta; las transferencias entre tus cuentas no cuentan.' }}>
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
            <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id) } })} />
          ))}
    </Card>
  );
}
