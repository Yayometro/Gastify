import { describe, it, expect } from "vitest";
import {
  MOBILE_BUNDLE_ID,
  androidPasskeyOrigins,
  buildAppleAssociation,
  buildAssetLinks,
  passkeyOrigins,
} from "./mobileApp";

const FP = "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5";

describe("apple-app-site-association", () => {
  it("is only built for a valid 10-character Team ID", () => {
    expect(buildAppleAssociation(undefined)).toBeNull();
    expect(buildAppleAssociation("")).toBeNull();
    expect(buildAppleAssociation("not a team id")).toBeNull();
    expect(buildAppleAssociation("ABCDE12345")).toEqual({
      webcredentials: { apps: [`ABCDE12345.${MOBILE_BUNDLE_ID}`] },
    });
  });
});

describe("assetlinks.json", () => {
  it("needs at least one valid SHA-256 fingerprint", () => {
    expect(buildAssetLinks(undefined)).toBeNull();
    expect(buildAssetLinks("nope, 12:34")).toBeNull();
  });

  it("lists the app and its fingerprints", () => {
    const links = buildAssetLinks(`${FP.toLowerCase()}, nope`) as Array<Record<string, unknown>>;
    expect(links).toHaveLength(1);
    expect(links[0].relation).toEqual(["delegate_permission/common.get_login_creds"]);
    expect(links[0].target).toEqual({
      namespace: "android_app",
      package_name: MOBILE_BUNDLE_ID,
      sha256_cert_fingerprints: [FP],
    });
  });
});

describe("android passkey origins", () => {
  it("turns the fingerprint into the apk-key-hash origin (base64url of the 32 bytes)", () => {
    const [origin] = androidPasskeyOrigins(FP);
    expect(origin.startsWith("android:apk-key-hash:")).toBe(true);
    const encoded = origin.slice("android:apk-key-hash:".length);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(encoded, "base64url").toString("hex").toUpperCase()).toBe(FP.replace(/:/g, ""));
  });

  it("leaves the plugin's default alone when nothing Android is configured", () => {
    expect(passkeyOrigins("https://gastify.example.com", undefined)).toBeUndefined();
    expect(passkeyOrigins(undefined, FP)).toBeUndefined();
  });

  it("adds the web origin first and the Android ones after it", () => {
    const origins = passkeyOrigins("https://gastify.example.com/", FP)!;
    expect(origins[0]).toBe("https://gastify.example.com");
    expect(origins).toHaveLength(2);
  });
});

describe("the mobile app configuration", () => {
  it("uses the same identifier as this module on both platforms", async () => {
    const fs = await import("node:fs");
    const appJson = JSON.parse(fs.readFileSync(new URL("../../../apps/mobile/app.json", import.meta.url), "utf8"));
    expect(appJson.expo.ios.bundleIdentifier).toBe(MOBILE_BUNDLE_ID);
    expect(appJson.expo.android.package).toBe(MOBILE_BUNDLE_ID);
  });
});
