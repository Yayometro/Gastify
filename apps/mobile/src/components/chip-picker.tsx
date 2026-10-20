import { Pressable, ScrollView, Text, useColorScheme } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { Colors } from '@/constants/theme';

export type ChipItem = { id: string; label: string; icon?: string | null; color?: string | null };

// A row of choices (accounts, categories, budgets...). The chosen one is filled with the accent.
export function ChipPicker({
  items,
  value,
  onChange,
  emptyText = 'Todavía no hay opciones.',
}: {
  items: ChipItem[];
  value: string;
  onChange: (id: string) => void;
  emptyText?: string;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  if (items.length === 0) return <Text className="font-inter text-sm text-gf-text-muted">{emptyText}</Text>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingRight: 8 }}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id || 'none'}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(item.id)}
            className="flex-row items-center gap-2 rounded-full border px-3 py-2"
            style={{
              borderColor: selected ? colors.accent : colors.border,
              backgroundColor: selected ? colors.accentSoft : colors.backgroundElement,
            }}>
            {item.icon ? <CategoryBadge icon={item.icon} color={item.color} size={24} /> : null}
            <Text className="font-inter-medium text-sm" style={{ color: selected ? colors.accent : colors.text }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
