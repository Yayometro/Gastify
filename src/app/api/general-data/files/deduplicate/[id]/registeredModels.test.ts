import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";

// The route populates category / subCategory / account / tags, so those
// models must be registered in Mongoose by the time it runs. Other models are
// mocked on purpose (Transaction would otherwise pull in some of them), so
// only the route's OWN imports can register these four.
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: {} }));
vi.mock("@/model/User", () => ({ default: {} }));
vi.mock("@/model/Transaction", () => ({ default: {} }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));

describe("files/deduplicate/[id] route", () => {
  it("registers every model it populates (bug 156)", async () => {
    await import("./route");
    expect(mongoose.modelNames()).toEqual(expect.arrayContaining(["Category", "SubCategory", "Account", "Tag"]));
  });
});
