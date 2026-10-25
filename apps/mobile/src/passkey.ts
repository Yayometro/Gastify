import Constants, { ExecutionEnvironment } from 'expo-constants';
import { tNow } from '@/i18n/now';
import { useEffect, useState } from 'react';

import { isPasskeyAvailable, signInWithPasskey, type PasskeyDriver, type PasskeyResult } from '@gastify/core/auth/passkeySignIn';
import { authClient } from '@/auth-client';

// Passkeys need the native module (react-native-passkey) AND the app being linked to the site's
// domain (associated domains / assetlinks), which only a development or store build has. Expo Go
// has neither, so there the button never shows. The require is wrapped because a build without the
// native module throws when the module is loaded.
function loadDriver(): PasskeyDriver | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-passkey').Passkey as PasskeyDriver;
  } catch {
    return null;
  }
}

const driver = loadDriver();

// True when this build can sign in with a passkey on this device.
export function usePasskeyAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let alive = true;
    isPasskeyAvailable(driver).then((value) => alive && setAvailable(value));
    return () => {
      alive = false;
    };
  }, []);
  return available;
}

// Sign in (or unlock an open session) with a passkey. The server's own sign-in routes do the
// verification; the auth client keeps the challenge cookie and stores the session it returns.
export function signInWithDevicePasskey(): Promise<PasskeyResult> {
  return signInWithPasskey(driver, {
    getOptions: () => authClient.$fetch('/passkey/generate-authenticate-options', { method: 'GET' }),
    verify: async (assertion) => {
      const result = await authClient.$fetch('/passkey/verify-authentication', {
        method: 'POST',
        body: { response: assertion },
      });
      // Tell the session store a session may exist now (the web client does this by itself).
      if (!result.error) authClient.$store.notify('$sessionSignal');
      return result;
    },
  });
}

// What to tell the person when it did not work.
export function passkeyFailureMessage(reason: Exclude<PasskeyResult, { ok: true }>['reason']): string | null {
  if (reason === 'cancelled') return null;
  if (reason === 'no-credentials') return tNow("mobile.no.encontramos.un.passkey.de.gastify.en.este.dispositivo");
  if (reason === 'unavailable') return tNow("mobile.los.passkeys.no.estan.disponibles.en.esta.version.de.la.app");
  return tNow("mobile.no.pudimos.entrar.con.tu.passkey.intenta.de.nuevo.o.usa.otro");
}
