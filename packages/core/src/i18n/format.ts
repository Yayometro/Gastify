import { INTL_TAG, type Locale } from "./locales";

// Dates and numbers in the person's language. The formatters are built once per (language, options) and reused: creating an
// Intl formatter is the expensive part, so a list of 200 rows must not create 200 of them.
const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

function cached<T extends Intl.DateTimeFormat | Intl.NumberFormat>(kind: "date" | "number", locale: Locale, options: object, build: () => T): T {
  const key = `${kind}|${locale}|${JSON.stringify(options)}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = build();
    cache.set(key, formatter);
  }
  return formatter as T;
}

export function formatDate(value: Date | string | number, locale: Locale, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return cached("date", locale, options, () => new Intl.DateTimeFormat(INTL_TAG[locale], options)).format(date);
}

export function formatNumber(value: number, locale: Locale, options: Intl.NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) return "";
  return cached("number", locale, options, () => new Intl.NumberFormat(INTL_TAG[locale], options)).format(value);
}
