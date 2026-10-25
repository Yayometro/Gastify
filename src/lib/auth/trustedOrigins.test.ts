import { describe, it, expect } from "vitest";
import { MOBILE_APP_SCHEME, buildTrustedOrigins } from "./trustedOrigins";

describe("buildTrustedOrigins", () => {
  it("trusts the app's own scheme everywhere", () => {
    for (const env of ["development", "production", "test", undefined]) {
      expect(buildTrustedOrigins(env)).toContain(`${MOBILE_APP_SCHEME}://`);
    }
  });

  it("never trusts the Expo Go (exp://) patterns outside development", () => {
    for (const env of ["production", "test", undefined, ""]) {
      const origins = buildTrustedOrigins(env);
      expect(origins.some((o) => o.startsWith("exp://"))).toBe(false);
    }
    expect(buildTrustedOrigins("production")).toEqual(["gastify://"]);
  });

  it("trusts the Expo Go patterns in development", () => {
    const origins = buildTrustedOrigins("development");
    expect(origins).toContain("exp://192.168.*.*:*/**");
    expect(origins).toContain("gastify://");
  });

  it("the scheme matches the one configured in the mobile app", async () => {
    const fs = await import("node:fs");
    const appJson = JSON.parse(fs.readFileSync(new URL("../../../apps/mobile/app.json", import.meta.url), "utf8"));
    expect(appJson.expo.scheme).toBe(MOBILE_APP_SCHEME);
  });
});
