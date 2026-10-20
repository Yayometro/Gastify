import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { SessionStatus } from '@gastify/core/auth/sessionStatus';
import { API_URL, authClient } from '@/auth-client';

const POLL_MS = 60 * 1000;

// Where the signed-in session stands on the server (see GET /api/session-status): still unlocked
// by the second factor, or idle for too long. Re-checked every minute and whenever the app comes
// back to the foreground, so a locked session shows the code screen instead of failing loads.
export function useSessionStatus(enabled: boolean) {
  const [status, setStatus] = useState<SessionStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const cookie = (await authClient.getCookie()) ?? '';
      const res = await fetch(`${API_URL}/api/session-status`, { headers: { Cookie: cookie }, credentials: 'omit' });
      setStatus((await res.json()) as SessionStatus);
    } catch {
      // Offline or the server is unreachable: keep the last known status.
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, refresh]);

  return { status, refresh };
}
