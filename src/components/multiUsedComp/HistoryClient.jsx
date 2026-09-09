"use client";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import { Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLoadingMessage from "./loaders/DashboardLoadingMessage";
import TabsToggler from "./TabsComponents/TabsToggler";
import TabsTogglerMontlyController from "./TabsComponents/tabsMontlyTransactions/TabsTogglerMontlyController";
import HistoricalMovementsController from "./HistoricalMovementsandCategories/HistoricalMovementsController";
import HistoricalComparativeCategories from "./historicalComparativeCategories/HistoricalComparativeCategories";
import HistoricalBudgetsComparative from "./historicalBudgetsComparative/HistoricalBudgetsComparative";
import HistoricalWalletAnalyzer from "./HistoricalWalletAnalyzer/HistoricalWalletAnalyzer";
import HistoricalProjectionsTable from "./HistoricalWalletAnalyzer/HistoricalProjectionsTable";
import usePeriodComparison from "@/hooks/usePeriodComparison";

function HistoryClient({ email }) {
  const [isLoading, setIsLoading] = useState(false);
  // Single shared "period A vs period B" state for every section below -
  // see usePeriodComparison for why this used to be duplicated per section.
  const periodState = usePeriodComparison();

  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const user = ccUser.data;

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
      setUser(ccUser.data);
      setIsLoading(false);
    }
  }, [ccUser.status, email]);
  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full">
        <div className="loader">
          {isLoading && (
            <DashboardLoadingMessage
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
            <TabsTogglerMontlyController periodState={periodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-wallet-analyzer">
            <HistoricalWalletAnalyzer periodState={periodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-projections-table">
            <HistoricalProjectionsTable periodState={periodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-comparative-categories">
            <HistoricalComparativeCategories periodState={periodState} />
          </div>
          <div className="w-full h-fulls pb-6 historical-budgets-comparative">
            <HistoricalBudgetsComparative periodState={periodState} />
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
