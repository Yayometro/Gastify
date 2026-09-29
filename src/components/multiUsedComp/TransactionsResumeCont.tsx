import React, { useState } from "react";
import TransResumeChart from "./TransResumeChart";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import type { TransactionData } from "@/lib/features/transacctionsSlice";

// Typed bridge for unmigrated child component
interface TransResumeChartProps {
  trchTransactions?: TransactionData[];
  trchIsBill?: boolean;
}

const TypedTransResumeChart = TransResumeChart as React.ComponentType<TransResumeChartProps>;

export interface TransactionsResumeContProps {
  trcIncomes?: TransactionData[];
  trcBills?: TransactionData[];
}

function TransactionsResumeCont({ trcIncomes, trcBills }: TransactionsResumeContProps): React.JSX.Element {
  const [isBillTab, setIsBillTab] = useState<boolean>(true);
  const handleTab = (budType: string) => {
    if (budType === "bill") {
      setIsBillTab(true);
    } else {
      setIsBillTab(false);
    }
  };

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
        <TypedTransResumeChart trchTransactions={trcBills} trchIsBill={true} />
      </div>
      <div className={`trc-container-sub w-full h-full ${isBillTab ? "hidden" : ""}`}>
        <TypedTransResumeChart trchTransactions={trcIncomes} trchIsBill={false} />
      </div>
    </div>
  );
}

export default TransactionsResumeCont;