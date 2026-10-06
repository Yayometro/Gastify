import { describe, it, expect } from "vitest";
import { requiresFreshStepUp, safeNextPath, FACTOR_CHANGE_PATHS } from "./factorChangePolicy";
import { FACTOR_CHANGE_STEP_UP_TTL_MS } from "./stepUpConfig";

const now = Date.UTC(2026, 9, 6, 12, 0, 0);
const ago = (ms: number) => new Date(now - ms);

describe("requiresFreshStepUp", () => {
  it("ignores endpoints that do not change factors", () => {
    expect(requiresFreshStepUp({ path: "/sign-in/email", hasSecondFactor: true, stepUpVerifiedAt: null, now })).toBe(false);
    expect(requiresFreshStepUp({ path: "/two-factor/verify-totp", hasSecondFactor: true, stepUpVerifiedAt: null, now })).toBe(false);
    expect(requiresFreshStepUp({ path: "/passkey/update-passkey", hasSecondFactor: true, stepUpVerifiedAt: null, now })).toBe(false);
  });

  it("lets the very first enrollment through when the account has no factor yet", () => {
    for (const path of FACTOR_CHANGE_PATHS) {
      expect(requiresFreshStepUp({ path, hasSecondFactor: false, stepUpVerifiedAt: null, now })).toBe(false);
    }
  });

  it("blocks every factor change on an account with a factor when there is no stamp (the stolen-session case)", () => {
    for (const path of FACTOR_CHANGE_PATHS) {
      expect(requiresFreshStepUp({ path, hasSecondFactor: true, stepUpVerifiedAt: null, now })).toBe(true);
      expect(requiresFreshStepUp({ path, hasSecondFactor: true, stepUpVerifiedAt: undefined, now })).toBe(true);
    }
  });

  it("allows it with a stamp inside the 5 minute window and blocks it just after", () => {
    const path = "/two-factor/disable";
    expect(requiresFreshStepUp({ path, hasSecondFactor: true, stepUpVerifiedAt: ago(30_000), now })).toBe(false);
    expect(requiresFreshStepUp({ path, hasSecondFactor: true, stepUpVerifiedAt: ago(FACTOR_CHANGE_STEP_UP_TTL_MS), now })).toBe(false);
    expect(requiresFreshStepUp({ path, hasSecondFactor: true, stepUpVerifiedAt: ago(FACTOR_CHANGE_STEP_UP_TTL_MS + 1), now })).toBe(true);
  });

  it("a stamp that is fine for the dashboard (15 min) is too old to change factors", () => {
    expect(requiresFreshStepUp({ path: "/passkey/delete-passkey", hasSecondFactor: true, stepUpVerifiedAt: ago(10 * 60 * 1000), now })).toBe(true);
  });

  it("accepts the stamp as a string or a number too", () => {
    expect(requiresFreshStepUp({ path: "/two-factor/enable", hasSecondFactor: true, stepUpVerifiedAt: ago(1000).toISOString(), now })).toBe(false);
    expect(requiresFreshStepUp({ path: "/two-factor/enable", hasSecondFactor: true, stepUpVerifiedAt: now - 1000, now })).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("only lets dashboard paths through", () => {
    expect(safeNextPath("/dashboard/profile")).toBe("/dashboard/profile");
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/login")).toBeNull();
    expect(safeNextPath("/dashboard/../login//x://")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(["/dashboard"])).toBeNull();
  });
});
