"use client";

import TutorialTip from "@/components/tour/TutorialTip";
import HistoryGate from "./loaders/HistoryGate";
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
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import type { BudgetHistoricalInput } from "@/helpers/transformers/budgetHistoricalComparative";

import { useT, useInfo } from "@/i18n/client";

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
  readOnly?: boolean;
  email?: string | null;
  demoBudgets?: BudgetHistoricalInput[];
  demoRatesToMxn?: Record<string, number>;
}>;

const TypedHistoricalProjectionsTable = HistoricalProjectionsTable as React.ComponentType<{
  periodState: PeriodComparisonState;
  readOnly?: boolean;
  email?: string | null;
  demoRatesToMxn?: Record<string, number>;
}>;

const TypedHistoricalComparativeCategories = HistoricalComparativeCategories as React.ComponentType<{
  periodState: PeriodComparisonState;
}>;

const TypedHistoricalBudgetsComparative = HistoricalBudgetsComparative as React.ComponentType<{
  periodState: PeriodComparisonState;
  readOnly?: boolean;
  email?: string | null;
  demoBudgets?: BudgetHistoricalInput[];
}>;

export interface HistoryClientProps {
  email?: string | null;
  readOnly?: boolean;
  demoBudgets?: BudgetHistoricalInput[];
  demoRatesToMxn?: Record<string, number>;
}

function HistoryClient({ email, readOnly = false, demoBudgets, demoRatesToMxn }: HistoryClientProps): React.JSX.Element {
  const { HISTORY_INFO } = useInfo();
  const t = useT();
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
  // Categories and budgets each compare their own two periods: changing one never moves the other.
  const categoriesPeriodState = usePeriodComparison();
  const budgetsPeriodState = usePeriodComparison();
  const setWalletAnalyzerCompareEnabled = walletAnalyzerPeriodState.setCompareEnabled;

  useEffect(() => {
    if (readOnly) setWalletAnalyzerCompareEnabled(true);
  }, [readOnly, setWalletAnalyzerCompareEnabled]);

  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);

  const toggleIsLoading = useCallback(() => {
    setIsLoading((prev) => !prev);
  }, []);

  useEffect(() => {
    // User
    if (!readOnly && ccUser.status == "idle" && email) {
      setIsLoading(true);
      dispatch(fetchUser(email));
    }
    if (ccUser.status == "succeeded") {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccUser.status, email, readOnly]);

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full">
        <div className="loader">
          {isLoading && (
            <TypedDashboardLoadingMessage
              message={t("web.we.are.building.up.your.dashboard.and.data")}
              subMessage={t("web.please.wait.a.moment")}
              setLoading={toggleIsLoading}
            />
          )}
        </div>
        <div className="w-full profile-img py-4 text-center text-white">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
            {t("history.title")}<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><InfoTip info={HISTORY_INFO} /><TutorialTip className="ml-0.5" tour="history" label={t("navbar.history")} />
          </h1>
        </div>
        <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px]">
          <HistoryGate tour="his-periods" className="history-client-cont w-full h-fulls flex flex-col justify-center items-center pb-4" starts={[periodState.timePeriod[0], periodState.compareEnabled ? periodState.comparePeriod[0] : null]}>
            <TypedTabsTogglerMontlyController periodState={periodState} />
          </HistoryGate>
          <HistoryGate tour="his-analyzer" className="w-full h-fulls pb-6 historical-wallet-analyzer" starts={[walletAnalyzerPeriodState.timePeriod[0], walletAnalyzerPeriodState.compareEnabled ? walletAnalyzerPeriodState.comparePeriod[0] : null]}>
            <TypedHistoricalWalletAnalyzer periodState={walletAnalyzerPeriodState} readOnly={readOnly} email={email} demoBudgets={demoBudgets} demoRatesToMxn={demoRatesToMxn} />
          </HistoryGate>
          <HistoryGate tour="his-projections" className="w-full h-fulls pb-6 historical-projections-table" starts={[projectionsPeriodState.timePeriod[0], projectionsPeriodState.compareEnabled ? projectionsPeriodState.comparePeriod[0] : null]}>
            <TypedHistoricalProjectionsTable periodState={projectionsPeriodState} readOnly={readOnly} email={email} demoRatesToMxn={demoRatesToMxn} />
          </HistoryGate>
          <HistoryGate tour="his-categories" className="w-full h-fulls pb-6 historical-comparative-categories" starts={[categoriesPeriodState.timePeriod[0], categoriesPeriodState.compareEnabled ? categoriesPeriodState.comparePeriod[0] : null]}>
            <TypedHistoricalComparativeCategories periodState={categoriesPeriodState} />
          </HistoryGate>
          <HistoryGate tour="his-budgets" className="w-full h-fulls pb-6 historical-budgets-comparative" starts={[budgetsPeriodState.timePeriod[0], budgetsPeriodState.compareEnabled ? budgetsPeriodState.comparePeriod[0] : null]}>
            <TypedHistoricalBudgetsComparative periodState={budgetsPeriodState} readOnly={readOnly} email={email} demoBudgets={demoBudgets} />
          </HistoryGate>
          <HistoryGate tour="his-movements" className="w-full h-fulls historical-transactions-container" starts={[periodState.timePeriod[0], periodState.compareEnabled ? periodState.comparePeriod[0] : null]}>
            <HistoricalMovementsController periodState={periodState} />
          </HistoryGate>
        </div>
      </div>
    </div>
  );
}

export default HistoryClient;
