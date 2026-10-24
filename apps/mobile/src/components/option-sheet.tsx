import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import { useT } from "@/i18n/client";

export type Option = { id: string; label: string };

// A short list of choices in the app's own sheet: it opens fast, closes with a tap outside it (or the X), and on a tablet
// is a centered card. For long lists with a search box use PickerModal instead.
export function OptionSheet({ visible, title, options, isSelected, onSelect, onClose }: { visible: boolean; title: string; options: Option[]; isSelected: (id: string) => boolean; onSelect: (id: string) => void; onClose: () => void }) {
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="80%">
      <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
        <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
          <Text className="font-inter-bold text-xl text-gf-text">{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {options.map((option) => {
            const selected = isSelected(option.id);
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(option.id);
                  onClose();
                }}
                className="flex-row items-center justify-between border-t border-gf-border py-3.5">
                <Text className="font-inter-medium text-base" style={{ color: selected ? colors.accent : colors.text }}>{option.label}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.accent} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </BottomSheet>
  );
}
