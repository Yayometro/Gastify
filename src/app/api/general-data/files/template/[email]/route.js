import { NextResponse } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import SubCategory from "@/model/SubCategory";
import xlsxPopulate from "xlsx-populate";

export async function GET(request, { params }) {
  try {
    await dbConnection();

    const userFound = await User.findOne({ mail: params.email }).lean();
    if (!userFound) throw new Error("User not found for template generation");

    // Fetch user subcategories (own + default)
    const subCategories = await SubCategory.find({
      $or: [{ user: userFound._id }, { isDefaultSubCatego: true }],
    })
      .populate("fatherCategory", "name")
      .lean();

    const subCatNames = subCategories.map((s) => s.name).filter(Boolean);

    // Build workbook
    const workbook = await xlsxPopulate.fromBlankAsync();
    const mainSheet = workbook.sheet(0);
    mainSheet.name("Transactions");

    // --- Headers ---
    const headers = [
      "Date",
      "Concept",
      "Bill Amount",
      "Income Amount",
      "Type (Bill/Income)",
      "SubCategory",
      "Tags (comma separated)",
    ];
    headers.forEach((h, i) => {
      const cell = mainSheet.cell(1, i + 1);
      cell.value(h);
      cell.style({ bold: true, fill: { type: "solid", color: "7C3AED" }, fontColor: "FFFFFF" });
    });

    // Column widths
    [18, 25, 14, 14, 18, 22, 28].forEach((w, i) => {
      mainSheet.column(i + 1).width(w);
    });

    // --- Hidden _data sheet for subcategory dropdown ---
    const dataSheet = workbook.addSheet("_data");
    subCatNames.forEach((name, idx) => {
      dataSheet.cell(idx + 1, 1).value(name);
    });
    try { dataSheet.hidden(true); } catch (_) {}

    // --- Data validation rows 2-201 ---
    const maxRows = 201;
    for (let row = 2; row <= maxRows; row++) {
      // Column E: Type dropdown
      mainSheet.cell(row, 5).dataValidation({
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Invalid Type",
        error: 'Please enter "Bill" or "Income"',
        formula1: '"Bill,Income"',
      });

      // Column F: SubCategory dropdown (referencing _data sheet)
      if (subCatNames.length > 0) {
        mainSheet.cell(row, 6).dataValidation({
          type: "list",
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: "Invalid SubCategory",
          error: "Please select a subcategory from the list",
          formula1: `_data!$A$1:$A$${subCatNames.length}`,
        });
      }
    }

    // --- Example row ---
    mainSheet.cell(2, 1).value(new Date()).style("numberFormat", "DD/MM/YYYY");
    mainSheet.cell(2, 2).value("Example transaction");
    mainSheet.cell(2, 3).value(100);
    mainSheet.cell(2, 4).value(0);
    mainSheet.cell(2, 5).value("Bill");
    mainSheet.cell(2, 6).value(subCatNames[0] || "");
    mainSheet.cell(2, 7).value("tag1, tag2");

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
