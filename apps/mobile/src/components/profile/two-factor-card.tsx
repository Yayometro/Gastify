import { useState } from 'react';
import { Alert, Linking, Pressable, Share, Text, View, useColorScheme } from 'react-native';

import { authClient } from '@/auth-client';
import { FormError } from '@/components/auth/auth-layout';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { APP_INFO } from '@gastify/core/info/appInfo';
import { useT } from "@/i18n/client";

type Setup = { uri: string; secret: string; codes: string[] };

// Two-step verification, as the web's panel: turn it on (key for the authenticator app + a first code to confirm),
// turn it off, or make new backup codes. The password is asked for when the account has one (an account that
// signs in only with Google leaves it empty).
export function TwoFactorCard() {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const enabled = Boolean((session?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled);
  const [password, setPassword] = useState('');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshSession = () => authClient.$store.notify('$sessionSignal');
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos completar la acción.');
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(async () => {
      const { data, error: failure } = await authClient.twoFactor.enable({ method: 'totp', password: password || undefined });
      if (failure || !data || data.method !== 'totp') throw new Error(failure?.message || 'No pudimos activar la verificación en dos pasos.');
      const secret = /secret=([A-Za-z2-7]+)/.exec(data.totpURI)?.[1] ?? '';
      setSetup({ uri: data.totpURI, secret, codes: data.backupCodes ?? [] });
      setPassword('');
    });

  const confirmCode = () =>
    run(async () => {
      const { error: failure } = await authClient.twoFactor.verifyTotp({ code: code.trim() });
      if (failure) throw new Error(failure.message || 'Código incorrecto.');
      toast.show('Verificación en dos pasos activada');
      setSetup(null);
      setCode('');
      refreshSession();
    });

  const turnOff = () =>
    Alert.alert(t("mobile.desactivar.la.verificacion.en.dos"), t("mobile.tu.cuenta.quedara.protegida.solo"), [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.desactivar"),
        style: 'destructive',
        onPress: () =>
          run(async () => {
            const { error: failure } = await authClient.twoFactor.disable({ password: password || undefined });
            if (failure) throw new Error(failure.message || 'No pudimos desactivarla.');
            toast.show('Verificación en dos pasos desactivada');
            setPassword('');
            refreshSession();
          }),
      },
    ]);

  const newCodes = () =>
    run(async () => {
      const { data, error: failure } = await authClient.twoFactor.generateBackupCodes({ password: password || undefined });
      if (failure || !data) throw new Error(failure?.message || 'No pudimos generar los códigos.');
      setCodes(data.backupCodes);
      setPassword('');
    });

  const shownCodes = codes ?? setup?.codes ?? null;

  return (
    <Card
      title={t("mobile.verificacion.en.dos.pasos")}
      info={APP_INFO.verificaci_n_en_dos_pasos}>
      <Text className="font-inter text-sm" style={{ color: enabled ? colors.income : colors.textSecondary }}>
        {enabled ? 'Activada con app autenticadora' : 'Desactivada. Actívala para proteger tu cuenta.'}
      </Text>

      {setup && (
        <View className="gap-3">
          <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.1.agrega.esta.clave.en")}</Text>
          <Text selectable className="font-inter-semibold text-base text-gf-text">{setup.secret || setup.uri}</Text>
          <Pressable accessibilityRole="button" onPress={() => Linking.openURL(setup.uri).catch(() => setError(t("mobile.no.encontramos.una.app.autenticadora")))} className="items-center rounded-full border border-gf-border py-2.5">
            <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.abrir.en.mi.app.autenticadora")}</Text>
          </Pressable>
          <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.2.escribe.el.codigo.de")}</Text>
          <TextField label={t("mobile.codigo")} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder={t("mobile.6.digitos")} />
          <GradientButton label={t("mobile.confirmar.y.activar")} onPress={confirmCode} loading={busy} disabled={busy || code.trim().length !== 6} />
        </View>
      )}

      {shownCodes && shownCodes.length > 0 && (
        <View className="gap-2 rounded-2xl border border-gf-border p-3">
          <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.codigos.de.respaldo.cada.uno")}</Text>
          <Text selectable className="font-inter text-sm text-gf-text">{shownCodes.join('   ')}</Text>
          <Pressable accessibilityRole="button" onPress={() => Share.share({ message: shownCodes.join('\n') })}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.compartir.o.guardar")}</Text>
          </Pressable>
        </View>
      )}

      {!setup && (
        <>
          <TextField label={t("mobile.contrasena.actual.si.tu.cuenta")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          {enabled ? (
            <View className="gap-2">
              <Pressable accessibilityRole="button" onPress={newCodes} disabled={busy} className="items-center rounded-full border border-gf-border py-2.5">
                <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.generar.codigos.de.respaldo.nuevos")}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={turnOff} disabled={busy} className="items-center py-2">
                <Text className="font-inter-semibold text-sm text-red-500">{t("mobile.desactivar")}</Text>
              </Pressable>
            </View>
          ) : (
            <GradientButton label={t("mobile.activar")} onPress={start} loading={busy} disabled={busy} />
          )}
        </>
      )}
      <FormError message={error} />
    </Card>
  );
}
