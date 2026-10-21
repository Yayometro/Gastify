import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';

// The sheet every analyzer card opens (the web opens a modal for each one): a title, an optional line under it and
// the detail.
export function DetailSheet({ visible, title, subtitle, onClose, children }: { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="86%">
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-start justify-between px-6 pb-2 pt-5">
              <View className="flex-1 pr-3">
                <Text className="font-inter-bold text-xl text-gf-text">{title}</Text>
                {subtitle ? <Text className="font-inter text-sm text-gf-text-muted">{subtitle}</Text> : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 12 }}>{children}</ScrollView>
          </SafeAreaView>
    </BottomSheet>
  );
}
