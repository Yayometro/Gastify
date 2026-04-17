import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import xlsxPopulate from "xlsx-populate";

export const TEMPLATE_VERSION = "2.0";

export async function GET(request, { params }) {
  try {
    await dbConnection();

    const userFound = await User.findOne({ mail: params.email }).lean();
    if (!userFound) throw new Error("User not found for template generation");

    const [categories, subCategories] = await Promise.all([
      Category.find({
        $or: [{ user: userFound._id }, { isDefaultCatego: true }],
      }).lean(),
      SubCategory.find({
        $or: [{ user: userFound._id }, { isDefaultSubCatego: true }],
      }).lean(),
    ]);

    const catNames = categories.map((c) => c.name).filter(Boolean);
    const subCatNames = subCategories.map((s) => s.name).filter(Boolean);

    const workbook = await xlsxPopulate.fromBlankAsync();
    const mainSheet = workbook.sheet(0);
    mainSheet.name("Transactions");

    // --- Headers (row 1) ---
    const headers = [
      "Date *",
      "Concept *",
      "Amount *",
      "Type (Bill/Income) *",
      "Category",
      "SubCategory",
      "Tags (comma separated)",
    ];
    headers.forEach((h, i) => {
      const cell = mainSheet.cell(1, i + 1);
      cell.value(h);
      cell.style({
        bold: true,
        fill: { type: "solid", color: "7C3AED" },
        fontColor: "FFFFFF",
      });
    });

    // --- Instruction note (row 2) ---
    const noteText =
      "📌 REQUIRED: Date, Concept, Amount, Type (* = required). Type defaults to Bill if empty. " +
      "Fill Category OR SubCategory — not both. If SubCategory is filled, Category is auto-resolved. " +
      "Transactions without Category are saved uncategorized.";
    const noteCell = mainSheet.cell(2, 1);
    noteCell.value(noteText);
    noteCell.style({
      italic: true,
      fill: { type: "solid", color: "FEF9C3" },
      fontColor: "92400E",
      wrapText: true,
    });
    mainSheet.range(2, 1, 2, headers.length).merged(true);
    mainSheet.row(2).height(36);

    // --- Column widths ---
    [18, 25, 14, 18, 22, 22, 28].forEach((w, i) => {
      mainSheet.column(i + 1).width(w);
    });

    // --- Hidden _data sheet (categories, subcategories, version) ---
    const dataSheet = workbook.addSheet("_data");
    catNames.forEach((name, idx) => dataSheet.cell(idx + 1, 1).value(name));
    subCatNames.forEach((name, idx) => dataSheet.cell(idx + 1, 2).value(name));
    dataSheet.cell(1, 3).value(TEMPLATE_VERSION); // version stored here
    try { dataSheet.hidden(true); } catch (_) {}

    // --- Data validation rows 3-202 ---
    for (let row = 3; row <= 202; row++) {
      mainSheet.cell(row, 4).dataValidation({
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Invalid Type",
        error: 'Please enter "Bill" or "Income". Leaving blank defaults to Bill.',
        formula1: '"Bill,Income"',
      });

      if (catNames.length > 0) {
        mainSheet.cell(row, 5).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid Category",
          error: "Please select a category from the list",
          formula1: `_data!$A$1:$A$${catNames.length}`,
        });
      }

      if (subCatNames.length > 0) {
        mainSheet.cell(row, 6).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid SubCategory",
          error: "Please select a subcategory from the list",
          formula1: `_data!$B$1:$B$${subCatNames.length}`,
        });
      }
    }

    // --- Example row (row 3) ---
    mainSheet.cell(3, 1).value(new Date()).style("numberFormat", "DD/MM/YYYY");
    mainSheet.cell(3, 2).value("Example transaction");
    mainSheet.cell(3, 3).value(100);
    mainSheet.cell(3, 4).value("Bill");
    mainSheet.cell(3, 5).value("");
    mainSheet.cell(3, 6).value(subCatNames[0] || "");
    mainSheet.cell(3, 7).value("tag1, tag2");

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
