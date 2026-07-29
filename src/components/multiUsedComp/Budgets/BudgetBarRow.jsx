"use client";

import React from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";

function BudgetBarRow({ budget, actual, onClick }) {
  const goalAmount = budget.goalAmount || 0;
  const isSaving = budget.isSaving === true;
  const value = isSaving ? budget.savingAmount || 0 : actual || 0;
  const ratio = goalAmount > 0 ? value / goalAmount : 0;
  const color = getBudgetBarColor(ratio, isSaving);
  const widthPct = Math.min(ratio, 1) * 100;

  let defaultCate = budget.category;
  if (budget.subCategory) {
    defaultCate = { ...budget.subCategory, isSub: true };
  }

  return (
    <div
      className="budget-bar-row w-full bg-white rounded-2xl p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(budget)}
    >
      <div className="flex items-center gap-2 mb-2">
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
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>${Number(value).toFixed(2)}</span>
        <span>of ${Number(goalAmount).toFixed(2)}</span>
      </div>
    </div>
  );
}

export default BudgetBarRow;
