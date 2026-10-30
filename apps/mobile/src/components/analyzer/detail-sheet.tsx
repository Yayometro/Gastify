import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InfoTip, type InfoText } from '@/components/info-tip';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import { useT } from "@/i18n/client";

import { TutorialTip } from '@/components/tour/tutorial-tip';
import type { MobileComponentTourId } from '@gastify/core/tour/mobileSteps';
import { TourPressable, TourTarget } from '@/components/tour/tour-target';
import { HelpSep } from '@/components/ui/help-sep';
// The sheet every analyzer card opens (the web opens a modal for each one): a title, an optional line under it and
// the detail.
export function DetailSheet({ visible, title, subtitle, info, tour, onClose, children, tall = false }: { visible: boolean; title: string; subtitle?: string; info?: InfoText; tour?: MobileComponentTourId; onClose: () => void; children: ReactNode; tall?: boolean }) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    // The tall sheet is always the same size (almost the whole screen), so it never moves what is under the finger.
    <BottomSheet visible={visible} onClose={onClose} maxHeight={tall ? '92%' : '86%'} wideWidth={tall ? 900 : 640} fill={tall}>
          <TourTarget id={tour ? `${tour}-sheet` : undefined} style={{ flex: tall ? 1 : undefined, flexShrink: 1 }}>
          <SafeAreaView edges={['bottom']} style={{ flex: tall ? 1 : undefined, flexShrink: 1 }}>
            <View className="flex-row items-start justify-between px-6 pb-2 pt-5">
              {/* The title block is the sheet's head for its tutorial: "this is the detail" points here. */}
              <TourTarget id={tour ? `${tour}-head` : undefined} className="flex-1 pr-3" style={{ minWidth: 0 }}>
                <Text numberOfLines={1} className="font-inter-bold text-xl text-gf-text">{title}</Text>
                {subtitle ? <Text numberOfLines={1} className="font-inter text-sm text-gf-text-muted">{subtitle}</Text> : null}
              </TourTarget>
              <View className="flex-row items-center gap-3" style={{ flexShrink: 0 }}>
                {info || tour ? (
                  <>
                    <HelpSep />
                    <View className="flex-row items-center gap-3">
                      {info ? <InfoTip info={info} /> : null}
                      {tour ? <TutorialTip tour={tour} label={title} pointer={false} /> : null}
                    </View>
                  </>
                ) : null}
                <TourPressable id={tour ? `${tour}-close` : undefined} accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </TourPressable>
              </View>
            </View>
            <ScrollView style={tall ? { flex: 1 } : undefined} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 12 }}>{children}</ScrollView>
          </SafeAreaView>
          </TourTarget>
    </BottomSheet>
  );
}
