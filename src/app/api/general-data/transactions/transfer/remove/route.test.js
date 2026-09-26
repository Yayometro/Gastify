import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const { fakeSession } = vi.hoisted(() => {
  const fakeSession = {
    withTransaction: vi.fn(async (fn) => fn()),
    endSession: vi.fn(async () => {}),
  };
  return { fakeSession };
});
vi.mock("@/model/Transaction", () => ({
  default: { find: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: { ...actual.default, startSession: vi.fn(async () => fakeSession) },
  };
});

import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { POST } from "./route";

function mockRequest(body, headers = {}) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeSession.withTransaction.mockImplementation(async (fn) => fn());
  auth.api.getSession.mockResolvedValue({
    user: { email: "test@example.com" },
  });
  User.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue({ _id: "user-123", wallet: "wallet-123" }),
  });
});

describe("transfer/remove", () => {
  it("rejects when no session exists", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);

    const res = await POST(mockRequest({ transferGroupId: "grp1" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/No session/);
    expect(Transaction.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects when user is not found", async () => {
    User.findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(null),
    });

    const res = await POST(mockRequest({ transferGroupId: "grp1" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/User not found/);
    expect(Transaction.deleteMany).not.toHaveBeenCalled();
  });

  it("removes both legs together inside one transaction scoped to the user wallet", async () => {
    Transaction.find.mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ _id: "leg1" }, { _id: "leg2" }]),
    });
    Transaction.deleteMany.mockResolvedValue({ deletedCount: 2 });

    const res = await POST(mockRequest({ transferGroupId: "grp1" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.data.deletedIds).toEqual(["leg1", "leg2"]);
    expect(Transaction.find).toHaveBeenCalledWith({
      transferGroupId: "grp1",
      wallet: "wallet-123",
    });
    expect(Transaction.deleteMany).toHaveBeenCalledWith(
      { transferGroupId: "grp1", wallet: "wallet-123" },
      { session: fakeSession }
    );
    expect(fakeSession.withTransaction).toHaveBeenCalledTimes(1);
  });

  it("rejects when no legs are found for the given transferGroupId in the user wallet", async () => {
    Transaction.find.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

    const res = await POST(mockRequest({ transferGroupId: "missing" }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/No transfer\/exchange found/);
    expect(Transaction.deleteMany).not.toHaveBeenCalled();
  });
});
