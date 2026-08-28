"use client";

import React, { useEffect, useState } from "react";
import ResponsiveBarsChartComponent from "../../chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import { useDispatch, useSelector } from "react-redux";
import { timeperiodRangesArray } from "@/helpers/timeFunctions/timeFunctions";
import TabsTogglerMontlyView from "./TabsTogglerMontlyView";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  mapToAddTypeTransactionAndColor,
  transactionsToMonths,
  transactionsToRelativeMonths,
} from "@/helpers/transformers/transactionsChange";
import { getDateInYearMonthDay } from "@/helpers/timeFunctions/timeFunctions";
import ColumnChartAntComparative from "../../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import TooltipForChart from "@/components/toltips/tooltipsForCharts/TooltipForChart";
import AtomicTop from "../../top3/atomicTop/AtomicTop";
import {
  generatePropForChartColAntTogglerTabs,
  generatePropForChartColAntPeriodCompare,
} from "./propsForColumnChartAntComparative-tabsToggler/propsColTabsToggler";

const today = new Date();

function TabsTogglerMontlyController() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState([]);
  const [timePeriod, setTimePeriod] = useState([
      new Date(today.getFullYear(), today.getMonth() - 2, 1),
      today,
    ]);
  const [clickedItems, setClickedItems] = useState([]);
  const [compareEnabled, setCompareEnabled] = useState(false);
  // Default: the same span the user is already looking at, shifted back
  // exactly one year - the most common comparison ("this vs. last year").
  const [comparePeriod, setComparePeriod] = useState(() => [
    new Date(
      timePeriod[0].getFullYear() - 1,
      timePeriod[0].getMonth(),
      timePeriod[0].getDate()
    ),
    new Date(
      timePeriod[1].getFullYear() - 1,
      timePeriod[1].getMonth(),
      timePeriod[1].getDate()
    ),
  ]);
  const [compareChartData, setCompareChartData] = useState(null);

  let { email } = useGetUserSession();

  // REDUX
  const dispath = useDispatch();
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const allTransactions = ccTransacciones.data;

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

    const labelA = `${getDateInYearMonthDay(timePeriod[0])} to ${getDateInYearMonthDay(timePeriod[1])}`;
    const labelB = `${getDateInYearMonthDay(comparePeriod[0])} to ${getDateInYearMonthDay(comparePeriod[1])}`;
    // Period A renders above the zero line, period B below it (mirrored) -
    // keeps the two periods visually anchored to "this vs that" instead of
    // reading left-to-right as 4 separate bars per month. `absValue` keeps
    // the real (always-positive) amount for labels/tooltips, since a
    // downward bar shouldn't be read as "negative spending."
    const tag = (arr, transactionType, color, mirror) =>
      arr.map((m) => ({
        ...m,
        transactionType,
        color,
        absValue: m.value,
        value: mirror ? -m.value : m.value,
      }));

    setCompareChartData({
      chartData: [
        ...tag(incomesA.array, `Income (${labelA})`, "#88FFE3", false),
        ...tag(billsA.array, `Bill (${labelA})`, "#ff8c8c", false),
        ...tag(incomesB.array, `Income (${labelB})`, "#4fd1b5", true),
        ...tag(billsB.array, `Bill (${labelB})`, "#ff5252", true),
      ],
      totals: {
        incomeA: incomesA.totalValue,
        billA: billsA.totalValue,
        incomeB: incomesB.totalValue,
        billB: billsB.totalValue,
      },
      labelA,
      labelB,
    });
  }, [allTransactions, timePeriod, comparePeriod, compareEnabled]);

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

  function getCompareValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setComparePeriod([new Date(start), new Date(end)]);
  }

  function handleCompareRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setComparePeriod([dateStart, dateEnd]);
    }
  }

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
