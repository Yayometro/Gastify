// The languages the app speaks. Spanish is the source of the texts and the default; English is the second one.
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

// The cookie and the field that remember the person's choice.
export const LOCALE_COOKIE = "gf-locale";

// The tag each language formats dates and numbers with (the money formats keep their own per-currency locale).
export const INTL_TAG: Record<Locale, string> = { es: "es-MX", en: "en-US" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Turns whatever the browser, the device or the stored choice says into one of our languages. "en-US" and "en" are English;
// anything else (including nothing at all) is the default.
export function resolveLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const first = input.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (isLocale(first)) return first;
  const base = first.split("-")[0];
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

// An Accept-Language header ("en-US,en;q=0.9,es;q=0.8") -> the language the person would read first among ours.
export function localeFromAcceptLanguage(header?: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

// Vercel includes the visitor's ISO country code on incoming requests. Use it
// only for the first visit: an explicit language cookie always takes priority.
// Countries where Spanish is the primary public language map to Spanish; other
// known countries use English, and unknown/missing codes fall back to the
// browser's Accept-Language header in the request layer.
const SPANISH_SPEAKING_COUNTRIES = new Set([
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "ES", "GQ", "GT", "HN", "MX", "NI", "PA", "PE", "PR", "PY", "SV", "UY", "VE",
]);

export function localeFromCountry(country?: string | null): Locale | null {
  const code = country?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  return SPANISH_SPEAKING_COUNTRIES.has(code) ? "es" : "en";
}
