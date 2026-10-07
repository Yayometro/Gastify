"use client";

import React from "react";
import { getDateInYearMonthDay } from "@/helpers/timeFunctions/timeFunctions";
import { Skeleton, Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import SelecterFilter, { SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import TabsToggler, { TabsTogglerComponentItem } from "./TabsComponents/TabsToggler";

export interface TopElementContainerViewProps {
  isLoading?: boolean;
  timePeriod: (string | Date | number | null | undefined)[];
  periodFromFather?: SelecterPeriod | string | number;
  elementsToDisplay?: number;
  timePeriodsForSelecter?: SelecterPeriod[];
  components?: TabsTogglerComponentItem<object>[] | null;
  handleRangeDate?: (dates: unknown) => void;
  getValueFromSelecter?: (val: string) => void;
  getValueFromItems: (n: number) => void;
  [key: string]: unknown;
}

function TopElementContainerView({
  isLoading,
  timePeriod,
  periodFromFather,
  elementsToDisplay,
  timePeriodsForSelecter,
  components,
  handleRangeDate,
  getValueFromSelecter,
  getValueFromItems,
}: TopElementContainerViewProps): React.JSX.Element {
  return (
    <div className="gf-glass-card w-full h-full rounded-[32px] p-4">
      <h1 className="text-center font-bold">Top {elementsToDisplay} elements by month</h1>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs ">
          From:{" "}
          <b>
            {!timePeriod[0]
              ? "No time selected"
              : getDateInYearMonthDay(timePeriod[0] as string | number | Date)}
          </b>{" "}
          to :{" "}
          <b>
            {!timePeriod[1]
              ? "No time selected"
              : getDateInYearMonthDay(timePeriod[1] as string | number | Date)}
          </b>
        </span>
        <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          <Tooltip title="Filter the date by a generic filter or by selecting a specific range 🤓">
            <div className="text-gf-text w-[10px]">
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
              "gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
            }
          />
          <TimeRange rpDate={handleRangeDate} />
        </div>
        <div className="flex items-center gap-1 gf-glass-card border border-gf-border rounded-full p-1 mt-2 mb-4">
          {[3, 6, 12, 24].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => getValueFromItems(n)}
              className={`w-7 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                elementsToDisplay === n ? "bg-fuchsia-600 text-white" : "text-gf-text-muted hover:bg-gf-surface-2"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <Skeleton active className="py-3" />
      ) : (
        <TabsToggler
          tabs={["Bills", "Incomes"]}
          compontentsArray={components}
          tooltip={"Select the tab that you want to see 😎"}
          contentStyle={"grid grid-cols-1 md:grid-cols-2 gap-4 items-start"}
        />
      )}
    </div>
  );
}

export default TopElementContainerView;
