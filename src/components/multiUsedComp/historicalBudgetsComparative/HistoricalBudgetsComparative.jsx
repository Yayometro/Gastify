"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useGetUserSession from "@/hooks/useGetUserSession";
import useModal from "@/hooks/useModalBasic";
import fetcher from "@/helpers/fetcher";
import { timeperiodRangesArray } from "@/helpers/timeFunctions/timeFunctions";
import { buildBudgetHistoricalComparative } from "@/helpers/transformers/budgetHistoricalComparative";
import HistoricalBudgetsComparativeView from "./HistoricalBudgetsComparativeView";
import BudgetHistoricalDetailModal from "./BudgetHistoricalDetailModal";
import BasicModal from "@/components/modals/basicModal/BasicModal";

const today = new Date();

// New (not yet on this page before) - lets you see how your spending
// budgets behaved month by month across whatever range you pick, same as
// the transaction/category sections above it. Fetches budgets via a
// dedicated route that includes archived ones (see
// budget/get-historical/route.js) rather than the app's usual /budget/get,
// since an archived budget's past months would otherwise disappear from a
// historical view even though its data was never deleted.
function HistoricalBudgetsComparative() {
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { email } = useGetUserSession();
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const walletPrimaryCurrency =
    useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const { close, modalContent, renderModal, handleClose } = useModal();

  function onOpenDetail(row) {
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
      .then((res) => {
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

  function getValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setTimePeriod([dateStart, dateEnd]);
    }
  }

  const timePeriodsForSelecter = [
    {
      value: `${new Date(today.getFullYear(), today.getMonth() - 2, 1)}*${today}`,
      name: "Last 3 months",
    },
    ...timeperiodRangesArray,
  ];

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
