import { describe, it, expect, vi, beforeEach } from "vitest";

// No real DB/network: Account/Wallet are mocked, and dbConnection is a
// no-op. Covers Phase 4's "new Account currency defaults to Wallet primary
// currency" rule.
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));

const { AccountMock } = vi.hoisted(() => {
  const AccountMock = vi.fn().mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    });
  });
  return { AccountMock };
});
vi.mock("@/model/Account", () => ({ default: AccountMock }));

import Wallet from "@/model/Wallet";
import Account from "@/model/Account";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("new-account currency defaulting", () => {
  it("defaults the new Account's currency to the Wallet's primaryCurrency when not provided", async () => {
    Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "EUR" }) });

    await POST(mockRequest({ userId: "u1", walletId: "w1", name: "Euro account", amount: 100 }));

    expect(Account).toHaveBeenCalledTimes(1);
    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.currency).toBe("EUR");
    expect(constructedDoc.balanceMinor).toBe(10000);
  });

  it("honors an explicit currency without looking up the Wallet", async () => {
    await POST(mockRequest({ userId: "u1", walletId: "w1", name: "Dollar account", amount: 50, currency: "USD" }));

    expect(Wallet.findById).not.toHaveBeenCalled();
    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.currency).toBe("USD");
    expect(constructedDoc.balanceMinor).toBe(5000);
  });

  it("falls back to MXN when the Wallet cannot be found", async () => {
    Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await POST(mockRequest({ userId: "u1", walletId: "missing", name: "Fallback account" }));

    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.currency).toBe("MXN");
  });

  it("rejects an unsupported explicit currency before constructing the Account", async () => {
    await expect(
      POST(mockRequest({ userId: "u1", walletId: "w1", currency: "GBP" }))
    ).rejects.toThrow(/Unsupported currency/);

    expect(Account).not.toHaveBeenCalled();
  });

  it("computes balanceMinor for a zero-decimal currency (JPY)", async () => {
    await POST(mockRequest({ userId: "u1", walletId: "w1", amount: 1000, currency: "JPY" }));

    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.balanceMinor).toBe(1000);
  });
});
