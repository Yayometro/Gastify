"use client";

import React, { useEffect, useState } from "react";
import ResponsiveBarsChartComponent from "../../chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import { useDispatch, useSelector } from "react-redux";
import { getPeriodLabel } from "@/helpers/timeFunctions/timeFunctions";
import TabsTogglerMontlyView from "./TabsTogglerMontlyView";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  mapToAddTypeTransactionAndColor,
  transactionsToMonths,
  transactionsToRelativeMonths,
} from "@/helpers/transformers/transactionsChange";
import ColumnChartAntComparative from "../../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import TooltipForChart from "@/components/toltips/tooltipsForCharts/TooltipForChart";
import AtomicTop from "../../top3/atomicTop/AtomicTop";
import {
  generatePropForChartColAntTogglerTabs,
  generatePropForChartColAntPeriodCompare,
} from "./propsForColumnChartAntComparative-tabsToggler/propsColTabsToggler";

function TabsTogglerMontlyController({ periodState }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState([]);
  const [clickedItems, setClickedItems] = useState([]);
  const [compareChartData, setCompareChartData] = useState(null);

  let { email } = useGetUserSession();

  // REDUX
  const dispath = useDispatch();
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
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
      setTransacctions(ccTransacciones.data);
      setLoading(false);
    }
  }, [ccTransacciones, email]);

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
    const tagOne = (m, monthName, metricLabel, periodLabel, color, mirror) => ({
      ...m,
      type: `${monthName} ${metricLabel}`,
      transactionType: `${metricLabel} (${periodLabel})`,
      color,
      absValue: m.value,
      value: mirror ? -m.value : m.value,
    });

    const monthIndices = Array.from(
      new Set([
        ...incomesA.array.map((m) => m.index),
        ...incomesB.array.map((m) => m.index),
        ...billsA.array.map((m) => m.index),
        ...billsB.array.map((m) => m.index),
      ])
    ).sort((a, b) => a - b);
    const byIndex = (arr, idx) => arr.find((m) => m.index === idx);

    const chartData = [];
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

  const components = [
    {
      tab: "incomes",
      props: {
        data: data[0] || [],
        totalValue: totalAmount[0] || 0,
        legendBottom: "months",
        legenedLeft: "Amount",
      },
      Component: ResponsiveBarsChartComponent,
    },
    {
      tab: "bills",
      props: {
        data: data[1] || [],
        totalValue: totalAmount[1] || 0,
        legendBottom: "Months",
        legenedLeft: "Amount",
      },
      Component: ResponsiveBarsChartComponent,
    },
    {
      tab: "comparative",
      props: generatePropForChartColAntTogglerTabs({data, clickedItems, setClickedItems, totalAmount, walletPrimaryCurrency }),
      Component: ColumnChartAntComparative,
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
      Component: ColumnChartAntComparative,
    });
    tabs.push("Compare periods");
  }

  return (
    <TabsTogglerMontlyView
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
