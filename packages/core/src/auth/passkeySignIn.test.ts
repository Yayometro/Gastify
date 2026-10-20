import { describe, it, expect, vi } from "vitest";
import { isPasskeyAvailable, signInWithPasskey, type PasskeyDriver, type PasskeyServer } from "./passkeySignIn";

const options = { challenge: "abc", rpId: "gastify.example.com" };
const assertion = { id: "cred", response: { signature: "sig" } };

function make(overrides: { driver?: Partial<PasskeyDriver> | null; server?: Partial<PasskeyServer> } = {}) {
  const driver: PasskeyDriver | null =
    overrides.driver === null
      ? null
      : { isSupported: vi.fn().mockResolvedValue(true), get: vi.fn().mockResolvedValue(assertion), ...overrides.driver };
  const server: PasskeyServer = {
    getOptions: vi.fn().mockResolvedValue({ data: options }),
    verify: vi.fn().mockResolvedValue({}),
    ...overrides.server,
  };
  return { driver, server };
}

describe("isPasskeyAvailable", () => {
  it("is false without the native module or when the device says no", async () => {
    expect(await isPasskeyAvailable(null)).toBe(false);
    expect(await isPasskeyAvailable(make({ driver: { isSupported: () => false } }).driver)).toBe(false);
    expect(await isPasskeyAvailable(make({ driver: { isSupported: () => Promise.reject(new Error("x")) } }).driver)).toBe(false);
  });
  it("is true when the device supports passkeys", async () => {
    expect(await isPasskeyAvailable(make().driver)).toBe(true);
  });
});

describe("signInWithPasskey", () => {
  it("does nothing, and asks the server nothing, when passkeys are unavailable", async () => {
    const { server } = make();
    expect(await signInWithPasskey(null, server)).toEqual({ ok: false, reason: "unavailable" });
    expect(server.getOptions).not.toHaveBeenCalled();
  });

  it("runs challenge -> device signature -> verification, in that order", async () => {
    const { driver, server } = make();
    expect(await signInWithPasskey(driver, server)).toEqual({ ok: true });
    expect(driver!.get).toHaveBeenCalledWith(options);
    expect(server.verify).toHaveBeenCalledWith(assertion);
  });

  it("fails without touching the device when the server gives no challenge", async () => {
    const { driver, server } = make({ server: { getOptions: vi.fn().mockResolvedValue({ error: { status: 500 } }) } });
    expect(await signInWithPasskey(driver, server)).toEqual({ ok: false, reason: "failed" });
    expect(driver!.get).not.toHaveBeenCalled();
  });

  it("tells a cancelled prompt apart from a missing passkey and from other failures", async () => {
    for (const [thrown, reason] of [
      [{ error: "UserCancelled" }, "cancelled"],
      [{ error: "NoCredentials" }, "no-credentials"],
      [new Error("boom"), "failed"],
    ] as const) {
      const { driver, server } = make({ driver: { get: vi.fn().mockRejectedValue(thrown) } });
      expect(await signInWithPasskey(driver, server)).toEqual({ ok: false, reason });
      expect(server.verify).not.toHaveBeenCalled();
    }
  });

  it("fails when the server rejects the signed answer", async () => {
    const { driver, server } = make({ server: { verify: vi.fn().mockResolvedValue({ error: { status: 401 } }) } });
    expect(await signInWithPasskey(driver, server)).toEqual({ ok: false, reason: "failed" });
  });
});
