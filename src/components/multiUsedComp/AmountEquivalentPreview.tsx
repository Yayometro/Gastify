"use client";

import React from "react";
import { Tooltip } from "antd";
import { formatMoneyMinor } from "@/lib/money/currencies";

export interface AmountEquivalentQuote {
  amountMinor?: number;
  currency?: string;
  rate?: number | string;
  source?: string;
  effectiveDate?: string | number | Date;
  estimated?: boolean;
  stale?: boolean;
  [key: string]: unknown;
}

export interface AmountEquivalentPreviewProps {
  quote?: AmountEquivalentQuote | null;
}

// Non-editable "≈ X" line shown below an Amount input when the selected
// Account's currency differs from the Wallet's primary currency. `quote` is
// the /fx/quote response shape ({amountMinor, currency, rate, source,
// effectiveDate, estimated, stale}) or null/undefined to render nothing.
function AmountEquivalentPreview({ quote }: AmountEquivalentPreviewProps): React.JSX.Element | null {
  if (!quote) return null;

  return (
    <Tooltip
      title={`Estimated at ${quote.rate} (${quote.source}${quote.stale ? ", stale" : ""}) on ${new Date(quote.effectiveDate).toLocaleDateString()}. Not a manual override.`}
    >
      <p className="text-[11px] text-gf-text-muted -mt-1 cursor-default">
        ≈ {formatMoneyMinor(quote.amountMinor, quote.currency, { showCode: false })} {quote.currency}
        {quote.estimated ? " (estimated)" : ""}
      </p>
    </Tooltip>
  );
}

export default AmountEquivalentPreview;
