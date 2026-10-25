import { cookies, headers } from "next/headers";
import { chooseLocale, LOCALE_COOKIE, type Locale } from "@gastify/core/i18n/locales";
import { loadMessages, type Namespace } from "@gastify/core/i18n/catalogs";
import { createTranslator, type TranslateFn } from "@gastify/core/i18n/translate";

// The country the request comes from, as the hosting platform reports it (Vercel, Cloudflare, CloudFront, or a proxy that sets X-Country-Code).
const COUNTRY_HEADERS = ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country", "x-country-code"];

// The language of this request: the one saved on the person's account (`account`, from the session) if they chose one; else the
// choice this browser remembers (cookie); else where they are: the country the person chose on their account (`accountCountry`),
// else the country the network reports; else the browser's language; else Spanish.
export async function currentLocale(account?: string | null, accountCountry?: string | null): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const requestHeaders = await headers();
    const networkCountry = COUNTRY_HEADERS.map((name) => requestHeaders.get(name)).find((value) => Boolean(value)) ?? null;
    return chooseLocale({
      account,
      device: cookieStore.get(LOCALE_COOKIE)?.value,
      country: accountCountry || networkCountry,
      language: requestHeaders.get("accept-language"),
    });
  } catch {
    // Outside a request (a script, or a test that calls a route directly) there are no headers to read: the account or the default.
    return chooseLocale({ account, country: accountCountry });
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
