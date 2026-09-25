import { describe, it, expect, vi, beforeEach } from "vitest";

// No real DB/network: Wallet/User are mocked, dbConnection is a no-op, and
// the session is mocked as always-authenticated with wallet "w1". Covers
// Phase 4's primaryCurrency mutation - presentation only, never touches
// already-stored native Account/Transaction money.
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import Wallet from "@/model/Wallet";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body), headers: new Headers() };
}

function makeWallet({ primaryCurrency = "MXN" } = {}) {
  return {
    _id: "w1",
    name: "Main",
    cash: 0,
    budget: { totalBudget: 0, totalSavings: 0, isSurpassed: false, isSaved: false },
    primaryCurrency,
    currencyUpdatedAt: null,
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.api.getSession.mockResolvedValue({ user: { email: "owner@example.com" } });
  User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ wallet: "w1" }) });
});

describe("wallet primaryCurrency mutation", () => {
  it("updates primaryCurrency and stamps currencyUpdatedAt when it changes", async () => {
    const wallet = makeWallet({ primaryCurrency: "MXN" });
    Wallet.findById.mockResolvedValue(wallet);

    const res = await POST(mockRequest({ walletId: "w1", primaryCurrency: "USD" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(wallet.primaryCurrency).toBe("USD");
    expect(wallet.currencyUpdatedAt).toBeInstanceOf(Date);
    expect(wallet.save).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when primaryCurrency is unchanged", async () => {
    const wallet = makeWallet({ primaryCurrency: "EUR" });
    Wallet.findById.mockResolvedValue(wallet);

    await POST(mockRequest({ walletId: "w1", primaryCurrency: "EUR" }));

    expect(wallet.currencyUpdatedAt).toBeNull();
  });

  it("rejects an unsupported currency before saving", async () => {
    const wallet = makeWallet({ primaryCurrency: "MXN" });
    Wallet.findById.mockResolvedValue(wallet);

    await expect(
      POST(mockRequest({ walletId: "w1", primaryCurrency: "GBP" }))
    ).rejects.toThrow(/Unsupported currency/);

    expect(wallet.save).not.toHaveBeenCalled();
    expect(wallet.primaryCurrency).toBe("MXN");
  });
});
