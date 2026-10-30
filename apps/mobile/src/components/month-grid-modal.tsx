import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';

import { useLocale, useT } from "@/i18n/client";
import { monthName } from "@gastify/core/i18n/dates";

// Picks a month of any year: the year moves with the arrows, the twelve months are a grid. Months after
// `latest` are not offered. Used wherever a period is chosen by month (tap the month's name).
export function MonthGridModal({
  visible,
  value,
  latest,
  onPick,
  onClose,
}: {
  visible: boolean;
  value: Date;
  latest: Date;
  onPick: (month: Date) => void;
  onClose: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [year, setYear] = useState(value.getFullYear());
  useEffect(() => {
    if (visible) setYear(value.getFullYear());
  }, [visible, value]);
  const index = (y: number, m: number) => y * 12 + m;
  const latestIndex = index(latest.getFullYear(), latest.getMonth());

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="82%">
        <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
          <View className="flex-row items-center justify-between px-6 pb-4 pt-4">
            <Text className="font-inter-bold text-2xl text-gf-text">{t("mobile.elegir.mes")}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <View className="flex-row items-center justify-between px-6 pb-4">
            <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.ano.anterior.2")} onPress={() => setYear((y) => y - 1)} hitSlop={10}>
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </Pressable>
            <Text className="font-inter-bold text-xl text-gf-text">{year}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("mobile.ano.siguiente.2")}
              accessibilityState={{ disabled: year >= latest.getFullYear() }}
              disabled={year >= latest.getFullYear()}
              onPress={() => setYear((y) => y + 1)}
              hitSlop={10}
              style={{ opacity: year >= latest.getFullYear() ? 0.3 : 1 }}>
              <Ionicons name="chevron-forward" size={26} color={colors.text} />
            </Pressable>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-3 px-6 pb-8">
            {Array.from({ length: 12 }, (_, month) => monthName(month, locale)).map((label, month) => {
              const selected = value.getFullYear() === year && value.getMonth() === month;
              const future = index(year, month) > latestIndex;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: future }}
                  disabled={future}
                  onPress={() => {
                    onPick(new Date(year, month, 1));
                    onClose();
                  }}
                  className="w-[30%] items-center rounded-2xl border border-gf-border py-4"
                  style={{ backgroundColor: selected ? colors.accentSoft : undefined, borderColor: selected ? colors.accent : colors.border, opacity: future ? 0.35 : 1 }}>
                  <Text className="font-inter-medium text-base capitalize text-gf-text">{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
    </BottomSheet>
  );
}
