import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { resetStore } from '@gastify/core/features/rootReducer';
import { authClient } from '@/auth-client';
import { LoginScreen } from '@/components/auth/login-screen';
import { NoTwoFactorScreen } from '@/components/auth/no-two-factor-screen';
import { TwoFactorScreen } from '@/components/auth/two-factor-screen';
import { useSessionStatus } from '@/hooks/use-session-status';
import { store } from '@/store';

function Waiting() {
  return (
    <View className="flex-1 items-center justify-center bg-gf-bg">
      <ActivityIndicator size="large" color="#a855f7" />
    </View>
  );
}

// Decides what the app shows: the sign-in, the second-factor code, a notice for an account
// without one, or the app itself. Mirrors the dashboard layout of the web (session + a recent
// second factor), using GET /api/session-status because the phone cannot follow a redirect.
export function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const { status, refresh } = useSessionStatus(Boolean(session));

  // The loading screen is only for the first start. Better Auth re-reads the session right after
  // a sign-in attempt (isPending flips back to true); if that replaced the sign-in screen, it would
  // be re-created empty and lose the second-factor step it was in the middle of.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    if (!isPending) setBooted(true);
  }, [isPending]);

  // Nobody signed in: drop whatever the previous account had loaded into Redux (the web had a
  // bug where another account briefly saw the previous one's data).
  useEffect(() => {
    if (!isPending && !session) store.dispatch(resetStore());
  }, [isPending, session]);

  if (isPending && !booted) return <Waiting />;
  if (!session) return <LoginScreen onSessionChanged={refresh} />;
  if (!status) return <Waiting />;
  // The server no longer knows this session (it expired, or it was closed elsewhere).
  if (!status.signedIn) return <LoginScreen onSessionChanged={refresh} />;
  // Either an authenticator app or a passkey counts as the account's second factor.
  if (!status.hasTwoFactor && !status.hasPasskey) return <NoTwoFactorScreen email={status.email} onRetry={refresh} />;
  if (status.stepUp !== 'fresh') {
    return <TwoFactorScreen onVerified={refresh} hasTwoFactor={status.hasTwoFactor} hasPasskey={status.hasPasskey} />;
  }
  return <>{children}</>;
}
