"use client";

import React, { createContext, useContext, useMemo } from "react";
import { createTranslator, type Dict, type TranslateFn } from "@gastify/core/i18n/translate";
import { DEFAULT_LOCALE, type Locale } from "@gastify/core/i18n/locales";

interface I18nValue {
  locale: Locale;
  t: TranslateFn;
}

const I18nContext = createContext<I18nValue | null>(null);

// The language of the page: the server reads the person's choice (cookie, or the browser's language) and passes in the texts
// of the namespaces that page shows. Everything below calls useT() and gets text in that language.
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Dict; children: React.ReactNode }): React.JSX.Element {
  const value = useMemo<I18nValue>(() => ({ locale, t: createTranslator(locale, messages) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// The translator of the current language. Without a provider it still renders: it shows the keys, so a missing provider is
// visible on screen instead of crashing the page.
const UNPROVIDED: I18nValue = { locale: DEFAULT_LOCALE, t: createTranslator(DEFAULT_LOCALE, {}) };

export function useT(): TranslateFn {
  return (useContext(I18nContext) ?? UNPROVIDED).t;
}

export function useLocale(): Locale {
  return (useContext(I18nContext) ?? UNPROVIDED).locale;
}
