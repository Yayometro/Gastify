import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findOneAndDelete: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";
import SubCategory from "@/model/SubCategory";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const subDelete = (SubCategory as unknown as { findOneAndDelete: ReturnType<typeof vi.fn> }).findOneAndDelete;
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userFindOne.mockReturnValue({ lean: async () => ({ _id: "u1", wallet: "w1" }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST /api/general-data/subcategory/remove", () => {
  it("removes a sub-category of the caller's own wallet", async () => {
    subDelete.mockReturnValue({ lean: async () => ({ _id: "s1", name: "Coffee" }) });
    const res = await POST(req("s1"));
    expect(subDelete).toHaveBeenCalledWith({ _id: "s1", wallet: "w1" });
    expect((await res.json()).message).toContain("Coffee");
  });

  // Bug 9: with nothing deleted the route read `removeSub.name` on null and
  // failed with "Cannot read properties of null" instead of its own message.
  it("when nothing was removed it fails with the intended message, not a TypeError", async () => {
    subDelete.mockReturnValue({ lean: async () => null });
    await expect(POST(req("missing"))).rejects.toThrow("SubCategory not removed");
    await expect(POST(req("missing"))).rejects.not.toThrow(/Cannot read properties/);
  });
});
