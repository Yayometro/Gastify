import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Tag from "@/model/Tag";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";

const CURRENT_TEMPLATE_VERSION = "2.0";

function excelSerialDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const offset = date_info.getTimezoneOffset() * 60000;
  return new Date(date_info.getTime() + offset);
}

async function resolveCategory(name, userId) {
  if (!name) return null;
  const cat = await Category.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    $or: [{ user: userId }, { isDefaultCatego: true }],
  }).lean();
  return cat ? cat._id : null;
}

async function resolveSubCategory(name, userId) {
  if (!name) return { subCategoryId: null, categoryId: null };
  const subCat = await SubCategory.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    $or: [{ user: userId }, { isDefaultSubCatego: true }],
  }).lean();
  if (!subCat) return { subCategoryId: null, categoryId: null };
  return {
    subCategoryId: subCat._id,
    categoryId: subCat.fatherCategory || null,
  };
}

async function resolveTags(rawTags, userId, walletId) {
  if (!rawTags) return [];
  const names = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
  const tagIds = [];
  for (const name of names) {
    let tag = await Tag.findOne({
      user: userId,
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }).lean();
    if (!tag) {
      tag = await Tag.create({ user: userId, wallet: walletId, name });
    }
    tagIds.push(tag._id);
  }
  return tagIds;
}

export async function POST(request, { params }) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tmpFilePath = path.join("/tmp", file.name);
    await writeFile(tmpFilePath, buffer);

    const workbook = await xlsxPopulate.fromFileAsync(tmpFilePath);

    // --- Version check ---
    let fileVersion = null;
    try {
      const dataSheet = workbook.sheet("_data");
      if (dataSheet) {
        fileVersion = dataSheet.cell(1, 3).value();
      }
    } catch (_) {}

    if (!fileVersion || String(fileVersion).trim() !== CURRENT_TEMPLATE_VERSION) {
      await unlink(tmpFilePath).catch(() => {});
      return NextResponse.json({
        ok: false,
        versionMismatch: true,
        currentVersion: CURRENT_TEMPLATE_VERSION,
        message: `Outdated template (v${fileVersion || "unknown"}). Please download the latest template (v${CURRENT_TEMPLATE_VERSION}) and try again.`,
        status: 400,
      });
    }

    const sheet = workbook.sheet(0);

    if (!params) throw new Error("No params ID received");

    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    if (!userFound) throw new Error("User not found");

    // Data starts at row 3 (row 1 = headers, row 2 = note)
    let i = 3;
    let isEmpty = false;
    const transactions = [];

    while (!isEmpty) {
      const serialDate = sheet.cell(`A${i}`).value();

      if (serialDate !== null && serialDate !== undefined) {
        const date =
          typeof serialDate === "number"
            ? excelSerialDateToJSDate(serialDate)
            : new Date(serialDate) || new Date();

        const concept = sheet.cell(`B${i}`).value() || "no concept";
        const amount = Number(sheet.cell(`C${i}`).value()) || 0;
        const typeRaw = sheet.cell(`D${i}`).value();
        const catName = sheet.cell(`E${i}`).value();
        const subCatName = sheet.cell(`F${i}`).value();
        const tagsRaw = sheet.cell(`G${i}`).value();

        // Default to Bill if Type is empty
        const type = typeRaw ? String(typeRaw).trim().toLowerCase() : "bill";
        const isBill = type === "bill";
        const isIncome = type === "income";

        // 4-case category/subcategory resolution
        let finalCategoryId = null;
        let finalSubCategoryId = null;

        if (subCatName) {
          const { subCategoryId, categoryId } = await resolveSubCategory(
            subCatName,
            userFound._id
          );
          finalSubCategoryId = subCategoryId;

          if (catName) {
            const explicitCatId = await resolveCategory(catName, userFound._id);
            if (
              explicitCatId &&
              categoryId &&
              String(explicitCatId) === String(categoryId)
            ) {
              finalCategoryId = explicitCatId;
            } else {
              finalCategoryId = categoryId; // trust subCat's parent on mismatch
            }
          } else {
            finalCategoryId = categoryId;
          }
        } else if (catName) {
          finalCategoryId = await resolveCategory(catName, userFound._id);
        }
        // if neither → null (saved uncategorized, same as manual transactions without category)

        const tagIds = await resolveTags(
          tagsRaw ? String(tagsRaw) : null,
          userFound._id,
          userFound.wallet
        );

        const transaction = {
          date,
          name: concept,
          amount,
          isBill,
          isIncome,
          isReadable: true,
          user: userFound._id,
          wallet: userFound.wallet,
        };

        if (finalSubCategoryId) transaction.subCategory = finalSubCategoryId;
        if (finalCategoryId) transaction.category = finalCategoryId;
        if (tagIds.length > 0) transaction.tags = tagIds;

        transactions.push(transaction);
        i++;
      } else {
        isEmpty = true;
      }
    }

    const newTransactions = await Transaction.create(transactions);
    if (!newTransactions) throw new Error("Transactions could not be saved");

    const populatedTransactions = await Transaction.find({
      _id: { $in: newTransactions.map((t) => t._id) },
    })
      .populate("category")
      .populate("subCategory")
      .populate("tags")
      .populate("account")
      .lean();

    await unlink(tmpFilePath);

    return NextResponse.json({
      data: populatedTransactions,
      message: "File saved",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
