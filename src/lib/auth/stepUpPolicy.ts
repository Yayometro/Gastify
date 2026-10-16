import { STEP_UP_ACTIVITY_RECORD_INTERVAL_MS, STEP_UP_TTL_MS } from "./stepUpConfig";

export interface StepUpSessionStamps {
  stepUpVerifiedAt?: Date | string | number | null;
  lastApiActivityAt?: Date | string | number | null;
}

export type StepUpDecision =
  | { allowed: false; reason: "never-verified" | "idle" }
  | { allowed: true; shouldRecordActivity: boolean };

function toMs(value: StepUpSessionStamps["stepUpVerifiedAt"]): number {
  if (value === null || value === undefined) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

// Server-side half of the "2FA stays fresh" rule for the API (the dashboard layout
// only judges page loads). A session that never passed a second-factor proof is
// refused; one that did stays valid while its last proof OR last API activity is
// within the window, i.e. an idle timeout, like the client guard (IdleStepUpGuard).
export function evaluateApiStepUp(stamps: StepUpSessionStamps, now: number = Date.now()): StepUpDecision {
  const verifiedAt = toMs(stamps.stepUpVerifiedAt);
  if (!verifiedAt) return { allowed: false, reason: "never-verified" };
  const lastActive = Math.max(verifiedAt, toMs(stamps.lastApiActivityAt));
  const idleFor = now - lastActive;
  if (idleFor > STEP_UP_TTL_MS) return { allowed: false, reason: "idle" };
  return { allowed: true, shouldRecordActivity: idleFor > STEP_UP_ACTIVITY_RECORD_INTERVAL_MS };
}
