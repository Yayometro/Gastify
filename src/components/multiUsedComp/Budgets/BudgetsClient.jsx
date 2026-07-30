"use client";

import React, { useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { matchBillToBudget } from "@/helpers/transformers/projectionsChange";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { getLastDayOfMonth, generate_timeperiod_ranges_array_for_dashboard } from "@/helpers/timeFunctions/timeFunctions";
import CategoIcon from "../CategoIcon";
import UniversalCategoIcon from "../UniversalCategoIcon";
import EmptyModule from "../EmptyModule";
import SelecterFilter from "@/components/Filters/selecterFilter/SelecterFilter";
import TimeRange from "@/components/Filters/timeRange/TimeRange";
import BudgetBarRow from "./BudgetBarRow";
import BudgetEditModal from "./BudgetEditModal";

const today = new Date();

function BudgetsClient({ mcSession }) {
  const { transacciones, budgets, user, wallet, loading } = useGetDataFromProvider();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState(getLastDayOfMonth(today.getFullYear(), today.getMonth()));
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalMode, setModalMode] = useState(null); // "creation" | "edition" | null

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

  const recentBills = useMemo(() => {
    if (!startDate || !endDate) return [];
    return (transacciones || []).filter((tra) => {
      if (!tra.isBill) return false;
      const transactionDate = new Date(tra.date || tra.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transacciones, startDate, endDate]);

  const actualByBudgetId = useMemo(() => {
    const map = {};
    spendingBudgets.forEach((budget) => {
      const matched = recentBills.filter((bill) => matchBillToBudget(bill, budget));
      map[budget._id] = matched.reduce((acc, bill) => acc + (bill.amount || 0), 0);
    });
    return map;
  }, [spendingBudgets, recentBills]);

  const spendingTotals = useMemo(() => {
    const fixed = spendingBudgets.reduce((acc, b) => acc + (b.goalAmount || 0), 0);
    const real = spendingBudgets.reduce((acc, b) => acc + (actualByBudgetId[b._id] || 0), 0);
    return { fixed, real };
  }, [spendingBudgets, actualByBudgetId]);

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

  const openCreate = () => {
    setEditingBudget({ user: user?._id, wallet: wallet?._id });
    setModalMode("creation");
  };
  const openEdit = (budget) => {
    setEditingBudget(budget);
    setModalMode("edition");
  };
  const closeModal = () => {
    setEditingBudget(null);
    setModalMode(null);
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
            <SelecterFilter
              getValue={getValueFromSelecter}
              periodOverride={generate_timeperiod_ranges_array_for_dashboard(today.getFullYear())}
              styles="bg-white text-black w-fit text-[10px] font-light flex items-center justify-center rounded-2xl px-[4px] sm:font-base sm:font-extralight active:border-0 hover:border-0 outline-none active:outline-none ring-offset-0 relative pulse-animation-short min-[400px]:py-[2px] min-[640px]:py-[4px]"
            />
            <TimeRange rpDate={handleRangeDate} rpResponse={""} />
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
            {spendingBudgets.length > 0 && (
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-purple-100 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total fixed (budgeted)</p>
                  <p className="text-lg text-purple-800 font-bold">{usdFormatChanger(spendingTotals.fixed)}</p>
                </div>
                <div className="flex-1 bg-purple-100 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Total real (spent)</p>
                  <p className="text-lg text-purple-800 font-bold">{usdFormatChanger(spendingTotals.real)}</p>
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
                    onClick={openEdit}
                  />
                ))}
              </div>
            )}

            <h2 className="text-xl text-purple-800 mb-2">Savings</h2>
            {savingBudgets.length <= 0 ? (
              <EmptyModule emMessage="No savings budgets yet. Create one 🤓" />
            ) : (
              <div className="flex flex-col gap-2">
                {savingBudgets.map((budget) => (
                  <BudgetBarRow key={budget._id} budget={budget} onClick={openEdit} />
                ))}
              </div>
            )}
          </>
        )}

        {modalMode && (
          <BudgetEditModal
            mode={modalMode}
            budget={editingBudget}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
}

export default BudgetsClient;
