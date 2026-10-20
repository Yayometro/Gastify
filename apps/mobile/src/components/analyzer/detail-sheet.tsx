import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';

// The sheet every analyzer card opens (the web opens a modal for each one): a title, an optional line under it and
// the detail.
export function DetailSheet({ visible, title, subtitle, onClose, children }: { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <View style={{ maxHeight: '86%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', backgroundColor: dark ? DARK_BASE : colors.background }}>
          <AmbientBackground />
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
        </View>
      </View>
    </Modal>
  );
}
