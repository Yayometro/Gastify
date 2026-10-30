"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@gastify/core/i18n/locales";
import { useT } from "@/i18n/client";

// null means automatic: the language of the place the person is in.
export type AccountLanguageChoice = Locale | null;

// The names are written in their own language, so each one reads from anywhere.
const NAMES: Record<Locale, string> = { es: "common.languageSpanish", en: "common.languageEnglish" };

// The language of the account, in the profile. It is saved on the account (so it follows the person to every device) and this
// browser keeps the same choice, so the page is already in that language on the next load.
export default function AccountLanguage({
  current,
  onSave,
}: {
  current: AccountLanguageChoice;
  onSave: (choice: AccountLanguageChoice) => Promise<void>;
}): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);

  const choose = async (choice: AccountLanguageChoice) => {
    if (choice === current || busy) return;
    setBusy(true);
    try {
      await onSave(choice);
      document.cookie = choice
        ? `${LOCALE_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`
        : `${LOCALE_COOKIE}=; path=/; max-age=0; samesite=lax`;
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const options: { value: AccountLanguageChoice; label: string }[] = [
    { value: null, label: t("profile.language.automatic") },
    { value: "es", label: t(NAMES.es) },
    { value: "en", label: t(NAMES.en) },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div data-tour="prof-language-options" className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full gf-glass-inset p-1" role="group" aria-label={t("profile.language.title")}>
        {options.map((option) => (
          <button
            key={option.value ?? "automatic"}
            type="button"
            aria-pressed={option.value === current}
            disabled={busy}
            onClick={() => choose(option.value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${option.value === current ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-purple-200/70">{t("profile.language.hint")}</p>
    </div>
  );
}
