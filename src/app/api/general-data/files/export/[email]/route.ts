import { NextResponse, type NextRequest } from "next/server";
import xlsxPopulate from "xlsx-populate";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import "@/model/Account";
import "@/model/Category";
import "@/model/SubCategory";
import "@/model/Tag";
import dbConnection from "@/app/api/dbConnection";
import { TEMPLATE_VERSION, COLUMNS, HEADERS, COLUMN_WIDTHS, EXPORT_NOTE_PREFIX } from "@/lib/files/gastifyTemplate";
import { getTransactionNativeMoney } from "@/lib/money/currencies";
import { buildLegacyMoney } from "@/lib/money/transactionMoney";
import { auth } from "@/lib/auth/betterAuth";
import dayjs from "dayjs";

export interface ExportTransactionsRequestBody {
  transactionIds?: string[];
}

export interface ExportErrorResponse {
  ok: false;
  message: string;
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<ExportErrorResponse> | NextResponse | Response> {
  try {
    const { transactionIds } = (await request.json()) as ExportTransactionsRequestBody;
    if (!transactionIds?.length) {
      return NextResponse.json({ ok: false, message: "No transactions to export" }, { status: 400 });
    }

    // Security fix: this route previously lacked session authentication and trusted
    // params.email from the URL to export transaction records (IDOR).
    // We now verify auth.api.getSession, resolve user identity exclusively from the session,
    // and query transactions scoped to user._id.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    await dbConnection();
    const user = await User.findOne({ mail: sesion.user.email }).lean();
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
    noteCell.value(`Gastify export — ${transactions.length} transaction(s) — ${dayjs().format("DD/MM/YYYY HH:mm")}. ${EXPORT_NOTE_PREFIX}`);
    noteCell.style({
      italic: true,
      fill: { type: "solid", color: "FEF9C3" },
      fontColor: "92400E",
      wrapText: true,
    });
    sheet.range(2, 1, 2, HEADERS.length).merged(true);
    sheet.row(2).height(36);

    // Column widths
    COLUMN_WIDTHS.forEach((w, i) => sheet.column(i + 1).width(w));

    // Data rows starting at row 3
    transactions.forEach((t: Record<string, unknown>, idx: number) => {
      const row = idx + 3;
      const dateStr = dayjs((t.date || t.createdAt) as string | Date).format("DD/MM/YYYY");
      const typeStr = t.isBill ? "Bill" : "Income";
      const catName = (t.category as { name?: string } | undefined)?.name || "";
      const subCatName = (t.subCategory as { name?: string } | undefined)?.name || "";
      const tagsStr = ((t.tags as { name?: string }[]) || []).map((tag) => tag.name).filter(Boolean).join(", ");
      const accountName = (t.account as { name?: string } | undefined)?.name || "";

      // .lean() never applies schema defaults - a Transaction written before
      // Phase 5's money-aware writes has no `money` field in its stored BSON
      // at all, so it needs the same legacy MXN-rate-1 fallback used
      // everywhere else in this migration rather than exporting a blank cell.
      const native =
        getTransactionNativeMoney(t) ||
        (buildLegacyMoney as (opts: { amount?: number; date?: Date }) => { account: { amountMinor: number; currency: string } })({
          amount: t.amount as number,
          date: t.date as Date,
        }).account;
      const reporting =
        (t.money as { reporting?: { amountMinor: number; currency: string } } | undefined)?.reporting ||
        (buildLegacyMoney as (opts: { amount?: number; date?: Date }) => { reporting: { amountMinor: number; currency: string } })({
          amount: t.amount as number,
          date: t.date as Date,
        }).reporting;
      const merchant = (t.money as { merchant?: { amountMinor: number; currency: string } | null } | undefined)?.merchant || null;

      sheet.cell(row, COLUMNS.DATE).value(dateStr);
      sheet.cell(row, COLUMNS.CONCEPT).value(t.name || "");
      sheet.cell(row, COLUMNS.ACCOUNT_AMOUNT).value(native.amountMinor / 100);
      sheet.cell(row, COLUMNS.ACCOUNT_CURRENCY).value(native.currency);
      sheet.cell(row, COLUMNS.TYPE).value(typeStr);
      sheet.cell(row, COLUMNS.CATEGORY).value(catName);
      sheet.cell(row, COLUMNS.SUB_CATEGORY).value(subCatName);
      sheet.cell(row, COLUMNS.TAGS).value(tagsStr);
      sheet.cell(row, COLUMNS.ACCOUNT).value(accountName);
      if (merchant) {
        sheet.cell(row, COLUMNS.MERCHANT_AMOUNT).value(merchant.amountMinor / 100);
        sheet.cell(row, COLUMNS.MERCHANT_CURRENCY).value(merchant.currency);
      }
      if (reporting) {
        sheet.cell(row, COLUMNS.REPORTING_AMOUNT).value(reporting.amountMinor / 100);
        sheet.cell(row, COLUMNS.REPORTING_CURRENCY).value(reporting.currency);
        // Exporting the exact stored reporting snapshot as "manual" on
        // re-import preserves it exactly, rather than letting a re-import
        // re-derive a possibly different ECB rate for the same date.
        sheet.cell(row, COLUMNS.FX_SOURCE).value("manual");
      }
    });

    // _data sheet with version so file can be re-imported
    const dataSheet = workbook.addSheet("_data");
    dataSheet.cell(1, 3).value(TEMPLATE_VERSION);
    try { dataSheet.hidden(true); } catch {
      // ignore
    }

    const buffer = await workbook.outputAsync();
    const filename = `gastify-export-${dayjs().format("YYYY-MM-DD")}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ ok: false, message: (e as Error)?.message || "Export failed" }, { status: 500 });
  }
}
