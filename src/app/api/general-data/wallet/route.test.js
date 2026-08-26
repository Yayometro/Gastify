import { describe, it, expect, vi, beforeEach } from "vitest";

// No real DB/network: Wallet is mocked, dbConnection is a no-op. Covers
// Phase 4's primaryCurrency mutation - presentation only, never touches
// already-stored native Account/Transaction money.
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));

import Wallet from "@/model/Wallet";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
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
