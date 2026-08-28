"use client";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import { Skeleton, Tooltip } from "antd";
import TabsToggler from "../TabsToggler";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import { getDateInYearMonthDay } from "@/helpers/timeFunctions/timeFunctions";
import { useEffect, useState } from "react";

function TabsTogglerMontlyView({
  getValueSelecterFilter,
  timePeriodsForSelecter,
  handleRangeDate,
  rangePickerResponse,
  components,
  data,
  timePeriod,
  tabs,
  compareEnabled,
  setCompareEnabled,
  comparePeriod,
  getCompareValueFromSelecter,
  handleCompareRangeDate,
  timePeriodsForCompareSelecter,
}) {

  return (
    <div className="w-full h-full">
      <h1>Transactions History</h1>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs ">
          From:{" "}
          <b>
            {!timePeriod && !timePeriod[0]
              ? "No time selected"
              : getDateInYearMonthDay(timePeriod[0])}
          </b>{" "}
          to :{" "}
          <b>
            {!timePeriod && !timePeriod[1]
              ? "No time selected"
              : getDateInYearMonthDay(timePeriod[1])}
          </b>
        </span>
        <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          <Tooltip title="Filter de date by generic filter or selecting a specific range 🤓">
            <div className="text-black w-[10px]">
              <UniversalCategoIcon
                type={`${"fa/FaRegQuestionCircle"}`}
                siz={15}
              />
            </div>
          </Tooltip>
          <SelecterFilter
            getValue={getValueSelecterFilter}
            periodOverride={timePeriodsForSelecter}
            styles={
              "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
            }
          />
          <TimeRange
            rpDate={handleRangeDate}
            rpResponse={rangePickerResponse}
          />
        </div>
        {typeof setCompareEnabled === "function" && (
          <div className="w-full flex flex-col items-center gap-2 mt-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={(e) => setCompareEnabled(e.target.checked)}
              />
              Compare vs another period
            </label>
            {compareEnabled && (
              <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
                <span className="text-xs">vs</span>
                <SelecterFilter
                  getValue={getCompareValueFromSelecter}
                  periodOverride={timePeriodsForCompareSelecter}
                  styles={
                    "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
                  }
                />
                <TimeRange
                  rpDate={handleCompareRangeDate}
                  startDateValue={comparePeriod?.[0]}
                  endDateValue={comparePeriod?.[1]}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {data.length <= 0 ? (
        <Skeleton active className="py-3"/>
      ) : (
        <TabsToggler
          tabs={tabs || ["Comparative", "Bills", "Incomes"]}
          compontentsArray={components}
          tooltip={"Select the tab that you want to see 😎"}
        />
      )}
    </div>
  );
}

export default TabsTogglerMontlyView;
