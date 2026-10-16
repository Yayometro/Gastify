import { describe, it, expect } from "vitest";
import { evaluateApiStepUp } from "./stepUpPolicy";
import { STEP_UP_ACTIVITY_RECORD_INTERVAL_MS, STEP_UP_TTL_MS } from "./stepUpConfig";

const NOW = new Date("2026-10-16T12:00:00Z").getTime();
const ago = (ms: number) => new Date(NOW - ms);

describe("evaluateApiStepUp", () => {
  it("refuses a session that never passed a second-factor proof", () => {
    expect(evaluateApiStepUp({}, NOW)).toEqual({ allowed: false, reason: "never-verified" });
    expect(evaluateApiStepUp({ stepUpVerifiedAt: null, lastApiActivityAt: ago(1000) }, NOW)).toEqual({ allowed: false, reason: "never-verified" });
    expect(evaluateApiStepUp({ stepUpVerifiedAt: "not a date" }, NOW)).toEqual({ allowed: false, reason: "never-verified" });
  });

  it("allows a fresh proof without writing activity yet", () => {
    expect(evaluateApiStepUp({ stepUpVerifiedAt: ago(5_000) }, NOW)).toEqual({ allowed: true, shouldRecordActivity: false });
  });

  it("allows within the window and asks to record activity once the interval has passed", () => {
    const d = evaluateApiStepUp({ stepUpVerifiedAt: ago(STEP_UP_ACTIVITY_RECORD_INTERVAL_MS + 1) }, NOW);
    expect(d).toEqual({ allowed: true, shouldRecordActivity: true });
  });

  it("refuses once the last proof is older than the window and there was no activity", () => {
    expect(evaluateApiStepUp({ stepUpVerifiedAt: ago(STEP_UP_TTL_MS + 1) }, NOW)).toEqual({ allowed: false, reason: "idle" });
  });

  it("keeps an active session alive: recent activity counts even if the proof is old", () => {
    const d = evaluateApiStepUp({ stepUpVerifiedAt: ago(3 * STEP_UP_TTL_MS), lastApiActivityAt: ago(10_000) }, NOW);
    expect(d).toEqual({ allowed: true, shouldRecordActivity: false });
  });

  it("refuses when both the proof and the last activity are stale", () => {
    const d = evaluateApiStepUp({ stepUpVerifiedAt: ago(3 * STEP_UP_TTL_MS), lastApiActivityAt: ago(STEP_UP_TTL_MS + 1) }, NOW);
    expect(d).toEqual({ allowed: false, reason: "idle" });
  });

  it("an activity stamp can never revive a session that has no proof", () => {
    expect(evaluateApiStepUp({ lastApiActivityAt: ago(1000) }, NOW)).toEqual({ allowed: false, reason: "never-verified" });
  });
});
