"use client";

import React from "react";
import { useThemeMode } from "@/app/ThemeProvider";
import { useT } from "@/i18n/client";
import { ProfileCard } from "./ProfileParts";

// Light or dark: it used to be a button of the navigation bar, which ran out of room.
export default function ProfileAppearanceCard(): React.JSX.Element {
  const t = useT();
  const { mode, toggleMode } = useThemeMode();
  const option = (id: "dark" | "light") => (
    <button
      key={id}
      type="button"
      role="radio"
      aria-checked={mode === id}
      onClick={() => {
        if (mode !== id) toggleMode();
      }}
      className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${mode === id ? "gf-glass-button text-white" : "gf-glass-card text-gf-text-muted hover:text-gf-text"}`}
    >
      {t(`profile.appearance.${id}`)}
    </button>
  );
  return (
    <ProfileCard title={t("profile.appearance.title")} tour="prof-appearance">
      <p className="text-sm text-gf-text-muted">{t("profile.appearance.text")}</p>
      <div className="flex gap-3" role="radiogroup" aria-label={t("profile.appearance.title")}>
        {option("dark")}
        {option("light")}
      </div>
    </ProfileCard>
  );
}
