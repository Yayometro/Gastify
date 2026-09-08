"use client";

import React, { useMemo } from "react";
import CategoIcon from "../CategoIcon";
import { usdFormatChanger } from "@/helpers/transformers/transactionsChange";

// Detail view opened from the Planned / Total spent / Unbudgeted summary
// cards on the Budgets page - those three numbers alone don't say WHERE the
// money went, so this breaks each one down: planned vs. actually spent per
// budget (bars), and the unbudgeted total split back out by category.
function SpendingSummaryDetailModal({ close, spendingBudgets, actualByBudgetId, coverage, spendingTotals }) {
  const rows = useMemo(() => {
    return (spendingBudgets || [])
      .map((budget) => {
        const actual = actualByBudgetId?.[budget._id] || 0;
        const goal = budget.goalAmount || 0;
        const ratio = goal > 0 ? actual / goal : 0;
        return { id: budget._id, name: budget.name || "Unnamed budget", actual, goal, ratio };
      })
      .sort((a, b) => b.actual - a.actual);
  }, [spendingBudgets, actualByBudgetId]);

  return (
    <div className="content absolute gf-glass-violet flex flex-col w-[94vw] max-w-[640px] max-h-[85vh] overflow-hidden rounded-3xl z-[1001]">
      <button
        type="button"
        onClick={close}
        className="absolute top-4 right-4 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors"
      >
        <CategoIcon type="MdClose" siz={20} />
      </button>
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white">Spending summary</h1>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="gf-glass-row rounded-2xl p-3 text-center">
            <p className="text-xs gf-text-muted-glass">Planned</p>
            <p className="text-lg font-bold text-white">{usdFormatChanger(spendingTotals.fixed)}</p>
          </div>
          <div className="gf-glass-row rounded-2xl p-3 text-center">
            <p className="text-xs gf-text-muted-glass">Total spent</p>
            <p className="text-lg font-bold text-white">{usdFormatChanger(coverage.totalSpent)}</p>
          </div>
          <div className="gf-glass-warning rounded-2xl p-3 text-center">
            <p className="text-xs text-amber-300">Unbudgeted</p>
            <p className="text-lg font-bold text-amber-300">
              {usdFormatChanger(coverage.unbudgetedSpent)}
              <span className="text-xs font-normal ml-1">· {Math.round(coverage.unbudgetedPercentage)}%</span>
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <p className="text-xs uppercase tracking-wide gf-text-muted-glass mb-2">Planned vs. spent, by budget</p>
        <div className="flex flex-col gap-2 mb-5">
          {rows.length === 0 ? (
            <p className="text-sm gf-text-muted-glass text-center py-4">No spending budgets yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="gf-glass-row rounded-xl p-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-white">{row.name}</span>
                  <span className="gf-text-muted-glass">
                    {usdFormatChanger(row.actual)} / {usdFormatChanger(row.goal)}
                  </span>
                </div>
                <div className="w-full h-2 bg-black/25 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.max(row.ratio * 100, 0), 100)}%`,
                      background: row.ratio > 1 ? "#f87171" : "#a855f7",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        {coverage.groups.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide gf-text-muted-glass mb-2">Unbudgeted, by category</p>
            <div className="flex flex-col gap-2">
              {coverage.groups.map((group) => (
                <div
                  key={group.key}
                  className="flex justify-between items-center gf-glass-row rounded-xl px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    {group.name}
                  </span>
                  <span className="font-semibold text-amber-300 shrink-0">{usdFormatChanger(group.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SpendingSummaryDetailModal;
