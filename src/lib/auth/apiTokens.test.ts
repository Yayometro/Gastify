import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: () => ({ lean: async () => ({ _id: "w1" }) }) } }));

import { getUserFromApiToken, resolveApiToken, hashApiToken } from "./apiTokens";
import User from "@/model/User";

const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const request = (authorization?: string) => ({ headers: new Headers(authorization ? { authorization } : {}) }) as unknown as Request;

beforeEach(() => vi.clearAllMocks());

describe("getUserFromApiToken (bug 78)", () => {
  it("accepts more than one space between the scheme and the token", async () => {
    const token = "abc123";
    const doc = { wallet: "w1", apiTokens: [{ tokenHash: hashApiToken(token), lastUsedAt: null }], save: vi.fn() };
    userFindOne.mockResolvedValue(doc);
    await expect(getUserFromApiToken(request(`Bearer   ${token}`))).resolves.toBeTruthy();
    await expect(getUserFromApiToken(request(`Bearer ${token}`))).resolves.toBeTruthy();
  });
  it("still rejects a missing or non-Bearer header", async () => {
    await expect(getUserFromApiToken(request())).rejects.toThrow("Missing or malformed");
    await expect(getUserFromApiToken(request("Basic abc"))).rejects.toThrow("Missing or malformed");
    await expect(getUserFromApiToken(request("Bearer"))).rejects.toThrow("Missing or malformed");
  });
});

describe("resolveApiToken (bug 79)", () => {
  it("a token that disappears between the lookup and the update is an invalid token, not a TypeError", async () => {
    userFindOne.mockResolvedValue({ wallet: "w1", apiTokens: [], save: vi.fn() });
    await expect(resolveApiToken("abc")).rejects.toThrow("Invalid API token");
  });
});
