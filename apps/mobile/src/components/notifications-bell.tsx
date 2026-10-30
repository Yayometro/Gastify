import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View, useColorScheme } from 'react-native';

import { TourPressable } from '@/components/tour/tour-target';
import { useBudgetAlertList } from '@/hooks/use-budget-alerts';
import { Colors } from '@/constants/theme';
import { usePendingRecurring } from '@/lib/recurring-pending';
import { useT } from '@/i18n/client';
import { tNow } from '@/i18n/now';

// The bell icon with the count of notices that apply right now, when there are any. It has no touch of its own: the
// button around it opens the notifications.
export function NotificationsGlyph({ size = 26, color }: { size?: number; color?: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const count = useBudgetAlertList().length + usePendingRecurring().items.length;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="notifications-outline" size={size} color={color ?? colors.text} />
      {count > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
          <Text className="font-inter-bold text-[10px]" style={{ color: '#ffffff' }}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

// The bell of the Inicio header: a round button that opens the notifications.
export function NotificationsBell({ size = 44 }: { size?: number }) {
  const t = useT();
  const count = useBudgetAlertList().length + usePendingRecurring().items.length;
  return (
    <TourPressable id="m-bell" accessibilityRole="button" accessibilityLabel={count > 0 ? tNow("mobile.notificaciones.p1.nuevas", { p1: count }) : t("mobile.notificaciones")} onPress={() => router.navigate('/notifications')} hitSlop={8} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <NotificationsGlyph size={size * 0.5} />
    </TourPressable>
  );
}
