import React, { useState } from "react";
import UniversalCategoIcon from "./UniversalCategoIcon";
import DisplayerCategoryCirclePacking from "./DisplayerCategoryCirclePacking";
import TransactionsResumeCont from "./TransactionsResumeCont";
import { Tooltip } from "antd";

function TransDetailsGrandContainer({tdgcInc, tdgcBills}) {
  let [isBubble, setIsBubble] = useState(true);
  const handleTab = (budType) => {
    if (budType === "bubble") {
      setIsBubble(true);
    } else {
      setIsBubble(false);
    }
  };
  return (
    <div className="tdgc-cont w-full h-full">
      <h1 className="text-2xl text-center font-semibold pt-5">
        Transactions Details
      </h1>
      <div className="tdgc-tab-headers-cont w-full text-center flex justify-center items-center gap-2 bg-purple-100">
        <div
          onClick={() => handleTab("bubble")}
          className={`tab-budget p-4 cursor-pointer hover:text-purple-400 ${
            isBubble ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Bubble
        </div>
        <div
          onClick={() => handleTab("")}
          className={`tab-saving p-4 cursor-pointer hover:text-purple-400 ${
            !isBubble ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Nested Pie
        </div>
        <Tooltip title="Select the kind of chart you want to display to see the detailed categories movements 🤓">
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      <div
        className={`trc-container-sub w-full h-full ${
          isBubble ? "" : "hidden"
        }`}
      >
        <DisplayerCategoryCirclePacking
          dccpIncomes={tdgcInc}
          dccoBills={tdgcBills}
        />
      </div>
      <div
        className={`trc-container-sub w-full h-full ${
          isBubble ? "hidden" : ""
        }`}
      >
        <TransactionsResumeCont trcBills={tdgcBills} trcIncomes={tdgcInc} />
      </div>
    </div>
  );
}

export default TransDetailsGrandContainer;
