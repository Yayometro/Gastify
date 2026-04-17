"use client";
import React, { useEffect, useState } from "react";
import TabsTrans from "./TabsTrans";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";
import { useSelector } from "react-redux";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
  getDateInYearMonthDay,
} from "@/helpers/timeFunctions/timeFunctions";
import { getTransactionsFromTimeRange } from "@/helpers/transformers/transactionsChange";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";

const today = new Date();

function ResumeTabsTrans({ timePeriodFromFather }) {
  const [isBillTab, setIsBillTab] = useState(true);
  const [allBills, setAllBills] = useState([]);
  const [allIncomes, setAllIncomes] = useState([]);
  const [timePeriod, setTimePeriod] = useState(
    timePeriodFromFather || [
      new Date(today.getFullYear(), today.getMonth(), 1),
      getLastDayOfMonth(today.getFullYear(), today.getMonth()),
    ]
  );

  const ccTransacciones = useSelector((state) => state.transacctionsReducer);
  const timePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(today.getFullYear());

  useEffect(() => {
    if (timePeriodFromFather) {
      setTimePeriod(timePeriodFromFather);
    }
  }, [timePeriodFromFather]);

  useEffect(() => {
    if (!ccTransacciones.data || ccTransacciones.data.length === 0) return;
    const [start, end] = timePeriod;
    const filtered = getTransactionsFromTimeRange(ccTransacciones.data, start, end).sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
    setAllBills(filtered.filter((t) => t.isBill && !t.isIncome));
    setAllIncomes(filtered.filter((t) => t.isIncome && !t.isBill));
  }, [ccTransacciones.data, timePeriod]);

  function getValueFromSelecter(v) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart, dateEnd) {
    if (dateStart && dateEnd) {
      setTimePeriod([dateStart, dateEnd]);
    }
  }

  const handleTab = (budType) => setIsBillTab(budType === "bill");

  return (
    <div className="rtt-cont w-full h-full">
      <h1 className="text-2xl text-center font-semibold pt-3">
        Transactions Resume
      </h1>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs">
          From:{" "}
          <b>{timePeriod[0] ? getDateInYearMonthDay(timePeriod[0]) : "No time selected"}</b>
          {" "}to:{" "}
          <b>{timePeriod[1] ? getDateInYearMonthDay(timePeriod[1]) : "No time selected"}</b>
        </span>
        <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          <Tooltip title="Filter by date using a preset range or selecting a specific range 🤓">
            <div className="text-black w-[10px]">
              <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
            </div>
          </Tooltip>
          <SelecterFilter
            getValue={getValueFromSelecter}
            periodFromFather={timePeriodsForSelecter[0]}
            periodOverride={timePeriodsForSelecter}
            styles="bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
          />
          <TimeRange rpDate={handleRangeDate} />
        </div>
      </div>
      <div className="bc-tab-headers-cont w-full text-center flex justify-center items-center gap-2 mt-2">
        <div
          onClick={() => handleTab("bill")}
          className={`tab-rtt-bill p-4 cursor-pointer hover:text-purple-400 ${
            isBillTab ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Bills Resume
        </div>
        <div
          onClick={() => handleTab("")}
          className={`tab-rtt-inc p-4 cursor-pointer hover:text-purple-400 ${
            !isBillTab ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Income Resume
        </div>
      </div>
      <div className="rtt-content-cont">
        <div className={`rtt-sub-cont w-full h-full ${isBillTab ? "" : "hidden"}`}>
          {allBills.length <= 0 ? (
            <div className="w-full py-[20px]">
              <EmptyModule
                emMessage="Ups... Nothing here 🤔. No bills found for this time period. Try a wider range like Last 6 months or All 2025."
              />
            </div>
          ) : (
            <TabsTrans ttTrans={allBills} ttIsbill={true} ttHorizontal={false} />
          )}
        </div>
        <div className={`rtt-sub-cont w-full h-full ${isBillTab ? "hidden" : ""}`}>
          {allIncomes.length <= 0 ? (
            <div className="w-full py-[20px]">
              <EmptyModule
                emMessage="Ups... Nothing here 🤔. No incomes found for this time period. Try a wider range like Last 6 months or All 2025."
              />
            </div>
          ) : (
            <TabsTrans ttTrans={allIncomes} ttIsbill={false} ttHorizontal={false} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeTabsTrans;
