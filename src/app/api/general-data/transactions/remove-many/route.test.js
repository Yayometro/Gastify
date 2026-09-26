import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Transaction", () => ({ default: { deleteMany: vi.fn() } }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

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
  auth.api.getSession.mockResolvedValue({
    user: { email: "test@example.com" },
  });
  User.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue({ _id: "user-123", wallet: "wallet-123" }),
  });
  Transaction.deleteMany.mockResolvedValue({
    acknowledged: true,
    deletedCount: 2,
  });
});

describe("remove-many route", () => {
  it("returns error response when no session exists", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);

    const res = await POST(mockRequest({ manyTrans: ["t1", "t2"] }));
    const data = await res.json();

    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/No session/);
    expect(Transaction.deleteMany).not.toHaveBeenCalled();
  });

  it("returns error response when user is not found", async () => {
    User.findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(null),
    });

    const res = await POST(mockRequest({ manyTrans: ["t1", "t2"] }));
    const data = await res.json();

    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/User not found/);
    expect(Transaction.deleteMany).not.toHaveBeenCalled();
  });

  it("scopes transaction deletion to the authenticated user wallet", async () => {
    const res = await POST(mockRequest({ manyTrans: ["t1", "t2"] }));
    const data = await res.json();

    expect(Transaction.deleteMany).toHaveBeenCalledWith({
      _id: { $in: ["t1", "t2"] },
      wallet: "wallet-123",
    });
    expect(data.ok).toBe(true);
    expect(data.status).toBe(200);
    expect(data.deletedCount).toBe(2);
    expect(data.message).toBe('"2" transactions removed successfully');
  });

  it("handles empty or missing manyTrans safely", async () => {
    Transaction.deleteMany.mockResolvedValueOnce({
      acknowledged: true,
      deletedCount: 0,
    });

    const res = await POST(mockRequest({}));
    const data = await res.json();

    expect(Transaction.deleteMany).toHaveBeenCalledWith({
      _id: { $in: [] },
      wallet: "wallet-123",
    });
    expect(data.ok).toBe(true);
    expect(data.deletedCount).toBe(0);
  });

  it("handles failure in deleteMany gracefully", async () => {
    Transaction.deleteMany.mockRejectedValueOnce(new Error("Database error"));

    const res = await POST(mockRequest({ manyTrans: ["t1"] }));
    const data = await res.json();

    expect(data.ok).toBe(false);
    expect(data.status).toBe(500);
    expect(data.error).toBe("Database error");
  });
});
