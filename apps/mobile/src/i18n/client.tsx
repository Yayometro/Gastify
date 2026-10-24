import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { createTranslator, type Dict, type TranslateFn } from "@gastify/core/i18n/translate";
import { DEFAULT_LOCALE, LOCALES, resolveLocale, isLocale, type Locale } from "@gastify/core/i18n/locales";
import { loadMessages, NAMESPACES } from "@gastify/core/i18n/catalogs";
import { loadInfo, SPANISH_INFO, type InfoData } from "@gastify/core/info/catalog";
import type { WalletText } from "@gastify/core/transformers/walletAnalyzer";

// The app's language: the one the person chose (kept on the device), or else the device's own language, or Spanish.
const STORE_KEY = "gf_locale";

function deviceLocale(): Locale {
  try {
    return resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return DEFAULT_LOCALE;
  }
}

async function savedLocale(): Promise<Locale | null> {
  try {
    const value = await SecureStore.getItemAsync(STORE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

interface I18nValue {
  locale: Locale;
  t: TranslateFn;
  info: InfoData;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);
const UNPROVIDED: I18nValue = { locale: DEFAULT_LOCALE, t: createTranslator(DEFAULT_LOCALE, {}), info: SPANISH_INFO, setLocale: () => undefined };

// The app waits for its texts (a few milliseconds from the device's own catalogs) before it draws, so no screen ever shows keys.
export function I18nProvider({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const [locale, setLocaleState] = useState<Locale | null>(null);
  const [messages, setMessages] = useState<Dict | null>(null);
  const [info, setInfo] = useState<InfoData | null>(null);

  useEffect(() => {
    let alive = true;
    savedLocale().then((saved) => {
      if (alive) setLocaleState(saved ?? deviceLocale());
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!locale) return;
    let alive = true;
    Promise.all([loadMessages(locale, NAMESPACES), loadInfo(locale)]).then(([loaded, explanations]) => {
      if (alive) {
        setMessages(loaded);
        setInfo(explanations);
      }
    });
    return () => {
      alive = false;
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    if (!(LOCALES as readonly string[]).includes(next)) return;
    setMessages(null);
    setInfo(null);
    setLocaleState(next);
    SecureStore.setItemAsync(STORE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<I18nValue | null>(
    () => (locale && messages && info ? { locale, t: createTranslator(locale, messages), info, setLocale } : null),
    [locale, messages, info, setLocale]
  );

  if (!value) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// The translator of the current language. Outside a provider it still renders (it shows the keys, so the mistake is visible).
export function useT(): TranslateFn {
  return (useContext(I18nContext) ?? UNPROVIDED).t;
}

export function useLocale(): Locale {
  return (useContext(I18nContext) ?? UNPROVIDED).locale;
}

export function useSetLocale(): (locale: Locale) => void {
  return (useContext(I18nContext) ?? UNPROVIDED).setLocale;
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
