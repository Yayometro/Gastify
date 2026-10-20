import { Pressable, Text } from 'react-native';

import { authClient } from '@/auth-client';
import { AuthLayout } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';

// The app only opens accounts that have a second factor (the data routes refuse a session that
// never passed one). Setting one up from the phone comes later; for now it is done on the web.
export function NoTwoFactorScreen({ email, onRetry }: { email: string; onRetry: () => void }) {
  return (
    <AuthLayout title="Falta un paso" subtitle={`Entraste como ${email}.`}>
      <Text className="font-inter text-base text-gf-text">
        Para proteger tus movimientos, Gastify necesita que esta cuenta tenga la verificación en dos pasos activada.
        Actívala desde la web (Perfil) y después vuelve a entrar aquí.
      </Text>
      <GradientButton label="Ya la activé, volver a entrar" onPress={onRetry} />
      <Pressable accessibilityRole="button" onPress={() => authClient.signOut()}>
        <Text className="text-center font-inter text-sm text-gf-text-muted">Cerrar sesión</Text>
      </Pressable>
    </AuthLayout>
  );
}
