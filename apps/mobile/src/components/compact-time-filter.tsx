import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { MonthSwitcher } from '@/components/month-switcher';
import { Colors } from '@/constants/theme';
import { HISTORY_PRESETS, type HistoryPreset } from '@gastify/core/history/periodComparison';

type Preset = 'dashboard' | HistoryPreset;

// One compact month rail across dashboard widgets. The rest of the period controls stay behind
// "Más filtros"; switching the month with an arrow makes that particular month the active range.
export function CompactTimeFilter({
  preset,
  onPreset,
  month,
  onMonth,
  latest,
  customFrom,
  onCustomFrom,
  customTo,
  onCustomTo,
  includeDashboard = false,
  extra,
}: {
  preset: Preset;
  onPreset: (value: Preset) => void;
  month: Date;
  onMonth: (value: Date) => void;
  latest: Date;
  customFrom: string;
  onCustomFrom: (value: string) => void;
  customTo: string;
  onCustomTo: (value: string) => void;
  includeDashboard?: boolean;
  // More controls that belong with the period (a comparison switch, for instance), shown inside "Más filtros".
  extra?: ReactNode;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [expanded, setExpanded] = useState(false);
  const options = includeDashboard
    ? [{ id: 'dashboard', label: 'Igual que arriba' }, { id: 'custom', label: 'Personalizado' }, ...HISTORY_PRESETS.filter((item) => item.value !== 'custom').map((item) => ({ id: item.value, label: item.label }))]
    : HISTORY_PRESETS.map((item) => ({ id: item.value, label: item.label }));
  const activeLabel = options.find((item) => item.id === preset)?.label;

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <MonthSwitcher value={month} latest={latest} onChange={(next) => { onMonth(next); onPreset('month'); }} />
        </View>
        {/* Same height as the month rail beside it (its arrows are 44 high plus 4 of padding each side) and a pink glass fill. */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          className="items-center justify-center rounded-full px-4"
          style={{ height: 52, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: scheme === 'dark' ? 'rgba(211,184,251,0.35)' : 'rgba(126,34,206,0.25)' }}>
          <Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{expanded ? 'Menos filtros' : 'Más filtros'}</Text>
        </Pressable>
      </View>
      {preset !== 'month' && <Text className="font-inter text-xs text-gf-text-muted">Periodo activo: {activeLabel}</Text>}
      {expanded && (
        <View className="gap-3">
          <ChipPicker items={options} value={preset} onChange={(id) => onPreset(id as Preset)} moreAfter={99} />
          {preset === 'custom' && (
            <View className="gap-3">
              <DateField label="Desde" value={customFrom} onChange={onCustomFrom} />
              <DateField label="Hasta" value={customTo} onChange={onCustomTo} />
            </View>
          )}
          {extra}
        </View>
      )}
    </View>
  );
}
