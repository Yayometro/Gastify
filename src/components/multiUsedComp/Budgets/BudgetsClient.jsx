"use client";

import React, { useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { getBudgetActualSpend } from "@/helpers/transformers/projectionsChange";
import {
  getBudgetCoverage,
  getUncoveredCatalogCategories,
} from "@/helpers/transformers/budgetCoverage";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { getLastDayOfMonth } from "@/helpers/timeFunctions/timeFunctions";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import EmptyModule from "../EmptyModule";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import BudgetBarRow from "./BudgetBarRow";
import BudgetEditModal from "./BudgetEditModal";
import BudgetDetailModal from "./BudgetDetailModal";
import {
  UnbudgetedSpendingCard,
  UnbudgetedSpendingModal,
} from "./UnbudgetedSpending";

const today = new Date();

function BudgetsClient({ mcSession }) {
  const { transacciones, budgets, categories, user, wallet, loading } = useGetDataFromProvider();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState(getLastDayOfMonth(today.getFullYear(), today.getMonth()));
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedDetailBudget, setSelectedDetailBudget] = useState(null);
  const [returnToDetailBudget, setReturnToDetailBudget] = useState(null);
  const [modalMode, setModalMode] = useState(null); // "creation" | "edition" | null
  const [showUnbudgeted, setShowUnbudgeted] = useState(false);
  const [returnToUnbudgeted, setReturnToUnbudgeted] = useState(false);

  const activeBudgets = useMemo(
    () => (budgets || []).filter((b) => !b.archived),
    [budgets]
  );
  const spendingBudgets = useMemo(
    () => activeBudgets.filter((b) => b.isSaving !== true),
    [activeBudgets]
  );
  const savingBudgets = useMemo(
    () => activeBudgets.filter((b) => b.isSaving === true),
    [activeBudgets]
  );

  const coverage = useMemo(
    () => getBudgetCoverage({ transactions: transacciones, budgets: spendingBudgets, startDate, endDate }),
    [transacciones, spendingBudgets, startDate, endDate]
  );

  const uncoveredCatalogCategories = useMemo(
    () => getUncoveredCatalogCategories(categories, spendingBudgets),
    [categories, spendingBudgets]
  );

  const actualByBudgetId = useMemo(() => {
    const map = {};
    spendingBudgets.forEach((budget) => {
      map[budget._id] = getBudgetActualSpend(budget, transacciones, startDate, endDate);
    });
    return map;
  }, [spendingBudgets, transacciones, startDate, endDate]);

  const spendingTotals = useMemo(() => {
    const fixed = spendingBudgets.reduce((acc, b) => acc + (b.goalAmount || 0), 0);
    return { fixed };
  }, [spendingBudgets]);

  const handleDateChange = (sDate, eDate) => {
    if (sDate) setStartDate(sDate);
    if (eDate) setEndDate(eDate);
  };

  const getBudgetRangeLabel = (start, end) => {
    if (!start || !end) return "";
    const todayDate = new Date();
    const lastMonthDate = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() - 1,
      1
    );

    const isThisMonth =
      start.getFullYear() === todayDate.getFullYear() &&
      start.getMonth() === todayDate.getMonth();

    const isLastMonth =
      start.getFullYear() === lastMonthDate.getFullYear() &&
      start.getMonth() === lastMonthDate.getMonth();

    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let tag = "";
    if (isThisMonth) tag = " (This Month)";
    else if (isLastMonth) tag = " (Last Month)";

    return `${startStr} - ${endStr}${tag}`;
  };

  const openCreate = () => {
    setEditingBudget({ user: user?._id, wallet: wallet?._id });
    setReturnToDetailBudget(null);
    setReturnToUnbudgeted(false);
    setModalMode("creation");
  };
  const openDetail = (budget) => {
    setSelectedDetailBudget(budget);
  };
  const openEdit = (budget) => {
    setSelectedDetailBudget(null);
    setReturnToDetailBudget(null);
    setEditingBudget(budget);
    setModalMode("edition");
  };
  const openEditFromDetail = (budget) => {
    setSelectedDetailBudget(null);
    setReturnToDetailBudget(budget);
    setEditingBudget(budget);
    setModalMode("edition");
  };
  const closeModal = () => {
    setEditingBudget(null);
    setModalMode(null);
    setReturnToDetailBudget(null);
    if (returnToUnbudgeted) setShowUnbudgeted(true);
    setReturnToUnbudgeted(false);
  };
  const handleBackToDetail = () => {
    const b = returnToDetailBudget;
    closeModal();
    if (b) {
      setSelectedDetailBudget(b);
    }
  };
  const handleResetFilters = () => {
    const y = today.getFullYear();
    const m = today.getMonth();
    setStartDate(new Date(y, m, 1));
    setEndDate(getLastDayOfMonth(y, m));
  };

  const categoryEntryFromGroup = (group) => ({
    category: group.category?._id || group.category || "",
    subCategory: group.subCategory?._id || group.subCategory || "",
    name: group.name,
    color: group.color || "#DADADA",
    icon: group.icon || null,
  });

  const openCreateFromUnbudgeted = (group) => {
    setShowUnbudgeted(false);
    setReturnToUnbudgeted(true);
    setReturnToDetailBudget(null);
    setEditingBudget({
      user: user?._id,
      wallet: wallet?._id,
      draftName: group.name,
      draftCategories: [categoryEntryFromGroup(group)],
      referenceSpent: group.amount || 0,
    });
    setModalMode("creation");
  };

  const openAddToBudget = (group, budget) => {
    setShowUnbudgeted(false);
    setReturnToUnbudgeted(true);
    setReturnToDetailBudget(null);
    setEditingBudget({ ...budget, pendingCategory: categoryEntryFromGroup(group) });
    setModalMode("edition");
  };

  return (
    <div className="w-full h-full sm:pr-2 pb-10">
      <div className="w-full profile-img py-[40px] text-center text-white">
        <h1 className="text-3xl min-[400px]:text-[40px] sm:text-[40px] md:text-[60px] font-thin">
          Budgets
        </h1>
      </div>
      <div className="content-profile-cont w-full h-full bg-slate-100 items-center mt-[10px] sm:mt-[20px] rounded-t-[60px] rounded-b-2xl shadow-sm px-4 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="bg-white border border-purple-200 text-purple-900 font-semibold text-xs px-3.5 py-1.5 rounded-2xl shadow-xs flex items-center gap-1.5 select-none"
              title="Time period currently being considered for budgets"
            >
              <UniversalCategoIcon type="fa/FaCalendarAlt" siz={13} />
              <span>{getBudgetRangeLabel(startDate, endDate)}</span>
            </div>
            <TimeRange rpDate={handleDateChange} rpResponse={""} />
            <Tooltip title="Click to return time to current month 🤓">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
              >
                <UniversalCategoIcon type="md/MdRefresh" siz={15} />
                <span>Reset</span>
              </button>
            </Tooltip>
            <Tooltip title="Filter by a preset period or pick a specific range; the left/right arrows jump to the previous/next month. 🤓">
              <div className="text-purple-500">
                <UniversalCategoIcon type={"fa/FaRegQuestionCircle"} siz={15} />
              </div>
            </Tooltip>
          </div>
          <div
            className="flex items-center gap-2 bg-purple-600 text-white rounded-full px-4 py-2 cursor-pointer hover:bg-purple-500"
            onClick={openCreate}
          >
            <CategoIcon type="MdAddCircleOutline" siz={22} />
            <p>New Budget</p>
          </div>
        </div>

        {loading ? (
          <Skeleton active />
        ) : (
          <>
            <h2 className="text-xl text-purple-800 mb-2">Spending budgets</h2>
            {(spendingBudgets.length > 0 || coverage.totalSpent > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div className="flex-1 bg-purple-100 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Planned</p>
                  <p className="text-lg text-purple-800 font-bold">{usdFormatChanger(spendingTotals.fixed)}</p>
                </div>
                <div className="flex-1 bg-purple-100 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total spent</p>
                  <p className="text-lg text-purple-800 font-bold">{usdFormatChanger(coverage.totalSpent)}</p>
                </div>
                <div className="flex-1 bg-amber-100 rounded-2xl p-3 text-center">
                  <p className="text-xs text-amber-700">Unbudgeted</p>
                  <p className="text-lg text-amber-900 font-bold">
                    {usdFormatChanger(coverage.unbudgetedSpent)}
                    <span className="text-xs font-normal ml-1">
                      · {Math.round(coverage.unbudgetedPercentage)}%
                    </span>
                  </p>
                </div>
              </div>
            )}
            {spendingBudgets.length <= 0 ? (
              <EmptyModule emMessage="No spending budgets yet. Create one 🤓" />
            ) : (
              <div className="flex flex-col gap-2 mb-6">
                {spendingBudgets.map((budget) => (
                  <BudgetBarRow
                    key={budget._id}
                    budget={budget}
                    actual={actualByBudgetId[budget._id] || 0}
                    onClick={openDetail}
                  />
                ))}
                <UnbudgetedSpendingCard
                  coverage={coverage}
                  onClick={() => setShowUnbudgeted(true)}
                />
              </div>
            )}

            {spendingBudgets.length <= 0 && coverage.totalSpent > 0 && (
              <div className="mb-6">
                <UnbudgetedSpendingCard
                  coverage={coverage}
                  onClick={() => setShowUnbudgeted(true)}
                />
              </div>
            )}

            <h2 className="text-xl text-purple-800 mb-2">Savings</h2>
            {savingBudgets.length <= 0 ? (
              <EmptyModule emMessage="No savings budgets yet. Create one 🤓" />
            ) : (
              <div className="flex flex-col gap-2">
                {savingBudgets.map((budget) => (
                  <BudgetBarRow key={budget._id} budget={budget} onClick={openDetail} />
                ))}
              </div>
            )}
          </>
        )}

        {selectedDetailBudget && (
          <BudgetDetailModal
            budget={selectedDetailBudget}
            transacciones={transacciones}
            startDate={startDate}
            endDate={endDate}
            onClose={() => setSelectedDetailBudget(null)}
            onEdit={openEditFromDetail}
          />
        )}

        {modalMode && (
          <BudgetEditModal
            mode={modalMode}
            budget={editingBudget}
            onClose={closeModal}
            onBack={returnToDetailBudget ? handleBackToDetail : null}
          />
        )}

        {showUnbudgeted && (
          <UnbudgetedSpendingModal
            coverage={coverage}
            budgets={spendingBudgets}
            uncoveredCatalogCategories={uncoveredCatalogCategories}
            rangeLabel={getBudgetRangeLabel(startDate, endDate)}
            onClose={() => setShowUnbudgeted(false)}
            onCreateBudget={openCreateFromUnbudgeted}
            onAddToBudget={openAddToBudget}
          />
        )}
      </div>
    </div>
  );
}

export default BudgetsClient;
