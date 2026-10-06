// Single source of truth for the step-up freshness window - both the
// authoritative server-side check (dashboard/layout.js) and the proactive
// client-side idle timer (IdleStepUpGuard.jsx) read this same constant so
// they can never drift apart.
export const STEP_UP_TTL_MINUTES: number = 15;
export const STEP_UP_TTL_MS: number = STEP_UP_TTL_MINUTES * 60 * 1000;

// Adding, removing or regenerating a second factor (TOTP, passkeys, backup
// codes) needs a FRESHER proof than just reaching the dashboard: whoever can
// change those factors can take the account over, so a stale stamp is not
// enough. See factorChangePolicy.ts.
export const FACTOR_CHANGE_STEP_UP_TTL_MINUTES: number = 5;
export const FACTOR_CHANGE_STEP_UP_TTL_MS: number = FACTOR_CHANGE_STEP_UP_TTL_MINUTES * 60 * 1000;

