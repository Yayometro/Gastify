import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const created = vi.hoisted(() => ({ last: null as null | Record<string, unknown> }));
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/IncomeSource", () => ({
  default: function IncomeSourceMock(this: Record<string, unknown>, args: Record<string, unknown>) {
    Object.assign(this, args);
    created.last = args;
    this.save = async () => this;
  },
}));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import User from "@/model/User";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  created.last = null;
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userFindOne.mockReturnValue({ lean: async () => ({ _id: "u1", wallet: "w1" }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST income-sources/new (bug 47)", () => {
  it("stores the multi-currency money on the source and on its first history entry", async () => {
    await POST(req({ name: "Salary", amount: 500.5, currency: "MXN", recurrence: "monthly" }));
    const created_ = created.last as { money: unknown; history: Array<{ money: unknown }> };
    expect(created_.money).toEqual({ amountMinor: 50050, currency: "MXN" });
    expect(created_.history[0].money).toEqual({ amountMinor: 50050, currency: "MXN" });
  });

  it("leaves money off when the currency is missing or unsupported, as before", async () => {
    await POST(req({ name: "Salary", amount: 10 }));
    expect((created.last as Record<string, unknown>).money).toBeUndefined();
    await POST(req({ name: "Salary", amount: 10, currency: "XXX" }));
    expect((created.last as Record<string, unknown>).money).toBeUndefined();
  });
});
