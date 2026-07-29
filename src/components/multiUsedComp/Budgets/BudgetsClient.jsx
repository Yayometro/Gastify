"use client";

import React, { useMemo, useState } from "react";
import { Skeleton } from "antd";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { matchBillToBudget } from "@/helpers/transformers/projectionsChange";
import CategoIcon from "../CategoIcon";
import EmptyModule from "../EmptyModule";
import BudgetBarRow from "./BudgetBarRow";
import BudgetEditModal from "./BudgetEditModal";

function BudgetsClient({ mcSession }) {
  const { transacciones, budgets, user, wallet, loading } = useGetDataFromProvider();
  const [selectedDuration, setSelectedDuration] = useState(30);
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
    const dayRange = new Date();
    dayRange.setDate(dayRange.getDate() - selectedDuration);
    return (transacciones || []).filter((tra) => {
      if (!tra.isBill) return false;
      const transactionDate = new Date(tra.date || tra.createdAt);
      return transactionDate >= dayRange;
    });
  }, [transacciones, selectedDuration]);

  const actualByBudgetId = useMemo(() => {
    const map = {};
    spendingBudgets.forEach((budget) => {
      const matched = recentBills.filter((bill) => matchBillToBudget(bill, budget));
      map[budget._id] = matched.reduce((acc, bill) => acc + (bill.amount || 0), 0);
    });
    return map;
  }, [spendingBudgets, recentBills]);

  const handleDurationChange = (e) => {
    setSelectedDuration(parseInt(e.target.value, 10));
  };

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
          <div className="w-fit text-[10px] font-light flex items-center justify-center bg-white rounded-2xl px-3 py-1 relative">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              name="DateSelector"
              value={selectedDuration}
              onChange={handleDurationChange}
            >
              <option value={2}>Yesterday</option>
              <option value={7}>Last week</option>
              <option value={15}>Last 15 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <div className="filterIconContainer absolute right-[8px] pointer-events-none">
              <CategoIcon type={"MdOutlineArrowDownward"} siz={12} />
            </div>
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
