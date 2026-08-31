import React, { useEffect, useRef, useState } from "react";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { useSelector } from "react-redux";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { buildCategoryHierarchy, getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import { formatMoneyMajor } from "@/lib/money/currencies";

function CategoryCirclePacking({ ccpTransacctions, ccpIsBill }) {
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const [zoomedId, setZoomedId] = useState(null);
  const [dataCat, setDataCat] = useState({});
  const [totalValueOn, setTotalValueOn] = useState(0);

  useEffect(() => {
    if (ccpTransacctions) {
      const totalAmount = ccpTransacctions.reduce((acc, trans) => acc += getPrimaryAmount(trans), 0);
      if (totalAmount) setTotalValueOn(totalAmount);
      setDataCat(buildCategoryHierarchy(ccpTransacctions, ccpIsBill));
    }
  }, [ccpTransacctions, ccpIsBill]);
  // console.log(newColors);
  // console.log(dataCat);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="CategoryCircle-Content-title pt-5">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Category {ccpIsBill ? "Bills" : "Incomes"} Details
        </h1>
      </div>
      <div className="circle-graph-container w-full h-full">
        <div className="circle-graph-container w-[100%] h-[500px] sm:h-[700px] md:h-[800px]">
          <ResponsiveCirclePacking
            data={dataCat}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            id="name"
            value="loc"
            valueFormat=" >-$"
            // colors={{ scheme: "nivo" }}
            colors={(cData) => {
              return String(cData.data[`color`]);
            }}
            colorBy="id"
            childColor={{
              from: "color",
              //   modifiers: [["brighter", 0.4]],
            }}
            padding={10}
            enableLabels={true}
            label={(e) => e.id + ": " + e.value}
            labelsFilter={(n) => 2 === n.node.depth}
            labelsSkipRadius={9}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 2]],
            }}
            borderWidth={1}
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.5]],
            }}
            motionConfig="slow"
            zoomedId={zoomedId}
            onClick={(node) => {
              setZoomedId(zoomedId === node.id ? null : node.id);
            }}
            tooltip={(dataa) => {
              // console.log(dataa);
              return (
                <div
                  style={{
                    padding: 5,
                    background: "#F7F9F9",
                    boxShadow: `0px 7px 16px 0px ${
                      dataa.color ? dataa.color : "rgba(0,0,0,0.27)"
                    }`,
                    display: "flex",
                    gap: "5px",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                  }}
                  className="max-w-[250px]"
                >
                  <h1 className="text-base text-center text-wrap font-bold">
                    {dataa.data.name}
                  </h1>
                  <div className="flex gap-2">
                    <div
                      style={{
                        backgroundColor: `${dataa.color}`,
                      }}
                      className="flex items-center justify-center text-[17px] min-w-[60px] h-[60px] rounded-3xl"
                    >
                      <UniversalCategoIcon type={dataa.data.icon} siz={15} />
                    </div>
                    <div className="flex flex-col text-[13px] font-semibold">
                      <div className="flex gap-2">
                        <p className="font-semibold">
                          {ccpIsBill ? "Total spent:" : "Total earned:"}
                        </p>
                        {formatMoneyMajor(totalValueOn, walletPrimaryCurrency)}
                      </div>
                      <div className="flex gap-2 underline" >
                        <p className="font-semibold">Amount:</p>
                        {formatMoneyMajor(dataa.value, walletPrimaryCurrency)}
                      </div>
                      <div className="flex gap-2">
                        <p className="font-semibold">Percentage:</p>
                        {String((dataa.value / totalValueOn) * 100).slice(0, 4)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CategoryCirclePacking;
