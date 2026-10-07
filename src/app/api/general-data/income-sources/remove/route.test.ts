import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/IncomeSource", () => ({ default: { findOne: vi.fn() } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";
import IncomeSource from "@/model/IncomeSource";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const sourceFindOne = (IncomeSource as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userFindOne.mockReturnValue({ lean: async () => ({ _id: "u1", wallet: "w1" }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST income-sources/remove", () => {
  it("archives the source and closes EVERY open history entry (bug 50)", async () => {
    const source = {
      name: "Salary",
      archived: false,
      active: true,
      history: [
        { amount: 1, effectiveTo: new Date(2026, 0, 1) as Date | null },
        { amount: 2, effectiveTo: null as Date | null },
        { amount: 3, effectiveTo: null as Date | null },
      ],
      save: vi.fn(async () => undefined),
    };
    sourceFindOne.mockResolvedValue(source);
    const res = await POST(req({ id: "s1" }));
    expect(source.archived).toBe(true);
    expect(source.active).toBe(false);
    expect(source.history.every((h) => h.effectiveTo instanceof Date)).toBe(true);
    expect(source.history[0].effectiveTo).toEqual(new Date(2026, 0, 1)); // an already closed entry is left alone
    expect((await res.json()).status).toBe(200); // bug 48
  });

  it("the error says 'remove' (bug 49)", async () => {
    await expect(POST(req({}))).rejects.toThrow("remove the income source");
  });
});
