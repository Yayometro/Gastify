import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { useToast } from '@/components/toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { useLocale, useT } from '@/i18n/client';
import { closePendingRecurring, pendingKey, setPendingRecurring, usePendingRecurring, type PendingRecurring } from '@/lib/recurring-pending';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { shortDate } from '@gastify/core/i18n/dates';
import { parseMoneyText } from '@gastify/core/transactions/movementForm';

// The window that asks for the amount of the variable-price charges that came due: one card each, with the amount of the
// last time ready to edit, "Confirm" (creates the charge) and "Skip" (creates nothing and moves on to the next date).
export function RecurringPendingSheet() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { items, open } = usePendingRecurring();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const answer = async (item: PendingRecurring, skip: boolean) => {
    const key = pendingKey(item);
    const typed = amounts[key];
    const amount = typed === undefined || typed === '' ? item.amount : parseMoneyText(typed);
    if (!skip && (amount === null || !Number.isFinite(amount) || amount < 0)) return toast.show(t('recurring.pending.error'));
    setBusy(key);
    try {
      await sendWrite('general-data/recurring/confirm', { id: item.recurringId, dueDate: item.dueDate, amount, skip });
      toast.show(t(skip ? 'recurring.pending.skipped' : 'recurring.pending.created'));
      const rest = items.filter((other) => pendingKey(other) !== key);
      setPendingRecurring(rest, rest.length > 0);
      if (!skip) void reloadAfterWrite(dispatch);
    } catch (error) {
      toast.show(messageOf(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <BottomSheet visible={open && items.length > 0} onClose={closePendingRecurring} maxHeight="85%">
      <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
        <View className="flex-row items-center justify-between px-6 pb-1 pt-5">
          <Text className="flex-1 font-inter-bold text-xl text-gf-text">{t('recurring.pending.title')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('mobile.cerrar')} onPress={closePendingRecurring} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <Text className="px-6 pb-3 font-inter text-sm text-gf-text-muted">{t('recurring.pending.intro')}</Text>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
          {items.map((item) => {
            const key = pendingKey(item);
            return (
              <View key={key} className="gap-3 rounded-3xl border border-gf-border p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 font-inter-semibold text-base text-gf-text">{item.name}</Text>
                  <Text className="font-inter text-xs text-gf-text-muted">{shortDate(new Date(item.dueDate), locale)}</Text>
                </View>
                <TextField
                  label={t('recurring.pending.amount')}
                  value={amounts[key] ?? String(item.amount)}
                  onChangeText={(text) => setAmounts((current) => ({ ...current, [key]: text.replace(/[^0-9.,]/g, '') }))}
                  keyboardType="decimal-pad"
                />
                <View className="flex-row gap-3">
                  <Pressable accessibilityRole="button" disabled={busy === key} onPress={() => void answer(item, false)} className="flex-1 items-center rounded-full py-3" style={{ backgroundColor: colors.accent, opacity: busy === key ? 0.6 : 1 }}>
                    <Text className="font-inter-semibold text-base" style={{ color: '#ffffff' }}>{t('recurring.pending.confirm')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={busy === key} onPress={() => void answer(item, true)} className="flex-1 items-center rounded-full border border-gf-border py-3">
                    <Text className="font-inter-semibold text-base text-gf-text-muted">{t('recurring.pending.skip')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </BottomSheet>
  );
}
