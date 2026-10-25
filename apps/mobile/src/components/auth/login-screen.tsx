import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { authClient } from '@/auth-client';
import { AuthLayout, FormError } from '@/components/auth/auth-layout';
import { CodeStep } from '@/components/auth/code-step';
import { GradientButton } from '@/components/ui/gradient-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { passkeyFailureMessage, signInWithDevicePasskey, usePasskeyAvailable } from '@/passkey';
import { useT } from "@/i18n/client";
import { tNow } from '@/i18n/now';

type SignInError = { status?: number; code?: string; message?: string };

function messageFor(error: SignInError): string {
  if (error.status === 429) return tNow("mobile.demasiados.intentos.espera.un.momento.y.vuelve.a.intentar");
  if (error.status === 401 || error.status === 400 || error.code === 'INVALID_EMAIL_OR_PASSWORD') {
    return tNow("mobile.correo.o.contrasena.incorrectos");
  }
  return error.message || tNow("mobile.no.pudimos.iniciar.sesion");
}

// Email and password first. If the account has a second factor, the code step follows on the same
// screen; the session only exists once the code is right (same as the web). Google and passkey are
// the other ways in. When any of them succeeds the session store updates by itself and AuthGate
// swaps this screen for the app (or for the second-factor screen, for Google).
export function LoginScreen({ onSessionChanged }: { onSessionChanged: () => void }) {
  const t = useT();
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  const passkeyAvailable = usePasskeyAvailable();

  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await authClient.signIn.email({ email: email.trim(), password });
      if (signInError) {
        setError(messageFor(signInError as SignInError));
        return;
      }
      if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
        setStep('code');
        return;
      }
      // Signed in without a second-factor challenge: AuthGate decides what that account sees.
      onSessionChanged();
    } catch {
      setError(t("mobile.no.pudimos.conectar.con.el"));
    } finally {
      setLoading(false);
    }
  };

  // Opens Google in the system browser; the server finishes the sign-in and sends the person back
  // to the app through its URL scheme (the Better Auth Expo plugin handles the round trip).
  const signInWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: googleError } = await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
      if (googleError) {
        setError(t("mobile.no.pudimos.iniciar.sesion.con"));
        return;
      }
      onSessionChanged();
    } catch {
      setError(t("mobile.no.pudimos.conectar.con.google"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const signInWithPasskey = async () => {
    setError(null);
    setPasskeyLoading(true);
    try {
      const result = await signInWithDevicePasskey();
      if (result.ok) onSessionChanged();
      else setError(passkeyFailureMessage(result.reason));
    } finally {
      setPasskeyLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <AuthLayout title={t("mobile.verificacion")} subtitle={t("mobile.tu.cuenta.tiene.verificacion.en")}>
        <CodeStep
          onVerified={onSessionChanged}
          onGiveUp={() => {
            setStep('password');
            setPassword('');
            setError(t("mobile.no.pudimos.verificar.tu.identidad"));
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setStep('password');
            setPassword('');
          }}>
          <Text className="text-center font-inter text-sm text-gf-text-muted">{t("mobile.cancelar")}</Text>
        </Pressable>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("mobile.gastify")} subtitle={t("mobile.inicia.sesion.para.ver.tus")}>
      <OutlineButton
        label={t("mobile.continuar.con.google")}
        icon={<AntDesign name="google" size={20} color={iconColor} />}
        onPress={signInWithGoogle}
        loading={googleLoading}
      />
      {passkeyAvailable && (
        <OutlineButton
          label={t("mobile.entrar.con.passkey")}
          icon={<Ionicons name="finger-print" size={22} color={iconColor} />}
          onPress={signInWithPasskey}
          loading={passkeyLoading}
        />
      )}
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-gf-border" />
        <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.o.con.tu.correo")}</Text>
        <View className="h-px flex-1 bg-gf-border" />
      </View>
      <TextField
        label={t("mobile.correo")}
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label={t("mobile.contrasena")}
        value={password}
        onChangeText={setPassword}
        placeholder={t("mobile.tu.contrasena")}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={signIn}
      />
      <FormError message={error} />
      <GradientButton label={t("mobile.entrar")} onPress={signIn} loading={loading} disabled={!email.trim() || !password} />
    </AuthLayout>
  );
}
