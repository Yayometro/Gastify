import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import Account from "@/model/Account";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

const CURRENT_TEMPLATE_VERSION = "2.1";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function excelSerialDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const offset = date_info.getTimezoneOffset() * 60000;
  return new Date(date_info.getTime() + offset);
}

function parseFlexibleDate(value) {
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

async function resolveCategory(name, userId) {
  if (name === null || name === undefined) return null;
  const safe = escapeRegex(String(name).trim());
  if (!safe) return null;
  const cat = await Category.findOne({
    name: { $regex: new RegExp(`^${safe}$`, "i") },
    $or: [{ user: userId }, { isDefaultCatego: true }],
  }).lean();
  return cat ? cat._id : null;
}

async function resolveSubCategory(name, userId) {
  if (name === null || name === undefined) return { subCategoryId: null, categoryId: null };
  const safe = escapeRegex(String(name).trim());
  if (!safe) return { subCategoryId: null, categoryId: null };
  const subCat = await SubCategory.findOne({
    name: { $regex: new RegExp(`^${safe}$`, "i") },
    $or: [{ user: userId }, { isDefaultSubCatego: true }],
  }).lean();
  if (!subCat) return { subCategoryId: null, categoryId: null };
  return { subCategoryId: subCat._id, categoryId: subCat.fatherCategory || null };
}

async function resolveAccount(name, userId, walletId) {
  if (name === null || name === undefined) return null;
  const safe = escapeRegex(String(name).trim());
  if (!safe) return null;
  const acc = await Account.findOne({
    name: { $regex: new RegExp(`^${safe}$`, "i") },
    user: userId,
    wallet: walletId,
  }).lean();
  return acc ? acc._id : null;
}

async function resolveTags(rawTags, userId, walletId) {
  if (!rawTags) return [];
  const names = String(rawTags).split(",").map((t) => t.trim()).filter(Boolean);
  const tagIds = [];
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

export async function POST(request, { params }) {
  let tmpFilePath = null;
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!file) {
      return NextResponse.json({ ok: false, message: "No file received" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tmpFilePath = path.join("/tmp", `upload_${Date.now()}.xlsx`);
    await writeFile(tmpFilePath, buffer);

    const workbook = await xlsxPopulate.fromFileAsync(tmpFilePath);

    // --- Version check ---
    let fileVersion = null;
    try {
      const dataSheet = workbook.sheet("_data");
      if (dataSheet) fileVersion = dataSheet.cell(1, 3).value();
    } catch (_) {}

    if (!fileVersion || String(fileVersion).trim() !== CURRENT_TEMPLATE_VERSION) {
      return NextResponse.json({
        ok: false,
        versionMismatch: true,
        currentVersion: CURRENT_TEMPLATE_VERSION,
        message: `Outdated template (v${fileVersion || "unknown"}). Please download the latest template (v${CURRENT_TEMPLATE_VERSION}) and try again.`,
      }, { status: 400 });
    }

    const sheet = workbook.sheet(0);

    if (!params?.id) {
      return NextResponse.json({ ok: false, message: "No user ID in URL" }, { status: 400 });
    }

    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    if (!userFound) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    // Data starts at row 3 (row 1 = headers, row 2 = note)
    let i = 3;
    const transactions = [];
    const skipped = [];

    while (true) {
      const rawDate = sheet.cell(`A${i}`).value();
      if (rawDate === null || rawDate === undefined || rawDate === "") break;

      const date = parseFlexibleDate(rawDate);
      if (!date) {
        skipped.push({ row: i, reason: `Invalid date: "${rawDate}"` });
        i++;
        continue;
      }

      const concept = sheet.cell(`B${i}`).value();
      const amountRaw = sheet.cell(`C${i}`).value();
      const amount = amountRaw !== null && amountRaw !== undefined ? Number(amountRaw) : 0;

      if (!concept && amount === 0) {
        // Likely the example row or truly empty — skip silently
        i++;
        continue;
      }

      const typeRaw = sheet.cell(`D${i}`).value();
      const catName = sheet.cell(`E${i}`).value();
      const subCatName = sheet.cell(`F${i}`).value();
      const tagsRaw = sheet.cell(`G${i}`).value();
      const accountName = sheet.cell(`H${i}`).value();

      const type = typeRaw ? String(typeRaw).trim().toLowerCase() : "bill";
      const isBill = type !== "income";
      const isIncome = type === "income";

      let finalCategoryId = null;
      let finalSubCategoryId = null;

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

      const resolvedAccountId = await resolveAccount(
        accountName,
        userFound._id,
        userFound.wallet
      );

      const transaction = {
        date,
        name: concept || "no concept",
        amount: isNaN(amount) ? 0 : amount,
        isBill,
        isIncome,
        isReadable: true,
        user: userFound._id,
        wallet: userFound.wallet,
      };

      if (finalSubCategoryId) transaction.subCategory = finalSubCategoryId;
      if (finalCategoryId) transaction.category = finalCategoryId;
      if (tagIds.length > 0) transaction.tags = tagIds;
      if (resolvedAccountId) transaction.account = resolvedAccountId;

      transactions.push(transaction);
      i++;
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        ok: false,
        message: `No valid transactions found in the file. ${skipped.length > 0 ? `Skipped rows: ${skipped.map(s => `row ${s.row} (${s.reason})`).join(", ")}` : ""}`,
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

    return NextResponse.json({
      data: populatedTransactions,
      message: `File saved${skipped.length > 0 ? ` (${skipped.length} rows skipped)` : ""}`,
      skipped,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({
      ok: false,
      message: e?.message || "Unexpected error processing the file",
    }, { status: 500 });
  } finally {
    if (tmpFilePath) await unlink(tmpFilePath).catch(() => {});
  }
}
