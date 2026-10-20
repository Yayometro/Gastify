import { describe, it, expect, vi, afterEach } from "vitest";
import { GET as appleGet } from "./apple-app-site-association/route";
import { GET as androidGet } from "./assetlinks.json/route";

const FP = "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5";

afterEach(() => vi.unstubAllEnvs());

describe("/.well-known/apple-app-site-association", () => {
  it("is a 404 until APPLE_TEAM_ID is configured", async () => {
    vi.stubEnv("APPLE_TEAM_ID", "");
    expect(appleGet().status).toBe(404);
  });

  it("answers the JSON Apple expects once it is", async () => {
    vi.stubEnv("APPLE_TEAM_ID", "ABCDE12345");
    const res = appleGet();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ webcredentials: { apps: ["ABCDE12345.com.yayometro.gastify"] } });
  });
});

describe("/.well-known/assetlinks.json", () => {
  it("is a 404 until ANDROID_CERT_SHA256 is configured", async () => {
    vi.stubEnv("ANDROID_CERT_SHA256", "");
    expect(androidGet().status).toBe(404);
  });

  it("lists the app and its fingerprint once it is", async () => {
    vi.stubEnv("ANDROID_CERT_SHA256", FP);
    const res = androidGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].target.package_name).toBe("com.yayometro.gastify");
    expect(body[0].target.sha256_cert_fingerprints).toEqual([FP]);
  });
});
