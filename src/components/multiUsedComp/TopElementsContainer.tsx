"use client";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser, setUser, type UserState } from "@/lib/features/userSlice";
import {
  fetchTrans,
  setTransacctions,
  type TransacctionsState,
} from "@/lib/features/transacctionsSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import {
  filterBillsOrIncomes,
  get_total_value_of_all_transactions,
  getTransactionsFromTimeRange,
  orderByHighestValue,
  reduceTransCategoriesSliced,
  sortBasedOnValueProperty,
  type TransactionLike,
} from "@/helpers/transformers/transactionsChange";
import { formatMoneyMajor } from "@/lib/money/currencies";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
} from "@/helpers/timeFunctions/timeFunctions";
import TopRankColumn, { type RankRowItem } from "./top3/topRankColumn/TopRankColumn";
import TopElementContainerView from "./TopElementContainerView";
import type { RootState, AppDispatch } from "@/lib/store";
import type { TabsTogglerComponentItem } from "./TabsComponents/TabsToggler";

const today = new Date();

export interface TopElementsContainerProps {
  timePeriodFromFather?: [Date, Date] | (Date | string)[] | null;
}

export interface TotalTransactionsLocalState {
  income: string | number;
  bills: string | number;
}

export interface CategoryGroupItem {
  children: RankRowItem[];
  total: string | number;
}

export interface TransactionCategoriesState {
  bills: CategoryGroupItem;
  incomes: CategoryGroupItem;
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

function TopElementsContainer({ timePeriodFromFather }: TopElementsContainerProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elementsToDisplay, setElementsToDisplay] = useState<number>(6);
  const [transactionsLocal, setTransactionsLocal] = useState<RankRowItem[][]>([]);
  const [totalTransactionsLocal, setTotalTransactionsLocal] = useState<TotalTransactionsLocalState>({ income: 0, bills: 0 });
  const [transactionCategories, setTransactionCategories] = useState<TransactionCategoriesState>({
    bills: { children: [], total: 0 },
    incomes: { children: [], total: 0 },
  });
  const [timePeriod, setTimePeriod] = useState<(Date | string)[]>(timePeriodFromFather || [
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(
      today.getFullYear(),
      today.getMonth(),
      getLastDayOfMonth(today.getFullYear(), today.getMonth()) as unknown as number
    ),
  ]);
  // True once the user makes a manual selection — prevents parent re-renders from resetting the period
  const userHasSelectedPeriod = useRef<boolean>(false);
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);
  const walletPrimaryCurrency = useSelector((state: RootState) => state.walletReducer?.data?.primaryCurrency) || "MXN";

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
      setUser(ccUser.data as unknown as UserState);
    }
    //Transactions
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data as unknown as TransacctionsState);
      setIsLoading(false);
    }
    if (ccTransacciones.data && ccTransacciones.data.length >= 1) {
      // Order by time and by the amount
      const transactionsOrdered = orderByHighestValue(
        getTransactionsFromTimeRange(
          ccTransacciones.data as unknown as ContainerTransactionItem[],
          timePeriod[0] as unknown as Date,
          timePeriod[1] as unknown as Date
        )
      );
      // Divide in bills or incomes
      const dividedTrans = filterBillsOrIncomes(transactionsOrdered);
      const incomesTransactionsSlices = sortBasedOnValueProperty(elementsToDisplay, dividedTrans.incomes as unknown as { value: number }[]);
      const billsTransactionsSlices = sortBasedOnValueProperty(elementsToDisplay, dividedTrans.bills as unknown as { value: number }[]);

      const totalTransLocalBills = formatMoneyMajor(get_total_value_of_all_transactions(billsTransactionsSlices), walletPrimaryCurrency);
      const totalTransLocalIncome = formatMoneyMajor(get_total_value_of_all_transactions(incomesTransactionsSlices), walletPrimaryCurrency);

      setTotalTransactionsLocal({ income: totalTransLocalIncome, bills: totalTransLocalBills });
      setTransactionsLocal([incomesTransactionsSlices as unknown as RankRowItem[], billsTransactionsSlices as unknown as RankRowItem[]]);
      // Transform to categories
      const toCategoriesSliced = orderByHighestValue(
        reduceTransCategoriesSliced(dividedTrans.bills as unknown as TransactionLike[], dividedTrans.bills.length)
      ).slice(0, elementsToDisplay);
      const totalValue = toCategoriesSliced.reduce(
        (acc: number, item: ContainerTransactionItem) => (acc += item.value || item.amount),
        0
      );
      const finalBillsCategories = {
        children: toCategoriesSliced as unknown as RankRowItem[],
        total: formatMoneyMajor(totalValue, walletPrimaryCurrency),
      };
      const toCategoriesSlicedIncomes = orderByHighestValue(
        reduceTransCategoriesSliced(dividedTrans.incomes as unknown as TransactionLike[], dividedTrans.incomes.length)
      ).slice(0, elementsToDisplay);
      const totalValueIncome = toCategoriesSlicedIncomes.reduce(
        (acc: number, item: ContainerTransactionItem) => (acc += item.value || item.amount),
        0
      );
      const finalIncomesCategories = {
        children: toCategoriesSlicedIncomes as unknown as RankRowItem[],
        total: formatMoneyMajor(totalValueIncome, walletPrimaryCurrency),
      };
      setTransactionCategories({ incomes: finalIncomesCategories, bills: finalBillsCategories });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccUser, ccTransacciones, timePeriod, elementsToDisplay]);

  // Sync father period only if user hasn't manually selected one yet
  useEffect(() => {
    if (!userHasSelectedPeriod.current && timePeriodFromFather) {
      setTimePeriod(timePeriodFromFather);
    }
  }, [timePeriodFromFather]);

  // COMPONENTS AND VARIABLES
  // Same title convention as WalletAnalyzerView's Top 12 cards (eyebrow +
  // big total), fuchsia instead of purple so this control reads as its own
  // thing next to the Wallet Analyzer's identical-looking [3,6,12,24] toggle.
  const topRankTitle = (label: string, total: string | number) => (
    <>
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-fuchsia-400">
        Top {elementsToDisplay} {label}
      </p>
      <p className="text-[15px] font-extrabold text-gf-text mb-2">Total: {total}</p>
    </>
  );
  const components: TabsTogglerComponentItem<object>[] = [
    {
      tab: "bills",
      props: {
        items: transactionsLocal[1],
        title: topRankTitle("Transactions", totalTransactionsLocal.bills),
      },
      Component: TopRankColumn as unknown as React.ComponentType<object>,
    },
    {
      tab: "incomes",
      props: {
        items: transactionsLocal[0],
        title: topRankTitle("Transactions", totalTransactionsLocal.income),
      },
      Component: TopRankColumn as unknown as React.ComponentType<object>,
    },
    {
      tab: "bills",
      props: {
        items: transactionCategories.bills.children,
        title: topRankTitle("Categories", transactionCategories.bills.total),
      },
      Component: TopRankColumn as unknown as React.ComponentType<object>,
    },
    {
      tab: "incomes",
      props: {
        items: transactionCategories.incomes.children,
        title: topRankTitle("Categories", transactionCategories.incomes.total),
      },
      Component: TopRankColumn as unknown as React.ComponentType<object>,
    },
  ];

  const timePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(
    today.getFullYear()
  );
  // FUNCTIONS
  function getValueFromSelecter(v: string) {
    userHasSelectedPeriod.current = true;
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart: unknown, dateEnd?: unknown) {
    if (dateStart && dateEnd) {
      userHasSelectedPeriod.current = true;
      setTimePeriod([dateStart as Date | string, dateEnd as Date | string]);
    }
  }
  const getValueFromItems = React.useCallback((e: number | string) => {
    setElementsToDisplay(+e);
  }, []);
  return (
    <TopElementContainerView
      isLoading={isLoading}
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
