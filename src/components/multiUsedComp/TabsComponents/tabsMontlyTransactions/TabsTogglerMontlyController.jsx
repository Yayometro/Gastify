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
} from "@/helpers/transformers/transactionsChange";
import ColumnChartAntComparative from "../../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import TooltipForChart from "@/components/toltips/tooltipsForCharts/TooltipForChart";
import AtomicTop from "../../top3/atomicTop/AtomicTop";
import { generatePropForChartColAntTogglerTabs } from "./propsForColumnChartAntComparative-tabsToggler/propsColTabsToggler";

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
    />
  );
}

export default TabsTogglerMontlyController;
