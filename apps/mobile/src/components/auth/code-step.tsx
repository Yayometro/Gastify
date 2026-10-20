import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { authClient } from '@/auth-client';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';

// Same limit as the web's /verify-2fa: three wrong codes and the session is closed.
const MAX_ATTEMPTS = 3;

// Asks for the second factor: the 6-digit code of the authenticator app, or a backup code.
// Used right after the password and again when an open session has been idle too long.
export function CodeStep({ onVerified, onGiveUp }: { onVerified: () => void; onGiveUp: () => void }) {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    const value = code.trim();
    if (!value) return;
    setError(null);
    setLoading(true);
    try {
      const result = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: value })
        : await authClient.twoFactor.verifyTotp({ code: value });
      if (!result.error) {
        onVerified();
        return;
      }
      const next = attempts + 1;
      setAttempts(next);
      setCode('');
      if (next >= MAX_ATTEMPTS) {
        // Close the session, like the web does after three failed attempts.
        await authClient.signOut();
        onGiveUp();
        return;
      }
      setError(`Código incorrecto. Te quedan ${MAX_ATTEMPTS - next} intento(s).`);
    } catch {
      setError('No pudimos conectar con el servidor. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TextField
        label={useBackup ? 'Código de respaldo' : 'Código de tu app autenticadora'}
        value={code}
        onChangeText={setCode}
        placeholder={useBackup ? 'xxxxx-xxxxx' : '6 dígitos'}
        keyboardType={useBackup ? 'default' : 'number-pad'}
        maxLength={useBackup ? 20 : 6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        onSubmitEditing={verify}
        autoFocus
      />
      <FormError message={error} />
      <GradientButton label="Verificar" onPress={verify} loading={loading} disabled={!code.trim()} />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setUseBackup((value) => !value);
          setCode('');
          setError(null);
        }}>
        <Text className="text-center font-inter-medium text-sm text-gf-accent-soft-text">
          {useBackup ? 'Usar el código de mi app' : 'Usar un código de respaldo'}
        </Text>
      </Pressable>
    </>
  );
}
