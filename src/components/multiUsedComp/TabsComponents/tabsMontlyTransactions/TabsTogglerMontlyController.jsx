"use client";

import React, { useEffect, useState } from "react";
import ResponsiveBarsChartComponent from "../../chartsComponents/responsiveBarsChartComponent/ResponsiveBarsChartComponent";
import {
  fetchTrans,
  setTransacctions,
} from "@/lib/features/transacctionsSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import { useDispatch, useSelector } from "react-redux";
import {
  timeperiodRangesArray,
} from "@/helpers/timeFunctions/timeFunctions";
import TabsTogglerMontlyView from "./TabsTogglerMontlyView";
import {
  filterBillsOrIncomes,
  getTransactionsFromTimeRange,
  transactionsToMonths,
} from "@/helpers/transformers/transactionsChange";

const today = new Date();

function TabsTogglerMontlyController() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState([]);
  const [timePeriod, setTimePeriod] = useState([
    new Date(today.getFullYear(), 0, 1),
    new Date(today.getFullYear(), 12, 0),
  ]);

  let { email } = useGetUserSession();

  // REDUX
  const dispath = useDispatch();
  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const allTransactions = ccTransacciones.data;

  // USE EFFECTS:
  useEffect(() => {
    if(timeperiodRangesArray.length > 0){
        const startDate = new Date(timeperiodRangesArray[timeperiodRangesArray.length - 1].value.split(
              "*"
            )[0],
        );
        const endDate = new Date(timeperiodRangesArray[timeperiodRangesArray.length - 1].value.split(
              "*"
            )[1],
        );
        setTimePeriod([startDate, endDate]);
    }
  }, []);

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
      // set new values
      setData([incomes.array, bills.array]);
      setTotalAmount([incomes.totalValue, bills.totalValue]);
    }
  }, [allTransactions, timePeriod]);

  // FUNCTIONS

  function getValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    setTimePeriod([dateStart, dateEnd]);
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
  ];

  return (
    <TabsTogglerMontlyView
      getValueSelecterFilter={getValueFromSelecter}
      timePeriodsForSelecter={timeperiodRangesArray}
      data={data}
      handleRangeDate={handleRangeDate}
      timePeriod={timePeriod}
      components={components}
    />
  );
}

export default TabsTogglerMontlyController;
