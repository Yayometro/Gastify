"use client";

import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useT } from "@/i18n/client";

// The dashboard renders with the recent months first; while the rest of the
// history is still arriving, totals for older periods may be incomplete. This
// small pill says so, and disappears as soon as the history is in.
function HistoryLoadingPill(): React.JSX.Element | null {
  const t = useT();
  const historyStatus = useSelector((state: RootState) => state.transacctionsReducer?.historyStatus);
  if (historyStatus !== "loading" && historyStatus !== "failed") return null;
  const failed = historyStatus === "failed";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full px-4 py-2 text-xs shadow-lg backdrop-blur ${
        failed ? "bg-red-600/90 text-white" : "bg-gf-surface/90 text-gf-text border border-gf-border"
      }`}
    >
      {failed
        ? t("web.we.couldn.t.load.your.full.history.reload.the.page.to.tr")
        : t("web.loading.your.full.history.the.totals.of.earlier.periods")}
    </div>
  );
}

export default HistoryLoadingPill;
