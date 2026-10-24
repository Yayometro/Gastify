"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@gastify/core/i18n/locales";
import { useLocale } from "@/i18n/client";

// The language names are written in their own language, so each one is readable from anywhere.
const NAMES: Record<Locale, string> = { es: "Español", en: "English" };

// Two pills, Español and English. The choice goes into a cookie (a year) and the page is refreshed so the server sends the
// texts of the new language.
export default function LanguageSwitch({ className = "" }: { className?: string }): React.JSX.Element {
  const router = useRouter();
  const current = useLocale();
  const choose = (locale: Locale) => {
    if (locale === current) return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className={`inline-flex items-center gap-1 rounded-full gf-glass-inset p-1 ${className}`} role="group" aria-label="Idioma / Language">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={locale === current}
          lang={locale}
          onClick={() => choose(locale)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${locale === current ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"}`}
        >
          {NAMES[locale]}
        </button>
      ))}
    </div>
  );
}
