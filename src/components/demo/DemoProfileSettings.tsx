"use client";

import { useState } from "react";
import { IoKeyOutline, IoLockClosedOutline, IoSparklesOutline } from "react-icons/io5";
import { useT } from "@/i18n/client";

const countries = [
  { code: "MX", key: "shared.demo.profileSettings.countryMexico" },
  { code: "US", key: "shared.demo.profileSettings.countryUnitedStates" },
  { code: "ES", key: "shared.demo.profileSettings.countrySpain" },
  { code: "JP", key: "shared.demo.profileSettings.countryJapan" },
] as const;

const currencies = ["MXN", "USD", "EUR", "JPY"] as const;

export default function DemoProfileSettings(): React.JSX.Element {
  const t = useT();
  const [country, setCountry] = useState("MX");
  const [currency, setCurrency] = useState<(typeof currencies)[number]>("MXN");

  return (
    <div className="mx-auto mt-5 grid w-full max-w-5xl gap-4 text-left">
      <section className="rounded-3xl border border-purple-300/15 bg-black/10 p-4 sm:p-5" aria-labelledby="demo-preferences-title">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-purple-200/15 bg-purple-300/10 text-purple-200"><IoSparklesOutline size={19} aria-hidden="true" /></span>
          <div><h2 id="demo-preferences-title" className="text-sm font-semibold text-white">{t("shared.demo.profileSettings.preferences")}</h2><p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("shared.demo.profileSettings.preferencesHelp")}</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[11px] font-medium text-purple-50">{t("shared.demo.profileSettings.country")}
            <select value={country} onChange={(event) => setCountry(event.target.value)} className="gf-profile-field min-h-10 rounded-xl border border-purple-300/20 bg-[#211832] px-3 text-sm text-white outline-none focus:border-purple-300/60">
              {countries.map((item) => <option key={item.code} value={item.code}>{t(item.key)}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-[11px] font-medium text-purple-50">{t("shared.demo.profileSettings.primaryCurrency")}
            <select value={currency} onChange={(event) => setCurrency(event.target.value as (typeof currencies)[number])} className="gf-profile-field min-h-10 rounded-xl border border-purple-300/20 bg-[#211832] px-3 text-sm text-white outline-none focus:border-purple-300/60">
              {currencies.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-gf-text-muted">{t("shared.demo.profileSettings.preferencePreview", { p1: t(countries.find((item) => item.code === country)?.key || countries[0].key), p2: currency })}</p>
      </section>

      <section className="rounded-3xl border border-purple-300/15 bg-black/10 p-4 sm:p-5" aria-labelledby="demo-passkeys-title">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-200/15 bg-emerald-300/10 text-emerald-200"><IoKeyOutline size={19} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="demo-passkeys-title" className="text-sm font-semibold text-white">{t("shared.demo.profileSettings.passkeys")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("shared.demo.profileSettings.passkeysHelp")}</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200/15 bg-emerald-300/[.07] px-2 py-1 text-[9px] text-emerald-100">{t("shared.demo.profileSettings.sample")}</span>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {["shared.demo.profileSettings.passkeyPhone", "shared.demo.profileSettings.passkeyLaptop"].map((key) => <li key={key} className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-xs text-purple-50"><IoLockClosedOutline className="shrink-0 text-emerald-200" aria-hidden="true" />{t(key)}<span className="ml-auto text-[9px] text-gf-text-muted">{t("shared.demo.profileSettings.activeSample")}</span></li>)}
        </ul>
        <p className="mt-3 text-[10px] leading-relaxed text-gf-text-muted">{t("shared.demo.profileSettings.passkeysNote")}</p>
      </section>

      <section className="rounded-3xl border border-purple-300/15 bg-black/10 p-4 sm:p-5" aria-labelledby="demo-tokens-title">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-200/15 bg-amber-300/10 text-amber-100"><IoKeyOutline size={19} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="demo-tokens-title" className="text-sm font-semibold text-white">{t("shared.demo.profileSettings.accessTokens")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-gf-text-muted">{t("shared.demo.profileSettings.accessTokensHelp")}</p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-200/15 bg-amber-300/[.07] px-2 py-1 text-[9px] text-amber-100">{t("shared.demo.profileSettings.example")}</span>
        </div>
        <p className="mt-3 rounded-xl border border-rose-200/15 bg-rose-950/20 px-3 py-2.5 text-[10px] leading-relaxed text-rose-100/90">{t("shared.demo.profileSettings.tokenSecurity")}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["ChatGPT", "Claude"] as const).map((connector) => <div key={connector} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="flex items-center justify-between gap-2"><strong className="text-xs text-purple-50">{connector}</strong><span className="rounded-full border border-white/10 px-2 py-0.5 text-[8px] text-gf-text-muted">{t("shared.demo.profileSettings.notConnected")}</span></div>
            <code className="mt-2 block break-all rounded-lg bg-black/20 px-2 py-1.5 text-[10px] text-purple-200">gf_demo_••••••••••••</code>
          </div>)}
        </div>
        <div className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-gf-text-muted"><IoSparklesOutline className="mt-0.5 shrink-0 text-purple-200" aria-hidden="true" /><p>{t("shared.demo.profileSettings.connectorCapabilities")}</p></div>
        <p className="mt-2 text-[10px] leading-relaxed text-gf-text-muted">{t("shared.demo.profileSettings.signupUnlocks")}</p>
      </section>
    </div>
  );
}
