import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
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

function parseFlexibleDate(value) {
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

// ±14h window around the parsed date — covers any timezone offset without
// crossing into adjacent calendar days for normal transactions
function dateWindow(date) {
  const ms = date.getTime();
  return {
    $gte: new Date(ms - 14 * 60 * 60 * 1000),
    $lte: new Date(ms + 14 * 60 * 60 * 1000),
  };
}

export async function POST(request, { params }) {
  let tmpFilePath = null;
  try {
    const data = await request.formData();
    const file = data.get("file");
    const deleteAll = data.get("deleteAll") === "true";
    if (!file) {
      return NextResponse.json({ ok: false, message: "No file received" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tmpFilePath = path.join("/tmp", `dedup_${Date.now()}.xlsx`);
    await writeFile(tmpFilePath, buffer);

    const workbook = await xlsxPopulate.fromFileAsync(tmpFilePath);

    // Version check
    let fileVersion = null;
    try {
      const dataSheet = workbook.sheet("_data");
      if (dataSheet) fileVersion = dataSheet.cell(1, 3).value();
    } catch (_) {}

    if (!fileVersion || String(fileVersion).trim() !== CURRENT_TEMPLATE_VERSION) {
      return NextResponse.json({
        ok: false,
        versionMismatch: true,
        message: `Outdated template (v${fileVersion || "unknown"}). Please use the latest template (v${CURRENT_TEMPLATE_VERSION}).`,
      }, { status: 400 });
    }

    if (!params?.id) {
      return NextResponse.json({ ok: false, message: "No user ID in URL" }, { status: 400 });
    }

    await dbConnection();
    const userFound = await User.findOne({ mail: params.id }).lean();
    if (!userFound) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    const sheet = workbook.sheet(0);

    // Parse all rows from Excel
    const excelRows = [];
    let i = 3;
    while (true) {
      const rawDate = sheet.cell(`A${i}`).value();
      if (rawDate === null || rawDate === undefined || rawDate === "") break;

      const date = parseFlexibleDate(rawDate);
      if (!date) { i++; continue; }

      const concept = sheet.cell(`B${i}`).value();
      const amountRaw = sheet.cell(`C${i}`).value();
      const amount = amountRaw !== null && amountRaw !== undefined ? Number(amountRaw) : 0;

      // Skip rows with no concept at all
      if (!concept) { i++; continue; }

      excelRows.push({ date, name: String(concept).trim(), amount });
      i++;
    }

    if (excelRows.length === 0) {
      return NextResponse.json({ ok: false, message: "No valid rows found in the file" }, { status: 400 });
    }

    // For each row, find all DB transactions with same day + name + amount, keep 1, remove rest
    let totalRemoved = 0;
    const removedIds = [];

    for (const row of excelRows) {
      const matches = await Transaction.find({
        user: userFound._id,
        amount: row.amount,
        name: { $regex: new RegExp(`^${row.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        date: dateWindow(row.date),
      })
        .select("_id")
        .lean();

      if (deleteAll ? matches.length >= 1 : matches.length > 1) {
        // deleteAll: remove every match; default: keep first, remove the rest
        const toDelete = deleteAll
          ? matches.map((m) => m._id)
          : matches.slice(1).map((m) => m._id);
        await Transaction.deleteMany({ _id: { $in: toDelete } });
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
    return NextResponse.json({ ok: false, message: e?.message || "Unexpected error" }, { status: 500 });
  } finally {
    if (tmpFilePath) await unlink(tmpFilePath).catch(() => {});
  }
}
