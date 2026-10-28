import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, useColorScheme } from 'react-native';

import { authClient } from '@/auth-client';
import { AuthLayout, FormError } from '@/components/auth/auth-layout';
import { CodeStep } from '@/components/auth/code-step';
import { OutlineButton } from '@/components/ui/outline-button';
import { Colors } from '@/constants/theme';
import { passkeyFailureMessage, signInWithDevicePasskey, usePasskeyAvailable } from '@/passkey';
import { useT } from "@/i18n/client";
import type { StepUpReason } from '@gastify/core/auth/sessionStatus';
import { STEP_UP_MAX_AGE_HOURS, STEP_UP_TTL_MINUTES } from '@gastify/core/auth/stepUpWindows';

// The sentence that says why the second factor is asked again (the same texts as the web's /verify-2fa).
const STEP_UP_REASON_KEY = {
  idle: 'auth.stepUp.idle',
  'max-age': 'auth.stepUp.maxAge',
  'never-verified': 'auth.stepUp.neverVerified',
  generic: 'auth.stepUp.generic',
} as const;

// An open session that is locked: it was just opened with Google (no second factor yet) or it has
// been idle too long. Ask for the second factor, like the web's /verify-2fa does: the code of the
// authenticator app when the account has one, and a passkey when it has one and this build can use it.
export function TwoFactorScreen({
  onVerified,
  hasTwoFactor,
  hasPasskey,
  reason,
}: {
  onVerified: () => void;
  hasTwoFactor: boolean;
  hasPasskey: boolean;
  // Why the session is locked, so the screen says it in plain words.
  reason?: StepUpReason;
}) {
  const t = useT();
  const scheme = useColorScheme();
  const iconColor = Colors[scheme === 'dark' ? 'dark' : 'light'].text;
  const passkeyAvailable = usePasskeyAvailable();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showPasskey = hasPasskey && passkeyAvailable;
  // A passkey-only account opened in a build that cannot use passkeys has no way to unlock here.
  const stuck = !hasTwoFactor && !showPasskey;

  const unlockWithPasskey = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithDevicePasskey();
      if (result.ok) onVerified();
      else setError(passkeyFailureMessage(result.reason));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("mobile.verifica.tu.identidad")}
      subtitle={t(STEP_UP_REASON_KEY[reason ?? 'generic'], { p1: reason === 'max-age' ? STEP_UP_MAX_AGE_HOURS : STEP_UP_TTL_MINUTES })}
    >
      <Text className="font-inter text-sm text-gf-text-muted">{t('auth.stepUp.howTo')}</Text>
      {showPasskey && (
        <OutlineButton
          label={t("mobile.usar.mi.passkey")}
          icon={<Ionicons name="finger-print" size={22} color={iconColor} />}
          onPress={unlockWithPasskey}
          loading={loading}
        />
      )}
      {hasTwoFactor && <CodeStep onVerified={onVerified} onGiveUp={() => {}} />}
      {stuck && (
        <Text className="font-inter text-base text-gf-text">
          {t("mobile.esta.cuenta.solo.tiene.passkey")}
        </Text>
      )}
      <FormError message={error} />
      <Pressable accessibilityRole="button" onPress={() => authClient.signOut()}>
        <Text className="text-center font-inter text-sm text-gf-text-muted">{t("mobile.cerrar.sesion")}</Text>
      </Pressable>
    </AuthLayout>
  );
}
