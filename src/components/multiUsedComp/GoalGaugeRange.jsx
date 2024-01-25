import React, { useEffect, useState } from "react";
import { Gauge } from "@ant-design/plots";
import CategoIcon from "./CategoIcon";
import UniversalCategoIcon from "./UniversalCategoIcon";

function GoalGaugeRange({ indBud, indBills }) {
  let [selectedDuration, setSelectedDuration] = useState(30);
  let [today, setToday] = useState("");
  let [currentExpense, setCurrentExpense] = useState(0);
  console.log(indBud);
  console.log(indBills);
  //Declare var
  const goalAmount = indBud?.goalAmount ? indBud.goalAmount : 100;
  const category = indBud?.category;
  const subCategory = indBud?.subCategory;
  let defaultCate = category;
  if (subCategory) {
    defaultCate = { ...subCategory, isSub: true };
  }
  useEffect(() => {
    if (indBud && indBills) {
      //TimeFilter
      let todey = new Date();
      const dayRange = new Date();
      dayRange.setDate(todey.getDate() - selectedDuration);
      let totalBills = indBills.filter((tra) => {
        const transactionDate = new Date(tra.date || tra.createdAt);
        return transactionDate >= dayRange;
      });
      //Filters
      if (subCategory) {
        const filterBySubCategory = totalBills.filter(
          (bill) => bill.subCategory?._id == subCategory?._id
        );
        // ADD amount
        const currentExpenseTemp = filterBySubCategory.reduce(
          (current, bill) => current + bill.amount,
          0
        );
        // SET
        setCurrentExpense(currentExpenseTemp);
      } else {
        const filterByCategory = totalBills.filter(
          (bill) => bill.category?._id == category?._id
        );
        // ADD amount
        const currentExpenseTemp = filterByCategory.reduce(
          (current, bill) => current + bill.amount,
          0
        );
        // SET
        setCurrentExpense(currentExpenseTemp);
      }
      // const globalExpenses = filterByCategory.concat(filterBySubCategory);
      // // ADD amount
      // const currentExpenseTemp = globalExpenses.reduce(
      //   (current, bill) => current + bill.amount,
      //   0
      // );
      // // SET
      // setCurrentExpense(currentExpenseTemp);
      // console.log(currentExpense)
    }
  }, [indBud, indBills, selectedDuration]);
  // console.log(currentExpense)
  // console.log(goalAmount);
  // console.log(category);
  const totalDes = String((currentExpense / goalAmount) * 100);
  // console.log(totalDes);
  const depured = totalDes.length > 5 ? totalDes.substring(0, 5) : totalDes;
  // console.log(depured);
  const config = {
    autoFit: true,
    // height: 300,
    data: {
      target: !currentExpense ? 0 : currentExpense,
      total: !goalAmount ? 100 : goalAmount,
      name: "score",
      thresholds: [
        goalAmount * 0.5,
        goalAmount * 0.7,
        goalAmount * 0.9,
        goalAmount * 1,
      ],
    },
    legend: false,
    scale: {
      color: {
        range: ["green", "#FAAD14", "#F4664A", "red"],
      },
    },
    style: {
      textContent: (target, total) => `Current：$ ${target}\nOf：$ ${total}`,
    },
  };
  //HANLDES
  const handleDurationChange = (event) => {
    setSelectedDuration(parseInt(event.target.value, 10));
  };
  return (
    <div className="w-[90%] flex flex-col justify-center items-center bg-slate-50 rounded-2xl shadow-xl mt-2">
      <div className="filters flex items-center justify-center">
        <div className=" w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
          <select
            className="bg-transparent appearance-none w-full pr-4"
            name="DateSelector"
            value={selectedDuration}
            onChange={handleDurationChange}
          >
            <option value={2}>Yesterday</option>
            <option value={7}>Las week</option>
            <option value={15}>Las 15 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <div className="filterIconContainer absolute right-[0px] pointer-events-none">
            <CategoIcon type={"MdOutlineArrowDownward"} siz={12} />
          </div>
        </div>
      </div>
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
          <p className="goalFauge-p-des font-normal">{indBud.name}</p>
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

export default GoalGaugeRange;
