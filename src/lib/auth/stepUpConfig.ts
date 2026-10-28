import {
  FACTOR_CHANGE_STEP_UP_TTL_MINUTES,
  STEP_UP_MAX_AGE_HOURS,
  STEP_UP_TTL_MINUTES,
} from "@gastify/core/auth/stepUpWindows";

// Single source of truth for the step-up freshness window - the server check
// (stepUpPolicy.ts, used by the pages and by the API) and the client idle timer
// (IdleStepUpGuard.tsx) read this same constant so they can never drift apart.
// The numbers live in packages/core so the mobile app reads the same ones.
export { FACTOR_CHANGE_STEP_UP_TTL_MINUTES, STEP_UP_MAX_AGE_HOURS, STEP_UP_TTL_MINUTES };
export const STEP_UP_TTL_MS: number = STEP_UP_TTL_MINUTES * 60 * 1000;

// Adding, removing or regenerating a second factor (TOTP, passkeys, backup
// codes) needs a FRESHER proof than just reaching the dashboard: whoever can
// change those factors can take the account over, so a stale stamp is not
// enough. See factorChangePolicy.ts.
export const FACTOR_CHANGE_STEP_UP_TTL_MS: number = FACTOR_CHANGE_STEP_UP_TTL_MINUTES * 60 * 1000;

// The longest a session may go between second-factor proofs, however busy it is.
// The idle window above resets with activity; this one never does, so a session
// that stays alive with calls still asks again every 12 hours.
export const STEP_UP_MAX_AGE_MS: number = STEP_UP_MAX_AGE_HOURS * 60 * 60 * 1000;

// The API enforces the same window as the dashboard, but as an IDLE timeout: a
// request made inside the window counts as activity (the client guard resets its
// timer on activity too), so someone working for an hour is not thrown out every
// 15 minutes. Activity is recorded at most this often, to spare the database a
// write per request. It lives in its own session field (lastApiActivityAt), never
// in stepUpVerifiedAt, which factor changes judge with a much shorter window.
export const STEP_UP_ACTIVITY_RECORD_INTERVAL_MS: number = 60 * 1000;
