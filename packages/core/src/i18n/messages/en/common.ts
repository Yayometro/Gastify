import type common from "../es/common";

// English for the common words. Same keys as the Spanish catalog (the tests check it).
const en: Record<keyof typeof common, string> = {
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.close": "Close",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "common.clear": "Clear",
  "common.confirm": "Confirm",
  "common.accept": "Accept",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.apply": "Apply",
  "common.reset": "Reset",
  "common.yes": "Yes",
  "common.no": "No",
  "common.all": "All",
  "common.none": "None",
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.understood": "Got it",
  "common.error": "Something went wrong",
  "common.success": "Done",
  "common.nothingHere": "Nothing here yet.",
  "common.emptyFallback": "No data for this period.",
  "common.from": "From",
  "common.to": "To",
  "common.count_one": "{count} item",
  "common.count_other": "{count} items",
  "common.language": "Language",
  "common.languageSpanish": "Spanish",
  "common.languageEnglish": "English",
  "common.metaDescription": "Take control of your incomes and bills",
};

export default en;
