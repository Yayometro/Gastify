import { describe, it, expect, vi, beforeEach } from "vitest";

// No real DB/network: Account/Wallet/User are mocked, dbConnection is a
// no-op, and the session is mocked as always-authenticated with wallet
// "w1". Covers Phase 4's "new Account currency defaults to Wallet primary
// currency" rule.
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

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
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body), headers: new Headers() };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.api.getSession.mockResolvedValue({ user: { email: "owner@example.com" } });
  User.findOne.mockReturnValue({
    lean: vi.fn().mockResolvedValue({ _id: "u1", wallet: "w1" }),
  });
});

describe("new-account currency defaulting", () => {
  it("defaults the new Account's currency to the Wallet's primaryCurrency when not provided", async () => {
    Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "EUR" }) });

    await POST(mockRequest({ name: "Euro account", amount: 100 }));

    expect(Account).toHaveBeenCalledTimes(1);
    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.currency).toBe("EUR");
    expect(constructedDoc.balanceMinor).toBe(10000);
  });

  it("honors an explicit currency without looking up the Wallet", async () => {
    await POST(mockRequest({ name: "Dollar account", amount: 50, currency: "USD" }));

    expect(Wallet.findById).not.toHaveBeenCalled();
    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.currency).toBe("USD");
    expect(constructedDoc.balanceMinor).toBe(5000);
  });

  it("falls back to MXN when the Wallet cannot be found", async () => {
    Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await POST(mockRequest({ name: "Fallback account" }));

    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.currency).toBe("MXN");
  });

  it("rejects an unsupported explicit currency before constructing the Account", async () => {
    await expect(
      POST(mockRequest({ currency: "GBP" }))
    ).rejects.toThrow(/Unsupported currency/);

    expect(Account).not.toHaveBeenCalled();
  });

  it("computes balanceMinor for a zero-decimal currency (JPY)", async () => {
    await POST(mockRequest({ amount: 1000, currency: "JPY" }));

    const constructedDoc = Account.mock.calls[0][0];
    expect(constructedDoc.balanceMinor).toBe(1000);
  });
});
