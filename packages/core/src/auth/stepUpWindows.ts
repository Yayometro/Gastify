// The second-factor windows, in one place for the server (src/lib/auth/stepUpConfig.ts), the web screens and the mobile app.
// Idle: a session that sits this long without activity asks for the second factor again.
export const STEP_UP_TTL_MINUTES: number = 15;
// Hard limit: however active the session is, the second factor is asked again this many hours after the last proof.
export const STEP_UP_MAX_AGE_HOURS: number = 12;
// Changing a factor (TOTP, passkeys, backup codes) needs a fresher proof than just reaching the dashboard.
export const FACTOR_CHANGE_STEP_UP_TTL_MINUTES: number = 5;
