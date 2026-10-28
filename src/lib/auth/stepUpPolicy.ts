import type { StepUpReason } from "@gastify/core/auth/sessionStatus";
import { STEP_UP_ACTIVITY_RECORD_INTERVAL_MS, STEP_UP_MAX_AGE_MS, STEP_UP_TTL_MS } from "./stepUpConfig";

export interface StepUpSessionStamps {
  stepUpVerifiedAt?: Date | string | number | null;
  lastApiActivityAt?: Date | string | number | null;
}

export type StepUpDecision =
  | { allowed: false; reason: StepUpReason }
  | { allowed: true; shouldRecordActivity: boolean };

function toMs(value: StepUpSessionStamps["stepUpVerifiedAt"]): number {
  if (value === null || value === undefined) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

// The second-factor rule for the pages and for the API (the same for both):
// - a session that never passed a second-factor proof is refused;
// - a session is refused once its last proof is older than 12 hours, however active it is (the hard limit);
// - otherwise it stays valid while its last proof OR its last activity is within 15 minutes (the idle timeout).
// Activity is what keeps someone working for an hour from being thrown out every 15 minutes.
export function evaluateApiStepUp(stamps: StepUpSessionStamps, now: number = Date.now()): StepUpDecision {
  const verifiedAt = toMs(stamps.stepUpVerifiedAt);
  if (!verifiedAt) return { allowed: false, reason: "never-verified" };
  if (now - verifiedAt > STEP_UP_MAX_AGE_MS) return { allowed: false, reason: "max-age" };
  const lastActive = Math.max(verifiedAt, toMs(stamps.lastApiActivityAt));
  const idleFor = now - lastActive;
  if (idleFor > STEP_UP_TTL_MS) return { allowed: false, reason: "idle" };
  return { allowed: true, shouldRecordActivity: idleFor > STEP_UP_ACTIVITY_RECORD_INTERVAL_MS };
}
