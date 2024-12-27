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
}) {
  const [time, setTime] = useState(timePeriod);
  useEffect(() => {
    if (timePeriod[0] && timePeriod[1]) {
      setTime([timePeriod[0], timePeriod[1]]);
    }
  }, [timePeriod]);

  return (
    <div className="w-full h-full">
      <h1>Transactions History</h1>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs ">
          From:{" "}
          <b>
            {!time && !time[0]
              ? "No time selected"
              : getDateInYearMonthDay(time[0])}
          </b>{" "}
          to :{" "}
          <b>
            {!time && !time[0]
              ? "No time selected"
              : getDateInYearMonthDay(time[1])}
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
      </div>
      {data.length <= 0 ? (
        <Skeleton active className="py-3"/>
      ) : (
        <TabsToggler
          tabs={["Bills", "Incomes"]}
          compontentsArray={components}
          tooltip={"Select the tab that you want to see 😎"}
        />
      )}
    </div>
  );
}

export default TabsTogglerMontlyView;
