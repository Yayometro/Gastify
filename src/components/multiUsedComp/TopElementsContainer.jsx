"use client";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser, setUser } from "@/lib/features/userSlice";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import {
  filterBillsOrIncomes,
  get_total_value_of_all_transactions,
  getTransactionsFromTimeRange,
  orderByHighestValue,
  reduceTransCategoriesSliced,
  sortBasedOnValueProperty,
  sortByIndex,
  usdFormatChanger,
} from "@/helpers/transformers/transactionsChange";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
  orderItemsInTheirMonth,
  slicedAndReduceNewValuesForMonths,
  timeperiodRangesArray,
} from "@/helpers/timeFunctions/timeFunctions";
import TopContainer from "./top3/top-container/TopContainer";
import TopElementContainerView from "./TopElementContainerView";

const today = new Date();

function TopElementsContainer({timePeriodFromFather}) {
  const [isLoading, setIsLoading] = useState(false);
  const [elementsToDisplay, setElementsToDisplay] = useState(6);
  const [transactionsLocal, setTransactionsLocal] = useState([]);
  const [totalTransactionsLocal, setTotalTransactionsLocal] = useState({income: 0, bills:0})
  const [transactionCategories, setTransactionCategories] = useState({
    bills: {children: [], total: 0},
    incomes: {children: [], total: 0},
  });
  const [timePeriod, setTimePeriod] = useState(timePeriodFromFather || [
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(
      today.getFullYear(),
      today.getMonth(),
      getLastDayOfMonth(today.getFullYear(), today.getMonth())
    ),
  ]);
  // True once the user makes a manual selection — prevents parent re-renders from resetting the period
  const userHasSelectedPeriod = useRef(false);
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
      const incomesTransactionsSlices = sortBasedOnValueProperty(elementsToDisplay, dividedTrans.incomes)
      const billsTransactionsSlices = sortBasedOnValueProperty(elementsToDisplay, dividedTrans.bills)

      const totalTransLocalBills = usdFormatChanger(get_total_value_of_all_transactions(billsTransactionsSlices))
      const totalTransLocalIncome = usdFormatChanger(get_total_value_of_all_transactions(incomesTransactionsSlices))

      setTotalTransactionsLocal({income: totalTransLocalIncome, bills:totalTransLocalBills})
      setTransactionsLocal([incomesTransactionsSlices, billsTransactionsSlices]);
      // Transform to categories
      const toCategoriesSliced = orderByHighestValue(
        reduceTransCategoriesSliced(dividedTrans.bills, dividedTrans.bills.length)
      ).slice(0, elementsToDisplay);
      const totalValue = toCategoriesSliced.reduce(
        (acc, item) => (acc += item.value || item.amount),
        0
      );
      const finalBillsCategories = {
        children: toCategoriesSliced,
        total: usdFormatChanger(totalValue),
      };
      const toCategoriesSlicedIncomes = orderByHighestValue(
        reduceTransCategoriesSliced(dividedTrans.incomes, dividedTrans.incomes.length)
      ).slice(0, elementsToDisplay);
      const totalValueIncome = toCategoriesSlicedIncomes.reduce(
        (acc, item) => (acc += item.value || item.amount),
        0
      );
      const finalIncomesCategories = {
        children: toCategoriesSlicedIncomes,
        total: usdFormatChanger(totalValueIncome),
      };
      setTransactionCategories({incomes: finalIncomesCategories, bills: finalBillsCategories});
    }
  }, [ccUser, ccTransacciones, timePeriod, elementsToDisplay]);

  // Sync father period only if user hasn't manually selected one yet
  useEffect(() => {
    if (!userHasSelectedPeriod.current && timePeriodFromFather) {
      setTimePeriod(timePeriodFromFather);
    }
  }, [timePeriodFromFather]);

  // COMPONENTS AND VARIABLES
  const styleChildTopMontContainer = "text-3xl text-purple-700 mt-2";
  const components = [
    {
      tab: "bills",
      props: {
        items: transactionsLocal[1],
        style: {
          father: "w-full text-center",
          child: "w-full flex align-center justify-center",
        },
        title: (
           <>
          <h1 className={styleChildTopMontContainer}>
            Top {elementsToDisplay} Transactions
          </h1>
          <p className="">Total of all: {totalTransactionsLocal.bills}</p>
          </>
        ),
      },
      Component: TopContainer,
    },
    {
      tab: "incomes",
      props: {
        items: transactionsLocal[0],
        style: {
          father: "w-full text-center",
          child: "w-full flex align-center justify-center",
        },
        title: (
          <>
          <h1 className={styleChildTopMontContainer}>
            Top {elementsToDisplay} Transactions
          </h1>
          <p className="">Total of all: {totalTransactionsLocal.income}</p>
          </>
        ),
      },
      Component: TopContainer,
    },
    {
      tab: "bills",
      props: {
        style: {
            father: "w-full text-center",
            child: "w-full flex align-center justify-center",
          },
        items: transactionCategories.bills.children,
        title: (
          <>
          <h1 className={styleChildTopMontContainer}>
            Top {elementsToDisplay} Categories
          </h1>
          <p className="">Total of all: {transactionCategories.bills.total}</p>
          </>
        ),
      },
      Component: TopContainer,
    },
    {
      tab: "incomes",
      props: {
        style: {
            father: "w-full text-center",
            child: "w-full flex align-center justify-center",
          },
        items: transactionCategories.incomes.children,
        title: (
          <>
          <h1 className={styleChildTopMontContainer}>
            Top {elementsToDisplay} Categories
          </h1>
          <p className="">Total of all: {transactionCategories.bills.total}</p>
          </>
        ),
      },
      Component: TopContainer,
    },
  ];

  const timePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(
    today.getFullYear()
  );
  // FUNCTIONS
  function getValueFromSelecter(v) {
    userHasSelectedPeriod.current = true;
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      userHasSelectedPeriod.current = true;
      setTimePeriod([dateStart, dateEnd]);
    }
  }
  const getValueFromItems = React.useCallback((e) => {
    setElementsToDisplay(+e);
  }, []);
  return (
    <TopElementContainerView
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

export default TopElementsContainer;
