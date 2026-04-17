"use client";
import React, { useEffect, useState } from "react";
import HistoricalMovementsView from "./HistoricalMovementsView";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  orderByHighestValue,
  reduceTransCategoriesSliced,
  sortByIndex,
} from "@/helpers/transformers/transactionsChange";
import {
  orderItemsInTheirMonth,
  slicedAndReduceNewValuesForMonths,
  timeperiodRangesArray,
} from "@/helpers/timeFunctions/timeFunctions";
import TopMonthContainer from "../top3/topMonthContainer/TopMonthContainer";

const today = new Date();

function HistoricalMovementsController() {
  const [isLoading, setIsLoading] = useState(false);
  const [elementsToDisplay, setElementsToDisplay] = useState(6);
  const [transactionsLocal, setTransactionsLocal] = useState([]);
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);

  const { email } = useGetUserSession();

  // USE EFFECTS:
  useEffect(() => {
    // User
    if (ccUser.status == "idle") {
      dispatch(fetchUser(email));
    }
    //Transactions
    if (ccTransacciones.status == "idle" && email) {
      setIsLoading(true);
      dispatch(fetchTrans(email));
    }
    if (ccUser.status == "succeeded") {
      setUser(ccUser.data);
    }
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data);
      setIsLoading(false);
    }
    if (ccTransacciones.data && ccTransacciones.data.length >= 1) {
      // Order by time and by the amount
      const transactionsOrdered = orderByHighestValue(
        getTransactionsFromTimeRange(
          ccTransacciones.data,
          timePeriod[0],
          timePeriod[1]
        )
      );
      // Divide in bills or incomes
      const dividedTrans = filterBillsOrIncomes(transactionsOrdered);
      // Order items in their month and create subarray
      const billsPerMonth = sortByIndex(orderItemsInTheirMonth(dividedTrans.bills));
      const incomesPerMonth = sortByIndex(orderItemsInTheirMonth(dividedTrans.incomes));
      // Cut the months subArray childrens and re-vaule the total per month
      const billsSliced = slicedAndReduceNewValuesForMonths(
        billsPerMonth,
        elementsToDisplay
      );
      const incomesSliced = slicedAndReduceNewValuesForMonths(
        incomesPerMonth,
        elementsToDisplay
      );
      setTransactionsLocal([incomesSliced, billsSliced]);
      // Re-structure the data to categories.
      const finalBillsCategories = billsPerMonth.map((month) => {
        const toCategoriesSliced = orderByHighestValue(reduceTransCategoriesSliced(month.childrens, elementsToDisplay)).slice(0, elementsToDisplay);
        const totalValuee = toCategoriesSliced.reduce((acc, item) => acc += (item.value || item.amount), 0)
        return { ...month, childrens: toCategoriesSliced, value: totalValuee };
      });
      const finalIncomesCategories = incomesPerMonth.map((month) => {
        const toCategoriesSliced = orderByHighestValue(reduceTransCategoriesSliced(month.childrens, elementsToDisplay)).slice(0, elementsToDisplay);
        const totalValuee = toCategoriesSliced.reduce((acc, item) => acc += (item.value || item.amount), 0)
        return { ...month, childrens: toCategoriesSliced, value: totalValuee };
      });
      setTransactionCategories([finalIncomesCategories, finalBillsCategories]);
    }
  }, [ccUser, ccTransacciones, timePeriod, elementsToDisplay]);

  // COMPONENTS AND VARIABLES
  const styleChildTopMontContainer = "text-3xl text-purple-700 mt-2";
  const components = [
    {
      tab: "bills",
      props: {
        items: transactionsLocal[1],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Transactions</h1>,
      },
      Component: TopMonthContainer,
    },
    {
      tab: "incomes",
      props: {
        items: transactionsLocal[0],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Transactions</h1>,
      },
      Component: TopMonthContainer,
    },
    {
      tab: "bills",
      props: {
        items: transactionCategories[1],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Categories</h1>,
      },
      Component: TopMonthContainer,
    },
    {
      tab: "incomes",
      props: {
        items: transactionCategories[0],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Categories</h1>,
      },
      Component: TopMonthContainer,
    },
  ];

  const timePeriodsForSelecter = [
    {
      value: `${new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1
      )}*${today}`,
      name: "Last 3 months",
    },
    ...timeperiodRangesArray,
  ];
  // FUNCTIONS
  function getValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setTimePeriod([dateStart, dateEnd]);
    }
  }
  const getValueFromItems = React.useCallback((e) => {
    setElementsToDisplay(+e)
  }, [])

  return (
    <HistoricalMovementsView
      isloading={isLoading}
      timePeriod={timePeriod}
      periodFromFather={timePeriodsForSelecter[0]}
      timePeriodsForSelecter={timePeriodsForSelecter}
      elementsToDisplay={elementsToDisplay}
      transactions={transactionsLocal}
      transactionsCategories={transactionCategories}
      getValueFromSelecter={getValueFromSelecter}
      handleRangeDate={handleRangeDate}
      components={components}
      getValueFromItems={getValueFromItems}
    />
  );
}

export default HistoricalMovementsController;
