import React, { useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import UniversalCategoIcon from "./UniversalCategoIcon";

function TabsTrans({ ttTrans, ttIsbill, ttHorizontal }) {
  const [newData, setNewData] = useState([]);
  const [totalValueOn, setTotalValueOn] = useState(0);

  useEffect(() => {
    if (ttTrans) {
      // console.log(ttTrans);
      let transWithoutCategory = ttTrans.filter((trans) => !trans.category);
      let transWithCategory = ttTrans.filter(
        (trans) => trans?.category && !trans?.subCategory
      );
      let transWithSubCat = ttTrans.filter((trans) => trans?.subCategory);
      let createNewOrder = ttTrans.map((trans) => {
        if (!trans.category) {
          return {
            "No category": trans.amount,
            type: `No category`,
            value: trans.amount,
            idCategory: "ID-nocategory",
            color: "#ABABAB",
            icon: "MdFilterNone",
          };
        }
        if (trans.category) {
          return {
            [trans.category.name]: trans.amount,
            type: trans.category.name,
            value: trans.amount,
            idCategory: trans.category._id,
            color: trans.category.color || "#ABABAB",
            icon: trans.category.icon || "MdFilterNone",
          };
        }
        if (trans.subCategory) {
          return {
            [trans.category.name]: trans.amount,
            type: trans.category.name,
            value: trans.amount,
            idCategory: trans.category._id,
            color: trans.category.color || "#ABABAB",
            icon: trans.category.icon || "MdFilterNone",
          };
        }
      });
      // console.log(createNewOrder);
      const reducedData = createNewOrder.reduce((acc, item) => {
        // Si el idCategory ya existe en el acumulador, suma su valor
        if (acc[item.idCategory]) {
          acc[item.idCategory].value += item.value;
        } else {
          // Si no, crea una nueva entrada en el acumulador
          acc[item.idCategory] = { ...item };
        }
        return acc;
      }, {});
      const finalArray = Object.values(reducedData);
      const totalValue = finalArray.reduce((acc, item) => acc + item.value, 0);
      //   console.log(finalArray);
      // console.log(totalValue);
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
                    ${totalValueOn}
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
