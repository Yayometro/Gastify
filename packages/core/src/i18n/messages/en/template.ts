import type template from "../es/template";

// English for the "template" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof template, string> = {
  "template.sheet": "Transactions",
  "template.header.date": "Date *",
  "template.header.concept": "Concept *",
  "template.header.accountAmount": "Account Amount *",
  "template.header.accountCurrency": "Account Currency",
  "template.header.type": "Type (Bill/Income) *",
  "template.header.category": "Category",
  "template.header.subCategory": "SubCategory",
  "template.header.tags": "Tags (comma separated)",
  "template.header.account": "Account",
  "template.header.merchantAmount": "Merchant Amount",
  "template.header.merchantCurrency": "Merchant Currency",
  "template.header.reportingAmount": "Reporting Amount",
  "template.header.reportingCurrency": "Reporting Currency",
  "template.header.fxSource": "FX Source",
  "template.type.bill": "Bill",
  "template.type.income": "Income",
  "template.note":
    "📌 REQUIRED: Date, Concept, Account Amount, Type (* = required). Type defaults to Bill if empty. " +
    "Account Currency: required if no Account is selected (blank + no Account defaults to your Wallet's primary currency); when an Account is selected, it must match that Account's currency or be left blank. " +
    "Fill Category OR SubCategory — not both. Merchant Amount needs a Merchant Currency (and vice versa) - only fill these if you were charged in a different currency than your Account. " +
    "Reporting Amount is the exact equivalent in your Wallet's primary currency, if you already know it; its currency must equal your Wallet's primary currency. Leave both blank to let Gastify estimate it from historical exchange rates. " +
    "FX Source: leave blank for an automatic estimate, or write \"manual\" if Reporting Amount is an exact value you're entering yourself.",
  "template.example.concept": "Example transaction",
  "template.example.tags": "tag1, tag2",
  "template.validation.typeTitle": "Invalid Type",
  "template.validation.currencyTitle": "Invalid Currency",
  "template.validation.categoryTitle": "Invalid Category",
  "template.validation.subCategoryTitle": "Invalid SubCategory",
  "template.validation.accountTitle": "Invalid Account",
};

export default en;
