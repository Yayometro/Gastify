import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { monthTitleEs } from '@gastify/core/format/spanishDates';

// Moves the month shown one step back or forward. Months after `latest` are not offered.
export function MonthSwitcher({
  value,
  onChange,
  latest,
  onPressTitle,
}: {
  value: Date;
  onChange: (month: Date) => void;
  latest: Date;
  // Tapping the month's name (the web lets you pick any month from a calendar).
  onPressTitle?: () => void;
}) {
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  const index = (date: Date) => date.getFullYear() * 12 + date.getMonth();
  const canGoForward = index(value) < index(latest);
  const shift = (delta: number) => onChange(new Date(value.getFullYear(), value.getMonth() + delta, 1));

  return (
    <View className="flex-row items-center justify-between rounded-full bg-gf-surface px-2 py-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        onPress={() => shift(-1)}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full">
        <Ionicons name="chevron-back" size={22} color={iconColor} />
      </Pressable>
      {onPressTitle ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Elegir mes" onPress={onPressTitle} hitSlop={8}>
          <Text className="font-inter-semibold text-base text-gf-text">{monthTitleEs(value)}</Text>
        </Pressable>
      ) : (
        <Text className="font-inter-semibold text-base text-gf-text">{monthTitleEs(value)}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        accessibilityState={{ disabled: !canGoForward }}
        disabled={!canGoForward}
        onPress={() => shift(1)}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ opacity: canGoForward ? 1 : 0.3 }}>
        <Ionicons name="chevron-forward" size={22} color={iconColor} />
      </Pressable>
    </View>
  );
}
