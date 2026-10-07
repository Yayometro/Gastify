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

function makeSource() {
  return {
    name: "Salary",
    amount: 500,
    currency: "MXN",
    recurrence: "monthly",
    anchorDate: new Date(2026, 0, 1),
    active: true,
    history: [{ amount: 500, recurrence: "monthly", effectiveFrom: new Date(2026, 0, 1), effectiveTo: null }] as Array<{
      amount: number;
      recurrence: string;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    }>,
    save: vi.fn(async function (this: unknown) {
      return this;
    }),
  };
}

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userFindOne.mockReturnValue({ lean: async () => ({ _id: "u1", wallet: "w1" }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST income-sources/update", () => {
  it("can set the amount to exactly 0 and records it in the history (bugs 42 and 43)", async () => {
    const source = makeSource();
    sourceFindOne.mockResolvedValue(source);
    await POST(req({ id: "s1", amount: 0 }));
    expect(source.amount).toBe(0);
    expect(source.history).toHaveLength(2);
    expect(source.history[0].effectiveTo).toBeInstanceOf(Date);
    expect(source.history[1].amount).toBe(0);
  });

  it("keeps the current amount when none is sent, and does not add a history entry", async () => {
    const source = makeSource();
    sourceFindOne.mockResolvedValue(source);
    await POST(req({ id: "s1", name: "Salary 2" }));
    expect(source.amount).toBe(500);
    expect(source.name).toBe("Salary 2");
    expect(source.history).toHaveLength(1);
  });

  it("an unchanged amount is not a change", async () => {
    const source = makeSource();
    sourceFindOne.mockResolvedValue(source);
    await POST(req({ id: "s1", amount: 500 }));
    expect(source.history).toHaveLength(1);
  });
});
