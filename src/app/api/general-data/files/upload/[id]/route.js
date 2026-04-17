import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
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

    let i = 2;
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
        const subCatName = sheet.cell(`F${i}`).value();
        const tagsRaw = sheet.cell(`G${i}`).value();

        // Type column overrides C/D if present
        let isBill = !!bill;
        let isIncome = !!income;
        if (typeCell) {
          const type = String(typeCell).trim().toLowerCase();
          isBill = type === "bill";
          isIncome = type === "income";
        }

        const amount = isBill ? bill || 1 : income || 1;

        // Resolve subCategory → auto-resolves category via fatherCategory
        const { subCategoryId, categoryId } = await resolveSubCategory(
          subCatName,
          userFound._id
        );

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

        if (subCategoryId) transaction.subCategory = subCategoryId;
        if (categoryId) transaction.category = categoryId;
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
