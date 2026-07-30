"use client";

import React from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { getBudgetBarGradient, getBudgetMoodEmoji } from "@/helpers/transformers/budgetHistory";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

function BudgetBarRow({ budget, actual, onClick }) {
  const goalAmount = budget.goalAmount || 0;
  const isSaving = budget.isSaving === true;
  const value = isSaving ? budget.savingAmount || 0 : actual || 0;
  const ratio = goalAmount > 0 ? value / goalAmount : 0;
  const exceeded = !isSaving && value > goalAmount;
  const gradient = getBudgetBarGradient(ratio, isSaving);
  const moodEmoji = getBudgetMoodEmoji(ratio, isSaving);
  const widthPct = Math.min(ratio, 1) * 100;
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

  return (
    <div
      className="budget-bar-row w-full bg-white rounded-2xl p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(budget)}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: defaultCate?.color || "#DADADA" }}
            className="rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center shrink"
          >
            <UniversalCategoIcon type={defaultCate?.icon || "md/MdFilterNone"} siz={18} />
          </div>
          <div className="flex flex-col">
            <p className="text-purple-800">{budget.name || "Unnamed budget"}</p>
            {defaultCate?.name && (
              <p className="text-[10px] text-gray-500">
                {defaultCate.isSub ? "SubCategory: " : "Category: "}
                {defaultCate.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className={`text-sm font-bold ${balanceColor}`}>{balanceText}</p>
          <span className="text-4xl leading-none" title="How this budget is doing">
            {moodEmoji}
          </span>
        </div>
      </div>
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${widthPct}%`, background: gradient }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{usdFormatChanger(value)}</span>
        <span>of {usdFormatChanger(goalAmount)}</span>
      </div>
    </div>
  );
}

export default BudgetBarRow;
