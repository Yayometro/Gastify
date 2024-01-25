import React, { useState } from "react";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import Top3 from "./Top3";
import EmptyModule from "./EmptyModule";

function Top3ContComp({ t3ccTransactions, ist3ccCategory }) {
  const [isBill, setIsBill] = useState(true);
//   const handleTab = (budType) => {
//     if (budType === "bill") {
//       setIsBillTab(true);
//     } else {
//       setIsBillTab(false);
//     }
//   };
  return (
    <div className="tdgc-cont w-full h-full">
      {/* <h1 className="text-2xl text-center font-semibold pt-5">Top 3</h1> */}
      <div className="tdgc-tab-headers-cont w-full text-center flex justify-center items-center gap-2 bg-purple-100">
        <div
          onClick={() => setIsBill(true)}
          className={`tab-budget p-4 cursor-pointer hover:text-purple-400 ${
            isBill ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Bill
        </div>
        <div
          onClick={() => setIsBill(false)}
          className={`tab-saving p-4 cursor-pointer hover:text-purple-400 ${
            !isBill ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Income
        </div>
        <Tooltip title="Select the top 3 income or bill🤓">
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      {t3ccTransactions ? (
        <div className="w-full">
          {!ist3ccCategory ? (
            <div className={`w-full top3-cont-comp-trans`}>
              <div
                className={`w-full top3-unit-displayer ${
                  isBill ? "" : "hidden"
                }`}
              >
                <Top3
                  t3List={t3ccTransactions}
                  t3Type={"transactions"}
                  t3IsBill={true}
                  t3IsTop={true}
                />
              </div>
              <div
                className={`w-full top3-unit-displayer ${
                  isBill ? "hidden" : ""
                }`}
              >
                <Top3
                  t3List={t3ccTransactions}
                  t3Type={"transactions"}
                  t3IsBill={false}
                  t3IsTop={true}
                />
              </div>
            </div>
          ) : (
            <div className={`w-full top3-cont-comp-category`}>
              <div
                className={`w-full top3-unit-displayer ${
                  isBill ? "" : "hidden"
                }`}
              >
                <Top3
                  t3List={t3ccTransactions}
                  t3Type={"categories"}
                  t3IsBill={true}
                  t3IsTop={true}
                />
              </div>
              <div
                className={`w-full top3-unit-displayer ${
                  isBill ? "hidden" : ""
                }`}
              >
                <Top3
                  t3List={t3ccTransactions}
                  t3Type={"categories"}
                  t3IsBill={false}
                  t3IsTop={true}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyModule emMessage={"No transactions to share... 🤕"} />
      )}
    </div>
  );
}

export default Top3ContComp;
