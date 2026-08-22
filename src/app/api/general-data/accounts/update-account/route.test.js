import { describe, it, expect, vi, beforeEach } from "vitest";

// No real DB/network: Account/Transaction are mocked, and dbConnection is a
// no-op. Covers the Phase 4 currency-change restriction (Account currency
// cannot change once Transactions are linked to it).
vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Transaction", () => ({ default: { countDocuments: vi.fn() } }));

import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
}

function makeFindAccountResult({ currency = "MXN", amount = 100, name = "Checking" } = {}) {
  return {
    _id: "acc1",
    name,
    amount,
    accountType: "debit",
    currency,
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("update-account currency-change restriction", () => {
  it("blocks changing currency when Transactions are already linked to the Account", async () => {
    const account = makeFindAccountResult({ currency: "MXN" });
    Account.findById.mockResolvedValue(account);
    Transaction.countDocuments.mockResolvedValue(3);

    await expect(
      POST(mockRequest({ accountId: "acc1", currency: "USD" }))
    ).rejects.toThrow(/Cannot change currency/);

    expect(account.save).not.toHaveBeenCalled();
    expect(account.currency).toBe("MXN");
  });

  it("allows changing currency when no Transactions are linked", async () => {
    const account = makeFindAccountResult({ currency: "MXN" });
    Account.findById.mockResolvedValue(account);
    Transaction.countDocuments.mockResolvedValue(0);

    const res = await POST(mockRequest({ accountId: "acc1", currency: "USD" }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(account.currency).toBe("USD");
    expect(account.save).toHaveBeenCalledTimes(1);
  });

  it("does not touch currency or count linked Transactions when currency is unchanged", async () => {
    const account = makeFindAccountResult({ currency: "MXN" });
    Account.findById.mockResolvedValue(account);

    await POST(mockRequest({ accountId: "acc1", currency: "MXN", amount: 250 }));

    expect(Transaction.countDocuments).not.toHaveBeenCalled();
    expect(account.currency).toBe("MXN");
    expect(account.balanceMinor).toBe(25000);
  });

  it("rejects an unsupported currency before saving", async () => {
    const account = makeFindAccountResult({ currency: "MXN" });
    Account.findById.mockResolvedValue(account);

    await expect(
      POST(mockRequest({ accountId: "acc1", currency: "GBP" }))
    ).rejects.toThrow(/Unsupported currency/);

    expect(account.save).not.toHaveBeenCalled();
  });

  it("keeps balanceMinor and amount in sync in the account's own currency", async () => {
    const account = makeFindAccountResult({ currency: "JPY", amount: 500 });
    Account.findById.mockResolvedValue(account);

    const res = await POST(mockRequest({ accountId: "acc1", amount: 1500 }));
    await res.json();

    expect(account.amount).toBe(1500);
    // JPY is zero-decimal, so balanceMinor equals the major amount.
    expect(account.balanceMinor).toBe(1500);
  });
});
