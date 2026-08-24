import { describe, it, expect, vi, beforeEach } from "vitest";
import xlsxPopulate from "xlsx-populate";
import { COLUMNS, TEMPLATE_VERSION } from "@/lib/files/gastifyTemplate";

vi.mock("@/app/api/dbConnection", () => ({ default: vi.fn() }));
vi.mock("@/model/Wallet", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/model/User", () => ({ default: { findOne: vi.fn() } }));

const { TransactionMock } = vi.hoisted(() => ({ TransactionMock: { find: vi.fn(), deleteMany: vi.fn() } }));
vi.mock("@/model/Transaction", () => ({ default: TransactionMock }));

import Wallet from "@/model/Wallet";
import User from "@/model/User";
import Transaction from "@/model/Transaction";
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

function mockFileRequest(buffer, { deleteAll = "false", preview = "true" } = {}) {
  return {
    formData: vi.fn().mockResolvedValue({
      get: (key) => {
        if (key === "file") return { arrayBuffer: () => Promise.resolve(buffer) };
        if (key === "deleteAll") return deleteAll;
        if (key === "preview") return preview;
        return null;
      },
    }),
  };
}

function chainableLean(result) {
  return { lean: vi.fn().mockResolvedValue(result) };
}

// A single Mongoose-doc-like object usable both via `.populate().then()`
// (preview mode) and `.select().lean()` (execute mode).
function fakeDoc(fields) {
  const obj = { _id: fields._id, ...fields };
  return {
    ...obj,
    populate: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(obj),
    toObject: () => obj,
    then: (resolve) => resolve([obj]).then ? resolve([obj]) : resolve([obj]),
  };
}

function mockFindReturning(docs) {
  // Emulates Transaction.find(...).populate(...) resolving to an array of
  // doc-like objects, and Transaction.find(...).select(...).lean() resolving
  // to the same plain-object shape.
  const chain = {
    populate: vi.fn().mockResolvedValue(docs.map((d) => ({ ...d, toObject: () => d }))),
    select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(docs) }),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  User.findOne.mockReturnValue(chainableLean({ _id: "u1", wallet: "w1" }));
  Wallet.findById.mockReturnValue(chainableLean({ primaryCurrency: "MXN" }));
});

describe("Excel dedup — native currency awareness", () => {
  it("does NOT treat a 100 MXN and a 100 USD transaction as duplicates of each other", async () => {
    // Same name, same date, same major-unit number (100) but different
    // native currencies - the pre-fix query matched on `amount` alone and
    // would have wrongly flagged these as duplicates.
    Transaction.find.mockReturnValue(mockFindReturning([
      { _id: "a", amount: 100, money: { account: { amountMinor: 10000, currency: "USD" } } },
    ]));
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, ACCOUNT_CURRENCY: "MXN" },
    ]);
    const res = await POST(mockFileRequest(buffer, { deleteAll: "true", preview: "true" }), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.toDelete).toHaveLength(0);
  });

  it("matches a duplicate when native currency and amount both agree", async () => {
    Transaction.find.mockReturnValue(mockFindReturning([
      { _id: "a", amount: 100, money: { account: { amountMinor: 10000, currency: "MXN" } } },
    ]));
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, ACCOUNT_CURRENCY: "MXN" },
    ]);
    const res = await POST(mockFileRequest(buffer, { deleteAll: "true", preview: "true" }), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.toDelete).toHaveLength(1);
  });

  it("falls back to legacy MXN-rate-1 native money for a pre-Phase-5 document with no money field", async () => {
    Transaction.find.mockReturnValue(mockFindReturning([
      { _id: "a", amount: 100 }, // no `money` field at all - legacy document
    ]));
    const buffer = await buildWorkbookBuffer([
      { DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100, ACCOUNT_CURRENCY: "MXN" },
    ]);
    const res = await POST(mockFileRequest(buffer, { deleteAll: "true", preview: "true" }), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.toDelete).toHaveLength(1);
  });

  it("rejects a file stamped with an older template version", async () => {
    const buffer = await buildWorkbookBuffer(
      [{ DATE: new Date(2026, 0, 15), CONCEPT: "Coffee", ACCOUNT_AMOUNT: 100 }],
      "2.1"
    );
    const res = await POST(mockFileRequest(buffer), { params: { id: "user@test.com" } });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.versionMismatch).toBe(true);
  });
});
