import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { authClient } from '@/auth-client';
import { FormError } from '@/components/auth/auth-layout';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { getApi } from '@gastify/core/api/client';
import { deleteAccountErrorText, validateDeleteAccount, type RemoveUserAnswer, type SecondFactorMethod } from '@gastify/core/profile/deleteAccount';

// "Eliminar mi cuenta": irreversible, so it asks for the account e-mail again and a fresh code of the authenticator
// app (or a backup code), exactly like the web (`general-data/user/remove-user`). An account that has only a passkey
// has no code to type here, so that one step is done on the web.
export function DeleteAccountCard({ email, twoFactorEnabled }: { email: string; twoFactorEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmMail, setConfirmMail] = useState('');
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<SecondFactorMethod>('totp');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirmMail('');
    setCode('');
    setMethod('totp');
    setError(null);
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const answer = await getApi().post<RemoveUserAnswer>('general-data/user/remove-user', { code: code.trim(), method, confirmMail: confirmMail.trim() });
      if (!answer?.ok) {
        setError(deleteAccountErrorText(answer));
        setCode('');
        return;
      }
      try {
        await authClient.signOut();
      } catch {
        // The session was already deleted on the server; signing out only clears the stored cookie.
      }
    } catch {
      setError('No pudimos conectar con el servidor. Revisa tu conexión.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    const problem = validateDeleteAccount({ accountEmail: email, confirmMail, code, method });
    if (problem) {
      setError(problem);
      return;
    }
    Alert.alert('Eliminar tu cuenta', 'Se borran tu cuenta y todos tus datos: movimientos, cuentas, categorías, presupuestos y etiquetas. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar todo', style: 'destructive', onPress: send },
    ]);
  };

  if (!open) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} className="items-center rounded-3xl border border-red-500/40 p-4">
        <Text className="font-inter-semibold text-base text-red-500">Eliminar mi cuenta</Text>
      </Pressable>
    );
  }

  return (
    <Card title="Eliminar mi cuenta">
      <Text className="font-inter text-sm text-gf-text-muted">
        Esto borra tu cuenta y TODOS tus datos (movimientos, cuentas, categorías, presupuestos, etiquetas, passkeys y la app autenticadora). No se puede deshacer.
      </Text>
      {!twoFactorEnabled ? (
        <>
          <Text className="font-inter text-sm text-gf-text">
            Para eliminarla, primero activa la verificación en dos pasos aquí arriba. Si tu cuenta usa solo un passkey, confirma tu identidad desde Gastify en la web (Perfil, «Eliminar mi cuenta»).
          </Text>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={8}>
            <Text className="font-inter-medium text-sm text-gf-accent-soft-text">Cerrar</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextField label={`Escribe tu correo (${email}) para confirmar`} value={confirmMail} onChangeText={setConfirmMail} keyboardType="email-address" autoComplete="email" />
          <TextField
            label={method === 'backup' ? 'Código de respaldo' : 'Código de tu app autenticadora'}
            value={code}
            onChangeText={setCode}
            placeholder={method === 'backup' ? 'xxxxx-xxxxx' : '6 dígitos'}
            keyboardType={method === 'backup' ? 'default' : 'number-pad'}
            maxLength={method === 'backup' ? 20 : 6}
            autoComplete="one-time-code"
          />
          <FormError message={error} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMethod((current) => (current === 'totp' ? 'backup' : 'totp'));
              setCode('');
              setError(null);
            }}
            hitSlop={8}>
            <Text className="font-inter-medium text-sm text-gf-accent-soft-text">{method === 'backup' ? 'Usar el código de mi app' : 'Usar un código de respaldo'}</Text>
          </Pressable>
          <View className="flex-row gap-3">
            <Pressable accessibilityRole="button" onPress={close} disabled={busy} className="flex-1 items-center rounded-full border border-gf-border py-3">
              <Text className="font-inter-semibold text-base text-gf-text">Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              onPress={confirm}
              disabled={busy}
              className="flex-1 items-center rounded-full bg-red-600 py-3"
              style={{ opacity: busy ? 0.6 : 1 }}>
              <Text className="font-inter-semibold text-base" style={{ color: '#ffffff' }}>{busy ? 'Eliminando…' : 'Eliminar'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}
