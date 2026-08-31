"use client";

import React from "react";
import { Skeleton, Tooltip } from "antd";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import UniversalCategoIcon from "../UniversalCategoIcon";
import EmptyModule from "../EmptyModule";
import { getDateInYearMonthDay } from "@/helpers/timeFunctions/timeFunctions";
import BudgetHistoricalComparativeRow from "./BudgetHistoricalComparativeRow";

function HistoricalBudgetsComparativeView({
  rows,
  isLoading,
  timePeriod,
  getValueFromSelecter,
  handleRangeDate,
  timePeriodsForSelecter,
  walletPrimaryCurrency,
  onOpenDetail,
}) {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl text-purple-700">Budgets comparative</h1>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs">
          From:{" "}
          <b>
            {!timePeriod[0] ? "No time selected" : getDateInYearMonthDay(timePeriod[0])}
          </b>{" "}
          to :{" "}
          <b>{!timePeriod[1] ? "No time selected" : getDateInYearMonthDay(timePeriod[1])}</b>
        </span>
        <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          <Tooltip title="See how your spending budgets performed month by month across this range - which ones you usually meet, which ones you usually exceed 🤓">
            <div className="text-black w-[10px]">
              <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
            </div>
          </Tooltip>
          <SelecterFilter
            getValue={getValueFromSelecter}
            periodOverride={timePeriodsForSelecter}
            styles={
              "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
            }
          />
          <TimeRange rpDate={handleRangeDate} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton active className="py-3" />
      ) : rows.length === 0 ? (
        <EmptyModule emMessage="No spending budgets tracked in this range 🤔" />
      ) : (
        <div className="flex flex-col gap-2 mt-3">
          {rows.map((row) => (
            <BudgetHistoricalComparativeRow
              key={row.budget._id}
              row={row}
              walletPrimaryCurrency={walletPrimaryCurrency}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoricalBudgetsComparativeView;
