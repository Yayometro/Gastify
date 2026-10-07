"use client";

import React from "react";
import { Tooltip } from "antd";
import { formatMoneyMinor } from "@/lib/money/currencies";

export interface CurrencyBreakdownItem {
  currency: string;
  nativeAmountMinor: number;
  primaryAmountMinor?: number;
  rate?: number | string | null;
  effectiveDate?: string | Date | null;
}

export interface CurrencyBreakdownData {
  isMultiCurrency?: boolean;
  breakdown: CurrencyBreakdownItem[];
}

export interface CurrencyBreakdownChipsProps {
  breakdown?: CurrencyBreakdownData | null;
  walletPrimaryCurrency?: string;
  className?: string;
}

// A per-currency chip row shown below an aggregate money figure (a month's
// income/expense, a Budget's total) - only rendered when more than one
// currency (or a single non-primary one) actually contributed, per
// getMonthCurrencyBreakdown / useLinkedAccountsTotal. Each foreign-currency
// chip shows the native amount, its converted equivalent, and the rate
// applied so the number isn't a mystery.
// An effective date that is missing or cannot be parsed reads "n/a" (it used to print "Invalid Date").
function formatRateDate(date?: string | Date | null): string {
  if (!date) return "n/a";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "n/a" : parsed.toLocaleDateString();
}

function CurrencyBreakdownChips({
  breakdown,
  walletPrimaryCurrency = "MXN",
  className,
}: CurrencyBreakdownChipsProps): React.JSX.Element | null {
  if (!breakdown?.isMultiCurrency) return null;
  return (
    <div className={`flex flex-wrap gap-1 mt-1.5 ${className || ""}`}>
      {(breakdown.breakdown ?? []).map((g) => (
        <Tooltip
          key={g.currency}
          title={
            g.currency === walletPrimaryCurrency
              ? "Already in your wallet's currency - no conversion needed."
              : `Converted at ${g.rate} (${walletPrimaryCurrency} per ${g.currency}) as of ${formatRateDate(g.effectiveDate)}.`
          }
        >
          <div className="bg-gf-surface border border-purple-200 rounded-full px-2 py-0.5 text-[11px] text-purple-300">
            {formatMoneyMinor(g.nativeAmountMinor, g.currency, { showCode: true })}
            {g.currency !== walletPrimaryCurrency && (
              <> → {formatMoneyMinor(g.primaryAmountMinor, walletPrimaryCurrency, { showCode: true })}</>
            )}
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

export default CurrencyBreakdownChips;
