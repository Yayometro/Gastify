import { NextResponse, type NextRequest } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import Wallet from "@/model/Wallet";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
// Registered for Transaction's .populate(category / subCategory / account / tags)
// below - without these imports Mongoose throws MissingSchemaError whenever this
// route is the first thing to load in a server instance (bug 156).
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Account";
import "@/model/Tag";
import { TEMPLATE_VERSION, COLUMNS } from "@/lib/files/gastifyTemplate";
import { SUPPORTED_CURRENCIES, majorToMinor, getTransactionNativeMoney } from "@/lib/money/currencies";
import { buildLegacyMoney } from "@/lib/money/transactionMoney";
import { auth } from "@/lib/auth/betterAuth";

export interface DedupPreviewResponse {
  ok: true;
  preview: true;
  scanned: number;
  toDelete: unknown[];
  toKeep: unknown[];
  message: string;
}

export interface DedupExecuteResponse {
  ok: true;
  removed: number;
  removedIds: string[];
  scanned: number;
  message: string;
}

export interface DedupErrorResponse {
  ok: false;
  message: string;
  versionMismatch?: boolean;
}

export type DedupResponse = DedupPreviewResponse | DedupExecuteResponse | DedupErrorResponse;

interface ParsedExcelRow {
  date: Date;
  name: string;
  currency: string;
  amountMinor: number;
}

function excelSerialDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const offset = date_info.getTimezoneOffset() * 60000;
  return new Date(date_info.getTime() + offset);
}

function parseFlexibleDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    const d = excelSerialDateToJSDate(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(value).trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ±30h window — covers a full calendar day in any timezone even if the
// transaction was created at an arbitrary time (not just midnight).
function dateWindow(date: Date) {
  const ms = date.getTime();
  return {
    $gte: new Date(ms - 30 * 60 * 60 * 1000),
    $lte: new Date(ms + 30 * 60 * 60 * 1000),
  };
}

// .lean() never applies schema defaults - a Transaction written before
// Phase 5's money-aware writes has no `money` field in its stored BSON at
// all, so it needs the same legacy MXN-rate-1 fallback used everywhere else
// in this migration rather than being treated as currency-less.
function nativeMoneyOf(transaction: unknown) {
  return (
    getTransactionNativeMoney(transaction) ||
    (buildLegacyMoney as (opts: { amount?: number; date?: Date }) => { account: { amountMinor: number; currency: string } })({
      amount: (transaction as { amount?: number }).amount,
    }).account
  );
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<DedupResponse>> {
  let tmpFilePath: string | null = null;
  try {
    // Security fix: this route previously lacked session authentication and trusted
    // params.id from the URL to identify the target user account (IDOR).
    // We now derive user identity strictly from auth.api.getSession, ignoring params.id,
    // and scope queries and deletions to the session user's wallet.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const data = await request.formData();
    const file = data.get("file") as File | null;
    const deleteAll = data.get("deleteAll") === "true";
    const preview = data.get("preview") === "true";
    if (!file) {
      return NextResponse.json({ ok: false, message: "No file received" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tmpFilePath = path.join("/tmp", `dedup_${Date.now()}.xlsx`);
    await writeFile(tmpFilePath, buffer);

    const workbook = await xlsxPopulate.fromFileAsync(tmpFilePath);

    // Version check
    let fileVersion: unknown = null;
    try {
      const dataSheet = workbook.sheet("_data");
      if (dataSheet) fileVersion = dataSheet.cell(1, 3).value();
    } catch {
      // ignore if missing
    }

    if (!fileVersion || String(fileVersion).trim() !== TEMPLATE_VERSION) {
      return NextResponse.json({
        ok: false,
        versionMismatch: true,
        message: `Outdated template (v${fileVersion || "unknown"}). Please use the latest template (v${TEMPLATE_VERSION}).`,
      }, { status: 400 });
    }

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }
    const parentWallet = await Wallet.findById(userFound.wallet).lean();
    const walletPrimaryCurrency = parentWallet?.primaryCurrency || "MXN";

    const sheet = workbook.sheet(0);

    // Parse all rows from Excel
    const excelRows: ParsedExcelRow[] = [];
    let i = 3;
    while (true) {
      const rawDate = sheet.cell(i, COLUMNS.DATE).value();
      if (rawDate === null || rawDate === undefined || rawDate === "") break;

      const date = parseFlexibleDate(rawDate);
      if (!date) { i++; continue; }

      const concept = sheet.cell(i, COLUMNS.CONCEPT).value();
      const amountRaw = sheet.cell(i, COLUMNS.ACCOUNT_AMOUNT).value();
      const amount = amountRaw !== null && amountRaw !== undefined ? Number(amountRaw) : 0;

      // Skip rows with no concept at all
      if (!concept) { i++; continue; }

      const rawCurrency = sheet.cell(i, COLUMNS.ACCOUNT_CURRENCY).value();
      const currency = rawCurrency && SUPPORTED_CURRENCIES.includes(String(rawCurrency).trim().toUpperCase())
        ? String(rawCurrency).trim().toUpperCase()
        : walletPrimaryCurrency;

      excelRows.push({
        date,
        name: String(concept).trim(),
        currency,
        amountMinor: majorToMinor(amount, currency),
      });
      i++;
    }

    if (excelRows.length === 0) {
      return NextResponse.json({ ok: false, message: "No valid rows found in the file" }, { status: 400 });
    }

    const POPULATE_OPTIONS = [
      { path: "category" },
      { path: "subCategory" },
      { path: "account" },
      { path: "tags" },
    ];

    // Native amount/currency comparison happens in application code below,
    // not in the Mongo query itself — legacy pre-Phase-5 documents have no
    // stored `money.account.amountMinor` to filter on at the database level
    // (plan section 15.4: dedup must compare native currency + native
    // amount minor, never legacy `amount` alone).
    const findCandidates = (row: ParsedExcelRow) => Transaction.find({
      user: userFound._id,
      name: { $regex: new RegExp(`^${row.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      date: dateWindow(row.date),
    });

    const matchesNative = (transaction: unknown, row: ParsedExcelRow) => {
      const native = nativeMoneyOf(transaction);
      return native.currency === row.currency && native.amountMinor === row.amountMinor;
    };

    // Preview mode: scan, build lists, return without deleting
    if (preview) {
      const previewToDelete: Record<string, unknown>[] = [];
      const previewToKeep: Record<string, unknown>[] = [];

      for (const row of excelRows) {
        const candidates = await findCandidates(row).populate(POPULATE_OPTIONS);
        const matches = candidates.filter((m) => matchesNative(m, row));

        const matchInfo = { date: row.date, name: row.name, amount: row.amountMinor / 100, currency: row.currency };
        if (deleteAll ? matches.length >= 1 : matches.length > 1) {
          if (deleteAll) {
            previewToDelete.push(...matches.map((m) => ({ ...(m as { toObject: () => Record<string, unknown> }).toObject(), _match: matchInfo })));
          } else {
            previewToKeep.push({ ...(matches[0] as { toObject: () => Record<string, unknown> }).toObject(), _match: matchInfo });
            previewToDelete.push(...matches.slice(1).map((m) => ({ ...(m as { toObject: () => Record<string, unknown> }).toObject(), _match: matchInfo })));
          }
        }
      }

      // Deduplicate by _id (a row could match the same DB transaction twice)
      const dedup = (arr: Record<string, unknown>[]) => {
        const seen = new Set<string>();
        return arr.filter((t) => { const k = String(t._id); if (seen.has(k)) return false; seen.add(k); return true; });
      };

      return NextResponse.json({
        ok: true,
        preview: true,
        scanned: excelRows.length,
        toDelete: dedup(previewToDelete),
        toKeep: dedup(previewToKeep),
        message: `Preview ready: ${dedup(previewToDelete).length} transaction(s) would be removed across ${excelRows.length} rows scanned.`,
      });
    }

    // Execute mode: scan and delete
    let totalRemoved = 0;
    const removedIds: string[] = [];

    for (const row of excelRows) {
      const candidates = await findCandidates(row).select("_id amount money").lean();
      const matches = candidates.filter((m) => matchesNative(m, row));

      if (deleteAll ? matches.length >= 1 : matches.length > 1) {
        const toDelete = deleteAll
          ? matches.map((m) => (m as { _id: unknown })._id)
          : matches.slice(1).map((m) => (m as { _id: unknown })._id);
        await Transaction.deleteMany({
          _id: { $in: toDelete },
          user: userFound._id,
          wallet: userFound.wallet,
        });
        totalRemoved += toDelete.length;
        removedIds.push(...toDelete.map(String));
      }
    }

    return NextResponse.json({
      ok: true,
      removed: totalRemoved,
      removedIds,
      scanned: excelRows.length,
      message:
        totalRemoved > 0
          ? `Found and removed ${totalRemoved} duplicate transaction(s) across ${excelRows.length} rows scanned.`
          : `No duplicates found across ${excelRows.length} rows scanned.`,
    });
  } catch (e) {
    console.error("Deduplicate error:", e);
    return NextResponse.json({ ok: false, message: (e as Error)?.message || "Unexpected error" }, { status: 500 });
  } finally {
    if (tmpFilePath) await unlink(tmpFilePath).catch(() => {});
  }
}
