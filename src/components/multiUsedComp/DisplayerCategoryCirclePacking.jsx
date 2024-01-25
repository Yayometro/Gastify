import React, { useState } from "react";
import CategoryCirclePacking from "./CategoryCirclePacking";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";

function DisplayerCategoryCirclePacking({ dccpIncomes, dccoBills }) {
  // Función para renderizar el contenido de cada pestaña
  let [tabBill, setTabBill] = useState(true);
  const handleToggle = (type) => {
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
          <CategoryCirclePacking ccpTransacctions={dccoBills} ccpIsBill={true}/>
        </div>
        <div
          className={`dccp-tc-income w-full h-full ${tabBill ? "hidden" : ""}`}
        >
          <CategoryCirclePacking
            ccpTransacctions={dccpIncomes}
            ccpIsBill={false}
          />
        </div>
      </div>
    </div>
  );
}

export default DisplayerCategoryCirclePacking;
