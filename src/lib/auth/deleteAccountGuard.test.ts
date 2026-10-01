import { describe, it, expect, vi, beforeEach } from "vitest";

const store: { doc: Record<string, unknown> | null } = { doc: null };
const updateOne = vi.fn(async (_filter: unknown, update: Record<string, Record<string, unknown>>) => {
  if (!store.doc) return;
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) store.doc[k] = ((store.doc[k] as number) || 0) + (v as number);
  }
  if (update.$set) Object.assign(store.doc, update.$set);
});
const findOne = vi.fn(async () => store.doc);

vi.mock("mongoose", () => ({
  default: { connection: { collection: () => ({ updateOne, findOne }) } },
}));
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));

import {
  getDeleteAccountLockRemainingMs,
  recordDeleteAccountFailure,
  MAX_DELETE_ACCOUNT_FAILURES,
  DELETE_ACCOUNT_LOCK_MS,
} from "./deleteAccountGuard";

beforeEach(() => {
  vi.clearAllMocks();
  store.doc = { token: "tok1" };
});

describe("deleteAccountGuard", () => {
  it("a fresh session is not locked", async () => {
    expect(await getDeleteAccountLockRemainingMs("tok1")).toBe(0);
  });

  it("counts failures and reports the attempts left", async () => {
    const first = await recordDeleteAccountFailure("tok1");
    expect(first).toEqual({ locked: false, attemptsLeft: MAX_DELETE_ACCOUNT_FAILURES - 1 });
    const second = await recordDeleteAccountFailure("tok1");
    expect(second).toEqual({ locked: false, attemptsLeft: MAX_DELETE_ACCOUNT_FAILURES - 2 });
  });

  it("locks the session on the last allowed failure and resets the counter", async () => {
    let result = { locked: false, attemptsLeft: 0 };
    for (let i = 0; i < MAX_DELETE_ACCOUNT_FAILURES; i++) result = await recordDeleteAccountFailure("tok1");
    expect(result.locked).toBe(true);
    expect(store.doc?.deleteAccountFailedAttempts).toBe(0);
    const remaining = await getDeleteAccountLockRemainingMs("tok1");
    expect(remaining).toBeGreaterThan(DELETE_ACCOUNT_LOCK_MS - 5000);
    expect(remaining).toBeLessThanOrEqual(DELETE_ACCOUNT_LOCK_MS);
  });

  it("an expired lock no longer blocks", async () => {
    store.doc = { token: "tok1", deleteAccountLockedUntil: new Date(Date.now() - 1000) };
    expect(await getDeleteAccountLockRemainingMs("tok1")).toBe(0);
  });
});
