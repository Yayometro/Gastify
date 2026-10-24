"use client";

import React, { createContext, useContext, useMemo } from "react";
import { createTranslator, type Dict, type TranslateFn } from "@gastify/core/i18n/translate";
import { DEFAULT_LOCALE, type Locale } from "@gastify/core/i18n/locales";
import { SPANISH_INFO, type InfoData } from "@gastify/core/info/catalog";
import type { WalletText } from "@gastify/core/transformers/walletAnalyzer";

interface I18nValue {
  locale: Locale;
  t: TranslateFn;
  info: InfoData;
}

const I18nContext = createContext<I18nValue | null>(null);

// The language of the page: the server reads the person's choice (cookie, or the browser's language) and passes in the texts
// of the namespaces that page shows, and the explanations ("?") of that language. Everything below calls useT() and useInfo().
export function I18nProvider({ locale, messages, info, children }: { locale: Locale; messages: Dict; info: InfoData; children: React.ReactNode }): React.JSX.Element {
  const value = useMemo<I18nValue>(() => ({ locale, t: createTranslator(locale, messages), info }), [locale, messages, info]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// The translator of the current language. Without a provider it still renders: it shows the keys, so a missing provider is
// visible on screen instead of crashing the page.
const UNPROVIDED: I18nValue = { locale: DEFAULT_LOCALE, t: createTranslator(DEFAULT_LOCALE, {}), info: SPANISH_INFO };

export function useT(): TranslateFn {
  return (useContext(I18nContext) ?? UNPROVIDED).t;
}

export function useLocale(): Locale {
  return (useContext(I18nContext) ?? UNPROVIDED).locale;
}

// The explanations ("?") of the current language.
export function useInfo(): InfoData {
  return (useContext(I18nContext) ?? UNPROVIDED).info;
}

// The wallet analyzer's texts in the current language: its month names, weekdays and sentences.
export function useWalletText(): WalletText {
  const t = useT();
  const locale = useLocale();
  return useMemo<WalletText>(() => ({ locale, t }), [locale, t]);
}
