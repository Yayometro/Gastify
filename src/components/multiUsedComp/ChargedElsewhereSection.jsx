"use client";

import { Switch } from "antd";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currencies";

// Advanced "Charged in another currency" disclosure (plan section 12.2).
// The main Amount field stays in the Account's own currency (what actually
// left the account); this optionally records the merchant amount/currency
// so a manual entry can be made directly in a foreign currency (e.g. "I
// spent $50 USD") without the user computing the native-currency
// equivalent by hand - the parent auto-fills the Amount field from a live
// FX estimate while this is open, editable if the user knows the exact
// native-currency charge.
function ChargedElsewhereSection({
  enabled,
  onToggle,
  merchantAmount,
  merchantCurrency,
  onMerchantAmountChange,
  onMerchantCurrencyChange,
  quoting,
}) {
  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onChange={onToggle} size="small" />
        <p className="label-tfp !mb-0">Charged in another currency</p>
      </div>
      {enabled && (
        <div className="w-full flex flex-col gap-2 bg-purple-50 border border-purple-200 rounded-xl p-2">
          <p className="label-tfp">Charged amount</p>
          <div className="flex gap-2 w-full">
            <input
              type="number"
              step="0.01"
              value={merchantAmount}
              onChange={(e) => onMerchantAmountChange(e.target.value)}
              placeholder="Amount"
              className="flex-1"
            />
            <select
              className="bg-white border border-purple-300 rounded-2xl px-2"
              value={merchantCurrency}
              onChange={(e) => onMerchantCurrencyChange(e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500">
            {quoting
              ? "Estimating the equivalent…"
              : "The Amount field above fills in automatically from a live estimate - adjust it if you know the exact amount that was charged."}
          </p>
        </div>
      )}
    </div>
  );
}

export default ChargedElsewhereSection;
