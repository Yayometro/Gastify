import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Account", () => ({ default: { findOne: vi.fn(), findById: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Category", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn() }));
vi.mock("@/lib/auth/betterAuth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const { TransactionMock } = vi.hoisted(() => {
  const savedDoc = {
    _id: "t1",
    name: "Groceries",
    save: vi.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };
  const TransactionMock = vi.fn().mockImplementation(function (doc) {
    Object.assign(this, doc, savedDoc);
    this.save = savedDoc.save;
  });
  TransactionMock.findById = vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue({ _id: "t1", name: "Groceries" }),
  });
  return { TransactionMock };
});
vi.mock("@/model/Transaction", () => ({ default: TransactionMock }));

import Account from "@/model/Account";
import Category from "@/model/Category";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import { auth } from "@/lib/auth/betterAuth";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body), headers: new Headers() };
}

function chainablePopulate(result) {
  const chain = {
    populate: vi.fn(() => chain),
    lean: vi.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.api.getSession.mockResolvedValue({ user: { email: "u1@example.com" } });
  User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "u1", wallet: "w1" }) });
  buildTransactionMoney.mockResolvedValue({
    account: { amountMinor: 25000, currency: "MXN" },
    merchant: null,
    reporting: {
      amountMinor: 25000,
      currency: "MXN",
      rate: "1",
      source: "same_currency",
      effectiveDate: new Date(),
    },
  });
  Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "MXN" }) });
  Transaction.findById.mockReturnValue(chainablePopulate({ _id: "t1", name: "Groceries" }));
});

describe("speech-add authentication and scoping", () => {
  it("throws when no session exists", async () => {
    auth.api.getSession.mockResolvedValueOnce(null);

    await expect(
      POST(
        mockRequest({
          text: "Create a bill with the title school payment with value of $250",
          lang: "English",
        })
      )
    ).rejects.toThrow(/No session/);
  });

  it("derives user and wallet from the session rather than untrusted caller user ID", async () => {
    await POST(
      mockRequest({
        text: "Create a bill with the title school payment with value of $250",
        lang: "English",
        user: "attacker-user-id",
      })
    );

    const constructedDoc = Transaction.mock.calls[0][0];
    expect(constructedDoc.user).toBe("u1");
    expect(constructedDoc.wallet).toBe("w1");
  });
});

describe("speech-add phrase parsing and extraction", () => {
  it("throws if title is missing from speech text", async () => {
    await expect(
      POST(
        mockRequest({
          text: "with value of $250",
          lang: "English",
        })
      )
    ).rejects.toThrow(/Title of transaction data is missing/);
  });

  it("throws if amount is missing from speech text", async () => {
    await expect(
      POST(
        mockRequest({
          text: "Create a bill with the title school payment with no numbers",
          lang: "English",
        })
      )
    ).rejects.toThrow(/Amount of transaction data is missing/);
  });

  it("parses an English speech transaction with title, amount, category and account", async () => {
    Category.findOne.mockResolvedValue({ _id: "cat-groceries" });
    Account.findOne.mockResolvedValue({ _id: "acc-bank" });
    Account.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ currency: "USD" }),
    });

    const res = await POST(
      mockRequest({
        text: "Create an expense with the title Weekly Market with value of $500 with a groceries category in the bank account",
        lang: "English",
      })
    );
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.status).toBe(201);

    const constructedDoc = Transaction.mock.calls[0][0];
    expect(constructedDoc.name).toBe("Weekly Market");
    expect(constructedDoc.amount).toBe(500);
    expect(constructedDoc.isBill).toBe(true);
    expect(constructedDoc.isIncome).toBe(false);

    expect(Category.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "u1",
      })
    );
    expect(Account.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "u1",
      })
    );

    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({
        accountAmount: 500,
        accountCurrency: "USD",
        walletPrimaryCurrency: "MXN",
      })
    );
  });

  it("parses a Spanish speech transaction with income type", async () => {
    const res = await POST(
      mockRequest({
        text: "crea un nuevo ingreso con el nombre Sueldo with monto of $10,000",
        lang: "Spanish",
      })
    );
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.status).toBe(201);

    const constructedDoc = Transaction.mock.calls[0][0];
    expect(constructedDoc.name).toBe("Sueldo");
    expect(constructedDoc.amount).toBe(10000);
    expect(constructedDoc.isIncome).toBe(true);
  });
});
