"use client";
import React, { useState } from "react";
import CategoryTreemap from "./CategoryTreemap";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";

function DisplayerCategoryTreemap({ dctIncomes, dctBills }) {
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
    <div className="displayer-ct-container w-full h-full ">
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
        <Tooltip title="How to navigate 🤔? Click a category to open it up and see its subcategories - use the breadcrumb above the chart to go back up.">
          <div className="">
            <UniversalCategoIcon type={`${"fa/FaRegQuestionCircle"}`} siz={15} />
          </div>
        </Tooltip>
      </div>
      <div className="dct-tab-content">
        <div className={`dct-tc-bill w-full h-full ${tabBill ? "" : "hidden"}`}>
          {dctBills.length <= 0 ? (
            <div className="w-full py-[20px]">
              <EmptyModule
                emMessage={`Ups... Nothing here 🤔.
                If this module is empty maybe the is not data in general or there is no data in this time-period.
                Try with a time-period older, like 3 months or 6 months to check.`}
              />
            </div>
          ) : (
            <CategoryTreemap ctTransactions={dctBills} ctIsBill={true} />
          )}
        </div>
        <div className={`dct-tc-income w-full h-full ${tabBill ? "hidden" : ""}`}>
          {dctIncomes.length <= 0 ? (
            <div className="w-full py-[20px]">
              <EmptyModule
                emMessage={`Ups... Nothing here 🤔.
                If this module is empty maybe the is not data in general or there is no data in this time-period.
                Try with a time-period older, like 3 months or 6 months to check.`}
              />
            </div>
          ) : (
            <CategoryTreemap ctTransactions={dctIncomes} ctIsBill={false} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DisplayerCategoryTreemap;
