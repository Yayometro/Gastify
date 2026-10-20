import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { authClient } from '@/auth-client';
import { AuthLayout, FormError } from '@/components/auth/auth-layout';
import { CodeStep } from '@/components/auth/code-step';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';

type SignInError = { status?: number; code?: string; message?: string };

function messageFor(error: SignInError): string {
  if (error.status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  if (error.status === 401 || error.status === 400 || error.code === 'INVALID_EMAIL_OR_PASSWORD') {
    return 'Correo o contraseña incorrectos.';
  }
  return error.message || 'No pudimos iniciar sesión.';
}

// Email and password first. If the account has a second factor, the code step follows on the same
// screen; the session only exists once the code is right (same as the web). When it succeeds the
// session store updates by itself and AuthGate swaps this screen for the app.
export function LoginScreen({ onSessionChanged }: { onSessionChanged: () => void }) {
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError('No pudimos conectar con el servidor. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <AuthLayout title="Verificación" subtitle="Tu cuenta tiene verificación en dos pasos activada.">
        <CodeStep
          onVerified={onSessionChanged}
          onGiveUp={() => {
            setStep('password');
            setPassword('');
            setError('No pudimos verificar tu identidad después de 3 intentos. Vuelve a iniciar sesión.');
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setStep('password');
            setPassword('');
          }}>
          <Text className="text-center font-inter text-sm text-gf-text-muted">Cancelar</Text>
        </Pressable>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Gastify" subtitle="Inicia sesión para ver tus movimientos.">
      <TextField
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Tu contraseña"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={signIn}
      />
      <FormError message={error} />
      <GradientButton label="Entrar" onPress={signIn} loading={loading} disabled={!email.trim() || !password} />
      <Text className="text-center font-inter text-xs text-gf-text-muted">
        Entrar con Google llega pronto. Por ahora usa tu correo y contraseña.
      </Text>
    </AuthLayout>
  );
}
