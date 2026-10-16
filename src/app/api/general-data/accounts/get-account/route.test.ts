import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Account", () => ({ default: { find: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";
import Account from "@/model/Account";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const accountFind = (Account as unknown as { find: ReturnType<typeof vi.fn> }).find;
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  userFindOne.mockReturnValue({ lean: async () => ({ _id: "u1", wallet: "w1" }) });
  accountFind.mockReturnValue({ sort: () => ({ lean: async () => [{ name: "Debit" }] }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST accounts/get-account", () => {
  it("refuses a request without a session and never touches the database", async () => {
    getSession.mockResolvedValue(null);
    await expect(POST(req("victim@example.com"))).rejects.toThrow();
    expect(userFindOne).not.toHaveBeenCalled();
    expect(accountFind).not.toHaveBeenCalled();
  });

  it("returns the accounts of the SESSION user, ignoring the mail in the body", async () => {
    getSession.mockResolvedValue({ user: { email: "me@example.com" } });
    const res = await POST(req("victim@example.com"));
    expect(userFindOne).toHaveBeenCalledWith({ mail: "me@example.com" });
    expect(accountFind).toHaveBeenCalledWith({ user: "u1", wallet: "w1" });
    const json = await (res as Response).json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([{ name: "Debit" }]);
  });
});
