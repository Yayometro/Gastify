import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/screen';
import { SwipeToDismiss } from '@/components/swipe-to-dismiss';
import { useToast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { dismissAlert } from '@/lib/alert-dismissals';
import { alertMood, MOOD_COLOR, type AlertMood } from '@/lib/alert-presentation';
import { useBudgetAlertList } from '@/hooks/use-budget-alerts';

import { useT, useInfo } from "@/i18n/client";

const GLYPH: Record<AlertMood, 'sparkles' | 'alert-circle' | 'flame'> = { celebrate: 'sparkles', alarm: 'alert-circle', fire: 'flame' };

// The notices of the budgets, saving goals and projects that apply now. A tap opens the notice's own window (with its
// effect and the button to the budget); a swipe to the left or to the right takes the notice off the list.
export default function NotificationsScreen() {
  const { APP_INFO } = useInfo();
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const toast = useToast();
  const alerts = useBudgetAlertList();
  const back = () => (router.canGoBack() ? router.back() : router.navigate('/'));

  return (
    <Screen
      title={t("mobile.notificaciones")}
      subtitle={t("mobile.avisos.de.tus.presupuestos.ahorros")}
      backLabel={t("mobile.atras")}
      onBack={back}
      headerAction={
        alerts.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.limpiar.todas.las.notificaciones")} onPress={() => alerts.forEach((alert) => void dismissAlert(alert.key))} className="rounded-full px-3 py-2" style={{ backgroundColor: colors.accentSoft }}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.limpiar.todas")}</Text>
          </Pressable>
        ) : undefined
      }>
      {alerts.length === 0 && (
        <Card title={t("mobile.sin.avisos.por.ahora")} info={APP_INFO.notificaciones}>
          <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.cuando.un.presupuesto.o.una")}</Text>
        </Card>
      )}
      {alerts.map((alert) => {
        const mood = alertMood(alert);
        const href = `/budgets/${alert.key.split(':')[0]}`;
        const accent = MOOD_COLOR[mood];
        return (
          <SwipeToDismiss key={alert.key} onDismiss={() => void dismissAlert(alert.key)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${alert.title}. ${alert.message}`}
              onPress={() => toast.present(alert.message, mood, { title: alert.title, href })}
              className="flex-row items-center gap-3 rounded-3xl p-4"
              style={{ backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border }}>
              <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}33` }}>
                <Ionicons name={GLYPH[mood]} size={22} color={accent} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-inter-semibold text-base text-gf-text">{alert.title}</Text>
                <Text className="font-inter text-sm text-gf-text-muted">{alert.message}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          </SwipeToDismiss>
        );
      })}
    </Screen>
  );
}
