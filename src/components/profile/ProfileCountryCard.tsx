"use client";

import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { updateUser, type UserData } from "@/lib/features/userSlice";
import type { AppDispatch, RootState } from "@/lib/store";
import { useLocale, useT } from "@/i18n/client";
import { countryOptions, normalizeCountry } from "@gastify/core/i18n/countries";
import TutorialTip from "@/components/tour/TutorialTip";
import { ProfileCard, errorMessage, saveAccount } from "./ProfileParts";

// The country the person picks. While the language is automatic, it decides the language. It is their own choice, saved on the
// account: nothing here reads the location.
export default function ProfileCountryCard() {
  const t = useT();
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.userReducer.data) as UserData;
  const current = normalizeCountry(user?.country);
  const [busy, setBusy] = useState<boolean>(false);
  const options = useMemo(() => countryOptions(locale), [locale]);

  const change = async (value: string) => {
    const next = normalizeCountry(value);
    if (next === current) return;
    setBusy(true);
    try {
      const updated = await saveAccount({ country: next });
      if (updated) dispatch(updateUser(updated));
      runNotify("ok", t("profile.country.saved"));
    } catch (error) {
      runNotify("error", errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileCard title={t("profile.country.title")} tour="prof-country" help={<><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="profCountry" label={t("profile.country.title")} /></>}>
      <select
        data-tour="prof-country-select"
        aria-label={t("profile.country.title")}
        value={current ?? ""}
        disabled={busy}
        onChange={(event) => change(event.target.value)}
        className="rounded-2xl border border-gf-border bg-gf-surface px-4 py-3 text-base text-gf-text outline-none focus:border-purple-400 disabled:opacity-60"
      >
        <option value="">{t("profile.country.automatic")}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      <p className="text-sm text-gf-text-muted">{t("profile.country.hint")}</p>
    </ProfileCard>
  );
}
