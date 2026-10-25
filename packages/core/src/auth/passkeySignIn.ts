// Signing in with a passkey from the phone. The browser has a built-in WebAuthn API; a native app
// does not, so the steps Better Auth's web client performs are done by hand here:
//   1. ask the server for a challenge (GET /passkey/generate-authenticate-options),
//   2. let the phone sign it (Face ID / Touch ID / the device's passkey manager),
//   3. send the signed answer back (POST /passkey/verify-authentication).
// The server verifies it and opens the session, and it also stamps the second-factor proof
// (see STEP_UP_PROOF_PATHS in betterAuth.ts), so a passkey sign-in is fully unlocked.
// The two sides are passed in, which keeps this testable without a phone.

// The native module (react-native-passkey): null when it is not part of the build.
export interface PasskeyDriver {
  isSupported(): boolean | Promise<boolean>;
  // Takes the server's request options, returns the signed assertion.
  get(requestJson: unknown): Promise<unknown>;
}

// The server calls, already carrying the session cookie handling of the auth client.
export interface PasskeyServer {
  getOptions(): Promise<{ data?: unknown; error?: unknown }>;
  verify(assertion: unknown): Promise<{ error?: unknown }>;
}

export type PasskeyFailure = "unavailable" | "cancelled" | "no-credentials" | "failed";
export type PasskeyResult = { ok: true } | { ok: false; reason: PasskeyFailure };

// react-native-passkey reports problems as { error: "UserCancelled" | "NoCredentials" | ... }.
function failureOf(error: unknown): PasskeyFailure {
  const code = String((error as { error?: unknown })?.error ?? (error as { code?: unknown })?.code ?? "");
  if (/cancel/i.test(code)) return "cancelled";
  if (/nocredentials|no_credentials/i.test(code)) return "no-credentials";
  return "failed";
}

export async function isPasskeyAvailable(driver: PasskeyDriver | null): Promise<boolean> {
  if (!driver) return false;
  try {
    return Boolean(await driver.isSupported());
  } catch {
    return false;
  }
}

export async function signInWithPasskey(driver: PasskeyDriver | null, server: PasskeyServer): Promise<PasskeyResult> {
  if (!driver || !(await isPasskeyAvailable(driver))) return { ok: false, reason: "unavailable" };

  const options = await server.getOptions();
  if (options.error || !options.data) return { ok: false, reason: "failed" };

  let assertion: unknown;
  try {
    assertion = await driver.get(options.data);
  } catch (error) {
    return { ok: false, reason: failureOf(error) };
  }

  const verified = await server.verify(assertion);
  if (verified.error) return { ok: false, reason: "failed" };
  return { ok: true };
}
