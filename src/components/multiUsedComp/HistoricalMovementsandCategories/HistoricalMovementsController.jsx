"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  mergeTopElementsForCompareTable,
  orderByHighestValue,
  orderItemsInRelativeMonth,
  reduceTransCategoriesSliced,
  sortByIndex,
} from "@/helpers/transformers/transactionsChange";
import {
  getPeriodLabel,
  orderItemsInTheirMonth,
  slicedAndReduceNewValuesForMonths,
  timeperiodRangesArray,
} from "@/helpers/timeFunctions/timeFunctions";
import TopMonthContainer from "../top3/topMonthContainer/TopMonthContainer";
import TopElementsCompareTable from "../top3/topMonthContainer/TopElementsCompareTable";

const today = new Date();

// Slices each relative-month bucket down to its top N highest-value
// transactions, for the compare table (same "top N" idea as the single-period
// view's slicedAndReduceNewValuesForMonths, just keyed by relative index).
function sliceTopTransactionMonths(monthsArr, n) {
  return monthsArr.map((m) => ({
    ...m,
    childrens: orderByHighestValue([...m.childrens]).slice(0, n),
  }));
}

// Same idea, but collapses each month's transactions into per-category
// totals first (reduceTransCategoriesSliced), then keeps the top N categories.
function sliceTopCategoryMonths(monthsArr, n) {
  return monthsArr.map((m) => ({
    ...m,
    childrens: orderByHighestValue(reduceTransCategoriesSliced(m.childrens, n)).slice(0, n),
  }));
}

function HistoricalMovementsController() {
  const [isLoading, setIsLoading] = useState(false);
  const [elementsToDisplay, setElementsToDisplay] = useState(6);
  const [transactionsLocal, setTransactionsLocal] = useState([]);
  const [transactionCategories, setTransactionCategories] = useState([]);
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), today.getMonth() - 2, 1),
    today,
  ]);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparePeriod, setComparePeriod] = useState(() => [
    new Date(today.getFullYear() - 1, today.getMonth() - 2, 1),
    new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
  ]);
  const [compareTables, setCompareTables] = useState(null);
  // Redux
  const dispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer);
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);

  const { email } = useGetUserSession();
  // Stable across the component's lifetime (only depends on the
  // module-level `today`) - memoized so it can safely sit in the compare
  // effect's dependency array below without a new array reference on every
  // render re-triggering that effect in a loop.
  const timePeriodsForSelecter = useMemo(
    () => [
      {
        value: `${new Date(today.getFullYear(), today.getMonth() - 2, 1)}*${today}`,
        name: "Last 3 months",
      },
      ...timeperiodRangesArray,
    ],
    []
  );

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

  // "Compare vs another period" table - mirrors the effect above but for
  // comparePeriod, bucketing both periods by relative month position (not
  // calendar month name) so they line up left-to-right regardless of which
  // years they fall in, matching the mirrored compare charts elsewhere on
  // this page. The earlier period always renders on the left.
  useEffect(() => {
    if (!compareEnabled) {
      setCompareTables(null);
      return;
    }
    if (!(ccTransacciones.data && ccTransacciones.data.length >= 1)) return;
    if (!timePeriod[0] || !timePeriod[1] || !comparePeriod[0] || !comparePeriod[1]) return;

    const [leftStart, leftEnd, rightStart, rightEnd] =
      timePeriod[0] <= comparePeriod[0]
        ? [timePeriod[0], timePeriod[1], comparePeriod[0], comparePeriod[1]]
        : [comparePeriod[0], comparePeriod[1], timePeriod[0], timePeriod[1]];

    const leftDivided = filterBillsOrIncomes(
      getTransactionsFromTimeRange(ccTransacciones.data, leftStart, leftEnd)
    );
    const rightDivided = filterBillsOrIncomes(
      getTransactionsFromTimeRange(ccTransacciones.data, rightStart, rightEnd)
    );

    function buildKind(leftArr, rightArr) {
      const leftMonths = orderItemsInRelativeMonth(leftArr, leftStart);
      const rightMonths = orderItemsInRelativeMonth(rightArr, rightStart);
      return {
        transactionRows: mergeTopElementsForCompareTable(
          sliceTopTransactionMonths(leftMonths, elementsToDisplay),
          sliceTopTransactionMonths(rightMonths, elementsToDisplay)
        ),
        categoryRows: mergeTopElementsForCompareTable(
          sliceTopCategoryMonths(leftMonths, elementsToDisplay),
          sliceTopCategoryMonths(rightMonths, elementsToDisplay)
        ),
      };
    }

    setCompareTables({
      bills: buildKind(leftDivided.bills, rightDivided.bills),
      incomes: buildKind(leftDivided.incomes, rightDivided.incomes),
      labelLeft: getPeriodLabel(timePeriodsForSelecter, [leftStart, leftEnd]),
      labelRight: getPeriodLabel(timePeriodsForSelecter, [rightStart, rightEnd]),
    });
  }, [
    ccTransacciones.data,
    timePeriod,
    comparePeriod,
    compareEnabled,
    elementsToDisplay,
    timePeriodsForSelecter,
  ]);

  // COMPONENTS AND VARIABLES
  const styleChildTopMontContainer = "text-3xl text-purple-700 mt-2";
  const components = [
    {
      tab: "bills",
      props: {
        items: transactionsLocal[1],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Transactions</h1>,
        mode: "transaction",
      },
      Component: TopMonthContainer,
    },
    {
      tab: "incomes",
      props: {
        items: transactionsLocal[0],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Transactions</h1>,
        mode: "transaction",
      },
      Component: TopMonthContainer,
    },
    {
      tab: "bills",
      props: {
        items: transactionCategories[1],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Categories</h1>,
        mode: "category",
      },
      Component: TopMonthContainer,
    },
    {
      tab: "incomes",
      props: {
        items: transactionCategories[0],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Categories</h1>,
        mode: "category",
      },
      Component: TopMonthContainer,
    },
  ];

  const tabs = ["Bills", "Incomes"];
  if (compareEnabled && compareTables) {
    components.push(
      {
        tab: "compare bills",
        props: {
          transactionRows: compareTables.bills.transactionRows,
          categoryRows: compareTables.bills.categoryRows,
          labelLeft: compareTables.labelLeft,
          labelRight: compareTables.labelRight,
          elementsToDisplay,
        },
        Component: TopElementsCompareTable,
      },
      {
        tab: "compare incomes",
        props: {
          transactionRows: compareTables.incomes.transactionRows,
          categoryRows: compareTables.incomes.categoryRows,
          labelLeft: compareTables.labelLeft,
          labelRight: compareTables.labelRight,
          elementsToDisplay,
        },
        Component: TopElementsCompareTable,
      }
    );
    tabs.push("Compare bills", "Compare incomes");
  }

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

  function getCompareValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setComparePeriod([new Date(start), new Date(end)]);
  }

  function handleCompareRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setComparePeriod([dateStart, dateEnd]);
    }
  }

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
      tabs={tabs}
      getValueFromItems={getValueFromItems}
      compareEnabled={compareEnabled}
      setCompareEnabled={setCompareEnabled}
      comparePeriod={comparePeriod}
      getCompareValueFromSelecter={getCompareValueFromSelecter}
      handleCompareRangeDate={handleCompareRangeDate}
      timePeriodsForCompareSelecter={timePeriodsForSelecter}
    />
  );
}

export default HistoricalMovementsController;
