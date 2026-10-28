// Single source of truth for the Gastify Excel template's version and column
// layout. Previously each of template/upload/export/deduplicate routes
// hardcoded its own copy of the version string (three independent "2.1"
// constants) - a version bump in one place silently desynced the others.
//
// v3.0 adds currency columns (plan section 15.1): Account Currency, Merchant
// Amount/Currency, Reporting Amount/Currency, and FX Source. v2.1 and earlier
// files are rejected outright (not silently re-mapped) since the column
// positions shifted (Amount moved from column C-only to Account
// Amount/Currency spanning C-D, and every column after D shifted right).

export const TEMPLATE_VERSION: string = "3.0";

// 1-indexed column numbers (matches xlsx-populate's cell(row, col) API).
export const COLUMNS = {
  DATE: 1,
  CONCEPT: 2,
  ACCOUNT_AMOUNT: 3,
  ACCOUNT_CURRENCY: 4,
  TYPE: 5,
  CATEGORY: 6,
  SUB_CATEGORY: 7,
  TAGS: 8,
  ACCOUNT: 9,
  MERCHANT_AMOUNT: 10,
  MERCHANT_CURRENCY: 11,
  REPORTING_AMOUNT: 12,
  REPORTING_CURRENCY: 13,
  FX_SOURCE: 14,
} as const;

export type ColumnsConfig = typeof COLUMNS;
export type ColumnKey = keyof typeof COLUMNS;

// The export keeps these English headers: it is a data export, not the template people fill in.
export const HEADERS: string[] = [
  "Date *",
  "Concept *",
  "Account Amount *",
  "Account Currency",
  "Type (Bill/Income) *",
  "Category",
  "SubCategory",
  "Tags (comma separated)",
  "Account",
  "Merchant Amount",
  "Merchant Currency",
  "Reporting Amount",
  "Reporting Currency",
  "FX Source",
];

// The template's headers in column order, as catalog keys: the template is written in the language of the person who downloads it.
export const TEMPLATE_HEADER_KEYS: readonly string[] = [
  "template.header.date",
  "template.header.concept",
  "template.header.accountAmount",
  "template.header.accountCurrency",
  "template.header.type",
  "template.header.category",
  "template.header.subCategory",
  "template.header.tags",
  "template.header.account",
  "template.header.merchantAmount",
  "template.header.merchantCurrency",
  "template.header.reportingAmount",
  "template.header.reportingCurrency",
  "template.header.fxSource",
];

// What the Type column may say for income, in each language the template is written in. Anything else counts as a bill (the default).
export const TEMPLATE_INCOME_WORDS: readonly string[] = ["income", "ingreso"];

export const COLUMN_WIDTHS: number[] = [18, 25, 16, 16, 18, 20, 20, 26, 20, 16, 16, 16, 16, 14];

export const EXPORT_NOTE_PREFIX: string =
  "Columns A-N are re-importable with the v3.0 template. Reporting Amount/Currency/FX Source reflect the exact historical value recorded for each transaction.";
