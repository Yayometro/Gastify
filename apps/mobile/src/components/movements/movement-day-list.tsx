import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { MovementRow } from '@/components/movements/movement-row';
import { useLocale, useT } from '@/i18n/client';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { groupByDay } from '@gastify/core/transactions/monthSummary';

// The movements of a list grouped by day (the same grouping the Movements tab uses), as plain rows that sit inside a screen's own
// scroll view. A screen that filters its movements (an account's, a period's) passes the ones to show; `returnTo` brings the person
// back to that screen after the movement. Past `limit` the list says so, and the screen links to the full list.
export function MovementDayList({
  movements,
  currency,
  returnTo,
  limit = 80,
}: {
  movements: TransactionData[];
  currency: string;
  returnTo?: string;
  limit?: number;
}) {
  const t = useT();
  const locale = useLocale();
  const now = useMemo(() => new Date(), []);
  const shown = useMemo(() => movements.slice(0, limit), [movements, limit]);
  const groups = useMemo(() => groupByDay(shown, now, locale, t), [shown, now, locale, t]);
  return (
    <View className="gap-1">
      {groups.map((group) => (
        <View key={group.key} className="gap-1">
          <Text className="pt-2 font-inter-semibold text-sm capitalize text-gf-text-muted">{group.label}</Text>
          {group.items.map((movement) => (
            <MovementRow
              key={String(movement._id)}
              divider
              movement={movement}
              currency={currency}
              onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } })}
            />
          ))}
        </View>
      ))}
      {movements.length > limit && <Text className="pt-2 font-inter text-xs text-gf-text-muted">{t("mobile.se.muestran.los.primeros.80")}</Text>}
    </View>
  );
}
