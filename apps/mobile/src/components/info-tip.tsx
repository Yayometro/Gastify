import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InfoContent, type InfoSection } from '@/components/info-content';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/theme';
import { useT } from "@/i18n/client";

// `text` is laid out by itself (sections, equations, colors); `sections` is for the tooltips that deserve a hand-made table or legend.
export type InfoText = { title: string; text: string; sections?: InfoSection[] };

// The "?" at the top right of a card: it opens a sheet that explains what the section shows, like the web's info
// icons. Tapping outside the sheet closes it too.
export function InfoTip({ info }: { info: InfoText }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.infoLabel", { p1: info.title })} onPress={() => setOpen(true)} hitSlop={10}>
        <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} maxHeight="88%">
        <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
          <View className="flex-row items-center gap-3 px-6 pb-3 pt-6">
            <Ionicons name="help-circle" size={26} color="#c084fc" />
            <Text className="flex-1 font-inter-bold text-xl text-gf-text">{info.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            <InfoContent text={info.text} sections={info.sections} />
          </ScrollView>
          <View className="px-6 pb-6 pt-3">
            <GradientButton label={t("mobile.entendido")} onPress={() => setOpen(false)} />
          </View>
        </SafeAreaView>
      </BottomSheet>
    </>
  );
}
