"use client";

import { Tooltip } from "antd";
import { formatMoneyMinor } from "@/lib/money/currencies";

// Non-editable "≈ X" line shown below an Amount input when the selected
// Account's currency differs from the Wallet's primary currency. `quote` is
// the /fx/quote response shape ({amountMinor, currency, rate, source,
// effectiveDate, estimated, stale}) or null/undefined to render nothing.
function AmountEquivalentPreview({ quote }) {
  if (!quote) return null;

  return (
    <Tooltip
      title={`Estimated at ${quote.rate} (${quote.source}${quote.stale ? ", stale" : ""}) on ${new Date(quote.effectiveDate).toLocaleDateString()}. Not a manual override.`}
    >
      <p className="text-[11px] text-slate-500 -mt-1 cursor-default">
        ≈ {formatMoneyMinor(quote.amountMinor, quote.currency, { showCode: false })} {quote.currency}
        {quote.estimated ? " (estimated)" : ""}
      </p>
    </Tooltip>
  );
}

export default AmountEquivalentPreview;
