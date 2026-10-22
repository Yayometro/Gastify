import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';

// The sheet every analyzer card opens (the web opens a modal for each one): a title, an optional line under it and
// the detail.
export function DetailSheet({ visible, title, subtitle, info, onClose, children, tall = false }: { visible: boolean; title: string; subtitle?: string; info?: InfoText; onClose: () => void; children: ReactNode; tall?: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    // The tall sheet is always the same size (almost the whole screen), so it never moves what is under the finger.
    <BottomSheet visible={visible} onClose={onClose} maxHeight={tall ? '92%' : '86%'} wideWidth={tall ? 900 : 640} fill={tall}>
          <SafeAreaView edges={['bottom']} style={{ flex: tall ? 1 : undefined, flexShrink: 1 }}>
            <View className="flex-row items-start justify-between px-6 pb-2 pt-5">
              <View className="flex-1 pr-3">
                <Text className="font-inter-bold text-xl text-gf-text">{title}</Text>
                {subtitle ? <Text className="font-inter text-sm text-gf-text-muted">{subtitle}</Text> : null}
              </View>
              <View className="flex-row items-center gap-3">
                {info ? <InfoTip info={info} /> : null}
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </Pressable>
              </View>
            </View>
            <ScrollView style={tall ? { flex: 1 } : undefined} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 12 }}>{children}</ScrollView>
          </SafeAreaView>
    </BottomSheet>
  );
}
