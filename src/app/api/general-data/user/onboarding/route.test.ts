import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn(), updateOne: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";

const api = auth.api as unknown as { getSession: ReturnType<typeof vi.fn> };
const userModel = User as unknown as { findOne: ReturnType<typeof vi.fn>; updateOne: ReturnType<typeof vi.fn> };

const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;
const record = (overrides: Record<string, unknown> = {}) => ({ sessions: 1, lastSessionId: "s-1", tutorial: "pending", progress: null, ...overrides });
const hasUser = (onboarding?: unknown) => userModel.findOne.mockReturnValue({ select: () => ({ lean: async () => ({ _id: "u1", onboarding }) }) });
const written = () => userModel.updateOne.mock.calls.map((call) => call[1].$set.onboarding);

beforeEach(() => {
  vi.clearAllMocks();
  api.getSession.mockResolvedValue({ user: { email: "me@example.com" }, session: { id: "s-2" } });
  userModel.updateOne.mockResolvedValue({ matchedCount: 1 });
  hasUser(record());
});

describe("POST /api/general-data/user/onboarding", () => {
  it("answers 401 without a session, and 400 for an action it does not know", async () => {
    api.getSession.mockResolvedValue(null);
    expect((await POST(req({ action: "state" }))).status).toBe(401);
    api.getSession.mockResolvedValue({ user: { email: "me@example.com" }, session: { id: "s-2" } });
    expect((await POST(req({ action: "explode" }))).status).toBe(400);
    expect((await POST(req(undefined))).status).toBe(400);
    expect(userModel.updateOne).not.toHaveBeenCalled();
  });

  it("always works on the account of the session, looked up by its email", async () => {
    await POST(req({ action: "state", mail: "someone-else@example.com" }));
    expect(userModel.findOne).toHaveBeenCalledWith({ mail: "me@example.com" });
  });

  it("reads the record, or null for an account from before the tutorial", async () => {
    const withRecord = await (await POST(req({ action: "state" }))).json();
    expect(withRecord.onboarding).toMatchObject({ sessions: 1, tutorial: "pending" });
    hasUser(undefined);
    expect((await (await POST(req({ action: "state" }))).json()).onboarding).toBeNull();
  });

  describe("visit", () => {
    it("counts a new session and says what to do: the welcome in the first one", async () => {
      hasUser(record({ sessions: 0, lastSessionId: null }));
      const body = await (await POST(req({ action: "visit" }))).json();
      expect(body.action).toBe("welcome");
      expect(written()).toEqual([{ sessions: 1, lastSessionId: "s-2", tutorial: "pending", progress: null }]);
      // The write is conditional on the session that was counted last.
      expect(userModel.updateOne.mock.calls[0][0]).toEqual({ _id: "u1", "onboarding.lastSessionId": null });
    });

    it("offers to resume in the second session when the tutorial was left half way", async () => {
      hasUser(record({ progress: { tour: "budgets", step: "budgets.projects" } }));
      const body = await (await POST(req({ action: "visit" }))).json();
      expect(body.action).toBe("resume");
      expect(body.onboarding.sessions).toBe(2);
    });

    it("does nothing in the third session", async () => {
      hasUser(record({ sessions: 2, lastSessionId: "s-1" }));
      expect((await (await POST(req({ action: "visit" }))).json()).action).toBe("none");
    });

    it("does not count the same session twice", async () => {
      hasUser(record({ lastSessionId: "s-2" }));
      const body = await (await POST(req({ action: "visit" }))).json();
      expect(body.action).toBe("none");
      expect(userModel.updateOne).not.toHaveBeenCalled();
    });

    it("does nothing more when another tab already counted the session", async () => {
      userModel.updateOne.mockResolvedValue({ matchedCount: 0 });
      hasUser(record({ sessions: 0, lastSessionId: null }));
      expect((await (await POST(req({ action: "visit" }))).json()).action).toBe("none");
    });

    it("tells an account from before the tutorial about it, without writing anything", async () => {
      hasUser(undefined);
      const body = await (await POST(req({ action: "visit" }))).json();
      expect(body.action).toBe("announce");
      expect(userModel.updateOne).not.toHaveBeenCalled();
    });
  });

  describe("progress", () => {
    it("keeps the last card shown while the tutorial is pending", async () => {
      await POST(req({ action: "progress", tour: "movements", step: "movements.list" }));
      expect(written()).toEqual([record({ progress: { tour: "movements", step: "movements.list" } })]);
    });

    it("refuses a card that does not exist, and does not write", async () => {
      expect((await POST(req({ action: "progress", tour: "movements", step: "budgets.savings" }))).status).toBe(400);
      expect((await POST(req({ action: "progress", tour: "nope", step: "x" }))).status).toBe(400);
      expect(userModel.updateOne).not.toHaveBeenCalled();
    });

    it("does not start a record for an older account, nor change a finished tutorial", async () => {
      hasUser(undefined);
      await POST(req({ action: "progress", tour: "movements", step: "movements.list" }));
      hasUser(record({ tutorial: "done" }));
      await POST(req({ action: "progress", tour: "movements", step: "movements.list" }));
      expect(userModel.updateOne).not.toHaveBeenCalled();
    });
  });

  describe("complete, dismiss and announce", () => {
    it("complete marks the tutorial done and forgets the progress", async () => {
      hasUser(record({ progress: { tour: "budgets", step: "budgets.projects" } }));
      await POST(req({ action: "complete" }));
      expect(written()).toEqual([record({ tutorial: "done", progress: null })]);
    });

    it("dismiss marks it dismissed, also for an account that had no record", async () => {
      await POST(req({ action: "dismiss" }));
      hasUser(undefined);
      await POST(req({ action: "dismiss" }));
      expect(written()).toEqual([record({ tutorial: "dismissed" }), { sessions: 0, lastSessionId: null, tutorial: "dismissed", progress: null }]);
    });

    it("announce saves an older account as dismissed once, and leaves the others alone", async () => {
      hasUser(undefined);
      await POST(req({ action: "announce" }));
      expect(written()).toEqual([{ sessions: 0, lastSessionId: null, tutorial: "dismissed", progress: null }]);
      userModel.updateOne.mockClear();
      hasUser(record());
      await POST(req({ action: "announce" }));
      expect(userModel.updateOne).not.toHaveBeenCalled();
    });
  });
});
