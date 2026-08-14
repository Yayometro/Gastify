"use client";

import React from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { getBudgetBarGradient, getBudgetMoodEmoji, getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";
import { isProjectBudget, isSavingBudget } from "@/helpers/transformers/budgetTypes";

function BudgetBarRow({ budget, actual, onClick }) {
  const goalAmount = budget.goalAmount || 0;
  const isSaving = isSavingBudget(budget);
  const isProject = isProjectBudget(budget);

  let value = 0;
  if (isSaving) {
    if (budget.linkedAccounts && budget.linkedAccounts.length > 0) {
      value = budget.linkedAccounts.reduce(
        (acc, a) => acc + (Number(a.amount) || 0),
        0
      );
    } else {
      value = Math.max(Number(budget.savingAmount) || 0, Number(actual) || 0);
    }
  } else {
    value = Number(actual) || 0;
  }

  const ratio = goalAmount > 0 ? value / goalAmount : 0;
  const exceeded = !isSaving && value > goalAmount;
  const isExceeded = value > goalAmount;
  const gradient = getBudgetBarGradient(ratio, isSaving);
  const barColor = getBudgetBarColor(ratio, isSaving);
  const moodEmoji = getBudgetMoodEmoji(ratio, isSaving);
  const widthPct = Math.min(ratio, 1) * 100;
  const pctNum = Math.round(ratio * 100);
  const balance = goalAmount - value; // spending: positive = remaining, negative = exceeded

  let defaultCate = budget.category;
  if (budget.subCategory) {
    defaultCate = { ...budget.subCategory, isSub: true };
  }

  const balanceText = isSaving
    ? balance <= 0
      ? `Goal reached${balance < 0 ? `, exceeded by ${usdFormatChanger(Math.abs(balance))}` : ""} 🎉`
      : `${usdFormatChanger(balance)} to go`
    : exceeded
      ? `Exceeded by ${usdFormatChanger(Math.abs(balance))}`
      : `${usdFormatChanger(balance)} remaining`;
  const balanceColor = isSaving
    ? balance <= 0
      ? "text-blue-600"
      : "text-gray-400"
    : exceeded
      ? "text-red-600"
      : "text-green-600";

  const periodLabel = isProject
    ? "one-time"
    :
    budget.period === "yearly"
      ? "/year"
      : budget.period === "quarterly"
      ? "/quarter"
      : budget.period === "biannual"
      ? "/6m"
      : "/month";

  return (
    <div
      className="budget-bar-row w-full bg-white rounded-2xl p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(budget)}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isProject ? (
            <div className="rounded-full w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center bg-purple-100 text-purple-700 border-2 border-white shadow-sm shrink-0">
              <UniversalCategoIcon type={budget.icon || "md/MdFlightTakeoff"} siz={18} />
            </div>
          ) : budget.categories && budget.categories.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {budget.categories.slice(0, 3).map((catItem, idx) => {
                const catObj = catItem.subCategory || catItem.category;
                const name = catObj?.name || "Category";
                const color = catObj?.color || "#DADADA";
                const icon = catObj?.icon || null;
                return (
                  <div
                    key={idx}
                    style={{ backgroundColor: color }}
                    className="rounded-full w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center border-2 border-white shadow-sm transition-transform hover:scale-110 shrink-0"
                    title={name}
                  >
                    {icon && <UniversalCategoIcon type={icon} siz={18} />}
                  </div>
                );
              })}
              {budget.categories.length > 3 && (
                <div className="rounded-full w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center bg-purple-100 text-purple-800 text-xs font-bold border-2 border-white shadow-sm shrink-0">
                  +{budget.categories.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{ backgroundColor: defaultCate?.color || "#DADADA" }}
              className="rounded-full w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center border-2 border-white shadow-sm shrink-0"
            >
              <UniversalCategoIcon type={defaultCate?.icon} siz={18} />
            </div>
          )}
          <div className="flex flex-col">
            <p className="text-purple-800">{budget.name || "Unnamed budget"}</p>
            <p className="text-[10px] text-gray-500">
              {isSaving ? "Saving Goal" : isProject ? "Project Budget" : "Spending Budget"} • {periodLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className={`text-sm font-bold ${balanceColor}`}>{balanceText}</p>
          <span className="text-4xl leading-none" title="How this budget is doing">
            {moodEmoji}
          </span>
        </div>
      </div>
      <div className="w-full h-5 bg-gray-200 rounded-full relative my-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(Math.max(ratio * 100, 0), 100)}%`, background: gradient }}
        />
        <div
          style={{
            left: `calc(${Math.min(Math.max(ratio * 100, 0), 100)}% - ${Math.min(Math.max(ratio * 100, 0), 100) * 0.40}px)`,
            borderColor: barColor,
          }}
          className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[12px] font-extrabold shadow-md z-10 border-[3px] ${
            isExceeded
              ? "bg-red-50 text-red-700"
              : "bg-white text-slate-800"
          }`}
          title={isExceeded ? `Exceeded limit/goal! (${pctNum}%)` : `${pctNum}% of goal/limit`}
        >
          <span>{pctNum}%</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{usdFormatChanger(value)}</span>
        <span>
          of {usdFormatChanger(goalAmount)}
          {isProject ? " total" : periodLabel}
        </span>
      </div>
    </div>
  );
}

export default BudgetBarRow;
