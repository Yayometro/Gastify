
import React, { useState } from 'react'
import TransResumeChart from './TransResumeChart'
import { Tooltip } from "antd";
import UniversalCategoIcon from './UniversalCategoIcon';

function TransactionsResumeCont({trcIncomes, trcBills}) {
    let [isBillTab, setIsBillTab] = useState(true)
    const handleTab = (budType) => {
        if(budType === "bill"){
            setIsBillTab(true)
        } else {
            setIsBillTab(false)
        }
      }
  return (
    <div className="trc-container w-full h-full">
        <div className="bc-tab-headers-cont w-full text-center flex justify-center items-center gap-2">
        <div
          onClick={() => handleTab("bill")}
          className={`tab-budget p-4 cursor-pointer hover:text-purple-400 ${
            isBillTab ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Bills Details
        </div>
        <div
          onClick={() => handleTab("")}
          className={`tab-saving p-4 cursor-pointer hover:text-purple-400 ${
            !isBillTab ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Income details
        </div>
        <Tooltip title="The needle indicator shows your actual state regarding your budget or saving 🤓">
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
        </div>
        <div className={`trc-container-sub w-full h-full ${isBillTab ? "" : "hidden"}`}>
            <TransResumeChart trchTransactions={trcBills} trchIsBill={true} />
        </div>
        <div className={`trc-container-sub w-full h-full ${isBillTab ? "hidden" : ""}`}>
            <TransResumeChart trchTransactions={trcIncomes} trchIsBill={false} />
        </div>
    </div>
  )
}

export default TransactionsResumeCont