"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Spin, Tooltip } from "antd";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { SUPPORTED_CURRENCIES, CURRENCY_META } from "@/lib/money/currencies";
import { updateWallet } from "@/lib/features/walletSlice";

// Lets the user choose which currency Wallet totals/reports are presented
// in. Never reinterprets already-stored native Account/Transaction money -
// only changes presentation.
function PrimaryCurrencySelector({ pcsWallet }) {
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();
  const toFetch = fetcher();

  const currentCurrency = pcsWallet?.primaryCurrency || "MXN";

  const handleChange = async (e) => {
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
        runNotify("ok", `Primary currency changed to ${nextCurrency} 🤓`);
      } else {
        runNotify("error", res.message || "Could not change primary currency");
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tooltip title="Wallet reports and totals are displayed in this currency. It does not change how each Account's own balance is stored.">
      <div className="pcs-container flex items-center gap-1 text-[10px] font-light bg-slate-100 text-black rounded-2xl px-[8px] py-[2px] sm:text-xs">
        <span className="whitespace-nowrap">Primary currency:</span>
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
