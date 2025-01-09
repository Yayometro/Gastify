"use client";
import { ResponsiveBar } from "@nivo/bar";
import React from "react";
import UniversalCategoIcon from "../../UniversalCategoIcon";
import currencyFormatter from "currency-formatter";

function ResponsiveBarsChartComponent({
  data,
  totalValue,
  propsPlus,
  legendBottom,
  legenedLeft,
  header
}) {
  const rest = {
    data: data,
    indexBy: "type",
    keys: ["value"],
    margin: { top: 10, right: 100, bottom: 50, left: 60 },
    padding: 0.15,
    valueScale: { type: "linear" },
    indexScale: { type: "band", round: true },
    valueFormat: " >-$0,~r",
    colors: (cData) => String(cData.data[`color`]),
    borderColor: { from: "color", modifiers: [["darker", 1.6]] },
    axisTop: null,
    axisRight: null,
    axisBottom: {
      tickSize: 0,
      tickPadding: 5,
      tickRotation: 0,
      legend: legendBottom,
      legendPosition: "middle",
      legendOffset: 40,
      truncateTickAt: 3,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: legenedLeft,
      legendPosition: "middle",
      legendOffset: -50,
      truncateTickAt: 0,
    },
    enableGridX: true,
    labelSkipWidth: 10,
    labelSkipHeight: 1,
    labelTextColor: { from: "color", modifiers: [["darker", "2.3"]] },
    legends: [
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
    ],
    tooltip: (dataa) => {
      // console.log(dataa)
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
            {dataa.data.type.toUpperCase()}
          </h1>
          <div className="flex gap-2">
            <div
              style={{ backgroundColor: `${dataa.color}` }}
              className="flex items-center justify-center text-[17px] min-w-[60px] h-[60px] rounded-3xl"
            >
              <UniversalCategoIcon type={dataa.data.icon} siz={15} />
            </div>
            <div className="flex flex-col text-[13px] font-semibold">
              <div className="flex gap-2">
                <p className="font-semibold">Total spent:</p>$
                {currencyFormatter.format(totalValue, {
                  locale: "en-US",
                })}
              </div>
              <div className="flex gap-2 underline">
                <p className="font-semibold">Amount:</p>
                {dataa.formattedValue}
              </div>
              <div className="flex gap-2">
                <p className="font-semibold">Percentage:</p>
                {String((dataa.value / totalValue) * 100).slice(0, 4)}%
              </div>
            </div>
          </div>
        </div>
      );
    },
    motionConfig: "gentle",
    role: "application",
    label: (d) => d.formattedValue,
    enableTotals: true,
    ...propsPlus
  };
  return (
    <div className="responsive-bars-chart-comp w-[100%] h-[400px] min-h-[300px] max-h-[600px]">
      {header}
      <span className=" text-center text-xs">
        Total:{" "}
        <b>
          {currencyFormatter.format(totalValue, {
            locale: "en-US",
          })}
        </b>
      </span>
      <ResponsiveBar {...rest} />
    </div>
  );
}

export default ResponsiveBarsChartComponent;
