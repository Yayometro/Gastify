"use client";
import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { percentOf } from "@gastify/core/format/percent";
import { useT } from "@/i18n/client";

export interface TooltipForChartItem {
  icon?: string;
  [key: string]: unknown;
}

export interface TooltipForChartProps {
  item: TooltipForChartItem;
  name?: string;
  value: number;
  totalValue: number;
  color?: string;
  walletPrimaryCurrency?: string;
}

function TooltipForChart({
  item,
  name,
  value,
  totalValue,
  color,
  walletPrimaryCurrency = "MXN",
}: TooltipForChartProps): React.JSX.Element {
  const t = useT();
  return (
    <div className="w-full flex items-center gap-2 text-xs" key={(name as string) + value}>
      <div
        style={{ backgroundColor: `${color}` }}
        className="flex items-center justify-center shrink-0 min-w-[36px] h-[36px] rounded-full"
      >
        <UniversalCategoIcon type={item.icon} siz={14} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gf-text-muted">{t("shared.totalSpent")}</span>
          <b className="text-gf-text">{formatMoneyMajor(totalValue, walletPrimaryCurrency)}</b>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gf-text-muted">{t("shared.amount")}</span>
          <b className="text-gf-text">{formatMoneyMajor(value, walletPrimaryCurrency)}</b>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gf-text-muted">{t("shared.percentage")}</span>
          <b className="text-gf-text">{percentOf(value, totalValue)}%</b>
        </div>
      </div>
    </div>
  );
}

export default TooltipForChart;
