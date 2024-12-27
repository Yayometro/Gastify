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
  usdFormatChanger,
} from "@/helpers/transformers/transactionsChange";
import ColumnChartAntComparative from "../../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import TooltipForChart from "@/components/toltips/tooltipsForCharts/TooltipForChart";
import currencyFormatter from "currency-formatter"

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
    if (timeperiodRangesArray.length > 0) {
      const startDate = new Date(
        timeperiodRangesArray[timeperiodRangesArray.length - 1].value.split(
          "*"
        )[0]
      );
      const endDate = new Date(
        timeperiodRangesArray[timeperiodRangesArray.length - 1].value.split(
          "*"
        )[1]
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
      const allTransConvined = mapToAddTypeTransactionAndColor([...bills.array, ...incomes.array])
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
    {
      tab: "comparative",
      props: {
        data: data[2],
        totalValue: <span><p>Total incomes: <b className=" font-extrabold">{usdFormatChanger(totalAmount[0])}</b></p><p>Total bills: <b className=" font-extrabold">{usdFormatChanger(totalAmount[1])}</b></p></span>,
        propPlus: {
          interaction: {
            tooltip: {
              render: (e, { items, title }) => {
                return (
                  <div
                    className="max-w-[250px] flex gap-1 flex-col items-center justify-center rounded-lg p-1 font-sans"
                    key={title}
                  >
                    <h1 className="text-base text-center text-wrap font-bold">
                      {String(title).toUpperCase()}
                    </h1>
                    {items.map((transMonth) => {
                      const { channel, value, color, name } = transMonth;
                      return (
                        <TooltipForChart
                          item={channel}
                          value={value}
                          color={color}
                          key={name + value}
                          totalValue={
                            name === "bill" ? totalAmount[1] : totalAmount[0]
                          }
                        />
                      );
                    })}
                  </div>
                );
              },
            },
          },
          label: {
            text: ({ value, isBill }) => {
              if (isBill) {
                return ((value / totalAmount[1]) * 100).toFixed(1) + "%";
              } else {
                return ((value / totalAmount[0]) * 100).toFixed(1) + "%";
              }
            },
            textBaseline: "bottom",
          },
        },
      },
      Component: ColumnChartAntComparative,
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
