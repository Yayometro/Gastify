"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { isHistoryReadyFor } from "@gastify/core/transactions/historyReady";

// True when every given period start is covered by the movements loaded so far.
export default function useHistoryReadyFor(...starts: (Date | string | number | null | undefined)[]): boolean {
  const historyStatus = useSelector((state: RootState) => state.transacctionsReducer?.historyStatus);
  const historyCutoff = useSelector((state: RootState) => state.transacctionsReducer?.historyCutoff);
  return isHistoryReadyFor({ historyStatus, historyCutoff }, ...starts);
}
