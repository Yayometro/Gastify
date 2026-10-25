// The countries an account can choose (ISO 3166-1 alpha-2). Historical codes (the USSR, East Germany...) are left out, and so is
// "UK" (the ISO code is "GB"). The names of each language are in countryNames.ts.
import { COUNTRY_NAMES } from "./countryNames";
import type { Locale } from "./locales";

export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT",
  "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI",
  "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY",
  "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK",
  "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL",
  "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR",
  "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS",
  "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP",
  "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM",
  "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF",
  "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW",
  "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

const CODES: ReadonlySet<string> = new Set(COUNTRY_CODES);

// "mx" -> "MX"; anything that is not one of the codes above -> null.
export function normalizeCountry(value: unknown): CountryCode | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return CODES.has(code) ? (code as CountryCode) : null;
}

// The name of a country in a language ("MX" -> "México" in Spanish). The names are a table, not the Intl API: the phone's
// JavaScript engine has no Intl.DisplayNames. A code without a name shows as the code.
export function countryName(code: string, locale: Locale): string {
  return (COUNTRY_NAMES[locale] as Record<string, string | undefined>)[code] ?? code;
}

// Every country with its name in the language, sorted by that name: the list a selector shows.
export function countryOptions(locale: Locale): { code: CountryCode; name: string }[] {
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) => a.name.localeCompare(b.name));
}
