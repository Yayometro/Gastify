import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Transaction", () => ({
  default: { findOneAndDelete: vi.fn() },
}));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import Transaction from "@/model/Transaction";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { POST } from "./route";

function mockRequest(headers = {}) {
  return {
    headers: new Headers(headers),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.api.getSession.mockResolvedValue({
    user: { email: "owner@example.com" },
  });
  User.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue({ _id: "user-123", wallet: "wallet-123" }),
  });
  Transaction.findOneAndDelete.mockResolvedValue({
    _id: "trans-1",
    name: "Grocery Store",
    amount: 150,
    wallet: "wallet-123",
  });
});

describe("remove-transaction/[id] route", () => {
  it("throws error when context or params is missing", async () => {
    await expect(POST(mockRequest(), undefined)).rejects.toThrow(
      /No params ID send to work on POST UPDATE TRANSACTION/
    );
  });

  it("throws error when id is empty or invalid", async () => {
    await expect(
      POST(mockRequest(), { params: { id: "" } })
    ).rejects.toThrow(/No params ID send to work on POST UPDATE TRANSACTION/);
  });

  it("throws error when no session exists", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);

    await expect(
      POST(mockRequest(), { params: { id: "trans-1" } })
    ).rejects.toThrow(/No session/);

    expect(Transaction.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("throws error when user is not found in database", async () => {
    User.findOne.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      POST(mockRequest(), { params: { id: "trans-1" } })
    ).rejects.toThrow(/User not found on REMOVE TRANSACTION/);

    expect(Transaction.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("scopes transaction deletion to the authenticated user wallet", async () => {
    const res = await POST(mockRequest(), { params: { id: "trans-1" } });
    const data = await res.json();

    expect(Transaction.findOneAndDelete).toHaveBeenCalledWith({
      _id: "trans-1",
      wallet: "wallet-123",
    });
    expect(data.ok).toBe(true);
    expect(data.status).toBe(201);
    expect(data.message).toBe("Transaction Grocery Store was removed 🤓");
    expect(data.data._id).toBe("trans-1");
  });

  it("handles Promise params correctly (Next.js 15+ App Router)", async () => {
    const res = await POST(mockRequest(), {
      params: Promise.resolve({ id: "trans-1" }),
    });
    const data = await res.json();

    expect(Transaction.findOneAndDelete).toHaveBeenCalledWith({
      _id: "trans-1",
      wallet: "wallet-123",
    });
    expect(data.ok).toBe(true);
    expect(data.status).toBe(201);
  });

  it("throws error when transaction is not found or not owned by user", async () => {
    Transaction.findOneAndDelete.mockResolvedValueOnce(null);

    await expect(
      POST(mockRequest(), { params: { id: "trans-nonexistent" } })
    ).rejects.toThrow(/Transaction could not be removed ❌/);
  });
});
