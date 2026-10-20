import { Pressable, Text } from 'react-native';

import { authClient } from '@/auth-client';
import { AuthLayout } from '@/components/auth/auth-layout';
import { CodeStep } from '@/components/auth/code-step';

// An open session that has been idle too long: ask for the second factor again, like the web's
// /verify-2fa page does after 15 minutes without activity.
export function TwoFactorScreen({ onVerified }: { onVerified: () => void }) {
  return (
    <AuthLayout title="Verifica tu identidad" subtitle="Por seguridad, confirma que eres tú para seguir usando Gastify.">
      <CodeStep onVerified={onVerified} onGiveUp={() => {}} />
      <Pressable accessibilityRole="button" onPress={() => authClient.signOut()}>
        <Text className="text-center font-inter text-sm text-gf-text-muted">Cerrar sesión</Text>
      </Pressable>
    </AuthLayout>
  );
}
