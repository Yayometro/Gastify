// The dates the person reads, in their language. The names and the word order come from Intl (the engine the money and
// number formats use), so each language writes its own. The formatters are cached: a list of dates builds each one once.
import { INTL_TAG, type Locale } from "./locales";
import type { TranslateFn } from "./translate";

const cache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(locale: Locale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(INTL_TAG[locale], options);
  cache.set(key, formatter);
  return formatter;
}

const capitalize = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// Spanish puts a comma after the weekday ("lunes, 14 de octubre"); the app writes it without one. English keeps its comma.
const tidy = (text: string, locale: Locale): string => (locale === "es" ? text.replace(/^([^,]+), /, "$1 ") : text);

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "Octubre 2026", with the first letter in capitals.
export function monthTitle(date: Date, locale: Locale): string {
  return capitalize(formatterFor(locale, { month: "long", year: "numeric" }).format(date).replace(" de ", " "));
}

// The name of a month (0 = January): "octubre" or "oct" (Spanish), "October" or "Oct" (English).
export function monthName(month: number, locale: Locale, style: "long" | "short" = "long"): string {
  return formatterFor(locale, { month: style }).format(new Date(2000, month, 1));
}

// "Lunes 19 de octubre de 2026", for a date field.
export function longDate(date: Date, locale: Locale): string {
  return capitalize(tidy(formatterFor(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date), locale));
}

// "1 ago 2026 – 31 oct 2026"
export function rangeLabel(start: Date, end: Date, locale: Locale): string {
  const short = formatterFor(locale, { day: "numeric", month: "short", year: "numeric" });
  return `${short.format(start)} – ${short.format(end)}`;
}

// "Hoy", "Ayer", or "lunes 14 de octubre" (with the year when it is not the current one).
export function dayLabel(date: Date, today: Date, locale: Locale, t: TranslateFn): string {
  if (sameDay(date, today)) return t("mobile.hoy");
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (sameDay(date, yesterday)) return t("mobile.ayer");
  const sameYear = date.getFullYear() === today.getFullYear();
  return tidy(formatterFor(locale, { weekday: "long", day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) }).format(date), locale);
}
