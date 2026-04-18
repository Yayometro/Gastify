import { NextResponse } from "next/server";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { TEMPLATE_VERSION } from "@/app/api/general-data/files/template/[email]/route";
import dayjs from "dayjs";

const HEADERS = [
  "Date *",
  "Concept *",
  "Amount *",
  "Type (Bill/Income) *",
  "Category",
  "SubCategory",
  "Tags (comma separated)",
  "Account",
];

const COL_WIDTHS = [18, 28, 14, 18, 22, 22, 28, 22];

export async function POST(request, { params }) {
  try {
    const { transactionIds } = await request.json();
    if (!transactionIds?.length) {
      return NextResponse.json({ ok: false, message: "No transactions to export" }, { status: 400 });
    }

    await dbConnection();
    const user = await User.findOne({ mail: params.email }).lean();
    if (!user) return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });

    const transactions = await Transaction.find({
      _id: { $in: transactionIds },
      user: user._id,
    })
      .populate("category")
      .populate("subCategory")
      .populate("account")
      .populate("tags")
      .sort({ date: -1 })
      .lean();

    const workbook = await xlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.name("Transactions");

    // Row 1 — headers (match template style)
    HEADERS.forEach((h, i) => {
      sheet.cell(1, i + 1).value(h).style({
        bold: true,
        fill: { type: "solid", color: "7C3AED" },
        fontColor: "FFFFFF",
      });
    });

    // Row 2 — note
    const noteCell = sheet.cell(2, 1);
    noteCell.value(`Gastify export — ${transactions.length} transaction(s) — ${dayjs().format("DD/MM/YYYY HH:mm")}. Columns A–G are re-importable. Column H (Account) is informational.`);
    noteCell.style({
      italic: true,
      fill: { type: "solid", color: "FEF9C3" },
      fontColor: "92400E",
      wrapText: true,
    });
    sheet.range(2, 1, 2, HEADERS.length).merged(true);
    sheet.row(2).height(36);

    // Column widths
    COL_WIDTHS.forEach((w, i) => sheet.column(i + 1).width(w));

    // Data rows starting at row 3
    transactions.forEach((t, idx) => {
      const row = idx + 3;
      const dateStr = dayjs(t.date || t.createdAt).format("DD/MM/YYYY");
      const typeStr = t.isBill ? "Bill" : "Income";
      const catName = t.category?.name || "";
      const subCatName = t.subCategory?.name || "";
      const tagsStr = (t.tags || []).map((tag) => tag.name).filter(Boolean).join(", ");
      const accountName = t.account?.name || "";

      sheet.cell(row, 1).value(dateStr);
      sheet.cell(row, 2).value(t.name || "");
      sheet.cell(row, 3).value(t.amount ?? 0);
      sheet.cell(row, 4).value(typeStr);
      sheet.cell(row, 5).value(catName);
      sheet.cell(row, 6).value(subCatName);
      sheet.cell(row, 7).value(tagsStr);
      sheet.cell(row, 8).value(accountName);
    });

    // _data sheet with version so file can be re-imported
    const dataSheet = workbook.addSheet("_data");
    dataSheet.cell(1, 3).value(TEMPLATE_VERSION);
    try { dataSheet.hidden(true); } catch (_) {}

    const buffer = await workbook.outputAsync();
    const filename = `gastify-export-${dayjs().format("YYYY-MM-DD")}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Export failed" }, { status: 500 });
  }
}
