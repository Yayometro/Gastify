import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useSelector } from "react-redux";
import { createTranslator, type Dict, type TranslateFn } from "@gastify/core/i18n/translate";
import { setCurrentTranslator } from "./now";
import { chooseLocale, countryOf, DEFAULT_LOCALE, isLocale, type Locale } from "@gastify/core/i18n/locales";
import { normalizeCountry } from "@gastify/core/i18n/countries";
import { loadMessages, MOBILE_NAMESPACES } from "@gastify/core/i18n/catalogs";
import { loadInfo, SPANISH_INFO, type InfoData } from "@gastify/core/info/catalog";
import type { WalletText } from "@gastify/core/transformers/walletAnalyzer";
import type { RootState } from "@/store";

// The last language the account chose, kept on the device so the app opens in it before the person's data has loaded.
const STORE_KEY = "gf_locale";

// What the device says about where it is and what it speaks: its language tag, with the region (for example "es-MX").
function deviceTag(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

async function rememberedAccountLanguage(): Promise<Locale | null> {
  try {
    const value = await SecureStore.getItemAsync(STORE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

// The language the account chose (null: automatic), or undefined while the person's data has not loaded.
export function useAccountLanguage(): Locale | null | undefined {
  return useSelector((state: RootState) => {
    if (state.userReducer.status !== "succeeded") return undefined;
    const language = (state.userReducer.data as { language?: unknown }).language;
    return isLocale(language) ? language : null;
  });
}

// The country the account chose (null: automatic, where the phone says the person is), or undefined while the data has not loaded.
export function useAccountCountry(): string | null | undefined {
  return useSelector((state: RootState) => {
    if (state.userReducer.status !== "succeeded") return undefined;
    const country = (state.userReducer.data as { country?: unknown }).country;
    return normalizeCountry(country) ?? null;
  });
}

interface I18nValue {
  locale: Locale;
  t: TranslateFn;
  info: InfoData;
}

interface Loaded extends I18nValue {
  messages: Dict;
}

const I18nContext = createContext<I18nValue | null>(null);
const UNPROVIDED: I18nValue = { locale: DEFAULT_LOCALE, t: createTranslator(DEFAULT_LOCALE, {}), info: SPANISH_INFO };

// The language of the app: the account's choice, else the one this device remembers, else where the phone says it is, else
// the phone's language, else Spanish. The app waits for its first texts (a few milliseconds from the device's own catalogs) before
// it draws, and keeps the previous texts while a new language loads, so no screen shows keys or goes blank.
export function I18nProvider({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const accountLanguage = useAccountLanguage();
  const accountCountry = useAccountCountry();
  const [remembered, setRemembered] = useState<Locale | null | undefined>(undefined);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let alive = true;
    rememberedAccountLanguage().then((value) => {
      if (alive) setRemembered(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Remember the account's choice on this device (cleared when the account is automatic).
  useEffect(() => {
    if (accountLanguage === undefined) return;
    const write = accountLanguage ? SecureStore.setItemAsync(STORE_KEY, accountLanguage) : SecureStore.deleteItemAsync(STORE_KEY);
    write.catch(() => undefined);
  }, [accountLanguage]);

  const tag = deviceTag();
  // The country the account chose wins over the phone's region (the phone only says where the person is until they choose).
  const locale = chooseLocale({
    account: accountLanguage !== undefined ? accountLanguage : (remembered ?? null),
    country: accountCountry || countryOf(tag),
    language: tag,
  });

  useEffect(() => {
    if (remembered === undefined) return;
    let alive = true;
    Promise.all([loadMessages(locale, MOBILE_NAMESPACES), loadInfo(locale)]).then(([messages, info]) => {
      if (alive) {
        setCurrentTranslator(locale, messages);
        setLoaded({ locale, messages, info, t: createTranslator(locale, messages) });
      }
    });
    return () => {
      alive = false;
    };
  }, [locale, remembered]);

  const value = useMemo<I18nValue | null>(
    () => (loaded ? { locale: loaded.locale, t: loaded.t, info: loaded.info } : null),
    [loaded]
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
