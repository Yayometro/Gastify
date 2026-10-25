// What GET /api/session-status answers (src/app/api/session-status/route.ts). The mobile app
// reads it to know whether to show the sign-in, the second-factor code, or the app itself.
export type SessionStatus =
  | { ok: true; signedIn: false }
  | {
      ok: true;
      signedIn: true;
      // "fresh" = the data routes accept this session right now.
      stepUp: "fresh" | "never-verified" | "idle";
      // Authenticator-app (TOTP) code set up on the account.
      hasTwoFactor: boolean;
      // At least one passkey registered. Either one is a valid second factor.
      hasPasskey: boolean;
      email: string;
      name: string;
    };
