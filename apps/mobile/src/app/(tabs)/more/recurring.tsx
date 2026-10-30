import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { SkeletonRows } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useInfo, useLocale, useT } from '@/i18n/client';
import { messageOf, sendWrite } from '@/lib/write';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { shortDate } from '@gastify/core/i18n/dates';
import { parseMoneyText } from '@gastify/core/transactions/movementForm';

type Rule = {
  id: string;
  name: string;
  amount: number;
  currency: string | null;
  frequency: string;
  isVariable: boolean;
  active: boolean;
  nextDueDate: string;
};

// The recurring expenses the person declared: each one can be paused, have its reference amount changed or be deleted
// (the charges it already created stay as ordinary movements).
export default function RecurringScreen() {
  const t = useT();
  const { APP_INFO } = useInfo();
  const locale = useLocale();
  const toast = useToast();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const primary = usePrimaryCurrency();
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/more'));

  const load = useCallback(async () => {
    try {
      setRules(await sendWrite<Rule[]>('general-data/recurring/get', {}));
    } catch (error) {
      setRules([]);
      toast.show(messageOf(error));
    }
  }, [toast]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (id: string, path: string, body: Record<string, unknown>, okKey: string) => {
    setBusy(id);
    try {
      await sendWrite(`general-data/recurring/${path}`, { id, ...body });
      toast.show(t(okKey));
      await load();
    } catch (error) {
      toast.show(messageOf(error));
    } finally {
      setBusy(null);
      setEditing(null);
      setRemoving(null);
    }
  };

  const saveAmount = (rule: Rule) => {
    const amount = parseMoneyText(editing?.value ?? '');
    if (amount === null) return toast.show(t('recurring.pending.error'));
    void run(rule.id, 'update', { amount }, 'recurring.manage.saved');
  };

  const action = (label: string, onPress: () => void, tone: 'normal' | 'danger' = 'normal', disabled = false) => (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} className="rounded-full border px-4 py-2" style={{ borderColor: tone === 'danger' ? '#ef4444' : colors.border, opacity: disabled ? 0.5 : 1 }}>
      <Text className="font-inter-semibold text-sm" style={{ color: tone === 'danger' ? '#ef4444' : colors.text }}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen tutorial="m-recurring" title={t('recurring.manage.title')} titleInfo={APP_INFO.gastos_recurrentes} backLabel={t('mobile.mas')} onBack={back}>
      {rules === null ? (
        <SkeletonRows count={3} />
      ) : rules.length === 0 ? (
        <Card>
          <Text className="font-inter text-sm text-gf-text-muted">{t('recurring.manage.empty')}</Text>
        </Card>
      ) : (
        rules.map((rule, index) => (
          <Card key={rule.id} tour={index === 0 ? 'm-recurring-first' : undefined}>
            <View className="gap-3" style={{ opacity: rule.active ? 1 : 0.7 }}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-0.5">
                  <Text className="font-inter-semibold text-base text-gf-text">{rule.name}</Text>
                  <Text className="font-inter text-xs text-gf-text-muted">
                    {t(`recurring.frequency.${rule.frequency}`)} · {rule.active ? t('recurring.manage.next', { p1: shortDate(new Date(rule.nextDueDate), locale) }) : t('recurring.manage.paused')}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="font-inter-bold text-base text-gf-text">{formatMoneyMajor(rule.amount, rule.currency || primary)}</Text>
                  <Text className="font-inter-medium text-[11px]" style={{ color: rule.isVariable ? '#fbbf24' : '#4ade80' }}>{rule.isVariable ? t('recurring.manage.variable') : t('recurring.manage.fixed')}</Text>
                </View>
              </View>
              {editing?.id === rule.id ? (
                <View className="gap-3">
                  <TextField label={t('recurring.pending.amount')} value={editing.value} onChangeText={(text) => setEditing({ id: rule.id, value: text.replace(/[^0-9.,]/g, '') })} keyboardType="decimal-pad" autoFocus />
                  <View className="flex-row gap-2">
                    {action(t('recurring.manage.save'), () => saveAmount(rule), 'normal', busy === rule.id)}
                    {action(t('recurring.manage.cancel'), () => setEditing(null))}
                  </View>
                </View>
              ) : removing === rule.id ? (
                <View className="gap-3">
                  <Text className="font-inter text-sm text-gf-text-muted">{t('recurring.manage.removeSure')}</Text>
                  <View className="flex-row gap-2">
                    {action(t('recurring.manage.removeYes'), () => void run(rule.id, 'remove', {}, 'recurring.manage.removed'), 'danger', busy === rule.id)}
                    {action(t('recurring.manage.cancel'), () => setRemoving(null))}
                  </View>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {action(rule.active ? t('recurring.manage.pause') : t('recurring.manage.resume'), () => void run(rule.id, 'update', { active: !rule.active }, 'recurring.manage.saved'), 'normal', busy === rule.id)}
                  {action(t('recurring.manage.edit'), () => setEditing({ id: rule.id, value: String(rule.amount) }))}
                  {action(t('recurring.manage.remove'), () => setRemoving(rule.id), 'danger')}
                </View>
              )}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
