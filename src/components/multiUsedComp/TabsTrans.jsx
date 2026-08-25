import React, { useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useSelector } from "react-redux";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import { getMonthCurrencyBreakdown } from "@/helpers/transformers/projectionsChange";
import { formatMoneyMinor } from "@/lib/money/currencies";

function TabsTrans({ ttTrans, ttIsbill, ttHorizontal }) {
  const [newData, setNewData] = useState([]);
  const [totalValueOn, setTotalValueOn] = useState(0);
  const walletPrimaryCurrency = useSelector((state) => state.walletReducer?.data?.primaryCurrency) || "MXN";

  useEffect(() => {
    if (ttTrans) {
      // These bars are labeled in the Wallet's primary currency, so each
      // transaction must be converted before summing - raw trans.amount is
      // in that transaction's own native currency, which only happens to
      // match the Wallet primary when every transaction shares one currency.
      let createNewOrder = ttTrans.map((trans) => {
        const category = trans.category;
        return {
          type: category ? category.name : "No category",
          value: getPrimaryAmount(trans),
          idCategory: category ? category._id : "ID-nocategory",
          color: (category && category.color) || "#ABABAB",
          icon: (category && category.icon) || "MdFilterNone",
          transaction: trans,
        };
      });
      const reducedData = createNewOrder.reduce((acc, item) => {
        if (acc[item.idCategory]) {
          acc[item.idCategory].value += item.value;
          acc[item.idCategory].transactions.push(item.transaction);
        } else {
          acc[item.idCategory] = { ...item, transactions: [item.transaction] };
        }
        return acc;
      }, {});
      const finalArray = Object.values(reducedData).sort((a, b) => b.value - a.value);
      const totalValue = finalArray.reduce((acc, item) => acc + item.value, 0);
      setNewData(finalArray);
      setTotalValueOn(totalValue);
    }
  }, [ttTrans]);
  return (
    <div className="tt-tabs-cont w-[100%] h-[400px] min-h-[300px] max-h-[600px]">
      <ResponsiveBar
        data={newData}
        indexBy="type"
        keys={["value"]}
        margin={{ top: 10, right: 100, bottom: 50, left: 60 }}
        padding={0.15}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        // valueFormat={v => `${v/totalValueOn}%`}
        valueFormat=" >-$0,~r"
        colors={(cData) => {
          return String(cData.data[`color`]);
        }}
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Categories",
          legendPosition: "middle",
          legendOffset: 40,
          truncateTickAt: 3,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Amount",
          legendPosition: "middle",
          legendOffset: -50,
          truncateTickAt: 0,
        }}
        enableGridX={true}
        labelSkipWidth={10}
        labelSkipHeight={1}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", "2.3"]],
        }}
        legends={[
          {
            dataFrom: "indexes",
            anchor: "right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemWidth: 100,
            itemHeight: 20,
            itemsSpacing: 2,
            symbolSize: 20,
            itemDirection: "left-to-right",
            effects: [
              {
                on: "hover",
                style: {
                  itemOpacity: 3,
                },
              },
            ],
          },
        ]}
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
                {dataa.data.type}
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
                      {ttIsbill ? "Total spent:" : "Total earned:"}
                    </p>
                    ${String(totalValueOn).slice(0, 9)}
                  </div>
                  <div className="flex gap-2 underline">
                    <p className="font-semibold">Amount:</p>
                    {dataa.formattedValue}
                  </div>
                  <div className="flex gap-2">
                    <p className="font-semibold">Percentage:</p>
                    {String((dataa.value / totalValueOn) * 100).slice(0, 4)}%
                  </div>
                </div>
              </div>
              {(() => {
                const { breakdown, isMultiCurrency } = getMonthCurrencyBreakdown(
                  dataa.data.transactions,
                  walletPrimaryCurrency
                );
                if (!isMultiCurrency) return null;
                return (
                  <div className="flex flex-wrap gap-1 justify-center w-full font-normal">
                    {breakdown.map((g) => (
                      <div
                        key={g.currency}
                        className="bg-white rounded-full px-2 py-0.5 text-[10px] border border-gray-200"
                      >
                        {formatMoneyMinor(g.nativeAmountMinor, g.currency, { showCode: true })}
                        {g.currency !== walletPrimaryCurrency && (
                          <> → {formatMoneyMinor(g.primaryAmountMinor, walletPrimaryCurrency, { showCode: true })}</>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        }}
        motionConfig="gentle"
        role="application"
        label={(d) => {
          // console.log(d)
          return d.formattedValue;
        }}
      />
    </div>
  );
}

export default TabsTrans;
