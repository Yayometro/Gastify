import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, localeFromAcceptLanguage, resolveLocale, type Locale } from "@gastify/core/i18n/locales";
import { loadMessages, type Namespace } from "@gastify/core/i18n/catalogs";
import { createTranslator, type TranslateFn } from "@gastify/core/i18n/translate";

// The language of this request: the choice the person saved (cookie), or else the language the browser asks for.
export async function currentLocale(): Promise<Locale> {
  try {
    const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (saved) return resolveLocale(saved);
    return localeFromAcceptLanguage((await headers()).get("accept-language"));
  } catch {
    // Outside a request (a script, or a test that calls a route directly) there is no cookie to read: the default language.
    return DEFAULT_LOCALE;
  }
}

// The texts of the namespaces a page shows, in the given language.
export function messagesFor(locale: Locale, namespaces: readonly Namespace[]) {
  return loadMessages(locale, namespaces);
}

// The translator for a server component: the language of this request, with the texts of the namespaces it shows.
export async function serverT(namespaces: readonly Namespace[]): Promise<TranslateFn> {
  const locale = await currentLocale();
  return createTranslator(locale, await messagesFor(locale, namespaces));
}
