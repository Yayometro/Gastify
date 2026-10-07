import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/auth/betterAuth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { POST } from "./route";
import { auth } from "@/lib/auth/betterAuth";
import Wallet from "@/model/Wallet";
import User from "@/model/User";

const getSession = (auth.api as unknown as { getSession: ReturnType<typeof vi.fn> }).getSession;
const walletFindById = (Wallet as unknown as { findById: ReturnType<typeof vi.fn> }).findById;
const userFindOne = (User as unknown as { findOne: ReturnType<typeof vi.fn> }).findOne;
const req = (body: unknown) => ({ headers: new Headers(), json: async () => body }) as unknown as Request;

const makeWallet = () => ({
  name: "Main",
  cash: 100,
  budget: { totalBudget: 500, totalSavings: 200, isSurpassed: true, isSaved: true },
  primaryCurrency: "MXN",
  save: vi.fn(async function (this: unknown) {
    return this;
  }),
});

let logSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  getSession.mockResolvedValue({ user: { email: "me@example.com" } });
  userFindOne.mockReturnValue({ lean: async () => ({ wallet: "w1" }) });
});
afterEach(() => logSpy.mockRestore());

describe("POST wallet - 0 and false are real values (bug 124)", () => {
  it("can set cash, budget and savings to 0 and the flags to false", async () => {
    const wallet = makeWallet();
    walletFindById.mockResolvedValue(wallet);
    await POST(req({ cash: 0, totalBudget: 0, totalSavings: 0, isSurpassed: false, isSaved: false }));
    expect(wallet.cash).toBe(0);
    expect(wallet.budget).toEqual({ totalBudget: 0, totalSavings: 0, isSurpassed: false, isSaved: false });
  });

  it("leaves the fields that are not sent as they were", async () => {
    const wallet = makeWallet();
    walletFindById.mockResolvedValue(wallet);
    await POST(req({ name: "Renamed" }));
    expect(wallet.name).toBe("Renamed");
    expect(wallet.cash).toBe(100);
    expect(wallet.budget.isSurpassed).toBe(true);
  });

  it("error messages name the wallet, not another route", async () => {
    walletFindById.mockResolvedValue(null);
    await expect(POST(req({ cash: 1 }))).rejects.toThrow("No Wallet was identified to update");
  });
});
