"use client";

import React from "react";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import TabsToggler, { type TabsTogglerComponentItem } from "../../TabsComponents/TabsToggler";
import { Skeleton } from "antd";
import PeriodFiltersWithCompare from "../../periodFiltersWithCompare/PeriodFiltersWithCompare";
import type { TimePeriodOption } from "@/hooks/usePeriodComparison";
import type { SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";

export interface HistoricalComparativeCategoriesViewProps {
  tabs: string[];
  // Dynamic component container passes heterogeneous props to child components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: TabsTogglerComponentItem<any>[];
  handleRangeDate: (dateStart?: Date | null, dateEnd?: Date | null) => void;
  getValueFromSelecter: (v: string) => void;
  periodFromFather: TimePeriodOption;
  timePeriodsForSelecter: TimePeriodOption[];
  timePeriod: [Date, Date];
  isLoading?: boolean | number;
  title?: React.ReactNode;
  compareEnabled: boolean;
  setCompareEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  comparePeriod: [Date, Date];
  getCompareValueFromSelecter: (v: string) => void;
  handleCompareRangeDate: (dateStart?: Date | null, dateEnd?: Date | null) => void;
  timePeriodsForCompareSelecter: TimePeriodOption[];
}

function HistoricalComparativeCategoriesView({
  tabs,
  components,
  handleRangeDate,
  getValueFromSelecter,
  periodFromFather,
  timePeriodsForSelecter,
  timePeriod,
  isLoading,
  title,
  compareEnabled,
  setCompareEnabled,
  comparePeriod,
  getCompareValueFromSelecter,
  handleCompareRangeDate,
  timePeriodsForCompareSelecter,
}: HistoricalComparativeCategoriesViewProps): React.JSX.Element {
  return (
    <div className="w-full h-full">
      {title || <div className="flex items-center gap-2"><h1 className=" text-3xl text-purple-300">Categories comparative</h1><InfoTip info={APP_INFO.gastos_por_categor_a} /></div>}
      <PeriodFiltersWithCompare
        timePeriod={timePeriod}
        getValueFromSelecter={getValueFromSelecter}
        periodFromFather={periodFromFather as SelecterPeriod}
        timePeriodsForSelecter={timePeriodsForSelecter as SelecterPeriod[]}
        handleRangeDate={handleRangeDate}
        compareEnabled={compareEnabled}
        setCompareEnabled={setCompareEnabled}
        comparePeriod={comparePeriod}
        getCompareValueFromSelecter={getCompareValueFromSelecter}
        handleCompareRangeDate={handleCompareRangeDate}
        timePeriodsForCompareSelecter={timePeriodsForCompareSelecter as SelecterPeriod[]}
      />
      {(isLoading as unknown as number) <= 0 ? (
        <Skeleton active className="py-3" />
      ) : (
        <TabsToggler
          tabs={tabs}
          compontentsArray={components}
          tooltip={"Select the tab that you want to see 😎"}
          contentStyle={"flex flex-col justify-center items-center"}
          tabInfo={{
            bills: APP_INFO.gastos_por_categor_a,
            incomes: APP_INFO.ingresos_por_categor_a,
            "compare bills": APP_INFO.gastos_por_categor_a_2,
            "compare incomes": APP_INFO.ingresos_por_categor_a_2,
          }}
        />
      )}
    </div>
  );
}

export default HistoricalComparativeCategoriesView;
