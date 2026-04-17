"use client";
import { getDateInYearMonthDay } from "@/helpers/timeFunctions/timeFunctions";
import { Skeleton, Tooltip } from "antd";
import React from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import TabsToggler from "../TabsComponents/TabsToggler";
import SelecterItemsToDisplay from "@/components/Filters/selecterItemsToDisplay/SelecterItemsToDisplay";

function HistoricalMovementsView({
  isLoading,
  timePeriod,
  periodFromFather,
  elementsToDisplay,
  timePeriodsForSelecter,
  components,
  handleRangeDate,
  getValueFromSelecter,
  getValueFromItems,
}) {
  return (
    <div className="w-full h-full">
      <h1>Top {elementsToDisplay} elements by month</h1>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs ">
          From:{" "}
          <b>
            {!timePeriod[0]
              ? "No time selected"
              : getDateInYearMonthDay(timePeriod[0])}
          </b>{" "}
          to :{" "}
          <b>
            {!timePeriod[1]
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
            getValue={getValueFromSelecter}
            periodFromFather={periodFromFather}
            periodOverride={timePeriodsForSelecter}
            styles={
              "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
            }
          />
          <TimeRange rpDate={handleRangeDate} />
          <SelecterItemsToDisplay
            getValue={getValueFromItems}
            itemFromFather={elementsToDisplay}
            styles={
                "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
              }
          />
        </div>
      </div>
      {isLoading <= 0 ? (
        <Skeleton active className="py-3" />
      ) : (
        <TabsToggler
          tabs={["Bills", "Incomes"]}
          compontentsArray={components}
          tooltip={"Select the tab that you want to see 😎"}
          contentStyle={"flex flex-col justify-center items-center"}
        />
      )}
    </div>
  );
}

export default HistoricalMovementsView;
