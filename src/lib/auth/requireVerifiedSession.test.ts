import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
  recordSessionActivity: vi.fn(),
}));

import { auth, recordSessionActivity } from "./betterAuth";
import { STEP_UP_TTL_MS } from "./stepUpConfig";

// The test setup file replaces this module with a pass-through for the route tests; here we want the real one.
const { getVerifiedSession } = await vi.importActual<typeof import("./requireVerifiedSession")>("./requireVerifiedSession");

const getSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const record = recordSessionActivity as unknown as ReturnType<typeof vi.fn>;
const headers = new Headers();
const session = (extra: Record<string, unknown>) => ({ user: { email: "me@example.com" }, session: { token: "tok", ...extra } });

beforeEach(() => {
  vi.clearAllMocks();
  record.mockResolvedValue(undefined);
});

describe("getVerifiedSession", () => {
  it("returns null without a session", async () => {
    getSession.mockResolvedValue(null);
    expect(await getVerifiedSession(headers)).toBeNull();
    expect(record).not.toHaveBeenCalled();
  });

  it("returns null for a signed-in session that never proved a second factor", async () => {
    getSession.mockResolvedValue(session({}));
    expect(await getVerifiedSession(headers)).toBeNull();
  });

  it("returns null once the session has been idle past the window", async () => {
    getSession.mockResolvedValue(session({ stepUpVerifiedAt: new Date(Date.now() - STEP_UP_TTL_MS - 5000) }));
    expect(await getVerifiedSession(headers)).toBeNull();
    expect(record).not.toHaveBeenCalled();
  });

  it("returns the session for a fresh proof and does not write on every request", async () => {
    const s = session({ stepUpVerifiedAt: new Date() });
    getSession.mockResolvedValue(s);
    expect(await getVerifiedSession(headers)).toBe(s);
    expect(record).not.toHaveBeenCalled();
  });

  it("records activity (keyed by the session token) when the last one is old enough", async () => {
    const s = session({ stepUpVerifiedAt: new Date(Date.now() - 5 * 60 * 1000) });
    getSession.mockResolvedValue(s);
    expect(await getVerifiedSession(headers)).toBe(s);
    expect(record).toHaveBeenCalledWith("tok");
  });

  it("a failing activity write never fails the request", async () => {
    const s = session({ stepUpVerifiedAt: new Date(Date.now() - 5 * 60 * 1000) });
    getSession.mockResolvedValue(s);
    record.mockRejectedValue(new Error("db down"));
    expect(await getVerifiedSession(headers)).toBe(s);
  });
});
