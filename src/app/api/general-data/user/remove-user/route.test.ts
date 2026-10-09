import { describe, it, expect, vi, beforeEach } from "vitest";

const deleteMany = vi.fn();
const collection = vi.fn((name: string) => ({
  deleteMany: (filter: unknown, options?: unknown) => deleteMany(name, filter, options),
}));
const dbSession = { id: "tx-session" };
const endSession = vi.fn();
// withTransaction just runs the callback once; `inTransaction` lets the tests
// see whether a delete ran inside it.
let inTransaction = false;
const withTransaction = vi.fn(async (fn: () => Promise<void>) => {
  inTransaction = true;
  try {
    await fn();
  } finally {
    inTransaction = false;
  }
});
const startSession = vi.fn(async () => ({ ...dbSession, withTransaction, endSession }));

vi.mock("mongoose", () => ({
  default: { connection: { collection: (name: string) => collection(name) }, startSession: () => startSession() },
}));
vi.mock("better-auth/api", () => ({
  isAPIError: (e: unknown) => (e as { name?: string })?.name === "APIError",
}));
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn(), verifyTOTP: vi.fn(), verifyBackupCode: vi.fn() } },
  countUserPasskeys: vi.fn(),
}));
vi.mock("@/lib/auth/deleteAccountGuard", () => ({
  getDeleteAccountLockRemainingMs: vi.fn(),
  recordDeleteAccountFailure: vi.fn(),
}));

const userDoc = {
  _id: "u1",
  fullName: "Test User",
  mail: "test@example.com",
  password: "legacy-hash",
  apiTokens: [{ name: "Claude", tokenHash: "abc" }],
  toObject() {
    return { _id: "u1", fullName: "Test User", mail: "test@example.com", password: "legacy-hash", apiTokens: this.apiTokens };
  },
};
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn(), findOneAndDelete: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/Account", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/Transaction", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/Budget", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/CategoryRule", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/IncomeSource", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/ProjectionBaseline", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/model/ProjectionSettings", () => ({ default: { deleteMany: vi.fn() } }));

import { POST } from "./route";
import { auth, countUserPasskeys } from "@/lib/auth/betterAuth";
import { getDeleteAccountLockRemainingMs, recordDeleteAccountFailure } from "@/lib/auth/deleteAccountGuard";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import Transaction from "@/model/Transaction";
import Account from "@/model/Account";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Budget from "@/model/Budget";
import CategoryRule from "@/model/CategoryRule";
import IncomeSource from "@/model/IncomeSource";
import ProjectionBaseline from "@/model/ProjectionBaseline";
import ProjectionSettings from "@/model/ProjectionSettings";

const api = auth.api as unknown as {
  getSession: ReturnType<typeof vi.fn>;
  verifyTOTP: ReturnType<typeof vi.fn>;
  verifyBackupCode: ReturnType<typeof vi.fn>;
};
const passkeyCount = countUserPasskeys as unknown as ReturnType<typeof vi.fn>;
const lockMs = getDeleteAccountLockRemainingMs as unknown as ReturnType<typeof vi.fn>;
const recordFailure = recordDeleteAccountFailure as unknown as ReturnType<typeof vi.fn>;
const userFind = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const userDelete = (User as unknown as { findOneAndDelete: ReturnType<typeof vi.fn> }).findOneAndDelete;
const walletDelete = (Wallet as unknown as { deleteMany: ReturnType<typeof vi.fn> }).deleteMany;
const txDelete = (Transaction as unknown as { deleteMany: ReturnType<typeof vi.fn> }).deleteMany;

function req(body: unknown) {
  return { headers: new Headers(), json: async () => body } as unknown as Request;
}
const goodBody = { code: "123456", confirmMail: "test@example.com" };
const apiError = () => Object.assign(new Error("INVALID_CODE"), { name: "APIError" });

beforeEach(() => {
  vi.clearAllMocks();
  deleteMany.mockReset();
  inTransaction = false;
  api.getSession.mockResolvedValue({
    user: { email: "test@example.com", twoFactorEnabled: true },
    session: { token: "tok1" },
  });
  passkeyCount.mockResolvedValue(0);
  api.verifyTOTP.mockResolvedValue({ status: true });
  api.verifyBackupCode.mockResolvedValue({ status: true });
  lockMs.mockResolvedValue(0);
  recordFailure.mockResolvedValue({ locked: false, attemptsLeft: 4 });
  userFind.mockResolvedValue(userDoc);
  userDelete.mockResolvedValue(userDoc);
  walletDelete.mockResolvedValue({ deletedCount: 1 });
  txDelete.mockResolvedValue({ deletedCount: 3 });
  for (const model of [Account, Category, SubCategory, Tag, Budget, CategoryRule, IncomeSource, ProjectionBaseline, ProjectionSettings]) {
    (model as unknown as { deleteMany: ReturnType<typeof vi.fn> }).deleteMany.mockResolvedValue({ deletedCount: 1 });
  }
});

async function json(res: Response) {
  return (await res.json()) as Record<string, unknown>;
}

describe("POST /api/general-data/user/remove-user", () => {
  it("rejects a request with no session and deletes nothing", async () => {
    api.getSession.mockResolvedValue(null);
    const res = await POST(req(goodBody));
    expect(res.status).toBe(401);
    expect(userDelete).not.toHaveBeenCalled();
  });

  describe("account with only passkeys (no TOTP)", () => {
    const passkeySession = (stepUpVerifiedAt?: Date) => ({
      user: { id: "u1", email: "test@example.com", twoFactorEnabled: false },
      session: { token: "tok1", stepUpVerifiedAt },
    });
    const emailOnly = { confirmMail: "test@example.com" };

    it("deletes with a fresh passkey verification and the retyped email, without asking for a code", async () => {
      passkeyCount.mockResolvedValue(1);
      api.getSession.mockResolvedValue(passkeySession(new Date(Date.now() - 60 * 1000)));
      const res = await POST(req(emailOnly));
      expect(res.status).toBe(200);
      expect(api.verifyTOTP).not.toHaveBeenCalled();
      expect(userDelete).toHaveBeenCalled();
    });

    it("asks to verify the passkey again when the proof is stale or missing", async () => {
      passkeyCount.mockResolvedValue(1);
      for (const stamp of [undefined, new Date(Date.now() - 60 * 60 * 1000)]) {
        api.getSession.mockResolvedValue(passkeySession(stamp));
        const res = await POST(req(emailOnly));
        expect(res.status).toBe(403);
        expect((await json(res)).code).toBe("STEP_UP_REQUIRED");
      }
      expect(userDelete).not.toHaveBeenCalled();
    });

    it("still requires the email to match", async () => {
      passkeyCount.mockResolvedValue(1);
      api.getSession.mockResolvedValue(passkeySession(new Date()));
      const res = await POST(req({ confirmMail: "other@example.com" }));
      expect(res.status).toBe(400);
      expect(userDelete).not.toHaveBeenCalled();
    });

    it("refuses an account with no factor at all", async () => {
      passkeyCount.mockResolvedValue(0);
      api.getSession.mockResolvedValue(passkeySession(new Date()));
      const res = await POST(req(emailOnly));
      expect(res.status).toBe(403);
      expect(userDelete).not.toHaveBeenCalled();
    });
  });

  it("refuses accounts without an authenticator app (TOTP) enabled", async () => {
    api.getSession.mockResolvedValue({ user: { email: "test@example.com", twoFactorEnabled: false }, session: { token: "t" } });
    const res = await POST(req(goodBody));
    expect(res.status).toBe(403);
    expect(api.verifyTOTP).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("requires a code", async () => {
    const res = await POST(req({ confirmMail: "test@example.com" }));
    expect(res.status).toBe(400);
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("requires the typed email to match the account email (case-insensitive)", async () => {
    const bad = await POST(req({ code: "123456", confirmMail: "other@example.com" }));
    expect(bad.status).toBe(400);
    expect(api.verifyTOTP).not.toHaveBeenCalled();
    const ok = await POST(req({ code: "123456", confirmMail: "  TEST@Example.com " }));
    expect(ok.status).toBe(200);
  });

  it("returns 429 while the session is locked and never checks the code", async () => {
    lockMs.mockResolvedValue(10 * 60 * 1000);
    const res = await POST(req(goodBody));
    expect(res.status).toBe(429);
    expect((await json(res)).retryAfterMinutes).toBe(10);
    expect(api.verifyTOTP).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("wrong code: 401, counts the failure, deletes nothing", async () => {
    api.verifyTOTP.mockRejectedValue(apiError());
    const res = await POST(req(goodBody));
    expect(res.status).toBe(401);
    expect((await json(res)).attemptsLeft).toBe(4);
    expect(recordFailure).toHaveBeenCalledWith("tok1");
    expect(userDelete).not.toHaveBeenCalled();
    expect(txDelete).not.toHaveBeenCalled();
  });

  it("the failure that triggers the lock answers 429", async () => {
    api.verifyTOTP.mockRejectedValue(apiError());
    recordFailure.mockResolvedValue({ locked: true, attemptsLeft: 0 });
    const res = await POST(req(goodBody));
    expect(res.status).toBe(429);
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("a non-API error while verifying is not treated as a wrong code", async () => {
    api.verifyTOTP.mockRejectedValue(new Error("database exploded"));
    await expect(POST(req(goodBody))).rejects.toThrow();
    expect(recordFailure).not.toHaveBeenCalled();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("correct TOTP code deletes the user and ALL their data, including the twoFactor collection", async () => {
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    expect(api.verifyTOTP).toHaveBeenCalledWith(expect.objectContaining({ body: { code: "123456" } }));
    expect(api.verifyBackupCode).not.toHaveBeenCalled();
    expect(userFind).toHaveBeenCalledWith({ mail: "test@example.com" });
    expect(userDelete).toHaveBeenCalledWith({ _id: "u1" }, { session: expect.objectContaining({ id: "tx-session" }) });
    expect(txDelete).toHaveBeenCalledWith({ user: "u1" });
    const cleaned = deleteMany.mock.calls.map((c) => c[0]);
    expect(cleaned).toEqual(["passkey", "account", "twoFactor", "session"]);
    deleteMany.mock.calls.forEach((c) => expect(c[1]).toEqual({ userId: "u1" }));
  });

  // Bug 121: the cascade is not atomic, so nothing that gives access to the
  // account may be touched until all the plain data is gone.
  it("deletes credentials, TOTP, sessions and the user document inside ONE transaction, after the data", async () => {
    const order: string[] = [];
    txDelete.mockImplementation(async () => {
      order.push("data:transactions");
      return { deletedCount: 1 };
    });
    deleteMany.mockImplementation(async (name: string) => {
      order.push(`${inTransaction ? "tx" : "NO-TX"}:${name}`);
      return { deletedCount: 1 };
    });
    userDelete.mockImplementation(async () => {
      order.push(`${inTransaction ? "tx" : "NO-TX"}:user`);
      return userDoc;
    });
    await POST(req(goodBody));
    expect(order).toEqual(["data:transactions", "tx:passkey", "tx:account", "tx:twoFactor", "tx:session", "tx:user"]);
    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("if deleting the plain data fails halfway, the account is left fully usable so the person can retry", async () => {
    (Tag as unknown as { deleteMany: ReturnType<typeof vi.fn> }).deleteMany.mockRejectedValue(new Error("db hiccup"));
    await expect(POST(req(goodBody))).rejects.toThrow();
    expect(startSession).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled(); // no passkey / account / twoFactor / session touched
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("if the final transaction fails, the session is still closed and the error is not swallowed", async () => {
    userDelete.mockRejectedValue(new Error("tx aborted"));
    await expect(POST(req(goodBody))).rejects.toThrow();
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("an account with no wallet or no data can still be deleted (these used to throw 'Wallet not removed')", async () => {
    walletDelete.mockResolvedValue({ deletedCount: 0 });
    txDelete.mockResolvedValue({ deletedCount: 0 });
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    expect(userDelete).toHaveBeenCalled();
  });

  it("also deletes budgets, category rules, income sources and projections (they used to be left behind as orphans)", async () => {
    const res = await POST(req(goodBody));
    expect(res.status).toBe(200);
    for (const model of [Budget, CategoryRule, IncomeSource, ProjectionBaseline, ProjectionSettings]) {
      expect((model as unknown as { deleteMany: ReturnType<typeof vi.fn> }).deleteMany).toHaveBeenCalledWith({ user: "u1" });
    }
  });

  it("does not touch any of those collections when the code is wrong", async () => {
    api.verifyTOTP.mockRejectedValue(apiError());
    await POST(req(goodBody));
    for (const model of [Budget, CategoryRule, IncomeSource, ProjectionBaseline, ProjectionSettings]) {
      expect((model as unknown as { deleteMany: ReturnType<typeof vi.fn> }).deleteMany).not.toHaveBeenCalled();
    }
  });

  it("a backup code is verified with verifyBackupCode and never opens a new session", async () => {
    const res = await POST(req({ ...goodBody, method: "backup", code: "abcd-efgh" }));
    expect(res.status).toBe(200);
    expect(api.verifyBackupCode).toHaveBeenCalledWith(
      expect.objectContaining({ body: { code: "abcd-efgh", disableSession: true } })
    );
    expect(api.verifyTOTP).not.toHaveBeenCalled();
  });

  it("deletes the SESSION user even if the body tries to name another one", async () => {
    await POST(req({ ...goodBody, mail: "victim@example.com", user: "someone-else" }));
    expect(userFind).toHaveBeenCalledWith({ mail: "test@example.com" });
    expect(userFind).not.toHaveBeenCalledWith({ mail: "victim@example.com" });
  });

  it("never sends the password hash or the api tokens back", async () => {
    const res = await POST(req(goodBody));
    const body = await json(res);
    const data = body.data as Record<string, unknown>;
    expect(data).not.toHaveProperty("password");
    expect(data).not.toHaveProperty("apiTokens");
    expect(data.mail).toBe("test@example.com");
    expect(String(body.message)).toContain("Test User");
  });
});
