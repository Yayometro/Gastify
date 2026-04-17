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
  const names = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
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
    const sheet = workbook.sheet(0);

    if (!params) throw new Error("No params ID received");

    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    if (!userFound) throw new Error("User not found");

    // Data starts at row 3 (row 1 = headers, row 2 = instruction note)
    // Backward compatible: if old 4-column format detected (no row 2 note), start at row 2
    const noteCell = sheet.cell("A2").value();
    const isNewFormat = noteCell && String(noteCell).includes("NOTE");
    let i = isNewFormat ? 3 : 2;
    let isEmpty = false;
    const transactions = [];

    while (!isEmpty) {
      const dateCell = sheet.cell(`A${i}`);
      const serialDate = dateCell.value();

      if (serialDate !== null && serialDate !== undefined) {
        const date =
          typeof serialDate === "number"
            ? excelSerialDateToJSDate(serialDate)
            : new Date(serialDate) || new Date();

        const concept = sheet.cell(`B${i}`).value() || "no concept";
        const bill = sheet.cell(`C${i}`).value() || 0;
        const income = sheet.cell(`D${i}`).value() || 0;
        const typeCell = sheet.cell(`E${i}`).value();
        const catName = sheet.cell(`F${i}`).value();
        const subCatName = sheet.cell(`G${i}`).value();
        const tagsRaw = sheet.cell(`H${i}`).value();

        // Type column overrides C/D if present
        let isBill = !!bill;
        let isIncome = !!income;
        if (typeCell) {
          const type = String(typeCell).trim().toLowerCase();
          isBill = type === "bill";
          isIncome = type === "income";
        }

        const amount = isBill ? bill || 1 : income || 1;

        // Resolve category/subcategory with 4-case logic:
        // 1. Both filled → validate subCat belongs to cat, use both
        // 2. Only cat → use cat only
        // 3. Only subCat → auto-resolve cat from fatherCategory
        // 4. Neither → no category
        let finalCategoryId = null;
        let finalSubCategoryId = null;

        if (subCatName) {
          const { subCategoryId, categoryId } = await resolveSubCategory(
            subCatName,
            userFound._id
          );
          finalSubCategoryId = subCategoryId;

          if (catName) {
            // Both filled: validate they match
            const explicitCatId = await resolveCategory(catName, userFound._id);
            if (
              explicitCatId &&
              categoryId &&
              String(explicitCatId) === String(categoryId)
            ) {
              finalCategoryId = explicitCatId;
            } else {
              // Mismatch — trust subCat's parent
              finalCategoryId = categoryId;
            }
          } else {
            // Only subCat — auto-resolve parent
            finalCategoryId = categoryId;
          }
        } else if (catName) {
          // Only category, no subCategory
          finalCategoryId = await resolveCategory(catName, userFound._id);
        }

        // Resolve tags (find or create)
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

    await unlink(tmpFilePath);

    return NextResponse.json({
      data: newTransactions,
      message: "File saved",
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
