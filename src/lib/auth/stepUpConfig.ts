// Single source of truth for the step-up freshness window - both the
// authoritative server-side check (dashboard/layout.js) and the proactive
// client-side idle timer (IdleStepUpGuard.jsx) read this same constant so
// they can never drift apart.
export const STEP_UP_TTL_MINUTES: number = 15;
export const STEP_UP_TTL_MS: number = STEP_UP_TTL_MINUTES * 60 * 1000;
