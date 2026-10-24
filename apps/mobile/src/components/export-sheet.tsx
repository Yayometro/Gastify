import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import { EXPORT_FORMATS, type ExportFormat } from '@/lib/export-file';
import { useT } from "@/i18n/client";

// A bottom sheet to choose the file format of an export (the web offers Excel; the phone also CSV and JSON).
export function ExportSheet({
  visible,
  count,
  busy,
  onPick,
  onClose,
}: {
  visible: boolean;
  count: number;
  busy: boolean;
  onPick: (format: ExportFormat) => void;
  onClose: () => void;
}) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissible={!busy}>
        <SafeAreaView edges={['bottom']}>
          <View className="gap-1 px-6 pb-6 pt-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter-bold text-xl text-gf-text">{t("mobile.exportar.movimientos")}</Text>
              {!busy && (
                <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={onClose} hitSlop={10}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              )}
            </View>
            <Text className="pb-2 font-inter text-sm text-gf-text-muted">
              {t("mobile.p1.del.periodo.y.los", { p1: count === 1 ? '1 movimiento' : `${count} movimientos` })}
            </Text>
            {EXPORT_FORMATS.map((format) => (
              <Pressable
                key={format.value}
                accessibilityRole="button"
                accessibilityLabel={t("mobile.exportAs", { p1: format.label })}
                disabled={busy}
                onPress={() => onPick(format.value)}
                className="flex-row items-center gap-3 py-3"
                style={{ opacity: busy ? 0.5 : 1 }}>
                <Ionicons name={format.value === 'json' ? 'code-slash-outline' : 'document-text-outline'} size={26} color={colors.accent} />
                <View className="flex-1">
                  <Text className="font-inter-semibold text-base text-gf-text">{format.label}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{format.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            ))}
            {busy ? (
              <View className="flex-row items-center justify-center gap-2 pt-2">
                <ActivityIndicator color={colors.accent} />
                <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.preparando.el.archivo")}</Text>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={onClose} className="items-center pt-3" hitSlop={8}>
                <Text className="font-inter-semibold text-base" style={{ color: colors.textSecondary }}>{t("mobile.cancelar")}</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
    </BottomSheet>
  );
}
