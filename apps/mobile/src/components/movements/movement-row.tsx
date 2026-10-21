import { Pressable, Text, View, useColorScheme } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { Colors } from '@/constants/theme';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { movementTime } from '@gastify/core/transactions/historyWindow';
import { movementKind } from '@gastify/core/transactions/monthSummary';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';

function clock(time: number | null): string {
  if (time === null) return '';
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// One movement: its category badge, what it was for, and the amount in the wallet's currency.
// Incomes are green with a plus, bills red with a minus, transfers neutral (they are not spending).
// Pressing opens it; a long press (or pressing while others are selected) selects it.
export function MovementRow({
  movement,
  currency,
  selected = false,
  divider = false,
  onPress,
  onLongPress,
}: {
  movement: TransactionData;
  currency: string;
  selected?: boolean;
  // A thin line under the row, for lists inside pop-ups.
  divider?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const category = movement.category ?? null;
  const kind = movementKind(movement);
  const time = clock(movementTime(movement));

  const sign = kind === 'income' ? '+' : kind === 'expense' ? '-' : '';
  const amountColor = kind === 'income' ? colors.income : kind === 'expense' ? colors.expense : colors.textSecondary;
  const title = movement.name || category?.name || 'Movimiento';
  const detail = kind === 'transfer' ? 'Transferencia' : category?.name || 'Sin categoría';
  const amount = formatMoneyMajor(Math.abs(getPrimaryAmount(movement)), currency);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sign}${amount}`}
      accessibilityState={{ selected }}
      className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5"
      style={{ backgroundColor: selected ? colors.accentSoft : 'transparent', ...(divider ? { borderRadius: 0, borderBottomWidth: 1, borderBottomColor: colors.border } : {}) }}>
      <CategoryBadge icon={category?.icon} color={category?.color} size={44} />
      <View className="flex-1 gap-0.5">
        <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>
          {title}
        </Text>
        <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={1}>
          {[detail, time].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text className="font-inter-semibold text-base" style={{ color: amountColor }}>
        {sign}
        {amount}
      </Text>
    </Pressable>
  );
}
