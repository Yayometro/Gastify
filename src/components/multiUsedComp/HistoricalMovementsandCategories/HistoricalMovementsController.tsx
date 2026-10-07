"use client";
import React, { useEffect, useState } from "react";
import HistoricalMovementsView from "./HistoricalMovementsView";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "@/lib/features/userSlice";
import {
  fetchTrans,
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
  type TransactionLike,
  type RelativeMonthGroup,
} from "@/helpers/transformers/transactionsChange";
import {
  getPeriodLabel,
  orderItemsInTheirMonth,
  slicedAndReduceNewValuesForMonths,
  type MonthTransactionsBucket,
  type MonthTransactionItem,
} from "@/helpers/timeFunctions/timeFunctions";
import TopMonthContainer from "../top3/topMonthContainer/TopMonthContainer";
import TopElementsCompareTable, { type CompareRow } from "../top3/topMonthContainer/TopElementsCompareTable";
import type { PeriodComparisonState } from "@/hooks/usePeriodComparison";
import type { RootState, AppDispatch } from "@/lib/store";
import type { TabsTogglerComponentItem } from "../TabsComponents/TabsToggler";
import type { SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";

export interface MonthBucket<T = unknown> {
  index?: number;
  monthLabel?: string;
  name?: string;
  icon?: string;
  value?: number;
  childrens: T[];
  [key: string]: unknown;
}

export interface ContainerTransactionItem {
  _id?: string;
  name?: string;
  value?: number;
  amount?: number;
  isBill?: boolean;
  isIncome?: boolean;
  kind?: string;
  date?: Date | string | number | null;
  createdAt?: Date | string | number | null;
  category?: {
    _id?: string;
    name?: string;
    icon?: string;
    color?: string;
    [key: string]: unknown;
  } | null;
  subCategory?: {
    _id?: string;
    name?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface HistoricalMovementsCompareTableKind {
  transactionRows: CompareRow[];
  categoryRows: CompareRow[];
}

export interface HistoricalMovementsCompareTablesState {
  bills: HistoricalMovementsCompareTableKind;
  incomes: HistoricalMovementsCompareTableKind;
  labelLeft: string;
  labelRight: string;
}

export interface HistoricalMovementsControllerProps {
  periodState: PeriodComparisonState;
}

// Slices each relative-month bucket down to its top N highest-value
// transactions, for the compare table (same "top N" idea as the single-period
// view's slicedAndReduceNewValuesForMonths, just keyed by relative index).
function sliceTopTransactionMonths<T extends TransactionLike = TransactionLike>(
  monthsArr: RelativeMonthGroup<T>[],
  n: number
): RelativeMonthGroup<T>[] {
  return monthsArr.map((m) => ({
    ...m,
    childrens: (orderByHighestValue([...m.childrens] as unknown as { value?: number }[]).slice(0, n) as unknown as T[]),
  }));
}

// Same idea, but collapses each month's transactions into per-category
// totals first (reduceTransCategoriesSliced), then keeps the top N categories.
function sliceTopCategoryMonths<T extends TransactionLike = TransactionLike>(
  monthsArr: RelativeMonthGroup<T>[],
  n: number
): RelativeMonthGroup<unknown>[] {
  return monthsArr.map((m) => ({
    ...m,
    childrens: orderByHighestValue(reduceTransCategoriesSliced(m.childrens)).slice(0, n),
  }));
}

function HistoricalMovementsController({ periodState }: HistoricalMovementsControllerProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elementsToDisplay, setElementsToDisplay] = useState<number>(6);
  const [transactionsLocal, setTransactionsLocal] = useState<MonthBucket[][]>([]);
  const [transactionCategories, setTransactionCategories] = useState<MonthBucket[][]>([]);
  const [compareTables, setCompareTables] = useState<HistoricalMovementsCompareTablesState | null>(null);
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);

  const { email } = useGetUserSession();
  // Period state (timePeriod/comparePeriod/compareEnabled + selector
  // options/handlers) is owned by HistoryClient via usePeriodComparison and
  // shared across every /dashboard/history section - see that hook for why.
  const {
    timePeriod,
    comparePeriod,
    compareEnabled,
    setCompareEnabled,
    timePeriodsForSelecter,
    getValueFromSelecter,
    handleRangeDate,
    getCompareValueFromSelecter,
    handleCompareRangeDate,
  } = periodState;

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
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setIsLoading(false);
    }
    if (ccTransacciones.data && ccTransacciones.data.length >= 1) {
      // Order by time and by the amount
      const transactionsOrdered = orderByHighestValue(
        getTransactionsFromTimeRange(
          ccTransacciones.data as unknown as ContainerTransactionItem[],
          timePeriod[0],
          timePeriod[1]
        )
      );
      // Divide in bills or incomes
      const dividedTrans = filterBillsOrIncomes(transactionsOrdered);
      // Order items in their month and create subarray
      const billsPerMonth = sortByIndex(
        orderItemsInTheirMonth(dividedTrans.bills as unknown as TransactionLike[]) as unknown as { index: number }[]
      ) as unknown as MonthTransactionsBucket<TransactionLike>[];
      const incomesPerMonth = sortByIndex(
        orderItemsInTheirMonth(dividedTrans.incomes as unknown as TransactionLike[]) as unknown as { index: number }[]
      ) as unknown as MonthTransactionsBucket<TransactionLike>[];
      // Cut the months subArray childrens and re-vaule the total per month
      const billsSliced = slicedAndReduceNewValuesForMonths(
        billsPerMonth as unknown as MonthTransactionsBucket<MonthTransactionItem>[],
        elementsToDisplay
      );
      const incomesSliced = slicedAndReduceNewValuesForMonths(
        incomesPerMonth as unknown as MonthTransactionsBucket<MonthTransactionItem>[],
        elementsToDisplay
      );
      setTransactionsLocal([incomesSliced as unknown as MonthBucket[], billsSliced as unknown as MonthBucket[]]);
      // Re-structure the data to categories.
      const finalBillsCategories = billsPerMonth.map((month) => {
        const toCategoriesSliced = orderByHighestValue(reduceTransCategoriesSliced(month.childrens)).slice(0, elementsToDisplay);
        const totalValuee = toCategoriesSliced.reduce((acc: number, item: ContainerTransactionItem) => acc += (item.value || item.amount), 0);
        return { ...month, childrens: toCategoriesSliced, value: totalValuee };
      });
      const finalIncomesCategories = incomesPerMonth.map((month) => {
        const toCategoriesSliced = orderByHighestValue(reduceTransCategoriesSliced(month.childrens)).slice(0, elementsToDisplay);
        const totalValuee = toCategoriesSliced.reduce((acc: number, item: ContainerTransactionItem) => acc += (item.value || item.amount), 0);
        return { ...month, childrens: toCategoriesSliced, value: totalValuee };
      });
      setTransactionCategories([finalIncomesCategories as unknown as MonthBucket[], finalBillsCategories as unknown as MonthBucket[]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      getTransactionsFromTimeRange(ccTransacciones.data as unknown as ContainerTransactionItem[], leftStart, leftEnd)
    );
    const rightDivided = filterBillsOrIncomes(
      getTransactionsFromTimeRange(ccTransacciones.data as unknown as ContainerTransactionItem[], rightStart, rightEnd)
    );

    function buildKind(leftArr: unknown[], rightArr: unknown[]): HistoricalMovementsCompareTableKind {
      const leftMonths = orderItemsInRelativeMonth(leftArr as TransactionLike[], leftStart);
      const rightMonths = orderItemsInRelativeMonth(rightArr as TransactionLike[], rightStart);
      return {
        transactionRows: mergeTopElementsForCompareTable(
          sliceTopTransactionMonths(leftMonths, elementsToDisplay),
          sliceTopTransactionMonths(rightMonths, elementsToDisplay)
        ) as CompareRow[],
        categoryRows: mergeTopElementsForCompareTable(
          sliceTopCategoryMonths(leftMonths, elementsToDisplay),
          sliceTopCategoryMonths(rightMonths, elementsToDisplay)
        ) as CompareRow[],
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
  const styleChildTopMontContainer = "text-3xl text-purple-300 mt-2";
  const components: TabsTogglerComponentItem<object>[] = [
    {
      tab: "bills",
      props: {
        items: transactionsLocal[1],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Transactions</h1>,
        mode: "transaction",
      },
      Component: TopMonthContainer as unknown as React.ComponentType<object>,
    },
    {
      tab: "incomes",
      props: {
        items: transactionsLocal[0],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Transactions</h1>,
        mode: "transaction",
      },
      Component: TopMonthContainer as unknown as React.ComponentType<object>,
    },
    {
      tab: "bills",
      props: {
        items: transactionCategories[1],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Categories</h1>,
        mode: "category",
      },
      Component: TopMonthContainer as unknown as React.ComponentType<object>,
    },
    {
      tab: "incomes",
      props: {
        items: transactionCategories[0],
        title: <h1 className={styleChildTopMontContainer}>Top {elementsToDisplay} Categories</h1>,
        mode: "category",
      },
      Component: TopMonthContainer as unknown as React.ComponentType<object>,
    },
  ];

  const tabs: string[] = ["Bills", "Incomes"];
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
        Component: TopElementsCompareTable as unknown as React.ComponentType<object>,
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
        Component: TopElementsCompareTable as unknown as React.ComponentType<object>,
      }
    );
    tabs.push("Compare bills", "Compare incomes");
  }

  // FUNCTIONS
  const getValueFromItems = React.useCallback((e: number | string) => {
    setElementsToDisplay(+e);
  }, []);

  return (
    <HistoricalMovementsView
      isLoading={isLoading}
      timePeriod={timePeriod}
      periodFromFather={timePeriodsForSelecter[0] as unknown as SelecterPeriod}
      timePeriodsForSelecter={timePeriodsForSelecter as unknown as SelecterPeriod[]}
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
      timePeriodsForCompareSelecter={timePeriodsForSelecter as unknown as SelecterPeriod[]}
    />
  );
}

export default HistoricalMovementsController;
