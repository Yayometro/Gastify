import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { formatMoneyMajor } from "@/lib/money/currencies";

function TooltipForChart({item, name, value, totalValue, color, walletPrimaryCurrency = "MXN"}) {
  return (
    <div className="w-full flex items-center gap-2 text-xs" key={name + value}>
      <div
        style={{ backgroundColor: `${color}` }}
        className="flex items-center justify-center shrink-0 min-w-[36px] h-[36px] rounded-full"
      >
        <UniversalCategoIcon type={item.icon} siz={14} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gf-text-muted">Total spent:</span>
          <b className="text-gf-text">{formatMoneyMajor(totalValue, walletPrimaryCurrency)}</b>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gf-text-muted">Amount:</span>
          <b className="text-gf-text">{formatMoneyMajor(value, walletPrimaryCurrency)}</b>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gf-text-muted">Percentage:</span>
          <b className="text-gf-text">{String((value / totalValue) * 100).slice(0, 4)}%</b>
        </div>
      </div>
    </div>
  );
}

export default TooltipForChart;
