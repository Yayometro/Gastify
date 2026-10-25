import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
  countUserPasskeys: vi.fn(),
}));

import { GET } from "./route";
import { auth, countUserPasskeys } from "@/lib/auth/betterAuth";
import { STEP_UP_TTL_MS } from "@/lib/auth/stepUpConfig";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const passkeyCount = countUserPasskeys as unknown as ReturnType<typeof vi.fn>;
const req = () => ({ headers: new Headers() }) as unknown as Request;
const user = { id: "u1", email: "me@example.com", name: "Me", twoFactorEnabled: true };

beforeEach(() => {
  vi.clearAllMocks();
  passkeyCount.mockResolvedValue(0);
});

describe("GET /api/session-status", () => {
  it("answers signedIn:false (not an error) without a session", async () => {
    getSession.mockResolvedValue(null);
    const body = await (await GET(req())).json();
    expect(body).toEqual({ ok: true, signedIn: false });
  });

  it("reports a session that never passed a second factor", async () => {
    getSession.mockResolvedValue({ user, session: {} });
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ signedIn: true, stepUp: "never-verified", hasTwoFactor: true, hasPasskey: false, email: "me@example.com" });
  });

  it("reports fresh when the proof is recent, idle when it is older than the window", async () => {
    getSession.mockResolvedValue({ user, session: { stepUpVerifiedAt: new Date() } });
    expect((await (await GET(req())).json()).stepUp).toBe("fresh");

    getSession.mockResolvedValue({ user, session: { stepUpVerifiedAt: new Date(Date.now() - STEP_UP_TTL_MS - 5000) } });
    expect((await (await GET(req())).json()).stepUp).toBe("idle");
  });

  it("reports a passkey as a second factor even without an authenticator app", async () => {
    passkeyCount.mockResolvedValue(2);
    getSession.mockResolvedValue({ user: { ...user, twoFactorEnabled: false }, session: {} });
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ hasTwoFactor: false, hasPasskey: true });
  });

  it("does not leak anything beyond the caller's own basics", async () => {
    getSession.mockResolvedValue({ user: { ...user, password: "x", apiTokens: [1] }, session: { token: "secret", stepUpVerifiedAt: new Date() } });
    const body = await (await GET(req())).json();
    expect(Object.keys(body).sort()).toEqual(["email", "hasPasskey", "hasTwoFactor", "name", "ok", "signedIn", "stepUp"]);
  });
});
