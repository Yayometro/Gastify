import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { MonthGridModal } from '@/components/month-grid-modal';
import { Colors } from '@/constants/theme';
import { monthTitleEs } from '@gastify/core/format/spanishDates';

// Moves the month shown one step back or forward; tapping the month's name opens a picker for any month of
// any year (the web does the same with its calendar). Months after `latest` are not offered. Every screen
// that reads a period by month uses this one, so the behavior is the same everywhere.
export function MonthSwitcher({
  value,
  onChange,
  latest,
}: {
  value: Date;
  onChange: (month: Date) => void;
  latest: Date;
}) {
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  const [pickerOpen, setPickerOpen] = useState(false);
  const index = (date: Date) => date.getFullYear() * 12 + date.getMonth();
  const canGoForward = index(value) < index(latest);
  const shift = (delta: number) => onChange(new Date(value.getFullYear(), value.getMonth() + delta, 1));

  return (
    <View className="flex-row items-center justify-between rounded-full bg-gf-surface px-2 py-1" style={{ minHeight: 52 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        onPress={() => shift(-1)}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full">
        <Ionicons name="chevron-back" size={22} color={iconColor} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${monthTitleEs(value)}. Elegir otro mes`} onPress={() => setPickerOpen(true)} hitSlop={8} className="flex-row items-center gap-1">
        <Text className="font-inter-semibold text-base text-gf-text">{monthTitleEs(value)}</Text>
        <Ionicons name="caret-down" size={12} color={iconColor} />
      </Pressable>
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
      <MonthGridModal visible={pickerOpen} value={value} latest={latest} onPick={(month) => onChange(month)} onClose={() => setPickerOpen(false)} />
    </View>
  );
}
