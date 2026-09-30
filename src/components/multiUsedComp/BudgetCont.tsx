import React, { useEffect, useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import UniversalCategoIcon from "./UniversalCategoIcon";
import EmptyModule from "./EmptyModule";
import { useDispatch, useSelector } from "react-redux";
import { fetchTrans, TransactionData } from "@/lib/features/transacctionsSlice";
import { fetchBudget, BudgetData } from "@/lib/features/budgetSlice";
import BudgetBarRow from "./Budgets/BudgetBarRow";
import BudgetEditModal, { BudgetModalItem } from "./Budgets/BudgetEditModal";
import BudgetDetailModal, { BudgetDetailItem, BudgetDetailTransactionItem } from "./Budgets/BudgetDetailModal";
import ProjectBudgetDetailModal, { ProjectBudgetItem, ProjectBudgetTransactionItem } from "./Budgets/ProjectBudgetDetailModal";
import { getBudgetActualSpend } from "@/helpers/transformers/projectionsChange";
import { getLastDayOfMonth, generate_timeperiod_ranges_array_for_dashboard } from "@/helpers/timeFunctions/timeFunctions";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import { getBudgetCoverage } from "@/helpers/transformers/budgetCoverage";
import { UnbudgetedSpendingCard } from "./Budgets/UnbudgetedSpending";
import { useRouter } from "next/navigation";
import { getExplicitBudgetId, isProjectBudget, isSavingBudget, isSpendingBudget } from "@/helpers/transformers/budgetTypes";
import { RootState, AppDispatch } from "@/lib/store";

export interface BudgetContProps {
  bWallet?: unknown;
  bTransactions?: unknown;
  bBudgets?: unknown;
  bcSession?: string | null | unknown;
}

const initialToday = new Date();

function BudgetCont({
  bcSession,
}: BudgetContProps): React.JSX.Element {
  const router = useRouter();
  const [startDate, setStartDate] = useState(new Date(initialToday.getFullYear(), initialToday.getMonth(), 1));
  const [endDate, setEndDate] = useState(getLastDayOfMonth(initialToday.getFullYear(), initialToday.getMonth()));
  const [bills, setBills] = useState<TransactionData[]>([]);
  const [savings, setSavings] = useState<BudgetData[]>([]);
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [projects, setProjects] = useState<BudgetData[]>([]);
  const [isBudget, setIsBudget] = useState(true);
  const [loadingComponent, setLoadingComponent] = useState(true);
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);
  const [selectedDetailBudget, setSelectedDetailBudget] = useState<BudgetData | null>(null);
  const [returnToDetailBudget, setReturnToDetailBudget] = useState<BudgetData | null>(null);
  //REDUX
  const dispatch = useDispatch<AppDispatch>();
  const ccBudget = useSelector((state: RootState) => state.budgetReducer);
  const ccTrans = useSelector((state: RootState) => state.transacctionsReducer);
  //
  const bcBudget = ccBudget.data;
  const bcTrans = ccTrans.data;
  const coverage = useMemo(
    () => getBudgetCoverage({ transactions: bcTrans, budgets: [...budgets, ...projects], startDate, endDate }),
    [bcTrans, budgets, projects, startDate, endDate]
  );
  // USE EFFECTS
  useEffect(() => {
    if(ccBudget.status == 'idle'){
      dispatch(fetchBudget(bcSession as unknown as Parameters<typeof fetchBudget>[0]))
    }
    if(ccTrans.status == 'idle'){
      dispatch(fetchTrans(bcSession as unknown as Parameters<typeof fetchTrans>[0]))
    }
  }, [])
  //
  useEffect(() => {
    if (!startDate || !endDate) return;
    if (((bcTrans.length > 0 as unknown as number) & (bcBudget.length > 0 as unknown as number))) {
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
    const tempSaving = bcBudget.filter((budg) => isSavingBudget(budg) && !budg.archived);
    setSavings(tempSaving);
    // BUDGETS
    const tempBudget = bcBudget.filter((budg) => isSpendingBudget(budg) && !budg.archived);
    setBudgets(tempBudget);
    setProjects(bcBudget.filter((budg) => isProjectBudget(budg) && !budg.archived));
    }
  }, [startDate, endDate, ccTrans, ccBudget]);
  const handleTab = (budType: string) => {
    if (budType === "budget") {
      setIsBudget(true);
    } else {
      setIsBudget(false);
    }
  };
  const handleRangeDate = (sDate: Date | null, eDate: Date | null) => {
    if (sDate) setStartDate(sDate);
    if (eDate) setEndDate(eDate);
  };
  function getValueFromSelecter(v?: string | null) {
    if (!v || !v.includes("*")) return;
    const [start, end] = v.split("*");
    setStartDate(new Date(start));
    setEndDate(new Date(end));
  }
  const openDetail = (budget: BudgetData) => {
    setSelectedDetailBudget(budget);
  };
  const openEditFromDetail = (budget: BudgetData) => {
    setSelectedDetailBudget(null);
    setReturnToDetailBudget(budget);
    setEditingBudget(budget);
  };
  const closeModal = () => {
    setEditingBudget(null);
    setReturnToDetailBudget(null);
  };
  const handleBackToDetail = () => {
    const b = returnToDetailBudget;
    closeModal();
    if (b) {
      setSelectedDetailBudget(b);
    }
  };
  const handleResetFilters = () => {
    const y = initialToday.getFullYear();
    const m = initialToday.getMonth();
    setStartDate(new Date(y, m, 1));
    setEndDate(getLastDayOfMonth(y, m));
  };

  return (
    <div className="budget-cont gf-glass-card py-4 px-2 w-full max-w-[1200px] mx-auto rounded-[32px]">
      <div className="wallet-budget-Content">
        <h1 className="wallet-budget-title text-2xl text-center font-bold">
          Wallet Budgets
        </h1>
      </div>
      <div className="filters flex items-center justify-center gap-2 flex-wrap my-2">
        <SelecterFilter
          getValue={getValueFromSelecter}
          periodOverride={generate_timeperiod_ranges_array_for_dashboard(initialToday.getFullYear())}
          styles="gf-glass-card text-gf-text w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
        />
        <TimeRange rpDate={handleRangeDate} rpResponse={""} />
        <Tooltip title="Click to return time to current month 🤓">
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 gf-glass-card hover:brightness-110 text-purple-100 rounded-full px-3 py-1 text-xs font-medium transition-[filter] cursor-pointer"
          >
            <UniversalCategoIcon type="md/MdRefresh" siz={15} />
            <span>Reset</span>
          </button>
        </Tooltip>
      </div>
      <div className="bc-tab-headers-cont w-full text-center flex justify-center items-center gap-2 mb-2">
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
          <div className="ind-budget-cont-slide flex flex-col gap-2 max-h-[700px] overflow-y-auto pb-2 px-1">
            {savings.map((saving, index) => (
              <BudgetBarRow
                budget={saving}
                onClick={openDetail}
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
          <div className="ind-budget-cont-slide flex flex-col gap-2 max-h-[700px] overflow-y-auto pb-2 px-1">
            {budgets.map((budget, index) => (
              <BudgetBarRow
                budget={budget}
                actual={getBudgetActualSpend(budget, bcTrans, startDate, endDate)}
                onClick={openDetail}
                key={`budget-goal-key-${index}`}
              />
            ))}
            <UnbudgetedSpendingCard
              coverage={coverage}
              compact
              onClick={() => router.push("/dashboard/budgets")}
            />
            {projects.length > 0 && <><p className="text-lg text-purple-300 text-center mt-4">Projects</p>{projects.map((project) => {
              const actual = bcTrans.filter((transaction) => getExplicitBudgetId(transaction) === String(project._id) && transaction.isBill && !transaction.isIncome).reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
              return <BudgetBarRow key={`project-${project._id}`} budget={project} actual={actual} onClick={openDetail} />;
            })}</>}
          </div>
        </div>
      )}
      {selectedDetailBudget && isProjectBudget(selectedDetailBudget) ? (
        <ProjectBudgetDetailModal
          budget={selectedDetailBudget as unknown as ProjectBudgetItem}
          transacciones={bcTrans as unknown as ProjectBudgetTransactionItem[]}
          onClose={() => setSelectedDetailBudget(null)}
          onEdit={openEditFromDetail as unknown as (budget: ProjectBudgetItem) => void}
        />
      ) : selectedDetailBudget && (
        <BudgetDetailModal
          budget={selectedDetailBudget as unknown as BudgetDetailItem}
          transacciones={bcTrans as unknown as BudgetDetailTransactionItem[]}
          startDate={startDate}
          endDate={endDate}
          onClose={() => setSelectedDetailBudget(null)}
          onEdit={openEditFromDetail as unknown as (budget: BudgetDetailItem) => void}
        />
      )}
      {editingBudget && (
        <BudgetEditModal
          mode="edition"
          budget={editingBudget as unknown as BudgetModalItem}
          onClose={closeModal}
          onBack={returnToDetailBudget ? handleBackToDetail : null}
        />
      )}
    </div>
  );
}

export default BudgetCont;
