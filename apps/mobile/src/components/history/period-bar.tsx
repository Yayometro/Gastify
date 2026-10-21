import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { PickerModal } from '@/components/picker-modal';
import { GlassSurface } from '@/components/ui/glass';
import { Colors } from '@/constants/theme';
import { rangeLabelEs } from '@gastify/core/format/spanishDates';
import { HISTORY_PRESETS_EXTENDED, type HistoryPreset } from '@gastify/core/history/periodComparison';
import type { MonthBounds } from '@gastify/core/transactions/monthSummary';

// The time selector of the web's History for wide screens: one glass bar with the period's name and its start and end
// dates, arrows to move it back or forward by its own length, and the full list of periods (last 3 months, a month,
// each quarter, each half, the year...) one tap away.
export function PeriodBar({ preset, range, onPreset, onShift, canGoForward }: { preset: HistoryPreset; range: MonthBounds; onPreset: (value: HistoryPreset) => void; onShift: (direction: -1 | 1) => void; canGoForward: boolean }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = useState(false);
  const label = HISTORY_PRESETS_EXTENDED.find((item) => item.value === preset)?.label ?? 'Periodo';
  return (
    <>
      <GlassSurface radius={30} style={{ minHeight: 64 }}>
        <View className="flex-row items-center justify-between px-3 py-1.5" style={{ minHeight: 64 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Periodo anterior" onPress={() => onShift(-1)} hitSlop={8} className="h-12 w-12 items-center justify-center rounded-full">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${label}. Elegir otro periodo`} onPress={() => setOpen(true)} hitSlop={8} className="items-center">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-inter-semibold text-lg text-gf-text">{preset === 'custom' ? 'Periodo' : label}</Text>
              <Ionicons name="caret-down" size={13} color={colors.text} />
            </View>
            <Text className="font-inter text-sm text-gf-text-muted">{rangeLabelEs(range.start, range.end)}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Periodo siguiente" accessibilityState={{ disabled: !canGoForward }} disabled={!canGoForward} onPress={() => onShift(1)} hitSlop={8} className="h-12 w-12 items-center justify-center rounded-full" style={{ opacity: canGoForward ? 1 : 0.3 }}>
            <Ionicons name="chevron-forward" size={26} color={colors.text} />
          </Pressable>
        </View>
      </GlassSurface>
      <PickerModal
        visible={open}
        title="Periodo"
        items={HISTORY_PRESETS_EXTENDED.map((item) => ({ id: item.value, label: item.label }))}
        isSelected={(id) => id === preset}
        onSelect={(id) => onPreset(id as HistoryPreset)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// The same range, moved by its own length: whole months for month-aligned ranges (a quarter moves three months), days otherwise.
export function shiftRange(range: MonthBounds, direction: -1 | 1): { from: Date; to: Date } {
  const { start, end } = range;
  const monthAligned = start.getDate() === 1 && end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  if (monthAligned) {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
    const from = new Date(start.getFullYear(), start.getMonth() + direction * months, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + months, 0);
    return { from, to };
  }
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  return { from: new Date(start.getFullYear(), start.getMonth(), start.getDate() + direction * days), to: new Date(end.getFullYear(), end.getMonth(), end.getDate() + direction * days) };
}
