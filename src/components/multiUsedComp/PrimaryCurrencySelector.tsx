"use client";

import React, { useState } from "react";

import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { useDispatch } from "react-redux";
import { Spin, Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { SUPPORTED_CURRENCIES, CURRENCY_META } from "@gastify/core/money/currencies";
import { updateWallet } from "@/lib/features/walletSlice";
import { useT, useInfo } from "@/i18n/client";

export interface PrimaryCurrencySelectorWallet {
  _id?: string;
  primaryCurrency?: string;
  [key: string]: unknown;
}

export interface PrimaryCurrencySelectorProps {
  pcsWallet?: PrimaryCurrencySelectorWallet | null;
}

// Lets the user choose which currency Wallet totals/reports are presented
// in. Never reinterprets already-stored native Account/Transaction money -
// only changes presentation.
function PrimaryCurrencySelector({ pcsWallet }: PrimaryCurrencySelectorProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const dispatch = useDispatch();
  const toFetch = fetcher();

  const currentCurrency = pcsWallet?.primaryCurrency || "MXN";

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const nextCurrency = e.target.value;
    if (!pcsWallet?._id || nextCurrency === currentCurrency) return;
    try {
      setIsSaving(true);
      const res = await toFetch.post("general-data/wallet", {
        walletId: pcsWallet._id,
        primaryCurrency: nextCurrency,
      });
      if (res.ok) {
        dispatch(updateWallet(res.data));
        runNotify("ok", t("profile.primaryCurrencyChanged", { p1: nextCurrency }));
      } else {
        runNotify("error", res.message || t("web.could.not.change.primary.currency"));
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tooltip title={t("shared.currency.help")}>
      <div className="pcs-container flex items-center gap-1 text-[10px] font-light bg-gf-surface-2 text-gf-text rounded-2xl px-[8px] py-[2px] sm:text-xs">
        <span className="whitespace-nowrap">{t("shared.currency.primary")}</span>
        <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" />
        <InfoTip info={APP_INFO.moneda_principal} />
        {isSaving ? (
          <Spin size="small" />
        ) : (
          <select
            className="bg-transparent appearance-none font-medium cursor-pointer outline-none"
            value={currentCurrency}
            onChange={handleChange}
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} ({CURRENCY_META[code].symbol})
              </option>
            ))}
          </select>
        )}
      </div>
    </Tooltip>
  );
}

export default PrimaryCurrencySelector;
