import type { Dict, Params, TranslateFn } from "@gastify/core/i18n/translate";
import { createTranslator } from "@gastify/core/i18n/translate";
import type { Locale } from "@gastify/core/i18n/locales";
import { setBreakdownLabels } from "@gastify/core/history/categoryBreakdown";
import { setTransactionLabels } from "@gastify/core/transformers/transactionsChange";

// The translator and the language of the screen, for code that runs outside the components (the file helpers, the messages
// of the data calls, the constants of a module). The provider sets both each time a language loads, so they always follow the
// screen's language. Before the first load the key itself is shown (the provider waits for the texts before it draws).
let current: TranslateFn | null = null;
let locale: Locale = "es";

export function setCurrentTranslator(next: Locale, messages: Dict): void {
  const t = createTranslator(next, messages);
  current = t;
  locale = next;
  // The names the data layer writes for the rows without a category and the totals, in the language on screen.
  setBreakdownLabels({ noCategory: t("mobile.sin.categoria"), noSubcategory: t("mobile.sin.subcategoria") });
  setTransactionLabels({ noCategory: t("mobile.sin.categoria"), totalExpenses: t("mobile.total.de.gastos"), totalIncomes: t("mobile.total.de.ingresos") });
}

// The language on screen (the month names and the dates of the helpers follow it).
export function currentLocale(): Locale {
  return locale;
}

export function tNow(key: string, params?: Params): string {
  return current ? current(key, params) : key;
}
