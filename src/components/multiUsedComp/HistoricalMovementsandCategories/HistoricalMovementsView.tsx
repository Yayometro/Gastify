"use client";

import React from "react";
import { Skeleton } from "antd";
import SelecterItemsToDisplay from "@/components/Filters/selecterItemsToDisplay/SelecterItemsToDisplay";
import TabsToggler, { TabsTogglerComponentItem } from "../TabsComponents/TabsToggler";
import PeriodFiltersWithCompare from "../periodFiltersWithCompare/PeriodFiltersWithCompare";
import type { SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";

export interface HistoricalMovementsViewProps {
  isLoading: number;
  timePeriod?: (Date | string | number | null | undefined)[] | [Date, Date] | null;
  periodFromFather?: SelecterPeriod | string | number;
  elementsToDisplay?: number;
  timePeriodsForSelecter?: SelecterPeriod[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: TabsTogglerComponentItem<any>[] | null;
  tabs?: string[] | null;
  handleRangeDate?: (startDate: Date | null, endDate: Date | null) => void;
  getValueFromSelecter?: (v: string) => void;
  getValueFromItems?: (n: number | string) => void;
  compareEnabled?: boolean;
  setCompareEnabled?: React.Dispatch<React.SetStateAction<boolean>> | ((enabled: boolean) => void);
  comparePeriod?: (Date | string | number | null | undefined)[] | [Date, Date] | null;
  getCompareValueFromSelecter?: (v: string) => void;
  handleCompareRangeDate?: (startDate: Date | null, endDate: Date | null) => void;
  timePeriodsForCompareSelecter?: SelecterPeriod[];
}

function HistoricalMovementsView({
  isLoading,
  timePeriod,
  periodFromFather,
  elementsToDisplay,
  timePeriodsForSelecter,
  components,
  tabs,
  handleRangeDate,
  getValueFromSelecter,
  getValueFromItems,
  compareEnabled,
  setCompareEnabled,
  comparePeriod,
  getCompareValueFromSelecter,
  handleCompareRangeDate,
  timePeriodsForCompareSelecter,
}: HistoricalMovementsViewProps): React.JSX.Element {
  return (
    <div className="w-full h-full">
      <h1>Top {elementsToDisplay} elements by month</h1>
      <PeriodFiltersWithCompare
        timePeriod={timePeriod}
        getValueFromSelecter={getValueFromSelecter}
        periodFromFather={periodFromFather}
        timePeriodsForSelecter={timePeriodsForSelecter}
        handleRangeDate={handleRangeDate}
        extraControls={
          <SelecterItemsToDisplay
            getValue={getValueFromItems}
            itemFromFather={elementsToDisplay}
            styles="gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
          />
        }
        compareEnabled={compareEnabled}
        setCompareEnabled={setCompareEnabled}
        comparePeriod={comparePeriod}
        getCompareValueFromSelecter={getCompareValueFromSelecter}
        handleCompareRangeDate={handleCompareRangeDate}
        timePeriodsForCompareSelecter={timePeriodsForCompareSelecter}
      />
      {isLoading <= 0 ? (
        <Skeleton active className="py-3" />
      ) : (
        <TabsToggler
          tabs={tabs || ["Bills", "Incomes"]}
          compontentsArray={components}
          tooltip={"Select the tab that you want to see 😎"}
          contentStyle={"flex flex-col justify-center items-center"}
        />
      )}
    </div>
  );
}

export default HistoricalMovementsView;
