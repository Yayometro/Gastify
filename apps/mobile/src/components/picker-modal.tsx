import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View, useColorScheme } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CategoryBadge } from '@/components/category-badge';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { useT } from "@/i18n/client";

export type PickerItem = { id: string; label: string; detail?: string; icon?: string | null; color?: string | null };

// A full-screen list with a search box, for choices that do not fit in a row of chips (categories,
// accounts, budgets...). The web opens a modal for the same reason. Search ignores case and accents.
export function PickerModal({
  visible,
  title,
  items,
  isSelected,
  onSelect,
  onClose,
  multiple = false,
  searchPlaceholder: searchPlaceholderProp,
}: {
  visible: boolean;
  title: string;
  items: PickerItem[];
  isSelected: (id: string) => boolean;
  // Single mode: called once and the list closes. Multiple mode: called per tap, the list stays open.
  onSelect: (id: string) => void;
  onClose: () => void;
  multiple?: boolean;
  searchPlaceholder?: string;
}) {
  const t = useT();
  const searchPlaceholder = searchPlaceholderProp ?? t("common.search");
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = normalizeText(query);
    if (!needle) return items;
    return items.filter((item) => normalizeText(`${item.label} ${item.detail ?? ''}`).includes(needle));
  }, [items, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    // A window like the others (it closes with its "×" or a tap outside), with the list filling it.
    <BottomSheet visible={visible} onClose={close} maxHeight="88%" fill>
      <View style={{ flex: 1 }}>
          <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
            <Text className="flex-1 pr-3 font-inter-bold text-2xl text-gf-text">{title}</Text>
            <View className="flex-row items-center gap-4">
              {multiple && (
                <Pressable accessibilityRole="button" onPress={close} hitSlop={10}>
                  <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{t("mobile.listo")}</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={close} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <View className="px-6 pb-2">
            <TextField label="" value={query} onChangeText={setQuery} onClear={() => setQuery('')} placeholder={searchPlaceholder} autoCorrect={false} />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id || 'none'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View className="h-px bg-gf-border" />}
            ListEmptyComponent={<Text className="pt-6 font-inter text-base text-gf-text-muted">{t("mobile.nada.coincide.con.p1", { p1: query })}</Text>}
            renderItem={({ item }) => {
              const selected = isSelected(item.id);
              return (
                <Pressable
                  accessibilityRole={multiple ? 'checkbox' : 'radio'}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onSelect(item.id);
                    if (!multiple) close();
                  }}
                  className="flex-row items-center gap-3 py-3">
                  {item.icon ? <CategoryBadge icon={item.icon} color={item.color} size={40} /> : null}
                  <View className="flex-1">
                    <Text className="font-inter-medium text-base text-gf-text">{item.label}</Text>
                    {item.detail ? <Text className="font-inter text-sm text-gf-text-muted">{item.detail}</Text> : null}
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.accent} /> : null}
                </Pressable>
              );
            }}
          />
      </View>
    </BottomSheet>
  );
}
