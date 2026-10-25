import { DEFAULT_LOCALE, type Locale } from "./locales";

// A catalog: the text of each key in one language. Keys are dotted, the first part is the namespace ("movements.filters.clear").
// Plurals are separate keys with a suffix: "movements.count_one" / "movements.count_other", chosen by the count.
export type Dict = Readonly<Record<string, string>>;
export type Params = Readonly<Record<string, string | number>>;
export type TranslateFn = (key: string, params?: Params) => string;

const PLURAL_RULES = new Map<Locale, Intl.PluralRules>();
// The plural form of a count. Some JavaScript engines (the phone's, for one) have no Intl.PluralRules: there, a whole number is
// "one" only when it is 1 and "other" otherwise, which is the rule of Spanish and English for whole numbers.
function pluralForm(locale: Locale, count: number): string {
  if (typeof Intl === "undefined" || typeof Intl.PluralRules !== "function") return count === 1 ? "one" : "other";
  let rules = PLURAL_RULES.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale === "en" ? "en-US" : "es-MX");
    PLURAL_RULES.set(locale, rules);
  }
  return rules.select(count);
}

// The text of a key in the person's language. If the key is missing there, it falls back to Spanish (the source), and if it is
// missing in Spanish too, to the key itself: a missing text shows up on screen instead of breaking the page.
export function translate(dict: Dict, fallback: Dict, locale: Locale, key: string, params?: Params): string {
  let template: string | undefined;
  if (params && typeof params.count === "number") {
    const form = pluralForm(locale, params.count);
    template = dict[`${key}_${form}`] ?? dict[`${key}_other`] ?? fallback[`${key}_${form}`] ?? fallback[`${key}_other`];
  }
  template ??= dict[key] ?? fallback[key] ?? fallback[`${key}_other`];
  if (template === undefined) return key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

// A translator bound to one language, with Spanish as the fallback. It is what components call as `t(key, params)`.
export function createTranslator(locale: Locale, dict: Dict, fallback: Dict = {}): TranslateFn {
  return (key, params) => translate(dict, fallback, locale, key, params);
}

export { DEFAULT_LOCALE };
