import React, { useState } from "react";
import CategoryTreemap from "./CategoryTreemap";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";

// Same Bills/Incomes tab wrapper as DisplayerCategoryCirclePacking, but
// rendering the category Treemap instead of the circle-packing bubble chart
// - used on Account movements detail, where the bubble chart read as too
// dark/cramped compared to the Treemap already used elsewhere in the app.
function DisplayerCategoryTreemap({ dccpIncomes, dccoBills }) {
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
        <Tooltip title="How to navigate 🤔? Hover over a tile to see the description and amount. Click a tile to zoom into its sub-categories.">
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
              <CategoryTreemap ctTransactions={dccoBills} ctIsBill={true}/>
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
              <CategoryTreemap
                ctTransactions={dccpIncomes}
                ctIsBill={false}
              />
            )
          }
        </div>
      </div>
    </div>
  );
}

export default DisplayerCategoryTreemap;
