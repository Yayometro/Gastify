"use client";

import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/plugins/two-factor";

// Single source of truth for the client-side auth API - every component
// that used to import from "next-auth/react" (signIn/signOut/useSession)
// imports `authClient` from here instead. No `baseURL` needed - the client
// and the auth server are always same-origin in Gastify, so it defaults to
// `window.location.origin`.
//
// twoFactorClient() is configured with neither `twoFactorPage` nor
// `onTwoFactorRedirect` deliberately - both would auto-intercept a
// twoFactorRedirect response before LoginComponent's own signIn.email()
// call ever sees it. The plan calls for an INLINE code-entry step on the
// login card itself (no page navigation) for the password path, so
// LoginComponent checks `data.twoFactorRedirect` on the raw response
// itself instead.
export const authClient = createAuthClient({
  plugins: [passkeyClient(), twoFactorClient()],
});
