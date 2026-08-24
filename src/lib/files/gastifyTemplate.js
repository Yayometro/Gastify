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

export const TEMPLATE_VERSION = "3.0";

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
};

export const HEADERS = [
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

export const COLUMN_WIDTHS = [18, 25, 16, 16, 18, 20, 20, 26, 20, 16, 16, 16, 16, 14];

export const TEMPLATE_NOTE =
  "📌 REQUIRED: Date, Concept, Account Amount, Type (* = required). Type defaults to Bill if empty. " +
  "Account Currency: required if no Account is selected (blank + no Account defaults to your Wallet's primary currency); when an Account is selected, it must match that Account's currency or be left blank. " +
  "Fill Category OR SubCategory — not both. Merchant Amount needs a Merchant Currency (and vice versa) - only fill these if you were charged in a different currency than your Account. " +
  "Reporting Amount is the exact equivalent in your Wallet's primary currency, if you already know it; its currency must equal your Wallet's primary currency. Leave both blank to let Gastify estimate it from historical exchange rates. " +
  "FX Source: leave blank for an automatic estimate, or write \"manual\" if Reporting Amount is an exact value you're entering yourself.";

export const EXPORT_NOTE_PREFIX =
  "Columns A-N are re-importable with the v3.0 template. Reporting Amount/Currency/FX Source reflect the exact historical value recorded for each transaction.";
