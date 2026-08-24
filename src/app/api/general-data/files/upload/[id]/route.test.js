import { describe, it, expect, vi, beforeEach } from "vitest";
import xlsxPopulate from "xlsx-populate";
import { COLUMNS, TEMPLATE_VERSION } from "@/lib/files/gastifyTemplate";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Category", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/SubCategory", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Tag", () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock("@/model/Account", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));
vi.mock("@/lib/money/server/transactionMoneyService", () => ({ buildTransactionMoney: vi.fn() }));
vi.mock("@/lib/money/server/transactionReadService", () => ({ attachDisplayMoneyToList: vi.fn() }));

const { TransactionMock } = vi.hoisted(() => {
  const TransactionMock = { create: vi.fn(), find: vi.fn() };
  return { TransactionMock };
});
vi.mock("@/model/Transaction", () => ({ default: TransactionMock }));

import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";
import { POST } from "./route";

async function buildWorkbookBuffer(rows, version = TEMPLATE_VERSION) {
  const wb = await xlsxPopulate.fromBlankAsync();
  const sheet = wb.sheet(0);
  rows.forEach((row, idx) => {
    const r = idx + 3;
    Object.entries(row).forEach(([colKey, value]) => {
      if (value !== undefined) sheet.cell(r, COLUMNS[colKey]).value(value);
    });
  });
  const dataSheet = wb.addSheet("_data");
  dataSheet.cell(1, 3).value(version);
  return wb.outputAsync();
}

function mockFileRequest(buffer) {
  return {
    formData: vi.fn().mockResolvedValue({
      get: (key) => (key === "file" ? { arrayBuffer: () => Promise.resolve(buffer) } : null),
    }),
  };
}

function chainableLean(result) {
  return { lean: vi.fn().mockResolvedValue(result) };
}

function chainablePopulateLean(result) {
  const chain = { populate: vi.fn(() => chain), lean: vi.fn().mockResolvedValue(result) };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  User.findOne.mockReturnValue(chainableLean({ _id: "u1", wallet: "w1" }));
  Wallet.findById.mockReturnValue(chainableLean({ primaryCurrency: "MXN" }));
  Account.findOne.mockReturnValue(chainableLean(null));
  Category.findOne.mockReturnValue(chainableLean(null));
  SubCategory.findOne.mockReturnValue(chainableLean(null));
  Transaction.create.mockResolvedValue([{ _id: "t1" }]);
  Transaction.find.mockReturnValue(chainablePopulateLean([{ _id: "t1" }]));
  attachDisplayMoneyToList.mockImplementation((list) => Promise.resolve(list.map((t) => ({ ...t, displayMoney: { native: { amountMinor: 10000, currency: "MXN" } } }))));
  buildTransactionMoney.mockResolvedValue({
    account: { amountMinor: 10000, currency: "MXN" },
    merchant: null,
    reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date(), estimated: false },
  });
});

describe("Excel v3 upload — version gate", () => {
  it("rejects a file stamped with an older template version", async () => {
    const buffer = await buildWorkbookBuffer(
      [{ DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100 }],
      "2.1"
    );
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.versionMismatch).toBe(true);
    expect(buildTransactionMoney).not.toHaveBeenCalled();
  });
});

describe("Excel v3 upload — response shape", () => {
  it("attaches displayMoney to every created transaction, since the frontend dispatches this response straight into Redux without a re-fetch", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100 },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(attachDisplayMoneyToList).toHaveBeenCalledWith(expect.any(Array), "MXN");
    expect(body.data[0].displayMoney).toBeDefined();
  });
});

describe("Excel v3 upload — currency validation", () => {
  it("defaults to the Wallet's primary currency with no Account and no Account Currency", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100 },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountAmount: 100, accountCurrency: "MXN", walletPrimaryCurrency: "MXN" })
    );
  });

  it("uses the resolved Account's own currency when Account Currency is left blank", async () => {
    Account.findOne.mockReturnValue(chainableLean({ _id: "acc1", name: "USD Card", currency: "USD" }));
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, ACCOUNT: "USD Card" },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountCurrency: "USD" })
    );
  });

  it("skips a row whose spreadsheet Account Currency conflicts with the resolved Account's currency", async () => {
    Account.findOne.mockReturnValue(chainableLean({ _id: "acc1", name: "USD Card", currency: "USD" }));
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, ACCOUNT: "USD Card", ACCOUNT_CURRENCY: "EUR" },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/doesn't match/);
    expect(buildTransactionMoney).not.toHaveBeenCalled();
  });

  it("skips a row with an unsupported Account Currency code when no Account is selected", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, ACCOUNT_CURRENCY: "XXX" },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Unsupported Account Currency/);
  });

  it("skips a row with Merchant Amount but no Merchant Currency", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, MERCHANT_AMOUNT: 90 },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Merchant Amount and Merchant Currency/);
  });

  it("skips a row whose Reporting Currency isn't the Wallet's primary currency", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, REPORTING_AMOUNT: 5, REPORTING_CURRENCY: "USD" },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Reporting Currency must be your Wallet's primary currency/);
  });

  it("rejects a trusted-provider FX Source from the generic upload route", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, FX_SOURCE: "revolut" },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/FX Source must be blank or "manual"/);
  });

  it("passes a manual Reporting Amount through as manualReportingAmount", async () => {
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Plane ticket", ACCOUNT_AMOUNT: 50, ACCOUNT_CURRENCY: "USD", REPORTING_AMOUNT: 950, REPORTING_CURRENCY: "MXN", FX_SOURCE: "manual" },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(buildTransactionMoney).toHaveBeenCalledWith(
      expect.objectContaining({ accountCurrency: "USD", manualReportingAmount: 950 })
    );
  });

  it("surfaces a per-row FX-unavailable error as a skipped row instead of failing the whole batch", async () => {
    buildTransactionMoney
      .mockRejectedValueOnce(new Error("Exchange-rate estimate unavailable"))
      .mockResolvedValueOnce({
        account: { amountMinor: 10000, currency: "MXN" },
        merchant: null,
        reporting: { amountMinor: 10000, currency: "MXN", rate: "1", source: "same_currency", effectiveDate: new Date(), estimated: false },
      });
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Foreign charge", ACCOUNT_AMOUNT: 100, ACCOUNT_CURRENCY: "JPY" },
      { DATE: new Date(2026, 0, 16), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100 },
    ]);
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: expect.stringMatching(/Exchange-rate estimate unavailable/) }),
    ]));
  });
});
