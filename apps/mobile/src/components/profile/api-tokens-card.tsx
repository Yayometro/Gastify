import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View, useColorScheme } from 'react-native';

import { FormError } from '@/components/auth/auth-layout';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { messageOf, sendWrite } from '@/lib/write';
import { getApi } from '@gastify/core/api/client';
import { APP_INFO } from '@gastify/core/info/appInfo';
import { useT } from "@/i18n/client";

type Token = { _id?: unknown; name: string; createdAt?: string | number | Date; lastUsedAt?: string | number | Date | null };

const day = (value: Token['createdAt']) => (value ? new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Access tokens for connecting other tools to the account (the web's "connector"). The token is shown once, when it is
// created: it is copied or shared right then. The list only has names and dates, and a token can be revoked.
export function ApiTokensCard() {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const toast = useToast();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApi().post<{ ok?: boolean; data?: Token[]; message?: string }>('general-data/api-tokens/list', {});
      if (!res?.ok) throw new Error(res?.message || 'No pudimos leer tus tokens.');
      setTokens(res.data ?? []);
      setError(null);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return setError(t("mobile.ponle.un.nombre.al.token"));
    setBusy(true);
    setError(null);
    try {
      const data = await sendWrite<{ token: string; name: string }>('general-data/api-tokens/new', { name: name.trim() });
      setCreated(data.token);
      setName('');
      load();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const revoke = (token: Token) =>
    Alert.alert(t("mobile.revocar.este.token"), `«${token.name}» deja de funcionar al instante. No se puede deshacer.`, [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.revocar"),
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/api-tokens/remove', { tokenId: String(token._id) });
            toast.show('Token revocado');
            setCreated(null);
            load();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);

  return (
    <Card title={t("mobile.tokens.de.acceso")} info={APP_INFO.tokens_de_acceso}>
      {loading && <ActivityIndicator color={colors.accent} />}
      {!loading && tokens.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.no.tienes.tokens")}</Text>}
      {tokens.map((token) => (
        <View key={String(token._id ?? token.name)} className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{token.name}</Text>
            <Text className="font-inter text-xs text-gf-text-muted">
              {t("mobile.creado.p1.p2", { p1: day(token.createdAt), p2: token.lastUsedAt ? ` · usado ${day(token.lastUsedAt)}` : ' · sin usar' })}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => revoke(token)} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-red-500">{t("mobile.revocar")}</Text>
          </Pressable>
        </View>
      ))}

      {created && (
        <View className="gap-2 rounded-2xl border border-gf-border p-3">
          <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.copialo.ahora.no.se.vuelve")}</Text>
          <Text selectable className="font-inter text-xs text-gf-text">{created}</Text>
          <Pressable accessibilityRole="button" onPress={() => Share.share({ message: created })}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.compartir.o.guardar")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setCreated(null)}>
            <Text className="font-inter-medium text-xs text-gf-text-muted">{t("mobile.ya.lo.guarde")}</Text>
          </Pressable>
        </View>
      )}

      <TextField label={t("mobile.nombre.del.token.nuevo")} value={name} onChangeText={setName} placeholder={t("mobile.mi.asistente")} maxLength={40} autoCapitalize="sentences" />
      <FormError message={error} />
      <GradientButton label={t("mobile.crear.token")} onPress={create} loading={busy} disabled={busy} />
    </Card>
  );
}
