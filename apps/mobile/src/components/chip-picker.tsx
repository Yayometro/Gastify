import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useColorScheme } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { PickerModal } from '@/components/picker-modal';
import { glassFill } from '@/components/ui/glass-fill';
import { Colors } from '@/constants/theme';
import { useT } from "@/i18n/client";

export type ChipItem = { id: string; label: string; icon?: string | null; color?: string | null; detail?: string };

type Common = {
  items: ChipItem[];
  // Title of the full list.
  title?: string;
  emptyText?: string;
  // Past this many options a leading "Ver todos" chip opens the full list with a search box.
  moreAfter?: number;
};

function ChipsRow({
  items,
  isSelected,
  onPress,
  multiple,
  title = 'Elegir',
  emptyText = 'Todavía no hay opciones.',
  moreAfter = 4,
}: Common & { isSelected: (id: string) => boolean; onPress: (id: string) => void; multiple: boolean }) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = useState(false);
  if (items.length === 0) return <Text className="font-inter text-sm text-gf-text-muted">{emptyText}</Text>;
  const hasMore = items.length > moreAfter;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingRight: 8 }}>
        {hasMore && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("mobile.chips.seeAll", { p1: title })}
            onPress={() => setOpen(true)}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-2"
            style={{ borderColor: colors.accent, backgroundColor: colors.accentSoft }}>
            <Ionicons name="search" size={16} color={colors.accent} />
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>
              {t("mobile.ver.todos.p1", { p1: items.length })}
            </Text>
          </Pressable>
        )}
        {items.map((item) => {
          const selected = isSelected(item.id);
          return (
            <Pressable
              key={item.id || 'none'}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => onPress(item.id)}
              className="flex-row items-center gap-2 rounded-full border px-3 py-2"
              style={selected ? { borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft } : { borderWidth: 1, borderColor: colors.border, ...glassFill(scheme === 'dark', colors.backgroundElement) }}>
              {item.icon ? <CategoryBadge icon={item.icon} color={item.color} size={24} /> : null}
              <Text className="font-inter-medium text-sm" style={{ color: selected ? colors.accent : colors.text }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {hasMore && (
        <PickerModal visible={open} title={title} items={items} isSelected={isSelected} onSelect={onPress} onClose={() => setOpen(false)} multiple={multiple} />
      )}
    </>
  );
}

// One choice among several.
export function ChipPicker({ value, onChange, ...common }: Common & { value: string; onChange: (id: string) => void }) {
  return <ChipsRow {...common} isSelected={(id) => id === value} onPress={onChange} multiple={false} />;
}

// Any number of choices (the categories of a budget, the accounts that feed a saving goal...).
export function MultiChipPicker({ values, onToggle, ...common }: Common & { values: string[]; onToggle: (id: string) => void }) {
  return <ChipsRow {...common} isSelected={(id) => values.includes(id)} onPress={onToggle} multiple />;
}
