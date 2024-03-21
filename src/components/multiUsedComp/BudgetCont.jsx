import React, { useEffect, useState } from "react";
import GoalGaugeRange from "./GoalGaugeRange";
import GoalSavingsRange from "./GoalSavingsRange";
import { Skeleton, Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoIcon from "./CategoIcon";
import EmptyModule from "./EmptyModule";
import { useDispatch, useSelector } from "react-redux";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import { fetchBudget } from "@/lib/features/budgetSlice";
import RangePicker from "./RangePicker";

function BudgetCont({ bWallet, bTransactions, bBudgets, bcSession }) {
  let [selectedDuration, setSelectedDuration] = useState(30);
  let [startDate, setStartDate] = useState(null);
  let [endDate, setEndDate] = useState(null);
  let [bills, setBills] = useState([]);
  let [savings, setSavings] = useState([]);
  let [budgets, setBudgets] = useState([]);
  let [today, setToday] = useState(new Date());
  let [isBudget, setIsBudget] = useState(true);
  const [loadingComponent, setLoadingComponent] = useState(true);
  //REDUX
  const dispatch = useDispatch();
  const ccBudget = useSelector((state) => state.budgetReducer)
  const ccTrans = useSelector((state) => state.transacctionsReducer);
  //
  const bcBudget = ccBudget.data;
  const bcTrans = ccTrans.data;
  // console.log(bcBudget)
  // console.log(bcTrans)
  // USE EFFECTS
  useEffect(() => {
    if(ccBudget.status == 'idle'){
      // console.log('first')
      dispatch(fetchBudget(bcSession))
    }
    if(ccTrans.status == 'idle'){
      // console.log('first')
      dispatch(fetchTrans(bcSession))
    }
  }, [])
  //
  useEffect(() => {
    // console.log(bWallet);
    // console.log(bTransactions);
    // console.log(bBudgets);
    let todey = new Date();
    const dayRange = new Date();
    dayRange.setDate(todey.getDate() - selectedDuration);
    // console.log(dayRange);
    if ( bcTrans.length > 0 & bcBudget.length > 0) {
      setLoadingComponent(false)
      // console.log(bcTrans)
      // console.log(bcBudget)
    //SET TIME TRANSACTIONS
    let total = bcTrans.filter((tra) => tra.isReadable == true);
    // console.log(total);
    total = bcTrans.filter((tra) => {
      const transactionDate = new Date(tra.date || tra.createdAt);
      return transactionDate >= dayRange;
    });
    // console.log(total);
    //BILLS
    const tempBills = total.filter((tra) => tra.isBill == true);
    setBills(tempBills);
    // console.log(tempBills);
    // SAVINGS
    let tempSaving = bcBudget.filter((budg) => budg.isSaving == true);
    setSavings(tempSaving);
    // console.log(tempSaving);
    // BUDGETS
    let tempBudget = bcBudget.filter((budg) => budg.isSaving !== true);
    setBudgets(tempBudget);
    // console.log(tempBudget);
    }
  }, [selectedDuration, ccTrans, ccBudget]);
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
  const handleRangeDate = (sDate, eDate) => {
    setStartDate(sDate);
    setEndDate(eDate);
  };
  // console.log(budgets);
  return (
    <div className="budget-cont py-4 px-2">
      <div className="wallet-budget-Content">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Wallet Budgets
        </h1>
      </div>
      <div className="filters flex flex-col items-center justify-center">
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
        <RangePicker rpDate={handleRangeDate} rpResponse={""} />
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
        <Tooltip title="Filter by time to see your current progress in a specific time period. As well as change between tabs to see progress in Budgets or Savings. 🤓">
          <div className="">
            <UniversalCategoIcon
              type={`${"fa/FaRegQuestionCircle"}`}
              siz={15}
            />
          </div>
        </Tooltip>
      </div>
      {loadingComponent ? (
        <div className="w-full h-full flex justify-center items-center py-2">
          <Skeleton active />
        </div>
      ) : savings.length <= 0 ? (
        <div className="w-full py-6">
          <EmptyModule
            emMessage={`No saving found. Please refresh or create a new budget 🤓`}
          />
        </div>
      ) : (
        <div className={`savings-cont ${!isBudget ? "" : "hidden"}`}>
          <p className="text-xl font-norma text-center">Savings</p>
          <div className="ind-budget-cont-slide flex gap-4 overflow-x-scroll overflow-y-hidden pb-5 pr-5">
            {savings.map((saving, index) => (
              <GoalSavingsRange
                ggrSavings={saving}
                key={`saving-goal-key-${index}`}
              />
            ))}
          </div>
        </div>
      )}
      {loadingComponent ? (
        <div className="w-full h-full flex justify-center items-center py-2">
          <Skeleton active />
        </div>
      ) : budgets.length <= 0 && bills.length <= 0 ? (
        <div className="w-full py-6">
          <EmptyModule
            emMessage={`No budget found. Please refresh or create a new budget 🤓`}
          />
        </div>
      ) : (
        <div className={`individual-budget-cont ${!isBudget ? "hidden" : ""}`}>
          <p className="text-xl font-norma text-center">Budget Bills</p>
          <div className="ind-budget-cont-slide flex gap-4 overflow-x-scroll overflow-y-hidden pb-5 pr-5">
            {budgets.map((budget, index) => (
              <GoalGaugeRange
                indBud={budget}
                indBills={bills}
                key={`budget-goal-key-${index}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetCont;
