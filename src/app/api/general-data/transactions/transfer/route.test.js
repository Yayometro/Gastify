import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Account", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/lib/money/server/fxRateService", () => ({ convert: vi.fn() }));

const { TransactionMock, fakeSession } = vi.hoisted(() => {
  const fakeSession = {
    withTransaction: vi.fn(async (fn) => fn()),
    endSession: vi.fn(async () => {}),
  };
  const TransactionMock = vi.fn().mockImplementation(function (doc) {
    Object.assign(this, doc);
    this._id = `id-${Math.random().toString(36).slice(2)}`;
    this.save = vi.fn().mockResolvedValue(this);
  });
  TransactionMock.findById = vi.fn();
  TransactionMock.find = vi.fn();
  TransactionMock.deleteMany = vi.fn();
  return { TransactionMock, fakeSession };
});
vi.mock("@/model/Transaction", () => ({ default: TransactionMock }));
vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: { ...actual.default, startSession: vi.fn(async () => fakeSession) },
  };
});

import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import Transaction from "@/model/Transaction";
import { convert } from "@/lib/money/server/fxRateService";
import { POST } from "./route";

function mockRequest(body) {
  return { json: vi.fn().mockResolvedValue(body) };
}

function chainablePopulate(result) {
  return { populate: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue(result) };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeSession.withTransaction.mockImplementation(async (fn) => fn());
  Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ primaryCurrency: "MXN" }) });
  Transaction.findById.mockReturnValue(chainablePopulate({ _id: "leg", name: "Transfer" }));
});

const SOURCE = { _id: "acc-mxn", user: "u1", wallet: "w1", currency: "MXN" };
const DEST = { _id: "acc-mxn-2", user: "u1", wallet: "w1", currency: "MXN" };
const USD_DEST = { _id: "acc-usd", user: "u1", wallet: "w1", currency: "USD" };

describe("transfer POST - validation", () => {
  it("rejects when source and destination Accounts are the same", async () => {
    const res = await POST(mockRequest({
      user: "u1", wallet: "w1", sourceAccountId: "acc1", sourceAmountMinor: 1000,
      destinationAccountId: "acc1", destinationAmountMinor: 1000,
    }));
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/must be different/);
  });

  it("rejects a same-currency \"transfer\" between Accounts of different currencies", async () => {
    Account.findById.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(SOURCE) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(USD_DEST) });

    const res = await POST(mockRequest({
      user: "u1", wallet: "w1", kind: "transfer",
      sourceAccountId: "acc-mxn", sourceAmountMinor: 10000,
      destinationAccountId: "acc-usd", destinationAmountMinor: 592,
    }));
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/use an exchange/);
  });

  it("rejects an Account that does not belong to this user/Wallet", async () => {
    Account.findById.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ ...SOURCE, user: "someone-else" }) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(DEST) });

    const res = await POST(mockRequest({
      user: "u1", wallet: "w1",
      sourceAccountId: "acc-mxn", sourceAmountMinor: 10000,
      destinationAccountId: "acc-mxn-2", destinationAmountMinor: 10000,
    }));
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Source Account not found/);
  });
});

describe("transfer POST - happy paths", () => {
  it("creates two atomic legs for a same-currency transfer", async () => {
    Account.findById.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(SOURCE) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(DEST) });

    const res = await POST(mockRequest({
      user: "u1", wallet: "w1", kind: "transfer",
      sourceAccountId: "acc-mxn", sourceAmountMinor: 10000,
      destinationAccountId: "acc-mxn-2", destinationAmountMinor: 10000,
      date: "2026-08-21",
    }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(fakeSession.withTransaction).toHaveBeenCalledTimes(1);
    expect(fakeSession.endSession).toHaveBeenCalledTimes(1);
    expect(TransactionMock).toHaveBeenCalledTimes(2);
    const [outgoingDoc, incomingDoc] = TransactionMock.mock.calls.map((c) => c[0]);
    expect(outgoingDoc.direction).toBe("debit");
    expect(outgoingDoc.transferDirection).toBe("out");
    expect(incomingDoc.direction).toBe("credit");
    expect(incomingDoc.transferDirection).toBe("in");
    expect(outgoingDoc.transferGroupId).toBe(incomingDoc.transferGroupId);
    expect(outgoingDoc.kind).toBe("transfer");
    expect(outgoingDoc.isBill).toBe(false);
    expect(outgoingDoc.isIncome).toBe(false);
  });

  it("uses a live FX quote for an exchange leg whose currency differs from the Wallet's primary", async () => {
    Account.findById.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(SOURCE) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(USD_DEST) });
    convert.mockResolvedValue({
      available: true, amountMinor: 592, currency: "USD", rate: "0.0592",
      effectiveDate: new Date("2026-08-21"), source: "ecb_reference", estimated: true, stale: false,
    });

    const res = await POST(mockRequest({
      user: "u1", wallet: "w1", kind: "exchange",
      sourceAccountId: "acc-mxn", sourceAmountMinor: 10000,
      destinationAccountId: "acc-usd", destinationAmountMinor: 592,
      date: "2026-08-21",
    }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    const [, incomingDoc] = TransactionMock.mock.calls.map((c) => c[0]);
    expect(incomingDoc.money.reporting.currency).toBe("MXN");
    expect(incomingDoc.money.reporting.source).toBe("ecb_reference");
  });

  it("throws (never fakes a rate) when the FX service is unavailable for a leg", async () => {
    Account.findById.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(SOURCE) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(USD_DEST) });
    convert.mockResolvedValue({ available: false });

    const res = await POST(mockRequest({
      user: "u1", wallet: "w1", kind: "exchange",
      sourceAccountId: "acc-mxn", sourceAmountMinor: 10000,
      destinationAccountId: "acc-usd", destinationAmountMinor: 592,
    }));
    const body = await res.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Exchange-rate estimate unavailable/);
    expect(TransactionMock).not.toHaveBeenCalled();
  });
});

describe("transfer POST - legacy (unmigrated) Account/Wallet documents", () => {
  // Regression coverage: a real Account/Wallet document that predates the
  // multi-currency migration has no currency/primaryCurrency field in its
  // stored BSON at all - .lean() never applies the schema default, so this
  // reads back as `undefined`, not "MXN". A live transfer between two real,
  // unmigrated MXN accounts crashed with "Unsupported currency: undefined"
  // before this was fixed to default explicitly wherever Account.currency/
  // Wallet.primaryCurrency is read.
  it("defaults both legs to MXN when neither the Wallet nor either Account has a currency field", async () => {
    Wallet.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "w1" }) }); // no primaryCurrency
    Account.findById
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "acc-mxn", user: "u1", wallet: "w1" }) }) // no currency
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "acc-mxn-2", user: "u1", wallet: "w1" }) }); // no currency

    const res = await POST(mockRequest({
      user: "u1", wallet: "w1", kind: "transfer",
      sourceAccountId: "acc-mxn", sourceAmountMinor: 10000,
      destinationAccountId: "acc-mxn-2", destinationAmountMinor: 10000,
    }));
    const body = await res.json();

    expect(body.ok).toBe(true);
    const [outgoingDoc, incomingDoc] = TransactionMock.mock.calls.map((c) => c[0]);
    expect(outgoingDoc.money.account.currency).toBe("MXN");
    expect(incomingDoc.money.account.currency).toBe("MXN");
    expect(outgoingDoc.money.reporting.currency).toBe("MXN");
  });
});
