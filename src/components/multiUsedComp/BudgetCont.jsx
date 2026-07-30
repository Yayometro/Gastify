import React, { useEffect, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";
import { useDispatch, useSelector } from "react-redux";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import { fetchBudget } from "@/lib/features/budgetSlice";
import BudgetBarRow from "./Budgets/BudgetBarRow";
import BudgetEditModal from "./Budgets/BudgetEditModal";
import { matchBillToBudget } from "@/helpers/transformers/projectionsChange";
import { getLastDayOfMonth, generate_timeperiod_ranges_array_for_dashboard } from "@/helpers/timeFunctions/timeFunctions";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";

const initialToday = new Date();

function BudgetCont({ bWallet, bTransactions, bBudgets, bcSession }) {
  let [startDate, setStartDate] = useState(new Date(initialToday.getFullYear(), initialToday.getMonth(), 1));
  let [endDate, setEndDate] = useState(getLastDayOfMonth(initialToday.getFullYear(), initialToday.getMonth()));
  let [bills, setBills] = useState([]);
  let [savings, setSavings] = useState([]);
  let [budgets, setBudgets] = useState([]);
  let [today, setToday] = useState(new Date());
  let [isBudget, setIsBudget] = useState(true);
  const [loadingComponent, setLoadingComponent] = useState(true);
  const [editingBudget, setEditingBudget] = useState(null);
  //REDUX
  const dispatch = useDispatch();
  const ccBudget = useSelector((state) => state.budgetReducer)
  const ccTrans = useSelector((state) => state.transacctionsReducer);
  //
  const bcBudget = ccBudget.data;
  const bcTrans = ccTrans.data;
  // USE EFFECTS
  useEffect(() => {
    if(ccBudget.status == 'idle'){
      dispatch(fetchBudget(bcSession))
    }
    if(ccTrans.status == 'idle'){
      dispatch(fetchTrans(bcSession))
    }
  }, [])
  //
  useEffect(() => {
    if (!startDate || !endDate) return;
    if ( bcTrans.length > 0 & bcBudget.length > 0) {
      setLoadingComponent(false)
    //SET TIME TRANSACTIONS
    let total = bcTrans.filter((tra) => tra.isReadable == true);
    total = bcTrans.filter((tra) => {
      const transactionDate = new Date(tra.date || tra.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    //BILLS
    const tempBills = total.filter((tra) => tra.isBill == true);
    setBills(tempBills);
    // SAVINGS
    let tempSaving = bcBudget.filter((budg) => budg.isSaving == true && !budg.archived);
    setSavings(tempSaving);
    // BUDGETS
    let tempBudget = bcBudget.filter((budg) => budg.isSaving !== true && !budg.archived);
    setBudgets(tempBudget);
    }
  }, [startDate, endDate, ccTrans, ccBudget]);
  const handleTab = (budType) => {
    if (budType === "budget") {
      setIsBudget(true);
    } else {
      setIsBudget(false);
    }
  };
  const handleRangeDate = (sDate, eDate) => {
    if (sDate) setStartDate(sDate);
    if (eDate) setEndDate(eDate);
  };
  function getValueFromSelecter(v) {
    if (!v || !v.includes("*")) return;
    const [start, end] = v.split("*");
    setStartDate(new Date(start));
    setEndDate(new Date(end));
  }
  return (
    <div className="budget-cont py-4 px-2 w-full lg:w-screen lg:max-w-[1200px] lg:relative lg:left-1/2 lg:-translate-x-1/2">
      <div className="wallet-budget-Content">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Wallet Budgets
        </h1>
      </div>
      <div className="filters flex items-center justify-center gap-2">
        <SelecterFilter
          getValue={getValueFromSelecter}
          periodOverride={generate_timeperiod_ranges_array_for_dashboard(initialToday.getFullYear())}
          styles="bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
        />
        <TimeRange rpDate={handleRangeDate} rpResponse={""} />
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
          <div className="ind-budget-cont-slide flex flex-col gap-2 max-h-[400px] overflow-y-auto pb-2 px-1">
            {savings.map((saving, index) => (
              <BudgetBarRow
                budget={saving}
                onClick={setEditingBudget}
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
          <div className="ind-budget-cont-slide flex flex-col gap-2 max-h-[400px] overflow-y-auto pb-2 px-1">
            {budgets.map((budget, index) => (
              <BudgetBarRow
                budget={budget}
                actual={bills
                  .filter((bill) => matchBillToBudget(bill, budget))
                  .reduce((acc, bill) => acc + (bill.amount || 0), 0)}
                onClick={setEditingBudget}
                key={`budget-goal-key-${index}`}
              />
            ))}
          </div>
        </div>
      )}
      {editingBudget && (
        <BudgetEditModal
          mode="edition"
          budget={editingBudget}
          onClose={() => setEditingBudget(null)}
        />
      )}
    </div>
  );
}

export default BudgetCont;
