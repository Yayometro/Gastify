import { useState } from 'react';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch } from 'react-redux';

import { authClient } from '@/auth-client';
import { FormError } from '@/components/auth/auth-layout';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { updateUser, type UserData } from '@gastify/core/features/userSlice';
import { validateEmailAddress, validateNewPassword } from '@gastify/core/profile/accessRules';

// How the person signs in: the e-mail and the password, changed through the same route as the web's profile
// (`general-data/user/update-user`). Changing the e-mail signs the person out, so they come back in with the new one.
export function AccessCard({ email }: { email: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [openForm, setOpenForm] = useState<'email' | 'password' | null>(null);

  const changeEmail = () => {
    const problem = validateEmailAddress(newEmail, email);
    setEmailError(problem);
    if (problem) return;
    Alert.alert('Cambiar tu correo', `Vas a entrar con ${newEmail.trim()}. Cerraremos tu sesión para que vuelvas a entrar con el correo nuevo.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cambiar',
        onPress: async () => {
          setEmailBusy(true);
          try {
            const updated = await sendWrite<UserData | null>('general-data/user/update-user', { mail: newEmail.trim() });
            if (updated && typeof updated === 'object') dispatch(updateUser(updated));
            toast.show('Correo actualizado. Vuelve a entrar con el nuevo.');
            await authClient.signOut();
          } catch (e) {
            setEmailError(messageOf(e));
          } finally {
            setEmailBusy(false);
          }
        },
      },
    ]);
  };

  const changePassword = async () => {
    const problem = validateNewPassword(password, confirm);
    setPasswordError(problem);
    if (problem) return;
    setPasswordBusy(true);
    try {
      await sendWrite('general-data/user/update-user', { password });
      toast.show('Contraseña actualizada');
      setPassword('');
      setConfirm('');
      setOpenForm(null);
    } catch (e) {
      setPasswordError(messageOf(e));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <Card title="Acceso" info={{ title: 'Acceso', text: 'Con qué correo y contraseña entras a Gastify. Si entras con Google y nunca definiste una contraseña, aquí puedes crear una.' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: openForm === 'email' }} onPress={() => setOpenForm(openForm === 'email' ? null : 'email')} className="flex-row items-center justify-between py-1">
        <View className="flex-1">
          <Text className="font-inter-semibold text-base text-gf-text">Cambiar correo</Text>
          <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={1}>{email}</Text>
        </View>
        <View className="rounded-full px-4 py-2" style={{ backgroundColor: colors.accentSoft }}><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{openForm === 'email' ? 'Cerrar' : 'Editar'}</Text></View>
      </Pressable>
      {openForm === 'email' && (
        <View className="gap-3">
          <TextField label="Correo nuevo" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoComplete="email" placeholder="tu@correo.com" onClear={() => setNewEmail('')} />
          <FormError message={emailError} />
          <GradientButton label="Cambiar correo" onPress={changeEmail} loading={emailBusy} disabled={emailBusy || !newEmail.trim()} />
        </View>
      )}

      <View className="h-px bg-gf-border" />

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: openForm === 'password' }} onPress={() => setOpenForm(openForm === 'password' ? null : 'password')} className="flex-row items-center justify-between py-1">
        <View className="flex-1">
          <Text className="font-inter-semibold text-base text-gf-text">Cambiar contraseña</Text>
          <Text className="font-inter text-sm text-gf-text-muted">Mínimo 8 caracteres, una mayúscula y un carácter especial.</Text>
        </View>
        <View className="rounded-full px-4 py-2" style={{ backgroundColor: colors.accentSoft }}><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{openForm === 'password' ? 'Cerrar' : 'Editar'}</Text></View>
      </Pressable>
      {openForm === 'password' && (
        <View className="gap-3">
          <TextField label="Contraseña nueva" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
          <TextField label="Repite la contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
          <FormError message={passwordError} />
          <GradientButton label="Guardar contraseña" onPress={changePassword} loading={passwordBusy} disabled={passwordBusy || !password} />
        </View>
      )}
    </Card>
  );
}
