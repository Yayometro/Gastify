import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Budget", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: {} }));
vi.mock("@/model/Account", () => ({ default: {} }));
vi.mock("@/model/Category", () => ({ default: {} }));
vi.mock("@/model/SubCategory", () => ({ default: {} }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/model/Transaction", () => ({
  default: { findOne: vi.fn(), findById: vi.fn() },
}));

import Transaction from "@/model/Transaction";
import Budget from "@/model/Budget";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body), headers: new Headers() };
}

function chainablePopulate(result) {
  const chain = {
    populate: vi.fn(() => chain),
    then: (resolve) => resolve(result),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.api.getSession.mockResolvedValue({ user: { email: "user@example.com" } });
  User.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue({ _id: "user-123", wallet: "wallet-123" }),
  });
});

describe("link-budget route", () => {
  it("throws when transactionId is not provided", async () => {
    await expect(POST(mockRequest({}))).rejects.toThrow(/Transaction id is required/);
  });

  it("throws when no session exists", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);

    await expect(
      POST(mockRequest({ transactionId: "trans-1" }))
    ).rejects.toThrow(/No session/);

    expect(Transaction.findOne).not.toHaveBeenCalled();
  });

  it("scopes transaction lookup to the authenticated user wallet", async () => {
    Transaction.findOne.mockResolvedValue(null);

    await expect(
      POST(mockRequest({ transactionId: "trans-1" }))
    ).rejects.toThrow(/Transaction was not found/);

    expect(Transaction.findOne).toHaveBeenCalledWith({
      _id: "trans-1",
      wallet: "wallet-123",
    });
  });

  it("links transaction to a project budget and populates relations", async () => {
    const mockTrans = {
      _id: "trans-1",
      user: "user-123",
      wallet: "wallet-123",
      budget: null,
      save: vi.fn().mockResolvedValue(true),
    };
    Transaction.findOne.mockResolvedValue(mockTrans);
    Budget.findOne.mockResolvedValue({
      _id: "budget-1",
      budgetType: "project",
    });
    Transaction.findById.mockReturnValue(
      chainablePopulate({ _id: "trans-1", budget: { _id: "budget-1" } })
    );

    const res = await POST(
      mockRequest({ transactionId: "trans-1", budgetId: "budget-1" })
    );
    const json = await res.json();

    expect(Budget.findOne).toHaveBeenCalledWith({
      _id: "budget-1",
      user: "user-123",
      wallet: "wallet-123",
      archived: { $ne: true },
    });
    expect(mockTrans.budget).toBe("budget-1");
    expect(mockTrans.save).toHaveBeenCalled();
    expect(json.ok).toBe(true);
    expect(json.status).toBe(201);
    expect(json.message).toBe("Movement added to project");
  });

  it("unlinks transaction when budgetId is null/empty", async () => {
    const mockTrans = {
      _id: "trans-1",
      user: "user-123",
      wallet: "wallet-123",
      budget: "budget-1",
      save: vi.fn().mockResolvedValue(true),
    };
    Transaction.findOne.mockResolvedValue(mockTrans);
    Transaction.findById.mockReturnValue(
      chainablePopulate({ _id: "trans-1", budget: null })
    );

    const res = await POST(
      mockRequest({ transactionId: "trans-1", budgetId: null })
    );
    const json = await res.json();

    expect(Budget.findOne).not.toHaveBeenCalled();
    expect(mockTrans.budget).toBeNull();
    expect(mockTrans.save).toHaveBeenCalled();
    expect(json.ok).toBe(true);
    expect(json.status).toBe(201);
    expect(json.message).toBe("Movement removed from project");
  });

  it("throws when linked budget is not found or not a project budget", async () => {
    const mockTrans = {
      _id: "trans-1",
      user: "user-123",
      wallet: "wallet-123",
      budget: null,
      save: vi.fn(),
    };
    Transaction.findOne.mockResolvedValue(mockTrans);
    Budget.findOne.mockResolvedValue({
      _id: "budget-1",
      budgetType: "spending",
    });

    await expect(
      POST(mockRequest({ transactionId: "trans-1", budgetId: "budget-1" }))
    ).rejects.toThrow(/Project budget was not found/);

    expect(mockTrans.save).not.toHaveBeenCalled();
  });
});
