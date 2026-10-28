import xlsxPopulate from "xlsx-populate";
import { SUPPORTED_CURRENCIES } from "@gastify/core/money/currencies";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import { COLUMN_WIDTHS, COLUMNS, TEMPLATE_HEADER_KEYS, TEMPLATE_VERSION } from "./gastifyTemplate";

export interface TemplateData {
  categories: string[];
  subCategories: string[];
  accounts: string[];
  primaryCurrency: string;
}

// A dropdown list. xlsx-populate writes every option it was not given as the text "undefined" into the XML (operator,
// showInputMessage, prompt, promptTitle), which strict readers reject: that was the damage in the old template. Every option
// is set here, so the file only ever holds real values. "between" is what Excel itself uses for a list.
function dropdown(options: { errorTitle: string; error: string; formula1: string }) {
  return {
    type: "list",
    operator: "between",
    allowBlank: true,
    showErrorMessage: true,
    showInputMessage: false,
    prompt: "",
    promptTitle: "",
    ...options,
  };
}

// The Excel template in the given language: headers, instructions, dropdowns and one example row.
// The import reads the file by column position (see upload/[id]/route.ts), so the words can change with the language
// without breaking an import; the version in the hidden _data sheet is what the import checks.
export async function buildGastifyTemplate(t: TranslateFn, data: TemplateData): Promise<Buffer> {
  const workbook = await xlsxPopulate.fromBlankAsync();
  const mainSheet = workbook.sheet(0);
  mainSheet.name(t("template.sheet"));

  // --- Headers (row 1) ---
  TEMPLATE_HEADER_KEYS.forEach((key, i) => {
    const cell = mainSheet.cell(1, i + 1);
    cell.value(t(key));
    cell.style({
      bold: true,
      fill: { type: "solid", color: "7C3AED" },
      fontColor: "FFFFFF",
    });
  });

  // --- Instruction note (row 2) ---
  const noteCell = mainSheet.cell(2, 1);
  noteCell.value(t("template.note"));
  noteCell.style({
    italic: true,
    fill: { type: "solid", color: "FEF9C3" },
    fontColor: "92400E",
    wrapText: true,
  });
  mainSheet.range(2, 1, 2, TEMPLATE_HEADER_KEYS.length).merged(true);
  mainSheet.row(2).height(48);

  // --- Column widths ---
  COLUMN_WIDTHS.forEach((w, i) => {
    mainSheet.column(i + 1).width(w);
  });

  // --- Hidden _data sheet (categories, subcategories, version, accounts, currencies) ---
  const dataSheet = workbook.addSheet("_data");
  data.categories.forEach((name, idx) => dataSheet.cell(idx + 1, 1).value(name));
  data.subCategories.forEach((name, idx) => dataSheet.cell(idx + 1, 2).value(name));
  dataSheet.cell(1, 3).value(TEMPLATE_VERSION); // version stored here
  data.accounts.forEach((name, idx) => dataSheet.cell(idx + 1, 4).value(name));
  SUPPORTED_CURRENCIES.forEach((code, idx) => dataSheet.cell(idx + 1, 5).value(code));
  try { dataSheet.hidden(true); } catch {
    // ignore
  }

  // --- Data validation rows 3-202 ---
  const typeList = `"${t("template.type.bill")},${t("template.type.income")}"`;
  for (let row = 3; row <= 202; row++) {
    mainSheet.cell(row, COLUMNS.TYPE).dataValidation(dropdown({
      errorTitle: t("template.validation.typeTitle"),
      error: t("errors.please.enter.bill.or.income"),
      formula1: typeList,
    }));

    [COLUMNS.ACCOUNT_CURRENCY, COLUMNS.MERCHANT_CURRENCY, COLUMNS.REPORTING_CURRENCY].forEach((col) => {
      mainSheet.cell(row, col).dataValidation(dropdown({
        errorTitle: t("template.validation.currencyTitle"),
        error: t("errors.api.selectOneOf", { p1: SUPPORTED_CURRENCIES.join(", ") }),
        formula1: `_data!$E$1:$E$${SUPPORTED_CURRENCIES.length}`,
      }));
    });

    if (data.categories.length > 0) {
      mainSheet.cell(row, COLUMNS.CATEGORY).dataValidation(dropdown({
        errorTitle: t("template.validation.categoryTitle"),
        error: t("errors.please.select.a.category.from"),
        formula1: `_data!$A$1:$A$${data.categories.length}`,
      }));
    }

    if (data.subCategories.length > 0) {
      mainSheet.cell(row, COLUMNS.SUB_CATEGORY).dataValidation(dropdown({
        errorTitle: t("template.validation.subCategoryTitle"),
        error: t("errors.please.select.a.subcategory.from"),
        formula1: `_data!$B$1:$B$${data.subCategories.length}`,
      }));
    }

    if (data.accounts.length > 0) {
      mainSheet.cell(row, COLUMNS.ACCOUNT).dataValidation(dropdown({
        errorTitle: t("template.validation.accountTitle"),
        error: t("errors.please.select.an.account.from"),
        formula1: `_data!$D$1:$D$${data.accounts.length}`,
      }));
    }
  }

  // --- Example row (row 3) ---
  // A style without a fill makes xlsx-populate write an empty <fill/> into styles.xml, which strict readers reject (the damage in
  // the old template). A white solid fill looks the same as no fill and keeps the XML valid.
  mainSheet.cell(3, COLUMNS.DATE).value(new Date()).style({ numberFormat: "DD/MM/YYYY", fill: { type: "solid", color: "FFFFFF" } });
  mainSheet.cell(3, COLUMNS.CONCEPT).value(t("template.example.concept"));
  mainSheet.cell(3, COLUMNS.ACCOUNT_AMOUNT).value(100);
  mainSheet.cell(3, COLUMNS.ACCOUNT_CURRENCY).value(data.primaryCurrency);
  mainSheet.cell(3, COLUMNS.TYPE).value(t("template.type.bill"));
  mainSheet.cell(3, COLUMNS.CATEGORY).value("");
  mainSheet.cell(3, COLUMNS.SUB_CATEGORY).value(data.subCategories[0] || "");
  mainSheet.cell(3, COLUMNS.TAGS).value(t("template.example.tags"));
  mainSheet.cell(3, COLUMNS.ACCOUNT).value(data.accounts[0] || "");
  mainSheet.cell(3, COLUMNS.MERCHANT_AMOUNT).value("");
  mainSheet.cell(3, COLUMNS.MERCHANT_CURRENCY).value("");
  mainSheet.cell(3, COLUMNS.REPORTING_AMOUNT).value("");
  mainSheet.cell(3, COLUMNS.REPORTING_CURRENCY).value("");
  mainSheet.cell(3, COLUMNS.FX_SOURCE).value("");

  return (await workbook.outputAsync()) as Buffer;
}
