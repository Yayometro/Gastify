import React, { useState } from "react";
import TransResumeChart from "./TransResumeChart";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import { useT } from "@/i18n/client";

// Typed bridge for unmigrated child component
interface TransResumeChartProps {
  trchTransactions?: TransactionData[];
  trchIsBill?: boolean;
  trchFill?: boolean;
}

const TypedTransResumeChart = TransResumeChart as React.ComponentType<TransResumeChartProps>;

export interface TransactionsResumeContProps {
  trcIncomes?: TransactionData[];
  trcBills?: TransactionData[];
  // Controlled by the card above (Gastos / Ingresos): when given, the chart's own switch is hidden.
  bill?: boolean;
  // Inside the card the chart fills the card's height instead of its own fixed one.
  fill?: boolean;
}

function TransactionsResumeCont({ trcIncomes, trcBills, bill, fill }: TransactionsResumeContProps): React.JSX.Element {
  const t = useT();
  const [ownBill, setOwnBill] = useState<boolean>(true);
  const isBillTab = bill ?? ownBill;
  const handleTab = (budType: string) => {
    if (budType === "bill") {
      setOwnBill(true);
    } else {
      setOwnBill(false);
    }
  };

  return (
    <div className="trc-container w-full h-full">
      <div className={`bc-tab-headers-cont mx-auto mb-3 flex w-fit max-w-full items-center justify-center gap-1 rounded-full gf-glass-inset p-1.5 ${bill === undefined ? "" : "hidden"}`}>
        <div
          onClick={() => handleTab("bill")}
          className={`tab-budget px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            isBillTab ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t("movements.details.bills")}
        </div>
        <div
          onClick={() => handleTab("")}
          className={`tab-saving px-5 py-2 text-base font-semibold cursor-pointer rounded-full whitespace-nowrap transition-all ${
            !isBillTab ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t("movements.details.incomes")}
        </div>
        <Tooltip title={t("movements.details.needleTip")}>
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      <div className={`trc-container-sub w-full h-full ${isBillTab ? "" : "hidden"}`}>
        <TypedTransResumeChart trchTransactions={trcBills} trchIsBill={true} trchFill={fill} />
      </div>
      <div className={`trc-container-sub w-full h-full ${isBillTab ? "hidden" : ""}`}>
        <TypedTransResumeChart trchTransactions={trcIncomes} trchIsBill={false} trchFill={fill} />
      </div>
    </div>
  );
}

export default TransactionsResumeCont;