import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, localeFromAcceptLanguage, resolveLocale, type Locale } from "@gastify/core/i18n/locales";
import { loadMessages, type Namespace } from "@gastify/core/i18n/catalogs";

// The language of this request: the choice the person saved (cookie), or else the language the browser asks for.
export async function currentLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (saved) return resolveLocale(saved);
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

// The texts of the namespaces a page shows, in the given language.
export function messagesFor(locale: Locale, namespaces: readonly Namespace[]) {
  return loadMessages(locale, namespaces);
}
