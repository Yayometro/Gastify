"use client";

import React, { useState } from "react";
import { banksForCountry, type Bank } from "@gastify/core/banks/banks";
import { normalizeText } from "@gastify/core/search/normalizeText";
import { useT } from "@/i18n/client";

// A bank's mark in a square tile: its logo (public/banks/<id>.webp) on white, or its initials on its brand color when
// the file is missing. Same idea as the phone's BankBadge.
export function BankBadge({ bank, size = 32 }: { bank: Bank; size?: number }): React.JSX.Element {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/35"
      style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: broken ? bank.color : "#ffffff" }}
    >
      {broken ? (
        <span className="px-0.5 text-center font-bold leading-none text-white" style={{ fontSize: Math.max(8, size * 0.3) }}>
          {bank.short}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/banks/${bank.id}.webp`} alt={bank.name} width={size} height={size} className="object-contain" style={{ width: size * 0.86, height: size * 0.86 }} onError={() => setBroken(true)} />
      )}
    </span>
  );
}

export interface BankPickerProps {
  country: string;
  value: string | null;
  onChange: (id: string | null) => void;
}

// The banks of a country as tiles (the phone's picker): a search box, the main banks and, below, the other and digital
// ones. Each group is one row until "See all" opens it. Choosing the chosen bank again clears it (the bank is optional).
export default function BankPicker({ country, value, onChange }: BankPickerProps): React.JSX.Element {
  const t = useT();
  const [query, setQuery] = useState("");
  const [openAll, setOpenAll] = useState<Record<string, boolean>>({});
  const needle = normalizeText(query);
  const found = (bank: Bank) => !needle || normalizeText(`${bank.name} ${bank.short}`).includes(needle);
  const { main: allMain, other: allOther } = banksForCountry(country);
  const main = allMain.filter(found);
  const other = allOther.filter(found);

  const tile = (bank: Bank) => {
    const selected = value === bank.id;
    return (
      <button
        key={bank.id}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={bank.name}
        onClick={() => onChange(selected ? null : bank.id)}
        className={`flex w-[84px] shrink-0 flex-col items-center gap-1 rounded-2xl border px-1.5 py-2 transition-colors ${
          selected ? "border-purple-400 bg-purple-500/25" : "border-white/15 bg-white/5 hover:bg-white/10"
        }`}
      >
        <BankBadge bank={bank} size={34} />
        <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-gf-text">{bank.name}</span>
      </button>
    );
  };

  const group = (key: string, title: string, banks: Bank[]) => {
    if (banks.length === 0) return null;
    const expanded = Boolean(openAll[key]) || needle.length > 0;
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gf-text-muted">{title}</span>
          {banks.length > 4 && needle.length === 0 ? (
            <button type="button" className="text-xs font-semibold text-purple-300" onClick={() => setOpenAll((current) => ({ ...current, [key]: !current[key] }))}>
              {expanded ? t("web.bankPicker.seeLess") : t("web.bankPicker.seeAll", { p1: banks.length })}
            </button>
          ) : null}
        </div>
        <div className={expanded ? "flex flex-wrap gap-2" : "flex gap-2 overflow-x-auto pb-1"}>{banks.map(tile)}</div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3" role="radiogroup" aria-label={t("accounts.form.bank")}>
      <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("accounts.form.searchBank")} />
      {main.length === 0 && other.length === 0 && <p className="text-xs text-gf-text-muted">{t("web.bankPicker.none", { p1: query })}</p>}
      {group("main", t("web.bankPicker.main"), main)}
      {group("other", t("web.bankPicker.other"), other)}
    </div>
  );
}
