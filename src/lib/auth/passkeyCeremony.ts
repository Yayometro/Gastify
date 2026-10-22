import { authClient } from "@/lib/auth/authClient";

// One passkey ceremony at a time, for the whole page. The browser cancels a running WebAuthn request the moment a second one
// starts, so two overlapping calls (a remount from a hot reload, a double click, the manual button pressed while the automatic
// attempt is still open) make the system dialog flash and the fingerprint reader re-arm over and over, and the touch is
// often lost. Every caller shares the attempt that is already running instead of starting another.
type PasskeyResult = Awaited<ReturnType<typeof authClient.signIn.passkey>>;

let running: Promise<PasskeyResult> | null = null;

export function signInWithPasskeyOnce(): Promise<PasskeyResult> {
  if (running) return running;
  const attempt = authClient.signIn.passkey().finally(() => {
    running = null;
  });
  running = attempt;
  return attempt;
}
