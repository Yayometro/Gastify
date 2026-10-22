import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { MovementRow } from '@/components/movements/movement-row';
import { Colors } from '@/constants/theme';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';

type Group = { key: string; name: string; total: number; items: TransactionData[] };

// One category opened: its total, how many movements it has and, below, its subcategories from the biggest spending to
// the smallest, each with its own movements indented under it, also from the biggest. A switch reverses the order.
export function CategoryDetailSheet({
  visible,
  name,
  prefix,
  movements,
  currency,
  onOpenMovement,
  onClose,
}: {
  visible: boolean;
  name: string;
  prefix?: string;
  movements: TransactionData[];
  currency: string;
  onOpenMovement: (movement: TransactionData) => void;
  onClose: () => void;
}) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [ascending, setAscending] = useState(false);
  const money = (value: number) => formatMoneyMajor(value, currency);

  const { total, groups } = useMemo(() => {
    const map = new Map<string, Group>();
    for (const tx of movements) {
      const sub = (tx as { subCategory?: { name?: string } | null }).subCategory?.name || 'Sin subcategoría';
      const group = map.get(sub) ?? { key: sub, name: sub, total: 0, items: [] };
      group.total += Math.abs(getPrimaryAmount(tx));
      group.items.push(tx);
      map.set(sub, group);
    }
    const dir = ascending ? 1 : -1;
    const sorted = [...map.values()]
      .map((group) => ({ ...group, items: [...group.items].sort((a, b) => dir * (Math.abs(getPrimaryAmount(a)) - Math.abs(getPrimaryAmount(b)))) }))
      .sort((a, b) => dir * (a.total - b.total));
    return { total: sorted.reduce((sum, group) => sum + group.total, 0), groups: sorted };
  }, [movements, ascending]);

  return (
    <DetailSheet
      tall
      visible={visible}
      onClose={onClose}
      title={name}
      subtitle={`${prefix ? `${prefix} · ` : ''}${movements.length} ${movements.length === 1 ? 'movimiento' : 'movimientos'}`}
      info={{ title: 'Detalle de la categoría', text: 'Total de la categoría = la suma de todos sus movimientos en el periodo. Abajo, cada subcategoría con su total, ordenadas de mayor a menor gasto, y dentro de cada una sus movimientos, también de mayor a menor. Con el interruptor puedes invertir el orden (de menor a mayor). Toca un movimiento para abrirlo.' }}>
      <View className="gap-1 rounded-2xl p-4" style={{ backgroundColor: colors.accentSoft }}>
        <Text className="font-inter text-sm text-gf-text-muted">Total de la categoría</Text>
        <Text className="font-inter-bold text-3xl text-gf-text">{money(total)}</Text>
        <Text className="font-inter text-sm text-gf-text-muted">{movements.length} {movements.length === 1 ? 'movimiento' : 'movimientos'} · {groups.length} {groups.length === 1 ? 'subcategoría' : 'subcategorías'}</Text>
      </View>
      <View className="flex-row gap-2">
        {[false, true].map((asc) => (
          <Pressable key={String(asc)} accessibilityRole="button" accessibilityState={{ selected: ascending === asc }} onPress={() => setAscending(asc)} className="rounded-full border border-gf-border px-4 py-2" style={{ backgroundColor: ascending === asc ? colors.accentSoft : undefined }}>
            <Text className="font-inter-medium text-sm text-gf-text">{asc ? 'Menor a mayor' : 'Mayor a menor'}</Text>
          </Pressable>
        ))}
      </View>
      {groups.map((group) => (
        <View key={group.key} className="gap-1">
          <View className="flex-row items-center justify-between gap-3 border-b border-gf-border pb-2 pt-3">
            <Text className="flex-1 font-inter-semibold text-base text-gf-text" numberOfLines={1}>{group.name}</Text>
            <Text className="font-inter text-xs text-gf-text-muted">{group.items.length} {group.items.length === 1 ? 'mov.' : 'movs.'}</Text>
            <Text className="font-inter-bold text-base text-gf-text">{money(group.total)}</Text>
          </View>
          <View style={{ marginLeft: 18, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 8 }}>
            {group.items.map((tx) => <MovementRow divider key={String(tx._id)} movement={tx} currency={currency} onPress={() => onOpenMovement(tx)} />)}
          </View>
        </View>
      ))}
    </DetailSheet>
  );
}
