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
import AtomicTop from "../../top3/atomicTop/AtomicTop";

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
      props: {
        data: data[2],
        totalValue: (
          <div className="w-full flex flex-col justify-center items-center">
            {clickedItems.length <= 0 ? (
              ""
            ) : (
              <div className="w-full flex flex-col justify-center items-center">
                <section className="w-full flex justify-center items-center py-2 gap-4">
                  <button
                    className=" py-2 px-2 bg-purple-600 rounded-full hover:bg-purple-800 gap-4 text-white"
                    onClick={() => setClickedItems([])}
                  >
                    Clear
                  </button>
                  <p className=" text-xs">Selected: </p>
                </section>
                <div className="w-full grid grid-cols-2 items-center gap-2 min-[452px]:flex min-[452px]:justify-start min-[452px]:flex-wrap">
                  {clickedItems.map((item, index) => (
                    <AtomicTop
                      key={item.type + item.value + item.isBill + index}
                      index={index}
                      color={item.color}
                      icon={item.icon}
                      name={String(item.type).toUpperCase()}
                      isBill={item.isBill ? true : false}
                      value={item.value}
                      fatherStyle={
                        "flex relative justify-between gap-1 items-center flex-1 rounded-3xl px-2 py-2 hover:mix-blend-multiply min-[352px]:justify-center min-[352px]:flex-col min-[352px]:px-2"
                      }
                      tooltip={
                        <div className="flex flex-col justify-center items-center">
                          <b>Type: {item.type}</b>
                          <b>Value: {usdFormatChanger(item.value)}</b>
                        </div>
                      }
                    />
                  ))}
                </div>
              </div>
            )}
            <span className="w-full pt-2">
              <p>
                Total incomes: <b>{usdFormatChanger(totalAmount[0])}</b>
              </p>
              <p>
                Total bills: <b>{usdFormatChanger(totalAmount[1])}</b>
              </p>
            </span>
          </div>
        ),
        propPlus: {
          legend: {
            color: {
              itemMarkerFill: (datum, index, data) => {
                return datum.id === "bill" ? "#ff8c8c" : "#88FFE3";
              },
            },
          },
          state: {
            unselected: { opacity: 0.5 },
            selected: { fill: "orange" },
          },
          interaction: {
            elementSelectByX: true,
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
          style: {
            fill: ({ color }) => color,
            inset: 0.2,
          },
          onReady: ({ chart }) => {
            chart.on("interval:click", (evt) => {
              const { data } = evt;
              setClickedItems((prev) => {
                let isRepeated = new Set(prev.map((i) => JSON.stringify(i)));
                return isRepeated.has(JSON.stringify(data?.data))
                  ? [...prev]
                  : [...prev, data?.data];
              });
            });
          },
        },
      },
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
