import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/screen';
import { TourPressable, TourTarget } from '@/components/tour/tour-target';
import { SwipeToDismiss } from '@/components/swipe-to-dismiss';
import { useToast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { dismissAlert } from '@/lib/alert-dismissals';
import { alertMood, MOOD_COLOR, type AlertMood } from '@/lib/alert-presentation';
import { useBudgetAlertList } from '@/hooks/use-budget-alerts';
import { openPendingRecurring, usePendingRecurring } from '@/lib/recurring-pending';

import { useT, useLocale } from "@/i18n/client";
import { dateTimeLabel } from "@gastify/core/i18n/dates";

const GLYPH: Record<AlertMood, 'sparkles' | 'alert-circle' | 'flame'> = { celebrate: 'sparkles', alarm: 'alert-circle', fire: 'flame' };

// The notices of the budgets, saving goals and projects that apply now. A tap opens the notice's own window (with its
// effect and the button to the budget); a swipe to the left or to the right takes the notice off the list.
export default function NotificationsScreen() {
  const t = useT();
  const locale = useLocale();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const toast = useToast();
  const alerts = useBudgetAlertList();
  const pending = usePendingRecurring().items;
  const back = () => (router.canGoBack() ? router.back() : router.navigate('/'));

  return (
    <Screen
      tutorial="m-notif"
      title={t("mobile.notificaciones")}
      subtitle={t("mobile.avisos.de.tus.presupuestos.ahorros")}
      backLabel={t("mobile.atras")}
      onBack={back}
      headerAction={
        alerts.length > 0 ? (
          <TourPressable id="m-notif-clear" accessibilityRole="button" accessibilityLabel={t("mobile.limpiar.todas.las.notificaciones")} onPress={() => alerts.forEach((alert) => void dismissAlert(alert.key))} className="rounded-full px-3 py-2" style={{ backgroundColor: colors.accentSoft }}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.limpiar.todas")}</Text>
          </TourPressable>
        ) : undefined
      }>
      <TourTarget id="m-notif-list" className="gap-3">
      {pending.length > 0 && (
        <TourPressable
          accessibilityRole="button"
          accessibilityLabel={t('recurring.pending.title')}
          onPress={openPendingRecurring}
          className="flex-row items-center gap-3 rounded-3xl p-4"
          style={{ backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border }}>
          <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.accent}33` }}>
            <Ionicons name="repeat" size={22} color={colors.accent} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-inter-semibold text-base text-gf-text">{t('recurring.pending.title')}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">{t('recurring.pending.bell', { p1: pending.length })}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TourPressable>
      )}
      {alerts.length === 0 && pending.length === 0 && (
        <Card title={t("mobile.sin.avisos.por.ahora")}>
          <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.cuando.un.presupuesto.o.una")}</Text>
        </Card>
      )}
      {alerts.map((alert, index) => {
        const mood = alertMood(alert);
        const href = `/budgets/${alert.key.split(':')[0]}`;
        const accent = MOOD_COLOR[mood];
        return (
          <SwipeToDismiss key={alert.key} onDismiss={() => void dismissAlert(alert.key)}>
            <TourPressable
              id={index === 0 ? "m-notif-item" : undefined}
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
                {alert.createdAt && <Text className="font-inter text-xs text-gf-text-muted">{dateTimeLabel(new Date(alert.createdAt), locale)}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TourPressable>
          </SwipeToDismiss>
        );
      })}
      </TourTarget>
    </Screen>
  );
}
