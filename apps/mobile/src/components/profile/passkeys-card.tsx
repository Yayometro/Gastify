import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View, useColorScheme } from 'react-native';

import { authClient } from '@/auth-client';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';

import { useT, useInfo } from "@/i18n/client";
import { shortDate } from '@gastify/core/i18n/dates';
import { currentLocale, tNow } from '@/i18n/now';

type Passkey = { id: string; name?: string | null; createdAt?: string | Date | null; deviceType?: string | null };

const when = (value: Passkey['createdAt']) => (value ? shortDate(new Date(value), currentLocale()) : '');

// The passkeys of the account (the web's panel): which ones exist and a way to remove one. A passkey is added
// from the web or from the installed app, because Expo Go has no passkey support.
export function PasskeysCard() {
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: failure } = await authClient.$fetch<Passkey[]>('/passkey/list-user-passkeys', { method: 'GET' });
      if (failure) throw new Error(failure.message || t("mobile.no.pudimos.leer.tus.passkeys"));
      setPasskeys(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("mobile.no.pudimos.leer.tus.passkeys"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = (passkey: Passkey) =>
    Alert.alert(t("mobile.quitar.este.passkey"), t("mobile.profile.passkeyRemoved", { p1: passkey.name || tNow("mobile.este.passkey") }), [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.quitar"),
        style: 'destructive',
        onPress: async () => {
          const { error: failure } = await authClient.$fetch('/passkey/delete-passkey', { method: 'POST', body: { id: passkey.id } });
          if (failure) {
            toast.show(failure.message || t("mobile.no.pudimos.quitarlo"), 'error');
            return;
          }
          toast.show(t("mobile.passkey.quitado"));
          load();
        },
      },
    ]);

  return (
    <Card title={t("mobile.passkeys")} info={APP_INFO.passkeys}>
      {loading && <ActivityIndicator color={colors.accent} />}
      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
      {!loading && !error && passkeys.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.todavia.no.tienes.passkeys")}</Text>}
      {passkeys.map((passkey) => (
        <View key={passkey.id} className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{passkey.name || t("mobile.passkey")}</Text>
            <Text className="font-inter text-xs text-gf-text-muted">{[passkey.deviceType, when(passkey.createdAt)].filter(Boolean).join(' · ')}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => remove(passkey)} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-red-500">{t("mobile.quitar")}</Text>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
