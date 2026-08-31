"use client";

import { Tooltip } from "antd";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { getDateInYearMonthDay } from "@/helpers/timeFunctions/timeFunctions";

const FILTER_PILL_STYLE =
  "bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]";

const COMPARE_TOOLTIP = "Compare this time period against another one, side by side";

// Shared by every "compare vs another period" section on the History page
// (Transactions History, Categories comparative, Top elements) - was three
// near-identical copies of this checkbox + two filter rows before, which is
// exactly why they'd drifted into three slightly different looks. One
// implementation now, so a polish pass here reaches every instance at once.
//
// Layout: the toggle sits above; below it, the primary period filter and
// (when compare is on) the second period's filter sit side by side with a
// "VS" between them once there's room (lg+), and stack vertically with VS
// in between on narrower screens - matches how the rest of the page already
// reads "this vs that" top-to-bottom on mobile.
function PeriodFiltersWithCompare({
  timePeriod,
  getValueFromSelecter,
  timePeriodsForSelecter,
  periodFromFather,
  handleRangeDate,
  rangePickerResponse,
  extraControls,
  compareEnabled,
  setCompareEnabled,
  comparePeriod,
  getCompareValueFromSelecter,
  handleCompareRangeDate,
  timePeriodsForCompareSelecter,
}) {
  const showCompareToggle = typeof setCompareEnabled === "function";

  return (
    <div className="filters flex flex-col justify-center items-center gap-2 w-full">
      {showCompareToggle && (
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={(e) => setCompareEnabled(e.target.checked)}
            className="appearance-none w-4 h-4 rounded-full border-2 border-purple-300 checked:bg-purple-600 checked:border-purple-600 cursor-pointer transition-colors"
          />
          <Tooltip title={COMPARE_TOOLTIP}>
            <span className="text-purple-700 font-medium">Compare</span>
          </Tooltip>
          <Tooltip title={COMPARE_TOOLTIP}>
            <span className="text-purple-400 flex items-center">
              <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={13} />
            </span>
          </Tooltip>
        </label>
      )}

      <div
        className={`w-full flex flex-col ${
          compareEnabled ? "lg:flex-row" : ""
        } items-center justify-center gap-3`}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs">
            From:{" "}
            <b>
              {!timePeriod?.[0] ? "No time selected" : getDateInYearMonthDay(timePeriod[0])}
            </b>{" "}
            to:{" "}
            <b>{!timePeriod?.[1] ? "No time selected" : getDateInYearMonthDay(timePeriod[1])}</b>
          </span>
          <div className="flex items-center justify-center flex-wrap gap-2">
            <Tooltip title="Filter de date by generic filter or selecting a specific range 🤓">
              <div className="text-black w-[10px]">
                <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
              </div>
            </Tooltip>
            <SelecterFilter
              getValue={getValueFromSelecter}
              periodFromFather={periodFromFather}
              periodOverride={timePeriodsForSelecter}
              styles={FILTER_PILL_STYLE}
            />
            <TimeRange rpDate={handleRangeDate} rpResponse={rangePickerResponse} />
            {extraControls}
          </div>
        </div>

        {showCompareToggle && compareEnabled && (
          <>
            <span className="text-purple-600 font-bold text-sm shrink-0">VS</span>
            <div className="flex flex-col items-center gap-1">
              {/* Mirrors the primary block's From/To line above its controls -
                  without it, this block was one line shorter than the primary
                  one, so `items-center` on the row centered it a few px off,
                  reading as a lopsided gap under just this side. */}
              <span className="text-xs">
                From:{" "}
                <b>
                  {!comparePeriod?.[0] ? "No time selected" : getDateInYearMonthDay(comparePeriod[0])}
                </b>{" "}
                to:{" "}
                <b>
                  {!comparePeriod?.[1] ? "No time selected" : getDateInYearMonthDay(comparePeriod[1])}
                </b>
              </span>
              <div className="flex items-center justify-center flex-wrap gap-2">
                <SelecterFilter
                  getValue={getCompareValueFromSelecter}
                  periodOverride={timePeriodsForCompareSelecter}
                  styles={FILTER_PILL_STYLE}
                />
                <TimeRange
                  rpDate={handleCompareRangeDate}
                  startDateValue={comparePeriod?.[0]}
                  endDateValue={comparePeriod?.[1]}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PeriodFiltersWithCompare;
