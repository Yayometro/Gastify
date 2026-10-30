import { useT, useInfo } from "@/i18n/client";
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { TourTarget } from '@/components/tour/tour-target';
import { CategoryBadge } from '@/components/category-badge';
import { MovementRow } from '@/components/movements/movement-row';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { tNow } from '@/i18n/now';


type Group = { key: string; name: string; icon?: string | null; color?: string | null; total: number; items: TransactionData[] };

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
  const t = useT();
  const { APP_INFO } = useInfo();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [ascending, setAscending] = useState(false);
  // The header (and its close control) appears first; the list of movements follows on the next turn, so a long list never delays it.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!visible) {
      setReady(false);
      return;
    }
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, [visible]);
  const money = (value: number) => formatMoneyMajor(value, currency);

  const { total, groups } = useMemo(() => {
    const map = new Map<string, Group>();
    for (const tx of movements) {
      const subCategory = (tx as { subCategory?: { name?: string; icon?: string; color?: string } | null }).subCategory;
      const category = (tx as { category?: { icon?: string; color?: string } | null }).category;
      const sub = subCategory?.name || t("mobile.sin.subcategoria");
      const group = map.get(sub) ?? { key: sub, name: sub, icon: subCategory?.icon ?? category?.icon, color: subCategory?.color ?? category?.color, total: 0, items: [] };
      group.total += Math.abs(getPrimaryAmount(tx));
      group.items.push(tx);
      map.set(sub, group);
    }
    const dir = ascending ? 1 : -1;
    const sorted = [...map.values()]
      .map((group) => ({ ...group, items: [...group.items].sort((a, b) => dir * (Math.abs(getPrimaryAmount(a)) - Math.abs(getPrimaryAmount(b)))) }))
      .sort((a, b) => dir * (a.total - b.total));
    return { total: sorted.reduce((sum, group) => sum + group.total, 0), groups: sorted };
  }, [movements, ascending, t]);

  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const count = `${tNow("mobile.movimientos.conteo", { count: movements.length, p1: movements.length })} · ${tNow("mobile.subcategorias.conteo", { count: groups.length, p1: groups.length })}`;

  return (
    <DetailSheet
      tour="m-catdetail"
      tall
      visible={visible}
      onClose={onClose}
      title={tablet ? '' : name}
      subtitle={tablet ? undefined : prefix}
>
      {/* The name and the total, once each: side by side on a tablet (big), the total under the name on a phone. */}
      {tablet ? (
        <TourTarget id="m-catdetail-total" className="flex-row items-end justify-between gap-4">
          <View className="flex-1">
            {prefix ? <Text className="font-inter-medium text-sm text-gf-text-muted">{prefix}</Text> : null}
            <Text className="font-inter-bold text-4xl text-gf-text" numberOfLines={1}>{name}</Text>
            <Text className="font-inter text-base text-gf-text-muted">{count}</Text>
          </View>
          <Text className="font-inter-bold text-4xl text-gf-text">{money(total)}</Text>
        </TourTarget>
      ) : (
        <TourTarget id="m-catdetail-total" className="gap-1 rounded-2xl p-4" style={{ backgroundColor: colors.accentSoft }}>
          <Text className="font-inter-bold text-3xl text-gf-text">{money(total)}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">{count}</Text>
        </TourTarget>
      )}
      <TourTarget id="m-catdetail-sort" className="flex-row gap-2">
        {[false, true].map((asc) => (
          <Pressable key={String(asc)} accessibilityRole="button" accessibilityState={{ selected: ascending === asc }} onPress={() => setAscending(asc)} className="rounded-full border border-gf-border px-4 py-2" style={{ backgroundColor: ascending === asc ? colors.accentSoft : undefined }}>
            <Text className="font-inter-medium text-sm text-gf-text">{asc ? t("mobile.menor.a.mayor") : t("mobile.mayor.a.menor")}</Text>
          </Pressable>
        ))}
      </TourTarget>
      {ready && groups.map((group, index) => (
        <TourTarget key={group.key} id={index === 0 ? "m-catdetail-group" : undefined} className="gap-1">
          <View className="flex-row items-center gap-3 border-b border-gf-border pb-2 pt-3">
            <CategoryBadge icon={group.icon} color={group.color} size={32} />
            <Text className="flex-1 font-inter-semibold text-base text-gf-text" numberOfLines={1}>{group.name}</Text>
            <Text className="font-inter text-xs text-gf-text-muted">{group.items.length} {group.items.length === 1 ? 'mov.' : 'movs.'}</Text>
            <Text className="font-inter-bold text-base text-gf-text">{money(group.total)}</Text>
          </View>
          <View style={{ marginLeft: 18, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 8 }}>
            {group.items.map((tx) => <MovementRow divider key={String(tx._id)} movement={tx} currency={currency} onPress={() => onOpenMovement(tx)} />)}
          </View>
        </TourTarget>
      ))}
    </DetailSheet>
  );
}
