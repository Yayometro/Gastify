import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { Colors } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-device-class';
import { tNow } from '@/i18n/now';
import type { BreakdownSlice } from '@gastify/core/history/categoryBreakdown';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { useT } from "@/i18n/client";

// The categories of a period as a table: numbered, a hairline between rows, the currency written once in the header
// instead of on every row, and the share of the total in its own column.
export function CategoryTable({
  rows,
  total,
  currency,
  selectedKey,
  disabled = false,
  firstColumn: firstColumnProp,
  limit,
  onPressRow,
  drillLabel,
}: {
  rows: BreakdownSlice[];
  total: number;
  currency: string;
  selectedKey?: string | null;
  disabled?: boolean;
  firstColumn?: string;
  limit?: number;
  onPressRow?: (key: string) => void;
  // What a row opens, written under its name with an arrow ("Ver subcategorías", "Ver transacciones"): the next level down.
  drillLabel?: string;
}) {
  const t = useT();
  const firstColumn = firstColumnProp ?? t("dashboard.bulk.category");
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  // On a phone the transactions column goes: its count moves under the name, so the name and the drill label have the width.
  const tablet = useIsTablet();
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <View>
      <View className={`flex-row items-center pb-2 ${tablet ? 'gap-3' : 'gap-2'}`}>
        <Text className="w-6 text-center font-inter-semibold text-xs uppercase text-gf-text-muted">#</Text>
        <Text className="flex-1 font-inter-semibold text-xs uppercase text-gf-text-muted">{firstColumn}</Text>
        <Text className={`${tablet ? 'w-12' : 'w-10'} text-right font-inter-semibold text-xs uppercase text-gf-text-muted`}>%</Text>
        {tablet && <Text className="w-14 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.trans")}</Text>}
        <Text className={`${tablet ? 'w-28' : 'w-24'} text-right font-inter-semibold text-xs uppercase text-gf-text-muted`}>{currency}</Text>
      </View>
      {shown.map((row, index) => (
        <Pressable
          key={row.key}
          accessibilityRole="button"
          accessibilityLabel={`${row.name}, ${formatMoneyMajor(row.value, currency)}`}
          disabled={disabled}
          onPress={() => onPressRow?.(row.key)}
          className={`flex-row items-center py-2.5 ${tablet ? 'gap-3' : 'gap-2'}`}
          style={{ borderTopWidth: 1, borderTopColor: colors.border, opacity: selectedKey && selectedKey !== row.key ? 0.45 : 1 }}>
          <Text className="w-6 text-center font-inter-bold text-sm text-gf-text-muted">{index + 1}</Text>
          {row.icon ? <CategoryBadge icon={row.icon} color={row.color} size={30} /> : <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: row.color }} />}
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
            {!tablet && <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tNow("mobile.movimientos.conteo", { count: row.count, p1: row.count })}</Text>}
            {drillLabel && (
              <View className="flex-row items-center gap-0.5" style={{ flexShrink: 1 }}>
                <Text className="font-inter-semibold text-xs" style={{ color: colors.accent, flexShrink: 1 }} numberOfLines={1}>{drillLabel}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.accent} />
              </View>
            )}
          </View>
          <Text className={`${tablet ? 'w-12' : 'w-10'} text-right font-inter text-sm text-gf-text-muted`}>{total > 0 ? Math.round((row.value / total) * 100) : 0}%</Text>
          {tablet && <Text className="w-14 text-right font-inter text-sm text-gf-text-muted">{row.count}</Text>}
          <Text className={`${tablet ? 'w-28' : 'w-24'} text-right font-inter-semibold text-sm text-gf-text`}>{formatMoneyMajor(row.value, currency, { showCode: false })}</Text>
        </Pressable>
      ))}
    </View>
  );
}
