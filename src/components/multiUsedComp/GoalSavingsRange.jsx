import React, { useEffect, useState } from "react";
import { Gauge } from "@ant-design/plots";
import UniversalCategoIcon from "./UniversalCategoIcon";

function GoalSavingsRange({ ggrSavings }) {
  //Declare var
  const goalAmount = ggrSavings?.goalAmount ? ggrSavings.goalAmount : 100;
  const currentSaving = ggrSavings?.savingAmount
  const category = ggrSavings?.category;
  const subCategory = ggrSavings?.subCategory;
  let defaultCate = category;
  if (subCategory) {
    defaultCate = { ...subCategory, isSub: true };
  }
  
  const totalDes = String((currentSaving / goalAmount) * 100);
  // console.log(totalDes);
  const depured = totalDes.length > 5 ? totalDes.substring(0, 5) : totalDes;
  // console.log(depured);
  const config = {
    autoFit: true,
    // height: 300,
    data: {
      target: !currentSaving ? 0 : currentSaving,
      total: !goalAmount ? 100 : goalAmount,
      name: "score",
      thresholds: [
        goalAmount * 0.2,
        goalAmount * 0.55,
        goalAmount * 0.8,
        goalAmount * 1,
      ],
    },
    legend: false,
    scale: {
      color: {
        range: ["red", "#F4664A", "#CDDC39", "green"],
      },
    },
    style: {
      textContent: (target, total) => `Current：$ ${target}\nOf：$ ${total}`,
    },
  };
  //HANLDES
  return (
    <div className="w-[90%] flex flex-col justify-center items-center bg-slate-50 rounded-2xl shadow-xl mt-2">
      <div className="Bug-info-cont w-full flex flex-row items-center justify-center gap-2 text-lg pt-2  px-3">
        <div
          style={{
            backgroundColor: defaultCate?.color || "#DADADA",
          }}
          className={`circle-ico rounded-full min-w-[50px] min-h-[50px] flex items-center justify-center hover:mix-blend-multiply shrink`}
        >
          {!defaultCate?.icon ? (
            <UniversalCategoIcon type={`${"md/MdFilterNone"}`} size={10} />
          ) : (
            <UniversalCategoIcon type={`${defaultCate.icon}`} size={10} />
          )}
        </div>
        <div className="bud-info-ps flex flex-col items-start justify-cente">
          <p className="goalFauge-p-des font-normal">{ggrSavings.name}</p>
          <p
            className="goalFauge-p-des w-fit text-xs font-light py-px px-2 rounded-full"
            style={{
              backgroundColor: defaultCate?.color || "#DADADA",
            }}
          >
            {defaultCate.isSub ? "SubCategory: " : "Category: "}
            {defaultCate.name}
          </p>
        </div>
      </div>
      <div className="max-w-full max-h-[300px] relative">
        <Gauge {...config} className="absolute max-h-[400px]" />
      </div>
    </div>
  );
}

export default GoalSavingsRange;
