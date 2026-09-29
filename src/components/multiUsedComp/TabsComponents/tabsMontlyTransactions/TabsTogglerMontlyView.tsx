"use client";
import React from "react";
import { Skeleton } from "antd";
import TabsToggler, { TabsTogglerComponentItem } from "../TabsToggler";
import PeriodFiltersWithCompare from "../../periodFiltersWithCompare/PeriodFiltersWithCompare";

// Typed bridge for unmigrated child JSX component
interface PeriodFiltersWithCompareProps {
  timePeriod?: Date[];
  getValueFromSelecter?: (v: string) => void;
  timePeriodsForSelecter?: Array<{ value: string; name: string }>;
  periodFromFather?: string;
  handleRangeDate?: (dateStart: Date | null, dateEnd: Date | null) => void;
  rangePickerResponse?: unknown;
  extraControls?: React.ReactNode;
  compareEnabled?: boolean;
  setCompareEnabled?: React.Dispatch<React.SetStateAction<boolean>> | ((enabled: boolean) => void);
  comparePeriod?: Date[];
  getCompareValueFromSelecter?: (v: string) => void;
  handleCompareRangeDate?: (dateStart: Date | null, dateEnd: Date | null) => void;
  timePeriodsForCompareSelecter?: Array<{ value: string; name: string }>;
}

const TypedPeriodFiltersWithCompare = PeriodFiltersWithCompare as unknown as React.ComponentType<PeriodFiltersWithCompareProps>;

export interface TabsTogglerMontlyViewProps {
  getValueSelecterFilter: (v: string) => void;
  timePeriodsForSelecter: Array<{ value: string; name: string }>;
  handleRangeDate: (dateStart: Date | null, dateEnd: Date | null) => void;
  rangePickerResponse?: unknown;
  // Dynamic component container passes heterogeneous props to child components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: TabsTogglerComponentItem<any>[] | null;
  data: unknown[];
  timePeriod: Date[];
  tabs?: string[] | null;
  compareEnabled: boolean;
  setCompareEnabled: React.Dispatch<React.SetStateAction<boolean>> | ((enabled: boolean) => void);
  comparePeriod: Date[];
  getCompareValueFromSelecter: (v: string) => void;
  handleCompareRangeDate: (dateStart: Date | null, dateEnd: Date | null) => void;
  timePeriodsForCompareSelecter: Array<{ value: string; name: string }>;
}

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
}: TabsTogglerMontlyViewProps): React.JSX.Element {
  return (
    <div className="w-full h-full">
      <TypedPeriodFiltersWithCompare
        timePeriod={timePeriod}
        getValueFromSelecter={getValueSelecterFilter}
        timePeriodsForSelecter={timePeriodsForSelecter}
        handleRangeDate={handleRangeDate}
        rangePickerResponse={rangePickerResponse}
        compareEnabled={compareEnabled}
        setCompareEnabled={setCompareEnabled}
        comparePeriod={comparePeriod}
        getCompareValueFromSelecter={getCompareValueFromSelecter}
        handleCompareRangeDate={handleCompareRangeDate}
        timePeriodsForCompareSelecter={timePeriodsForCompareSelecter}
      />
      {data.length <= 0 ? (
        <Skeleton active className="py-3" />
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
