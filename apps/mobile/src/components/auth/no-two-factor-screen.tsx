import { Pressable, Text } from 'react-native';

import { authClient } from '@/auth-client';
import { AuthLayout } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { useT } from "@/i18n/client";

// The app only opens accounts that have a second factor (the data routes refuse a session that
// never passed one). Setting one up from the phone comes later; for now it is done on the web.
export function NoTwoFactorScreen({ email, onRetry }: { email: string; onRetry: () => void }) {
  const t = useT();
  return (
    <AuthLayout title={t("mobile.falta.un.paso")} subtitle={t("mobile.auth.signedInAs", { p1: email })}>
      <Text className="font-inter text-base text-gf-text">
        {t("mobile.para.proteger.tus.movimientos.gastify")}
      </Text>
      <GradientButton label={t("mobile.ya.la.active.volver.a")} onPress={onRetry} />
      <Pressable accessibilityRole="button" onPress={() => authClient.signOut()}>
        <Text className="text-center font-inter text-sm text-gf-text-muted">{t("mobile.cerrar.sesion")}</Text>
      </Pressable>
    </AuthLayout>
  );
}
