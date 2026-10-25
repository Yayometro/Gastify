import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
// The client-only entry: `better-auth/plugins/two-factor` (what the web imports) also carries the
// server plugin, which the phone's JavaScript engine cannot parse.
import { twoFactorClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

// Where the Gastify server lives. In production builds it is the Vercel site; while developing,
// set EXPO_PUBLIC_API_URL in apps/mobile/.env.local (for example http://192.168.1.69:3000, the
// Mac running `npm run dev`) so the app talks to the local server instead.
// Google sign-in is started here and finished on the server's own address (BETTER_AUTH_URL): the two must be the same
// domain, or the sign-in state set on one never comes back to the other. So the production default is the domain the
// web serves from.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://mygastify.com';

// Same server-side sessions as the web app. The session cookie is kept in the phone's secure
// storage (Keychain on iPhone, Keystore on Android) and sent by hand on every request.
// The scheme must match `expo.scheme` in app.json and MOBILE_APP_SCHEME on the server.
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({ scheme: 'gastify', storagePrefix: 'gastify', storage: SecureStore }),
    twoFactorClient(),
  ],
});
