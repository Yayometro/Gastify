"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import useModal from "@/hooks/useModalBasic";
import fetcher from "@/helpers/fetcher";
import {
  buildBudgetHistoricalComparative,
  type BudgetHistoricalInput,
  type BudgetHistoricalComparativeRowData,
} from "@/helpers/transformers/budgetHistoricalComparative";
import HistoricalBudgetsComparativeView from "./HistoricalBudgetsComparativeView";
import BudgetHistoricalDetailModal from "./BudgetHistoricalDetailModal";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import type { PeriodComparisonState } from "@/hooks/usePeriodComparison";

export interface HistoricalBudgetsComparativeProps {
  periodState: PeriodComparisonState;
}

export interface HistoricalBudgetsApiResponse {
  ok?: boolean;
  data?: BudgetHistoricalInput[];
  message?: string;
  status?: number;
}

// New (not yet on this page before) - lets you see how your spending
// budgets behaved month by month across whatever range you pick, same as
// the transaction/category sections above it. Fetches budgets via a
// dedicated route that includes archived ones (see
// budget/get-historical/route.js) rather than the app's usual /budget/get,
// since an archived budget's past months would otherwise disappear from a
// historical view even though its data was never deleted.
//
// Period state (timePeriod + selector options/handlers) is owned by
// HistoryClient via usePeriodComparison and shared across every
// /dashboard/history section, so this table always shows the same range as
// the rest of the page - it doesn't render its own compare-period table
// (period-vs-period budget changes live in HistoricalWalletAnalyzer instead).
function HistoricalBudgetsComparative({
  periodState,
}: HistoricalBudgetsComparativeProps): React.JSX.Element {
  const { timePeriod, timePeriodsForSelecter, getValueFromSelecter, handleRangeDate } = periodState;
  const [budgets, setBudgets] = useState<BudgetHistoricalInput[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { email } = useGetUserSession();
  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);
  const walletPrimaryCurrency: string =
    useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const { close, modalContent, renderModal, handleClose } = useModal();

  function onOpenDetail(row: BudgetHistoricalComparativeRowData): void {
    renderModal(
      <BudgetHistoricalDetailModal row={row} walletPrimaryCurrency={walletPrimaryCurrency} close={handleClose} />
    );
  }

  useEffect(() => {
    if (!email) return;
    setIsLoading(true);
    const toFetch = fetcher();
    toFetch
      .post("general-data/budget/get-historical", email)
      .then((res: HistoricalBudgetsApiResponse) => {
        if (res.ok) setBudgets(res.data || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [email]);

  const rows =
    ccTransacciones.data &&
    ccTransacciones.data.length >= 1 &&
    budgets.length >= 1 &&
    timePeriod[0] &&
    timePeriod[1]
      ? buildBudgetHistoricalComparative({
          budgets,
          transactions: ccTransacciones.data,
          startDate: timePeriod[0],
          endDate: timePeriod[1],
        })
      : [];

  return (
    <>
      <HistoricalBudgetsComparativeView
        rows={rows}
        isLoading={isLoading}
        timePeriod={timePeriod}
        getValueFromSelecter={getValueFromSelecter}
        handleRangeDate={handleRangeDate}
        timePeriodsForSelecter={timePeriodsForSelecter}
        walletPrimaryCurrency={walletPrimaryCurrency}
        onOpenDetail={onOpenDetail}
      />
      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </>
  );
}

export default HistoricalBudgetsComparative;
