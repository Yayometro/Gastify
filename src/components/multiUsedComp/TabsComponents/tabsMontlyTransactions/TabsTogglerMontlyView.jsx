"use client";
import { Skeleton } from "antd";
import TabsToggler from "../TabsToggler";
import PeriodFiltersWithCompare from "../../periodFiltersWithCompare/PeriodFiltersWithCompare";

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
      <PeriodFiltersWithCompare
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
