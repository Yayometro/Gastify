import React, { useState } from "react";
import CategoryCirclePacking from "./CategoryCirclePacking";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";
import type { TransactionData } from "@/lib/features/transacctionsSlice";

// Typed bridge for unmigrated CategoryCirclePacking component
interface CategoryCirclePackingProps {
  ccpTransacctions?: TransactionData[];
  ccpIsBill?: boolean;
  ccpFill?: boolean;
}

const TypedCategoryCirclePacking = CategoryCirclePacking as React.ComponentType<CategoryCirclePackingProps>;

export interface DisplayerCategoryCirclePackingProps {
  dccpIncomes?: TransactionData[];
  dccoBills?: TransactionData[];
  // Controlled by the card above (Gastos / Ingresos): when given, the chart's own switch is hidden.
  bill?: boolean;
  // Inside the card the chart fills the card's height instead of its own fixed one.
  fill?: boolean;
}

function DisplayerCategoryCirclePacking({
  dccpIncomes,
  dccoBills,
  bill,
  fill,
}: DisplayerCategoryCirclePackingProps): React.JSX.Element {
  // Función para renderizar el contenido de cada pestaña
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
          Category Bills
        </div>
        <div
          onClick={() => handleToggle("income")}
          className={`thc-bill px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            !tabBill ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          Category Incomes
        </div>
        <Tooltip title="How to navigate 🤔? It's really simple just HOVER over the circle to see the description and amount. And if you want to see some circles with more detail, just click to zoom in or click in the father of the circle nested to zoom out.">
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
                emMessage={`Ups... Nothing here 🤔.
                If this module is empty maybe the is not data in general or there is no data in this time-period.
                Try with a time-period older, like 3 months or 6 months to check.`}
              />
            </div>
            ) : (
              <TypedCategoryCirclePacking ccpTransacctions={dccoBills} ccpIsBill={true} ccpFill={fill}/>
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
                emMessage={`Ups... Nothing here 🤔.
                If this module is empty maybe the is not data in general or there is no data in this time-period.
                Try with a time-period older, like 3 months or 6 months to check.`}
              />
            </div>
            ) : (
              <TypedCategoryCirclePacking
                ccpTransacctions={dccpIncomes}
                ccpIsBill={false}
                ccpFill={fill}
              />
            )
          }
        </div>
      </div>
    </div>
  );
}

export default DisplayerCategoryCirclePacking;
