"use client";

import TutorialTip from "@/components/tour/TutorialTip";
import React from "react";

import { getDateInYearMonthDay } from "@gastify/core/time/timeFunctions";
import { Skeleton } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import SelecterFilter, { SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import TabsToggler, { TabsTogglerComponentItem } from "./TabsComponents/TabsToggler";
import { useT } from "@/i18n/client";

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
  const t = useT();
  return (
    <div className="gf-glass-card w-full h-full rounded-[32px] p-4">
      <div data-tour="dash-top-title" className="flex items-center justify-center gap-1.5"><h1 className="text-center font-bold">{t("dashboard.top.byMonth", { p1: elementsToDisplay })}</h1><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="dashTop" label={t("tour.dashTop.name")} /></div>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs ">
          {t("dashboard.from")}{" "}
          <b>
            {!timePeriod[0]
              ? t("web.no.time.selected")
              : getDateInYearMonthDay(timePeriod[0] as string | number | Date)}
          </b>{" "}
          {t("dashboard.to")}{" "}
          <b>
            {!timePeriod[1]
              ? t("web.no.time.selected")
              : getDateInYearMonthDay(timePeriod[1] as string | number | Date)}
          </b>
        </span>
        <div data-tour="dash-top-period" className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          
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
        <div data-tour="dash-top-count" className="flex items-center gap-1 gf-glass-card border border-gf-border rounded-full p-1 mt-2 mb-4">
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
        <div data-tour="dash-top-tabs">
        <TabsToggler
          tabs={[t("web.bills"), t("web.incomes")]}
          compontentsArray={components}
          contentStyle={"grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"}
        />
        </div>
      )}
    </div>
  );
}

export default TopElementContainerView;
