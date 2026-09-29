"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/store";
import {
  fetchTrans,
  setTransacctions,
  type TransacctionsState,
} from "@/lib/features/transacctionsSlice";
import type { WalletData } from "@/lib/features/walletSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import { getPeriodLabel } from "@/helpers/timeFunctions/timeFunctions";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  mapToAddTypeTransactionAndColor,
  transactionsToMonths,
  transactionsToRelativeMonths,
} from "@/helpers/transformers/transactionsChange";
import type usePeriodComparison from "@/hooks/usePeriodComparison";
import type { TabsTogglerComponentItem } from "../TabsToggler";
import TabsTogglerMontlyView from "./TabsTogglerMontlyView";
import ResponsiveBarsChartComponent from "../../chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent";
import ColumnChartAntComparative from "../../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import {
  generatePropForChartColAntTogglerTabs,
  generatePropForChartColAntPeriodCompare,
} from "./propsForColumnChartAntComparative-tabsToggler/propsColTabsToggler";

export type PeriodComparisonState = ReturnType<typeof usePeriodComparison>;

export interface TabsTogglerMontlyControllerProps {
  periodState: PeriodComparisonState;
}

export interface MonthBucketItem {
  type?: string;
  index?: number;
  monthLabel?: string;
  value: number;
  isBill?: boolean | null;
  isIncome?: boolean | null;
  [key: string]: unknown;
}

export interface CompareTotals {
  incomeA: number;
  billA: number;
  incomeB: number;
  billB: number;
}

export interface CompareChartItem {
  type: string;
  transactionType: string;
  color: string;
  absValue: number;
  value: number;
  monthLabel?: string;
  index?: number;
  [key: string]: unknown;
}

export interface CompareChartDataState {
  chartData: CompareChartItem[];
  totals: CompareTotals;
  labelA: string;
  labelB: string;
}

export interface ClickedChartItem {
  type?: string;
  value?: number;
  isBill?: boolean;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

// Typed bridges for unmigrated child JSX components
interface TabsTogglerMontlyViewProps {
  getValueSelecterFilter: (v: string) => void;
  timePeriodsForSelecter: Array<{ value: string; name: string }>;
  data: unknown[][];
  handleRangeDate: (dateStart: Date | null, dateEnd: Date | null) => void;
  timePeriod: Date[];
  // Dynamic component container passes heterogeneous props to child components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: TabsTogglerComponentItem<any>[];
  tabs: string[];
  compareEnabled: boolean;
  setCompareEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  comparePeriod: Date[];
  getCompareValueFromSelecter: (v: string) => void;
  handleCompareRangeDate: (dateStart: Date | null, dateEnd: Date | null) => void;
  timePeriodsForCompareSelecter: Array<{ value: string; name: string }>;
  rangePickerResponse?: unknown;
}
const TypedTabsTogglerMontlyView = TabsTogglerMontlyView as unknown as React.ComponentType<TabsTogglerMontlyViewProps>;

interface ResponsiveBarsChartComponentProps {
  data?: unknown[];
  totalValue?: number;
  legendBottom?: string;
  legenedLeft?: string;
  [key: string]: unknown;
}
const TypedResponsiveBarsChartComponent = ResponsiveBarsChartComponent as unknown as React.ComponentType<ResponsiveBarsChartComponentProps>;

interface ColumnChartAntComparativeProps {
  data?: unknown;
  totalValue?: React.ReactNode;
  propPlus?: Record<string, unknown>;
  [key: string]: unknown;
}
const TypedColumnChartAntComparative = ColumnChartAntComparative as unknown as React.ComponentType<ColumnChartAntComparativeProps>;

function TabsTogglerMontlyController({
  periodState,
}: TabsTogglerMontlyControllerProps): React.JSX.Element {
  const [data, setData] = useState<unknown[][]>([]);
  const [, setLoading] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number[]>([]);
  const [clickedItems, setClickedItems] = useState<ClickedChartItem[]>([]);
  const [compareChartData, setCompareChartData] = useState<CompareChartDataState | null>(null);

  const { email } = useGetUserSession();

  // REDUX
  const dispath = useDispatch<AppDispatch>();
  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);
  const walletPrimaryCurrency: string = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const allTransactions = ccTransacciones.data;
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

  useEffect(() => {
    // User
    if (ccTransacciones.status == "idle" && email) {
      setLoading(true);
      dispath(fetchTrans(email));
    }
    if (ccTransacciones.status == "succeeded") {
      setTransacctions(ccTransacciones.data as unknown as TransacctionsState);
      setLoading(false);
    }
  }, [ccTransacciones, email, dispath]);

  useEffect(() => {
    if (allTransactions.length >= 1 && timePeriod[0] && timePeriod[1]) {
      // First filter by range
      const transactionsFilteredWithDateRange = getTransactionsFromTimeRange(
        allTransactions,
        timePeriod[0],
        timePeriod[1]
      );
      //   filter by incomes or bills
      const transactionsTemp = filterBillsOrIncomes(
        transactionsFilteredWithDateRange
      );
      // Transform all transactions to month object to chart
      const bills = transactionsToMonths(transactionsTemp.bills);
      const incomes = transactionsToMonths(transactionsTemp.incomes);
      const allTransConvined = mapToAddTypeTransactionAndColor([
        ...bills.array,
        ...incomes.array,
      ]);
      // set new values
      setData([incomes.array, bills.array, allTransConvined]);
      setTotalAmount([
        incomes.totalValue,
        bills.totalValue,
        incomes.totalValue + bills.totalValue,
      ]);
    }
  }, [allTransactions, timePeriod]);

  useEffect(() => {
    if (!compareEnabled) {
      setCompareChartData(null);
      return;
    }
    if (allTransactions.length < 1) return;
    if (!timePeriod[0] || !timePeriod[1] || !comparePeriod[0] || !comparePeriod[1]) return;

    const transA = getTransactionsFromTimeRange(allTransactions, timePeriod[0], timePeriod[1]);
    const transB = getTransactionsFromTimeRange(allTransactions, comparePeriod[0], comparePeriod[1]);
    const splitA = filterBillsOrIncomes(transA);
    const splitB = filterBillsOrIncomes(transB);

    // Bucketed by position-within-range (not calendar month name) so the two
    // periods pair up bar-for-bar even when they span different years or
    // aren't the same calendar months at all.
    const incomesA = transactionsToRelativeMonths(splitA.incomes, timePeriod[0]);
    const billsA = transactionsToRelativeMonths(splitA.bills, timePeriod[0]);
    const incomesB = transactionsToRelativeMonths(splitB.incomes, comparePeriod[0]);
    const billsB = transactionsToRelativeMonths(splitB.bills, comparePeriod[0]);

    const labelA = getPeriodLabel(timePeriodsForSelecter, timePeriod);
    const labelB = getPeriodLabel(timePeriodsForSelecter, comparePeriod);
    // Period A renders above the zero line, period B below it (mirrored).
    // `type` (the chart's xField) folds the metric into the bucket key -
    // "June Income" / "June Bill" - not just "Month 1", so each xField
    // bucket only ever contains the 2 bars being compared (this period's
    // income vs. that period's income), and the axis reads as real month
    // names instead of "Month 1"/"Month 2". Bucketing by month alone put
    // all 4 series (income A/B, bill A/B) in the same bucket, so the
    // grouped-bar layout scattered them side by side instead of stacking
    // income over income and bill over bill - `absValue` keeps the real
    // (always-positive) amount for labels/tooltips, since a downward bar
    // shouldn't read as "negative spending."
    const tagOne = (
      m: MonthBucketItem,
      monthName: string,
      metricLabel: string,
      periodLabel: string,
      color: string,
      mirror: boolean
    ): CompareChartItem => ({
      ...m,
      type: `${monthName} ${metricLabel}`,
      transactionType: `${metricLabel} (${periodLabel})`,
      color,
      absValue: m.value,
      value: mirror ? -m.value : m.value,
    });

    const monthIndices = Array.from(
      new Set([
        ...incomesA.array.map((m: MonthBucketItem) => m.index),
        ...incomesB.array.map((m: MonthBucketItem) => m.index),
        ...billsA.array.map((m: MonthBucketItem) => m.index),
        ...billsB.array.map((m: MonthBucketItem) => m.index),
      ])
    ).filter((idx): idx is number => idx !== undefined && !isNaN(idx)).sort((a, b) => a - b);
    const byIndex = (arr: MonthBucketItem[], idx: number) => arr.find((m) => m.index === idx);

    const chartData: CompareChartItem[] = [];
    monthIndices.forEach((idx) => {
      const iA = byIndex(incomesA.array, idx);
      const iB = byIndex(incomesB.array, idx);
      const bA = byIndex(billsA.array, idx);
      const bB = byIndex(billsB.array, idx);
      // Period A's calendar month name for this relative slot, preferred
      // since it's the "current"/primary timeline the axis is oriented
      // around - falls back to B's (or a plain "Month N") only when A has
      // no data at all for this index.
      const monthName =
        (iA || bA || iB || bB)?.monthLabel?.split(" ")[0] || `Month ${idx + 1}`;
      if (iA) chartData.push(tagOne(iA, monthName, "Income", labelA, "#88FFE3", false));
      if (iB) chartData.push(tagOne(iB, monthName, "Income", labelB, "#4fd1b5", true));
      if (bA) chartData.push(tagOne(bA, monthName, "Bill", labelA, "#ff8c8c", false));
      if (bB) chartData.push(tagOne(bB, monthName, "Bill", labelB, "#ff5252", true));
    });

    setCompareChartData({
      chartData,
      totals: {
        incomeA: incomesA.totalValue,
        billA: billsA.totalValue,
        incomeB: incomesB.totalValue,
        billB: billsB.totalValue,
      },
      labelA,
      labelB,
    });
  }, [allTransactions, timePeriod, comparePeriod, compareEnabled, timePeriodsForSelecter]);

  // Dynamic component container passes heterogeneous props to child components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components: TabsTogglerComponentItem<any>[] = [
    {
      tab: "incomes",
      props: {
        data: data[0] || [],
        totalValue: totalAmount[0] || 0,
        legendBottom: "months",
        legenedLeft: "Amount",
      },
      Component: TypedResponsiveBarsChartComponent,
    },
    {
      tab: "bills",
      props: {
        data: data[1] || [],
        totalValue: totalAmount[1] || 0,
        legendBottom: "Months",
        legenedLeft: "Amount",
      },
      Component: TypedResponsiveBarsChartComponent,
    },
    {
      tab: "comparative",
      props: generatePropForChartColAntTogglerTabs({
        data,
        clickedItems,
        setClickedItems,
        totalAmount,
        walletPrimaryCurrency,
      }),
      Component: TypedColumnChartAntComparative,
    },
  ];

  const tabs = ["Comparative", "Bills", "Incomes"];
  if (compareEnabled && compareChartData) {
    components.push({
      tab: "compare periods",
      props: generatePropForChartColAntPeriodCompare({
        compareData: compareChartData.chartData,
        totals: compareChartData.totals,
        labelA: compareChartData.labelA,
        labelB: compareChartData.labelB,
        walletPrimaryCurrency,
      }),
      Component: TypedColumnChartAntComparative,
    });
    tabs.push("Compare periods");
  }

  return (
    <TypedTabsTogglerMontlyView
      getValueSelecterFilter={getValueFromSelecter}
      timePeriodsForSelecter={timePeriodsForSelecter}
      data={data}
      handleRangeDate={handleRangeDate}
      timePeriod={timePeriod}
      components={components}
      tabs={tabs}
      compareEnabled={compareEnabled}
      setCompareEnabled={setCompareEnabled}
      comparePeriod={comparePeriod}
      getCompareValueFromSelecter={getCompareValueFromSelecter}
      handleCompareRangeDate={handleCompareRangeDate}
      timePeriodsForCompareSelecter={timePeriodsForSelecter}
    />
  );
}

export default TabsTogglerMontlyController;
