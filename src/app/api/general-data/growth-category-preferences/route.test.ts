import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/requireVerifiedSession", () => ({ getVerifiedSession: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/GrowthCategoryPreference", () => ({ default: { find: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn() } }));

import { GET, POST, PUT } from "./route";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import User from "@/model/User";
import Category from "@/model/Category";
import GrowthCategoryPreference from "@/model/GrowthCategoryPreference";

const categoryId = "507f1f77bcf86cd799439011";
const request = (body?: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;
const withLean = (value: unknown) => ({ select: () => ({ lean: async () => value }) });
const mock = (value: unknown) => value as { [key: string]: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
  (getVerifiedSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { email: "me@example.com" } });
  mock(User).findOne.mockReturnValue(withLean({ _id: "user", wallet: "wallet" }));
  mock(Category).findOne.mockReturnValue(withLean({ _id: categoryId }));
  mock(GrowthCategoryPreference).find.mockReturnValue(withLean([]));
});

describe("growth category preferences", () => {
  it("requires a verified session before reading preferences", async () => {
    (getVerifiedSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mock(User).findOne).not.toHaveBeenCalled();
  });

  it("rejects a category outside the caller's wallet", async () => {
    mock(Category).findOne.mockReturnValue(withLean(null));
    const response = await PUT(request({ categoryId, reductionPercent: 25 }));
    expect(response.status).toBe(404);
    expect(mock(Category).findOne).toHaveBeenCalledWith({ _id: categoryId, $or: [{ isDefaultCatego: true }, { user: "user", wallet: "wallet" }] });
    expect(mock(GrowthCategoryPreference).updateOne).not.toHaveBeenCalled();
  });

  it("upserts one wallet-scoped intention through the mobile POST alias", async () => {
    const response = await POST(request({ categoryId, reductionPercent: 25 }));
    expect(response.status).toBe(200);
    expect(mock(GrowthCategoryPreference).updateOne).toHaveBeenCalledWith(
      { wallet: "wallet", category: categoryId },
      { $set: { reductionPercent: 25 } },
      { upsert: true, runValidators: true }
    );
  });

  it("removes a preference when the user saves zero percent", async () => {
    await PUT(request({ categoryId, reductionPercent: 0 }));
    expect(mock(GrowthCategoryPreference).deleteOne).toHaveBeenCalledWith({ wallet: "wallet", category: categoryId });
  });

  it("rejects invalid percentages without touching the database preference", async () => {
    const response = await PUT(request({ categoryId, reductionPercent: 101 }));
    expect(response.status).toBe(400);
    expect(mock(GrowthCategoryPreference).updateOne).not.toHaveBeenCalled();
  });
});
