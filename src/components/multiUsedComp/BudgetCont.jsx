import React, { useEffect, useState } from "react";
import GoalGaugeRange from "./GoalGaugeRange";
import GoalSavingsRange from "./GoalSavingsRange";
import { Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoIcon from "./CategoIcon";

function BudgetCont({ bWallet, bTransactions, bBudgets }) {
  let [selectedDuration, setSelectedDuration] = useState(30);
  let [bills, setBills] = useState([]);
  let [savings, setSavings] = useState([]);
  let [budgets, setBudgets] = useState([]);
  let [today, setToday] = useState(new Date());
  let [isBudget, setIsBudget] = useState(true);
  useEffect(() => {
    // console.log(bWallet);
    // console.log(bTransactions);
    // console.log(bBudgets);
    let todey = new Date();
    const dayRange = new Date();
    dayRange.setDate(todey.getDate() - selectedDuration);
    // console.log(dayRange);
    // if (bWallet && bTransactions & bBudgets) {
    //SET TIME TRANSACTIONS
    let total = bTransactions.filter((tra) => tra.isReadable == true);
    console.log(total);
    total = bTransactions.filter((tra) => {
      const transactionDate = new Date(tra.date || tra.createdAt);
      return transactionDate >= dayRange;
    });
    // console.log(total);
    //BILLS
    const tempBills = total.filter((tra) => tra.isBill == true);
    setBills(tempBills);
    // console.log(tempBills);
    // SAVINGS
    let tempSaving = bBudgets.filter((budg) => budg.isSaving == true);
    setSavings(tempSaving);
    // console.log(tempSaving);
    // BUDGETS
    let tempBudget = bBudgets.filter((budg) => budg.isSaving !== true);
    setBudgets(tempBudget);
    // console.log(tempBudget);
    // }
  }, [selectedDuration, bWallet, bTransactions, bBudgets]);
  const handleDurationChange = (event) => {
    setSelectedDuration(parseInt(event.target.value, 10));
  };
  const handleTab = (budType) => {
    if (budType === "budget") {
      setIsBudget(true);
    } else {
      setIsBudget(false);
    }
  };
  // console.log(budgets);
  return (
    <div className="budget-cont py-4">
      <div className="wallet-budget-Content">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Wallet Budget's
        </h1>
      </div>
      <div className="filters flex items-center justify-center">
        <div className="w-fit text-[10px] font-light flex items-center justify-center sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short">
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
      <div className="bc-tab-headers-cont w-full text-center flex justify-center items-center gap-2">
        <div
          onClick={() => handleTab("budget")}
          className={`tab-budget p-4 cursor-pointer hover:text-purple-400 ${
            isBudget ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Budgets
        </div>
        <div
          onClick={() => handleTab("")}
          className={`tab-saving p-4 cursor-pointer hover:text-purple-400 ${
            !isBudget ? "border-b-2 border-purple-600 text-purple-600 " : ""
          }`}
        >
          Savings
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
      {savings.length <= 0 ? (
        <p>No savings created...</p>
      ) : (
        <div className={`savings-cont ${!isBudget ? "" : "hidden"}`}>
          <p className="text-xl font-norma text-center">Savings</p>
          <div className="ind-budget-cont-slide flex gap-4 overflow-x-scroll overflow-y-hidden pb-5 pr-5">
            {savings.map((saving) => (
              <GoalSavingsRange ggrSavings={saving} />
            ))}
          </div>
        </div>
      )}
      {budgets.length <= 0 && bills.length <= 0 ? (
        <p>No Budgets created...</p>
      ) : (
        <div className={`individual-budget-cont ${!isBudget ? "hidden" : ""}`}>
          <p className="text-xl font-norma text-center">Budget Bills</p>
          <div className="ind-budget-cont-slide flex gap-4 overflow-x-scroll overflow-y-hidden pb-5 pr-5">
            {budgets.map((budget) => (
              <GoalGaugeRange indBud={budget} indBills={bills} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetCont;
