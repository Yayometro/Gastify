import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import UniversalCategoIcon from "./UniversalCategoIcon";
import DisplayerCategoryTreemap from "./DisplayerCategoryTreemap";
import DisplayerCategoryCirclePacking from "./DisplayerCategoryCirclePacking";
import TransactionsResumeCont from "./TransactionsResumeCont";
import { Tooltip } from "antd";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getLastDayOfMonth,
  getDateInYearMonthDay,
} from "@gastify/core/time/timeFunctions";
import { getTransactionsFromTimeRange } from "@/helpers/transformers/transactionsChange";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import type { RootState } from "@/lib/store";
import type { TransactionData } from "@/lib/features/transacctionsSlice";

// Typed bridges for unmigrated child components
interface DisplayerCategoryTreemapProps {
  dccpIncomes?: TransactionData[];
  dccoBills?: TransactionData[];
}

interface DisplayerCategoryCirclePackingProps {
  dccpIncomes?: TransactionData[];
  dccoBills?: TransactionData[];
}

interface TransactionsResumeContProps {
  trcBills?: TransactionData[];
  trcIncomes?: TransactionData[];
}

const TypedDisplayerCategoryTreemap = DisplayerCategoryTreemap as React.ComponentType<DisplayerCategoryTreemapProps>;
const TypedDisplayerCategoryCirclePacking = DisplayerCategoryCirclePacking as React.ComponentType<DisplayerCategoryCirclePackingProps>;
const TypedTransactionsResumeCont = TransactionsResumeCont as React.ComponentType<TransactionsResumeContProps>;

export interface TransDetailsGrandContainerProps {
  timePeriodFromFather?: [Date, Date] | Date[];
}

const today = new Date();

function TransDetailsGrandContainer({ timePeriodFromFather }: TransDetailsGrandContainerProps): React.JSX.Element {
  // "treemap" is the default view - it's the easiest to read at a glance,
  // Bubble and Nested Pie stay available as alternate ways to look at the
  // same category/subcategory breakdown.
  const [activeTab, setActiveTab] = useState<string>("treemap");
  const [allBills, setAllBills] = useState<TransactionData[]>([]);
  const [allIncomes, setAllIncomes] = useState<TransactionData[]>([]);
  // Own local time-period filter, same pattern as ResumeTabsTrans - lets
  // this section be scoped to a different range than the rest of the
  // Wallet page instead of always mirroring the page-level filter.
  const [timePeriod, setTimePeriod] = useState<[Date, Date] | Date[]>(
    timePeriodFromFather || [
      new Date(today.getFullYear(), today.getMonth(), 1),
      getLastDayOfMonth(today.getFullYear(), today.getMonth()),
    ]
  );

  const ccTransacciones = useSelector((state: RootState) => state.transacctionsReducer);
  const timePeriodsForSelecter = generate_timeperiod_ranges_array_for_dashboard(today.getFullYear());

  useEffect(() => {
    if (timePeriodFromFather) setTimePeriod(timePeriodFromFather);
  }, [timePeriodFromFather]);

  useEffect(() => {
    if (!ccTransacciones.data || ccTransacciones.data.length === 0) return;
    const [start, end] = timePeriod;
    const filtered: TransactionData[] = getTransactionsFromTimeRange(ccTransacciones.data, start, end);
    setAllBills(filtered.filter((t: TransactionData) => t.isBill && !t.isIncome));
    setAllIncomes(filtered.filter((t: TransactionData) => t.isIncome && !t.isBill));
  }, [ccTransacciones.data, timePeriod]);

  function getValueFromSelecter(v: string) {
    const [start, end] = v.split("*");
    setTimePeriod([new Date(start), new Date(end)]);
  }

  function handleRangeDate(dateStart: Date | null, dateEnd: Date | null) {
    if (dateStart && dateEnd) setTimePeriod([dateStart, dateEnd]);
  }

  return (
    <div className="tdgc-cont gf-glass-card w-full h-full rounded-[32px] p-4">
      <div className="flex items-center justify-center gap-1.5 pt-5">
        <h1 className="text-2xl text-center font-semibold">
          Category Details
        </h1>
        <InfoTip info={APP_INFO.detalle_de_la_categor_a} />
      </div>
      <div className="filters flex flex-col justify-center items-center pt-2">
        <span className="text-xs">
          From:{" "}
          <b>{timePeriod[0] ? getDateInYearMonthDay(timePeriod[0]) : "No time selected"}</b>
          {" "}to:{" "}
          <b>{timePeriod[1] ? getDateInYearMonthDay(timePeriod[1]) : "No time selected"}</b>
        </span>
        <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          <Tooltip title="Filter by date using a preset range or selecting a specific range 🤓">
            <div className="text-gf-text w-[10px]">
              <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
            </div>
          </Tooltip>
          <SelecterFilter
            getValue={getValueFromSelecter}
            periodFromFather={timePeriodsForSelecter[0]}
            periodOverride={timePeriodsForSelecter}
            styles="gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
          />
          <TimeRange rpDate={handleRangeDate} />
        </div>
      </div>
      <div className="tdgc-tab-headers-cont mx-auto mb-3 flex w-fit max-w-full items-center justify-center gap-1 rounded-full gf-glass-inset p-1.5 gf-tab-bar-accent ">
        <div
          onClick={() => setActiveTab("treemap")}
          className={`tab-treemap px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            activeTab === "treemap" ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          Treemap
        </div>
        <div
          onClick={() => setActiveTab("bubble")}
          className={`tab-budget px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            activeTab === "bubble" ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          Bubble
        </div>
        <div
          onClick={() => setActiveTab("nestedPie")}
          className={`tab-saving px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            activeTab === "nestedPie" ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          Nested Pie
        </div>
        <Tooltip title="Select the kind of chart you want to display to see the detailed categories movements 🤓">
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      {/*
        Each tab's chart is only mounted while active, not always-mounted
        and CSS-hidden - Nivo's ResponsiveCirclePacking/ResponsiveSunburst
        measure their container via ResizeObserver at mount time, and that
        measurement is unreliable across a display:none -> visible toggle
        (the container can still report 0x0). Mounting fresh on every switch
        forces a real initial measurement instead, and matches how
        TabsToggler elsewhere on the History page already switches tabs.
      */}
      <div className="trc-container-sub w-full h-full">
        {activeTab === "treemap" && (
          <TypedDisplayerCategoryTreemap dccpIncomes={allIncomes} dccoBills={allBills} />
        )}
        {activeTab === "bubble" && (
          <TypedDisplayerCategoryCirclePacking dccpIncomes={allIncomes} dccoBills={allBills} />
        )}
        {activeTab === "nestedPie" && (
          <TypedTransactionsResumeCont trcBills={allBills} trcIncomes={allIncomes} />
        )}
      </div>
    </div>
  );
}

export default TransDetailsGrandContainer;
