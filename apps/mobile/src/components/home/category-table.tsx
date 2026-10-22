import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { Colors } from '@/constants/theme';
import type { BreakdownSlice } from '@gastify/core/history/categoryBreakdown';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

// The categories of a period as a table: numbered, a hairline between rows, the currency written once in the header
// instead of on every row, and the share of the total in its own column.
export function CategoryTable({
  rows,
  total,
  currency,
  selectedKey,
  disabled = false,
  firstColumn = 'Categoría',
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
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <View>
      <View className="flex-row items-center gap-3 pb-2">
        <Text className="w-6 text-center font-inter-semibold text-xs uppercase text-gf-text-muted">#</Text>
        <Text className="flex-1 font-inter-semibold text-xs uppercase text-gf-text-muted">{firstColumn}</Text>
        <Text className="w-12 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">%</Text>
        <Text className="w-14 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">Trans.</Text>
        <Text className="w-28 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{currency}</Text>
      </View>
      {shown.map((row, index) => (
        <Pressable
          key={row.key}
          accessibilityRole="button"
          accessibilityLabel={`${row.name}, ${formatMoneyMajor(row.value, currency)}`}
          disabled={disabled}
          onPress={() => onPressRow?.(row.key)}
          className="flex-row items-center gap-3 py-2.5"
          style={{ borderTopWidth: 1, borderTopColor: colors.border, opacity: selectedKey && selectedKey !== row.key ? 0.45 : 1 }}>
          <Text className="w-6 text-center font-inter-bold text-sm text-gf-text-muted">{index + 1}</Text>
          {row.icon ? <CategoryBadge icon={row.icon} color={row.color} size={30} /> : <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: row.color }} />}
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
            {drillLabel && (
              <View className="flex-row items-center gap-0.5">
                <Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{drillLabel}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.accent} />
              </View>
            )}
          </View>
          <Text className="w-12 text-right font-inter text-sm text-gf-text-muted">{total > 0 ? Math.round((row.value / total) * 100) : 0}%</Text>
          <Text className="w-14 text-right font-inter text-sm text-gf-text-muted">{row.count}</Text>
          <Text className="w-28 text-right font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.value, currency, { showCode: false })}</Text>
        </Pressable>
      ))}
    </View>
  );
}
