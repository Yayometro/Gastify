import { DEFAULT_LOCALE, type Locale } from "./locales";

// A catalog: the text of each key in one language. Keys are dotted, the first part is the namespace ("movements.filters.clear").
// Plurals are separate keys with a suffix: "movements.count_one" / "movements.count_other", chosen by the count.
export type Dict = Readonly<Record<string, string>>;
export type Params = Readonly<Record<string, string | number>>;
export type TranslateFn = (key: string, params?: Params) => string;

const PLURAL_RULES = new Map<Locale, Intl.PluralRules>();
function pluralRules(locale: Locale): Intl.PluralRules {
  let rules = PLURAL_RULES.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale === "en" ? "en-US" : "es-MX");
    PLURAL_RULES.set(locale, rules);
  }
  return rules;
}

// The text of a key in the person's language. If the key is missing there, it falls back to Spanish (the source), and if it is
// missing in Spanish too, to the key itself: a missing text shows up on screen instead of breaking the page.
export function translate(dict: Dict, fallback: Dict, locale: Locale, key: string, params?: Params): string {
  let template: string | undefined;
  if (params && typeof params.count === "number") {
    const form = pluralRules(locale).select(params.count);
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
