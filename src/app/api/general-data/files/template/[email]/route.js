import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import xlsxPopulate from "xlsx-populate";

export async function GET(request, { params }) {
  try {
    await dbConnection();

    const userFound = await User.findOne({ mail: params.email }).lean();
    if (!userFound) throw new Error("User not found for template generation");

    // Fetch user categories and subcategories (own + default)
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

    // Build workbook
    const workbook = await xlsxPopulate.fromBlankAsync();
    const mainSheet = workbook.sheet(0);
    mainSheet.name("Transactions");

    // --- Headers (row 1) ---
    const headers = [
      "Date",
      "Concept",
      "Bill Amount",
      "Income Amount",
      "Type (Bill/Income)",
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
    const noteCell = mainSheet.cell(2, 1);
    noteCell.value(
      "📌 NOTE: Fill Category OR SubCategory — if SubCategory is filled, Category is auto-resolved. Leave Category empty when using SubCategory."
    );
    noteCell.style({
      bold: false,
      italic: true,
      fill: { type: "solid", color: "FEF9C3" },
      fontColor: "92400E",
      wrapText: true,
    });
    // Merge note across all columns
    mainSheet.range(2, 1, 2, headers.length).merged(true);
    mainSheet.row(2).height(30);

    // --- Column widths ---
    [18, 25, 14, 14, 18, 22, 22, 28].forEach((w, i) => {
      mainSheet.column(i + 1).width(w);
    });

    // --- Hidden _data sheet ---
    const dataSheet = workbook.addSheet("_data");
    catNames.forEach((name, idx) => dataSheet.cell(idx + 1, 1).value(name));
    subCatNames.forEach((name, idx) => dataSheet.cell(idx + 1, 2).value(name));
    try { dataSheet.hidden(true); } catch (_) {}

    // --- Data validation rows 3-202 (data starts at row 3) ---
    for (let row = 3; row <= 202; row++) {
      // Column E: Type
      mainSheet.cell(row, 5).dataValidation({
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Invalid Type",
        error: 'Please enter "Bill" or "Income"',
        formula1: '"Bill,Income"',
      });

      // Column F: Category
      if (catNames.length > 0) {
        mainSheet.cell(row, 6).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid Category",
          error: "Please select a category from the list",
          formula1: `_data!$A$1:$A$${catNames.length}`,
        });
      }

      // Column G: SubCategory
      if (subCatNames.length > 0) {
        mainSheet.cell(row, 7).dataValidation({
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
    mainSheet.cell(3, 4).value(0);
    mainSheet.cell(3, 5).value("Bill");
    mainSheet.cell(3, 6).value("");
    mainSheet.cell(3, 7).value(subCatNames[0] || "");
    mainSheet.cell(3, 8).value("tag1, tag2");

    const buffer = await workbook.outputAsync();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gastify-template.xlsx"`,
      },
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e.message, ok: false }, { status: 500 });
  }
}
