"use client";
import React, { useState } from "react";
import CategoryTreemap from "./CategoryTreemap";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import { useT } from "@/i18n/client";

// Typed bridge for unmigrated CategoryTreemap component
interface CategoryTreemapProps {
  ctTransactions?: TransactionData[];
  ctIsBill?: boolean;
  ctFill?: boolean;
}

const TypedCategoryTreemap = CategoryTreemap as React.ComponentType<CategoryTreemapProps>;

export interface DisplayerCategoryTreemapProps {
  dccpIncomes?: TransactionData[];
  dccoBills?: TransactionData[];
  // Controlled by the card above (Gastos / Ingresos): when given, the chart's own switch is hidden.
  bill?: boolean;
  // Inside the card the chart fills the card's height; on Account movements it keeps its own size.
  fill?: boolean;
}

// Same Bills/Incomes tab wrapper as DisplayerCategoryCirclePacking, but
// rendering the category Treemap instead of the circle-packing bubble chart
// - used on Account movements detail, where the bubble chart read as too
// dark/cramped compared to the Treemap already used elsewhere in the app.
function DisplayerCategoryTreemap({
  dccpIncomes,
  dccoBills,
  bill,
  fill,
}: DisplayerCategoryTreemapProps): React.JSX.Element {
  const t = useT();
  const [ownBill, setOwnBill] = useState(true);
  const tabBill = bill ?? ownBill;
  const handleToggle = (type: "bill" | "income" | string) => {
    if (type === "bill") {
      setOwnBill(true);
    }
    if (type === "income") {
      setOwnBill(false);
    }
  };
  return (
    <div className="displayer-ccp-container w-full h-full ">
      <div className={`tab-headers-cont mx-auto mb-3 flex w-fit max-w-full items-center justify-center gap-1 rounded-full gf-glass-inset p-1.5 ${bill === undefined ? "" : "hidden"}`}>
        <div
          onClick={() => handleToggle("bill")}
          className={`thc-bill px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            tabBill ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t("categories.chart.bills")}
        </div>
        <div
          onClick={() => handleToggle("income")}
          className={`thc-bill px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            !tabBill ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t("categories.chart.incomes")}
        </div>
        <Tooltip title={t("categories.chart.treemapTip")}>
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      <div className={`dccp-tab-content ${fill ? "h-full" : ""}`}>
        <div
          className={`dccp-tc-bill w-full h-full ${tabBill ? "" : "hidden"}`}
        >
          {
            dccoBills.length <= 0 ? (
              <div className="w-full py-[20px]">
              <EmptyModule
                emMessage={t("categories.nothingHere")}
              />
            </div>
            ) : (
              <TypedCategoryTreemap ctTransactions={dccoBills} ctIsBill={true} ctFill={fill}/>
            )
          }
        </div>
        <div
          className={`dccp-tc-income w-full h-full ${tabBill ? "hidden" : ""}`}
        >
          {
            dccpIncomes.length <= 0 ? (
              <div className="w-full py-[20px]">
              <EmptyModule
                emMessage={t("categories.nothingHere")}
              />
            </div>
            ) : (
              <TypedCategoryTreemap
                ctTransactions={dccpIncomes}
                ctIsBill={false}
                ctFill={fill}
              />
            )
          }
        </div>
      </div>
    </div>
  );
}

export default DisplayerCategoryTreemap;
