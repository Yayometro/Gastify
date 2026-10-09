import { FACTOR_CHANGE_STEP_UP_TTL_MS } from "./stepUpConfig";

// Code the server answers with (HTTP 403) when a factor change needs a fresh
// step-up; the client reacts to it by sending the user to /verify-2fa.
export const STEP_UP_REQUIRED_CODE = "STEP_UP_REQUIRED";

// Better Auth endpoints that add, remove, reveal or regenerate a second
// factor. `update-passkey` (only renames one) is deliberately left out.
export const FACTOR_CHANGE_PATHS: ReadonlySet<string> = new Set([
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/generate-backup-codes",
  "/two-factor/get-totp-uri",
  "/passkey/generate-register-options",
  "/passkey/verify-registration",
  "/passkey/delete-passkey",
]);

export interface FactorChangeCheck {
  path: string;
  // True when the account already has TOTP enabled or at least one passkey.
  hasSecondFactor: boolean;
  stepUpVerifiedAt: Date | string | number | null | undefined;
  now?: number;
}

// A fresh step-up is required to touch factors ONLY when the account already
// has one. The very first enrollment (no factor yet) stays open: there is
// nothing to prove yet, and the dashboard already forces that enrollment.
export function requiresFreshStepUp({ path, hasSecondFactor, stepUpVerifiedAt, now = Date.now() }: FactorChangeCheck): boolean {
  if (!FACTOR_CHANGE_PATHS.has(path)) return false;
  if (!hasSecondFactor) return false;
  const stampedAt = stepUpVerifiedAt ? new Date(stepUpVerifiedAt).getTime() : 0;
  return !(now - stampedAt <= FACTOR_CHANGE_STEP_UP_TTL_MS);
}

// True when the session proved a second factor within the factor-change window
// (the stamp is written by the server only after a passkey / code verified).
export function hasFreshStepUp(stepUpVerifiedAt: Date | string | number | null | undefined, now: number = Date.now()): boolean {
  const stampedAt = stepUpVerifiedAt ? new Date(stepUpVerifiedAt).getTime() : 0;
  return now - stampedAt <= FACTOR_CHANGE_STEP_UP_TTL_MS;
}

// Only paths inside the dashboard may be used as the post-verification
// destination (keeps /verify-2fa?next=... from becoming an open redirect).
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/dashboard")) return null;
  if (next.startsWith("//") || next.includes("\\") || next.includes("://")) return null;
  return next;
}
