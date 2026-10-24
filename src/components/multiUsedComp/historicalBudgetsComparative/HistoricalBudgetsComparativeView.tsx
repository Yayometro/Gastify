"use client";

import React from "react";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import { Skeleton, Tooltip } from "antd";
import SelecterFilter, { type SelecterPeriod } from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import UniversalCategoIcon from "../UniversalCategoIcon";
import EmptyModule from "../EmptyModule";
import { getDateInYearMonthDay } from "@gastify/core/time/timeFunctions";
import BudgetHistoricalComparativeRow from "./BudgetHistoricalComparativeRow";
import type { BudgetHistoricalComparativeRowData } from "@/helpers/transformers/budgetHistoricalComparative";
import type { TimePeriodOption } from "@/hooks/usePeriodComparison";
import { useT } from "@/i18n/client";

export interface HistoricalBudgetsComparativeViewProps {
  rows: BudgetHistoricalComparativeRowData[];
  isLoading?: boolean;
  timePeriod: [Date, Date] | (Date | string | number | null | undefined)[];
  getValueFromSelecter?: (val: string) => void;
  handleRangeDate?: (dateStart?: Date | null, dateEnd?: Date | null) => void;
  timePeriodsForSelecter?: SelecterPeriod[] | TimePeriodOption[];
  walletPrimaryCurrency?: string;
  onOpenDetail: (row: BudgetHistoricalComparativeRowData) => void;
}

function HistoricalBudgetsComparativeView({
  rows,
  isLoading,
  timePeriod,
  getValueFromSelecter,
  handleRangeDate,
  timePeriodsForSelecter,
  walletPrimaryCurrency,
  onOpenDetail,
}: HistoricalBudgetsComparativeViewProps): React.JSX.Element {
  const tr = useT();
  const t = useT();
  return (
    <div className="w-full h-full">
      <div className="flex items-center gap-2"><h1 className="text-3xl text-purple-300">{t("budgets.comparative.title")}</h1><InfoTip info={APP_INFO.presupuestos_del_periodo} /></div>
      <div className="filters flex flex-col justify-center items-center">
        <span className="text-xs">
          {tr("budgets.from")}{" "}
          <b>
            {!timePeriod[0] ? "No time selected" : getDateInYearMonthDay(timePeriod[0])}
          </b>{" "}
          {tr("budgets.to")}{" "}
          <b>{!timePeriod[1] ? "No time selected" : getDateInYearMonthDay(timePeriod[1])}</b>
        </span>
        <div className="filters w-full h-full flex items-center justify-center flex-wrap gap-2">
          <Tooltip title={t("budgets.comparative.help")}>
            <div className="text-gf-text w-[10px]">
              <UniversalCategoIcon type="fa/FaRegQuestionCircle" siz={15} />
            </div>
          </Tooltip>
          <SelecterFilter
            getValue={getValueFromSelecter}
            periodOverride={timePeriodsForSelecter as SelecterPeriod[]}
            styles={
              "gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative min-[400px]:py-[2px] min-[640px]:py-[4px]"
            }
          />
          <TimeRange rpDate={handleRangeDate} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton active className="py-3" />
      ) : rows.length === 0 ? (
        <EmptyModule emMessage={t("budgets.comparative.none")} />
      ) : (
        <div className="flex flex-col gap-2 mt-3">
          {rows.map((row) => (
            <BudgetHistoricalComparativeRow
              key={row.budget._id as React.Key}
              row={row}
              walletPrimaryCurrency={walletPrimaryCurrency}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoricalBudgetsComparativeView;
