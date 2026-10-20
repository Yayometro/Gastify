import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { CategoryBadge } from '@/components/category-badge';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { normalizeText } from '@gastify/core/search/normalizeText';

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
  searchPlaceholder = 'Buscar',
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
    <Modal visible={visible} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: dark ? DARK_BASE : colors.background }}>
        <AmbientBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
            <Text className="font-inter-bold text-2xl text-gf-text">{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={multiple ? 'Listo' : 'Cerrar'} onPress={close} hitSlop={10}>
              {multiple ? <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>Listo</Text> : <Ionicons name="close" size={28} color={colors.text} />}
            </Pressable>
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
            ListEmptyComponent={<Text className="pt-6 font-inter text-base text-gf-text-muted">Nada coincide con «{query}».</Text>}
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
        </SafeAreaView>
      </View>
    </Modal>
  );
}
