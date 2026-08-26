import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import xlsxPopulate from "xlsx-populate";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";
import { TEMPLATE_VERSION, COLUMNS, HEADERS, COLUMN_WIDTHS, TEMPLATE_NOTE } from "@/lib/files/gastifyTemplate";

export async function GET(request, { params }) {
  try {
    await dbConnection();

    const userFound = await User.findOne({ mail: params.email }).lean();
    if (!userFound) throw new Error("User not found for template generation");

    const [categories, subCategories, accounts, wallet] = await Promise.all([
      Category.find({
        $or: [{ user: userFound._id }, { isDefaultCatego: true }],
      }).lean(),
      SubCategory.find({
        $or: [{ user: userFound._id }, { isDefaultSubCatego: true }],
      }).lean(),
      Account.find({ user: userFound._id, wallet: userFound.wallet }).lean(),
      Wallet.findById(userFound.wallet).lean(),
    ]);

    const catNames = categories.map((c) => c.name).filter(Boolean);
    const subCatNames = subCategories.map((s) => s.name).filter(Boolean);
    const accountNames = accounts.map((a) => a.name).filter(Boolean);
    const walletPrimaryCurrency = wallet?.primaryCurrency || "MXN";

    const workbook = await xlsxPopulate.fromBlankAsync();
    const mainSheet = workbook.sheet(0);
    mainSheet.name("Transactions");

    // --- Headers (row 1) ---
    HEADERS.forEach((h, i) => {
      const cell = mainSheet.cell(1, i + 1);
      cell.value(h);
      cell.style({
        bold: true,
        fill: { type: "solid", color: "7C3AED" },
        fontColor: "FFFFFF",
      });
    });

    // --- Instruction note (row 2) ---
    const noteCell = mainSheet.cell(2, 1);
    noteCell.value(TEMPLATE_NOTE);
    noteCell.style({
      italic: true,
      fill: { type: "solid", color: "FEF9C3" },
      fontColor: "92400E",
      wrapText: true,
    });
    mainSheet.range(2, 1, 2, HEADERS.length).merged(true);
    mainSheet.row(2).height(48);

    // --- Column widths ---
    COLUMN_WIDTHS.forEach((w, i) => {
      mainSheet.column(i + 1).width(w);
    });

    // --- Hidden _data sheet (categories, subcategories, version, accounts, currencies) ---
    const dataSheet = workbook.addSheet("_data");
    catNames.forEach((name, idx) => dataSheet.cell(idx + 1, 1).value(name));
    subCatNames.forEach((name, idx) => dataSheet.cell(idx + 1, 2).value(name));
    dataSheet.cell(1, 3).value(TEMPLATE_VERSION); // version stored here
    accountNames.forEach((name, idx) => dataSheet.cell(idx + 1, 4).value(name));
    SUPPORTED_CURRENCIES.forEach((code, idx) => dataSheet.cell(idx + 1, 5).value(code));
    try { dataSheet.hidden(true); } catch (_) {}

    // --- Data validation rows 3-202 ---
    for (let row = 3; row <= 202; row++) {
      mainSheet.cell(row, COLUMNS.TYPE).dataValidation({
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Invalid Type",
        error: 'Please enter "Bill" or "Income". Leaving blank defaults to Bill.',
        formula1: '"Bill,Income"',
      });

      [COLUMNS.ACCOUNT_CURRENCY, COLUMNS.MERCHANT_CURRENCY, COLUMNS.REPORTING_CURRENCY].forEach((col) => {
        mainSheet.cell(row, col).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid Currency",
          error: `Please select one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
          formula1: `_data!$E$1:$E$${SUPPORTED_CURRENCIES.length}`,
        });
      });

      if (catNames.length > 0) {
        mainSheet.cell(row, COLUMNS.CATEGORY).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid Category",
          error: "Please select a category from the list",
          formula1: `_data!$A$1:$A$${catNames.length}`,
        });
      }

      if (subCatNames.length > 0) {
        mainSheet.cell(row, COLUMNS.SUB_CATEGORY).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid SubCategory",
          error: "Please select a subcategory from the list",
          formula1: `_data!$B$1:$B$${subCatNames.length}`,
        });
      }

      if (accountNames.length > 0) {
        mainSheet.cell(row, COLUMNS.ACCOUNT).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid Account",
          error: "Please select an account from the list",
          formula1: `_data!$D$1:$D$${accountNames.length}`,
        });
      }
    }

    // --- Example row (row 3) ---
    mainSheet.cell(3, COLUMNS.DATE).value(new Date()).style("numberFormat", "DD/MM/YYYY");
    mainSheet.cell(3, COLUMNS.CONCEPT).value("Example transaction");
    mainSheet.cell(3, COLUMNS.ACCOUNT_AMOUNT).value(100);
    mainSheet.cell(3, COLUMNS.ACCOUNT_CURRENCY).value(walletPrimaryCurrency);
    mainSheet.cell(3, COLUMNS.TYPE).value("Bill");
    mainSheet.cell(3, COLUMNS.CATEGORY).value("");
    mainSheet.cell(3, COLUMNS.SUB_CATEGORY).value(subCatNames[0] || "");
    mainSheet.cell(3, COLUMNS.TAGS).value("tag1, tag2");
    mainSheet.cell(3, COLUMNS.ACCOUNT).value(accountNames[0] || "");
    mainSheet.cell(3, COLUMNS.MERCHANT_AMOUNT).value("");
    mainSheet.cell(3, COLUMNS.MERCHANT_CURRENCY).value("");
    mainSheet.cell(3, COLUMNS.REPORTING_AMOUNT).value("");
    mainSheet.cell(3, COLUMNS.REPORTING_CURRENCY).value("");
    mainSheet.cell(3, COLUMNS.FX_SOURCE).value("");

    const buffer = await workbook.outputAsync();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gastify-template-v${TEMPLATE_VERSION}.xlsx"`,
      },
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e.message, ok: false }, { status: 500 });
  }
}
