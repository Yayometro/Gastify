import React from "react";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { formatMoneyMajor } from "@/lib/money/currencies";

function TooltipForChart({item, name, value, totalValue, color, walletPrimaryCurrency = "MXN"}) {
  return (
    <div className="w-full h-full flex gap-2" key={name + value}>
      <div
        style={{ backgroundColor: `${color}` }}
        className="flex items-center justify-center text-[17px] min-w-[60px] h-[60px] rounded-3xl"
      >
        <UniversalCategoIcon type={item.icon} siz={15} />
      </div>
      <div className="flex flex-col text-[13px] font-semibold">
        <div className="flex gap-2">
          <p className="font-semibold">Total spent:</p>
          <b className="">{formatMoneyMajor(totalValue, walletPrimaryCurrency)}</b>
        </div>
        <div className="flex gap-2 underline">
          <p className="font-semibold">Amount:</p>
          <b className="">{formatMoneyMajor(value, walletPrimaryCurrency)}</b>
        </div>
        <div className="flex gap-2">
          <p className="font-semibold">Percentage:</p>
          <b className="">{String((value / totalValue) * 100).slice(0, 4)}%</b>
        </div>
      </div>
    </div>
  );
}

export default TooltipForChart;
