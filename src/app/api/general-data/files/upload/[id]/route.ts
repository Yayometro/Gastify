import { NextResponse, type NextRequest } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import { TEMPLATE_VERSION, COLUMNS } from "@/lib/files/gastifyTemplate";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";
import { buildTransactionMoney } from "@/lib/money/server/transactionMoneyService";
import { attachDisplayMoneyToList } from "@/lib/money/server/transactionReadService";
import { auth } from "@/lib/auth/betterAuth";

export interface SkippedRow {
  row: number;
  reason: string;
}

export interface UploadSuccessResponse {
  data: unknown[];
  message: string;
  skipped: SkippedRow[];
  status: number;
  ok: true;
}

export interface UploadErrorResponse {
  ok: false;
  message: string;
  versionMismatch?: boolean;
  currentVersion?: string;
}

export type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  // Excel serial number
  if (typeof value === "number") {
    const d = excelSerialDateToJSDate(value);
    return isNaN(d.getTime()) ? null : d;
  }

  const s = String(value).trim();
  if (!s) return null;

  // DD/MM/YYYY or D/M/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD (ISO)
  const iso = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback: native parse (works for "Jan 15, 2025" etc.)
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function normalizeCurrency(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim().toUpperCase();
}

async function resolveCategory(name: unknown, userId: unknown) {
  if (name === null || name === undefined) return null;
  const safe = escapeRegex(String(name).trim());
  if (!safe) return null;
  const cat = await Category.findOne({
    name: { $regex: new RegExp(`^${safe}$`, "i") },
    $or: [{ user: userId }, { isDefaultCatego: true }],
  }).lean();
  return cat ? cat._id : null;
}

async function resolveSubCategory(name: unknown, userId: unknown) {
  if (name === null || name === undefined) return { subCategoryId: null, categoryId: null };
  const safe = escapeRegex(String(name).trim());
  if (!safe) return { subCategoryId: null, categoryId: null };
  const subCat = await SubCategory.findOne({
    name: { $regex: new RegExp(`^${safe}$`, "i") },
    $or: [{ user: userId }, { isDefaultSubCatego: true }],
  }).lean();
  if (!subCat) return { subCategoryId: null, categoryId: null };
  return { subCategoryId: subCat._id, categoryId: (subCat as { fatherCategory?: unknown }).fatherCategory || null };
}

async function resolveAccount(name: unknown, userId: unknown, walletId: unknown) {
  if (name === null || name === undefined) return null;
  const safe = escapeRegex(String(name).trim());
  if (!safe) return null;
  const acc = await Account.findOne({
    name: { $regex: new RegExp(`^${safe}$`, "i") },
    user: userId,
    wallet: walletId,
  }).lean();
  return acc || null;
}

async function resolveTags(rawTags: unknown, userId: unknown, walletId: unknown) {
  if (!rawTags) return [];
  const names = String(rawTags).split(",").map((t) => t.trim()).filter(Boolean);
  const tagIds: unknown[] = [];
  for (const name of names) {
    const safe = escapeRegex(String(name));
    let tag = await Tag.findOne({
      user: userId,
      name: { $regex: new RegExp(`^${safe}$`, "i") },
    }).lean();
    if (!tag) {
      tag = await Tag.create({ user: userId, wallet: walletId, name });
    }
    tagIds.push(tag._id);
  }
  return tagIds;
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UploadResponse>> {
  let tmpFilePath: string | null = null;
  try {
    // Security fix: this route previously lacked session authentication and trusted
    // params.id from the URL to identify the target user account (IDOR).
    // We now derive user identity strictly from auth.api.getSession, ignoring params.id.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const data = await request.formData();
    const file = data.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, message: "No file received" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tmpFilePath = path.join("/tmp", `upload_${Date.now()}.xlsx`);
    await writeFile(tmpFilePath, buffer);

    const workbook = await xlsxPopulate.fromFileAsync(tmpFilePath);

    // --- Version check ---
    let fileVersion: unknown = null;
    try {
      const dataSheet = workbook.sheet("_data");
      if (dataSheet) fileVersion = dataSheet.cell(1, 3).value();
    } catch {
      // ignore if sheet is missing
    }

    if (!fileVersion || String(fileVersion).trim() !== TEMPLATE_VERSION) {
      return NextResponse.json({
        ok: false,
        versionMismatch: true,
        currentVersion: TEMPLATE_VERSION,
        message: `Outdated template (v${fileVersion || "unknown"}). Please download the latest template (v${TEMPLATE_VERSION}) and try again.`,
      }, { status: 400 });
    }

    const sheet = workbook.sheet(0);

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }
    const parentWallet = await Wallet.findById(userFound.wallet).lean();
    const walletPrimaryCurrency = parentWallet?.primaryCurrency || "MXN";

    // Data starts at row 3 (row 1 = headers, row 2 = note)
    let i = 3;
    const transactions: Record<string, unknown>[] = [];
    const skipped: SkippedRow[] = [];
    const cell = (col: number) => sheet.cell(i, col).value();

    while (true) {
      const rawDate = cell(COLUMNS.DATE);
      if (rawDate === null || rawDate === undefined || rawDate === "") break;

      const date = parseFlexibleDate(rawDate);
      if (!date) {
        skipped.push({ row: i, reason: `Invalid date: "${rawDate}"` });
        i++;
        continue;
      }

      const concept = cell(COLUMNS.CONCEPT);
      const accountAmountRaw = cell(COLUMNS.ACCOUNT_AMOUNT);
      const accountAmount = accountAmountRaw !== null && accountAmountRaw !== undefined ? Number(accountAmountRaw) : 0;

      if (!concept && accountAmount === 0) {
        // Likely the example row or truly empty — skip silently
        i++;
        continue;
      }

      const accountName = cell(COLUMNS.ACCOUNT);
      const resolvedAccount = await resolveAccount(accountName, userFound._id, userFound.wallet) as { _id: unknown; name?: string; currency?: string } | null;

      // Account currency is authoritative when an Account is selected.
      const rawAccountCurrency = normalizeCurrency(cell(COLUMNS.ACCOUNT_CURRENCY));
      let accountCurrency: string;
      if (resolvedAccount) {
        accountCurrency = resolvedAccount.currency || walletPrimaryCurrency;
        if (rawAccountCurrency && rawAccountCurrency !== accountCurrency) {
          skipped.push({ row: i, reason: `Account Currency "${rawAccountCurrency}" doesn't match "${resolvedAccount.name}"'s currency (${accountCurrency}). Leave it blank or fix the mismatch.` });
          i++;
          continue;
        }
      } else if (rawAccountCurrency) {
        if (!SUPPORTED_CURRENCIES.includes(rawAccountCurrency)) {
          skipped.push({ row: i, reason: `Unsupported Account Currency: "${rawAccountCurrency}"` });
          i++;
          continue;
        }
        accountCurrency = rawAccountCurrency;
      } else {
        accountCurrency = walletPrimaryCurrency;
      }

      const merchantAmountRaw = cell(COLUMNS.MERCHANT_AMOUNT);
      const merchantCurrencyRaw = normalizeCurrency(cell(COLUMNS.MERCHANT_CURRENCY));
      const hasMerchantAmount = merchantAmountRaw !== null && merchantAmountRaw !== undefined && merchantAmountRaw !== "";
      if (hasMerchantAmount !== Boolean(merchantCurrencyRaw)) {
        skipped.push({ row: i, reason: "Merchant Amount and Merchant Currency must both be filled, or both left blank." });
        i++;
        continue;
      }
      if (merchantCurrencyRaw && !SUPPORTED_CURRENCIES.includes(merchantCurrencyRaw)) {
        skipped.push({ row: i, reason: `Unsupported Merchant Currency: "${merchantCurrencyRaw}"` });
        i++;
        continue;
      }

      const reportingAmountRaw = cell(COLUMNS.REPORTING_AMOUNT);
      const reportingCurrencyRaw = normalizeCurrency(cell(COLUMNS.REPORTING_CURRENCY));
      const hasReportingAmount = reportingAmountRaw !== null && reportingAmountRaw !== undefined && reportingAmountRaw !== "";
      if (hasReportingAmount !== Boolean(reportingCurrencyRaw)) {
        skipped.push({ row: i, reason: "Reporting Amount and Reporting Currency must both be filled, or both left blank." });
        i++;
        continue;
      }
      if (reportingCurrencyRaw && reportingCurrencyRaw !== walletPrimaryCurrency) {
        skipped.push({ row: i, reason: `Reporting Currency must be your Wallet's primary currency (${walletPrimaryCurrency}), got "${reportingCurrencyRaw}".` });
        i++;
        continue;
      }

      const fxSourceRaw = cell(COLUMNS.FX_SOURCE);
      const fxSource = fxSourceRaw ? String(fxSourceRaw).trim().toLowerCase() : "";
      if (fxSource && fxSource !== "manual") {
        skipped.push({ row: i, reason: `FX Source must be blank or "manual", got "${fxSourceRaw}". Trusted provider sources aren't available through file upload.` });
        i++;
        continue;
      }
      if (fxSource === "manual" && !hasReportingAmount) {
        skipped.push({ row: i, reason: 'FX Source is "manual" but no Reporting Amount was given.' });
        i++;
        continue;
      }

      const typeRaw = cell(COLUMNS.TYPE);
      const catName = cell(COLUMNS.CATEGORY);
      const subCatName = cell(COLUMNS.SUB_CATEGORY);
      const tagsRaw = cell(COLUMNS.TAGS);

      const type = typeRaw ? String(typeRaw).trim().toLowerCase() : "bill";
      const isBill = type !== "income";
      const isIncome = type === "income";

      let finalCategoryId: unknown = null;
      let finalSubCategoryId: unknown = null;

      if (subCatName) {
        const { subCategoryId, categoryId } = await resolveSubCategory(subCatName, userFound._id);
        finalSubCategoryId = subCategoryId;
        // Prefer the subCategory's real parent for consistency. If the subCategory
        // name didn't resolve (e.g. a stale naming-rule reference), fall back to the
        // explicit category name instead of silently discarding a valid category.
        if (categoryId) {
          finalCategoryId = categoryId;
        } else if (catName) {
          finalCategoryId = await resolveCategory(catName, userFound._id);
        }
      } else if (catName) {
        finalCategoryId = await resolveCategory(catName, userFound._id);
      }

      const tagIds = await resolveTags(
        tagsRaw ? String(tagsRaw) : null,
        userFound._id,
        userFound.wallet
      );

      let money: unknown;
      try {
        money = await buildTransactionMoney({
          accountAmount,
          accountCurrency,
          merchantAmount: hasMerchantAmount ? Number(merchantAmountRaw) : undefined,
          merchantCurrency: merchantCurrencyRaw || undefined,
          walletPrimaryCurrency,
          date,
          manualReportingAmount: hasReportingAmount ? Number(reportingAmountRaw) : undefined,
        });
      } catch (fxError) {
        skipped.push({ row: i, reason: (fxError as Error)?.message || "Could not resolve this row's exchange rate" });
        i++;
        continue;
      }

      const transaction: Record<string, unknown> = {
        date,
        name: concept || "no concept",
        amount: isNaN(accountAmount) ? 0 : accountAmount,
        isBill,
        isIncome,
        isReadable: true,
        user: userFound._id,
        wallet: userFound.wallet,
        kind: isIncome ? "income" : "expense",
        direction: isIncome ? "credit" : "debit",
        money,
      };

      if (finalSubCategoryId) transaction.subCategory = finalSubCategoryId;
      if (finalCategoryId) transaction.category = finalCategoryId;
      if (tagIds.length > 0) transaction.tags = tagIds;
      if (resolvedAccount) transaction.account = resolvedAccount._id;

      transactions.push(transaction);
      i++;
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        ok: false,
        message: `No valid transactions found in the file. ${skipped.length > 0 ? `Skipped rows: ${skipped.map((s) => `row ${s.row} (${s.reason})`).join(", ")}` : ""}`,
      }, { status: 400 });
    }

    const newTransactions = await Transaction.create(transactions);

    const populatedTransactions = await Transaction.find({
      _id: { $in: newTransactions.map((t) => t._id) },
    })
      .populate("category")
      .populate("subCategory")
      .populate("tags")
      .populate("account")
      .lean();

    // The frontend dispatches this response's `data` straight into Redux
    // rather than re-fetching from get-transactions, so it needs the same
    // displayMoney DTO every other read route attaches - otherwise these
    // rows render with their raw legacy `amount` mislabeled as the Wallet's
    // primary currency until the next full refetch.
    const transactionsWithDisplayMoney = await attachDisplayMoneyToList(
      populatedTransactions,
      walletPrimaryCurrency
    );

    return NextResponse.json({
      data: transactionsWithDisplayMoney,
      message: `File saved${skipped.length > 0 ? ` (${skipped.length} rows skipped)` : ""}`,
      skipped,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({
      ok: false,
      message: (e as Error)?.message || "Unexpected error processing the file",
    }, { status: 500 });
  } finally {
    if (tmpFilePath) await unlink(tmpFilePath).catch(() => {});
  }
}
