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
}

const TypedCategoryCirclePacking = CategoryCirclePacking as React.ComponentType<CategoryCirclePackingProps>;

export interface DisplayerCategoryCirclePackingProps {
  dccpIncomes?: TransactionData[];
  dccoBills?: TransactionData[];
}

function DisplayerCategoryCirclePacking({
  dccpIncomes,
  dccoBills,
}: DisplayerCategoryCirclePackingProps): React.JSX.Element {
  // Función para renderizar el contenido de cada pestaña
  const [tabBill, setTabBill] = useState(true);
  const handleToggle = (type: "bill" | "income" | string) => {
    if (type === "bill") {
      setTabBill(true);
    }
    if (type === "income") {
      setTabBill(false);
    }
  };
  return (
    <div className="displayer-ccp-container w-full h-full ">
      <div className="tab-headers-cont w-full text-center flex justify-center items-center gap-2">
        <div
          onClick={() => handleToggle("bill")}
          className={`thc-bill p-4 cursor-pointer hover:text-purple-400 ${
            tabBill ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Category Bills
        </div>
        <div
          onClick={() => handleToggle("income")}
          className={`thc-bill p-4 cursor-pointer hover:text-purple-400 ${
            !tabBill ? "border-b-2 border-purple-600 text-purple-600 " : ""
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
      <div className="dccp-tab-content">
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
              <TypedCategoryCirclePacking ccpTransacctions={dccoBills} ccpIsBill={true}/>
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
              />
            )
          }
        </div>
      </div>
    </div>
  );
}

export default DisplayerCategoryCirclePacking;
