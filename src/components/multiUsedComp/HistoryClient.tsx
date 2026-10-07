"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "@/lib/features/userSlice";
import type { AppDispatch, RootState } from "@/lib/store";
import DashboardLoadingMessage from "./loaders/DashboardLoadingMessage";
import TabsTogglerMontlyController from "./TabsComponents/tabsMontlyTransactions/TabsTogglerMontlyController";
import HistoricalMovementsController from "./HistoricalMovementsandCategories/HistoricalMovementsController";
import HistoricalComparativeCategories from "./historicalComparativeCategories/HistoricalComparativeCategories";
import HistoricalBudgetsComparative from "./historicalBudgetsComparative/HistoricalBudgetsComparative";
import HistoricalWalletAnalyzer from "./HistoricalWalletAnalyzer/HistoricalWalletAnalyzer";
import HistoricalProjectionsTable from "./HistoricalWalletAnalyzer/HistoricalProjectionsTable";
import usePeriodComparison from "@/hooks/usePeriodComparison";

export type PeriodComparisonState = ReturnType<typeof usePeriodComparison>;

// Typed bridges for unmigrated child JSX components
const TypedDashboardLoadingMessage = DashboardLoadingMessage as React.ComponentType<{
  message?: string;
  subMessage?: string;
  setLoading?: () => void;
}>;

const TypedTabsTogglerMontlyController = TabsTogglerMontlyController as React.ComponentType<{
  periodState: PeriodComparisonState;
}>;

const TypedHistoricalWalletAnalyzer = HistoricalWalletAnalyzer as React.ComponentType<{
  periodState: PeriodComparisonState;
}>;

const TypedHistoricalProjectionsTable = HistoricalProjectionsTable as React.ComponentType<{
  periodState: PeriodComparisonState;
}>;

const TypedHistoricalComparativeCategories = HistoricalComparativeCategories as React.ComponentType<{
  periodState: PeriodComparisonState;
}>;

const TypedHistoricalBudgetsComparative = HistoricalBudgetsComparative as React.ComponentType<{
  periodState: PeriodComparisonState;
}>;

export interface HistoryClientProps {
  email?: string | null;
}

function HistoryClient({ email }: HistoryClientProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Shared "period A vs period B" state for the chart/category/budget/
  // movements sections below - see usePeriodComparison for why this used
  // to be duplicated per section instead of shared once.
  const periodState = usePeriodComparison();
  // Wallet Analyzer and Projections each get their OWN independent period
  // state, deliberately NOT sharing periodState above - confirmed live that
  // sharing one instance meant picking a period in the Wallet Analyzer
  // silently changed what Projections showed too, which isn't wanted:
  // these two sections are meant to be filterable independently of each
  // other and of the rest of the page, the same way every section already
  // was before periodState existed.
  const walletAnalyzerPeriodState = usePeriodComparison();
  const projectionsPeriodState = usePeriodComparison();

  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);

  const toggleIsLoading = useCallback(() => {
    setIsLoading((prev) => !prev);
  }, []);

  useEffect(() => {
    // User
    if (ccUser.status == "idle" && email) {
      setIsLoading(true);
      dispatch(fetchUser(email));
    }
    if (ccUser.status == "succeeded") {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccUser.status, email]);

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full">
        <div className="loader">
          {isLoading && (
            <TypedDashboardLoadingMessage
              message={`We are building up your dashboard and data`}
              subMessage={`Please wait a moment 🤓`}
              setLoading={toggleIsLoading}
            />
          )}
        </div>
        <div className="w-full profile-img py-4 text-center text-white">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
            Transactions History
          </h1>
        </div>
        <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px]">
          <div className="history-client-cont w-full h-fulls flex flex-col justify-center items-center pb-4">
            <TypedTabsTogglerMontlyController periodState={periodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-wallet-analyzer">
            <TypedHistoricalWalletAnalyzer periodState={walletAnalyzerPeriodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-projections-table">
            <TypedHistoricalProjectionsTable periodState={projectionsPeriodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-comparative-categories">
            <TypedHistoricalComparativeCategories periodState={periodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-budgets-comparative">
            <TypedHistoricalBudgetsComparative periodState={periodState} />
          </div>
          <div className="w-full h-fulls historical-transactions-container">
            <HistoricalMovementsController periodState={periodState} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryClient;
