"use client";

import React from "react";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import { formatMoneyMajor } from "@/lib/money/currencies";

// Full month-by-month breakdown for one Budget, opened by clicking its row
// in the Budgets comparative list. Mirrors the mini bar chart's data
// one-to-one, just laid out as an explicit table instead of bars, for
// anyone who wants the exact numbers rather than the at-a-glance shape.
// Renders its own wrapper/close button (matching BasicModal's other
// content components, e.g. ModalContentTopMonthItem) since passing
// `renderContent` bypasses BasicModal's default chrome entirely.
function BudgetHistoricalDetailModal({ row, walletPrimaryCurrency, close }) {
  const { budget, monthlySeries, monthsTracked, monthsMet } = row;

  return (
    <div className="content absolute bg-slate-100 border-2 border-purple-600 flex flex-col w-full h-full max-w-[640px] max-h-[80%] rounded-2xl items-center overflow-hidden z-[1001]">
      <header className="w-full bg-purple-600 text-white px-6 py-4">
        <p className="text-lg">{budget.name || "Unnamed budget"}</p>
        <p className="text-xs text-white/80">
          {monthlySeries[0]?.label} - {monthlySeries[monthlySeries.length - 1]?.label} ·{" "}
          {monthsMet} of {monthsTracked} months met
        </p>
      </header>
      <div className="w-full flex-1 overflow-y-auto px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-400">
              <th className="text-left font-normal pb-2">Month</th>
              <th className="text-right font-normal pb-2">Actual</th>
              <th className="text-right font-normal pb-2">Goal</th>
              <th className="text-right font-normal pb-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {monthlySeries.map((m) => (
              <tr key={m.label} className="border-t border-gray-200">
                <td className="py-2.5">
                  {m.label}
                  {m.estimated && (
                    <span
                      className="text-gray-400 cursor-help"
                      title="Predates this budget's earliest known goal - compared against that earliest goal as an estimate."
                    >
                      *
                    </span>
                  )}
                </td>
                <td className="text-right py-2.5">{formatMoneyMajor(m.actual, walletPrimaryCurrency)}</td>
                <td className="text-right py-2.5">{formatMoneyMajor(m.goal, walletPrimaryCurrency)}</td>
                <td className={`text-right py-2.5 font-medium ${m.met ? "text-green-600" : "text-red-600"}`}>
                  {m.met ? "Met" : "Exceeded"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {monthlySeries.some((m) => m.estimated) && (
          <p className="text-[10px] text-gray-400 mt-3">
            * Estimated - predates this budget&apos;s earliest known goal, compared against that earliest goal.
          </p>
        )}
      </div>
      <button onClick={close}>
        <div className="close-con absolute top-[0%] right-[0%] border-2 rounded-full bg-slate-50 text-purple-700 m-1 pulse-animation-short z-[100]">
          <CategoIcon type="MdClose" siz={20} />
        </div>
      </button>
    </div>
  );
}

export default BudgetHistoricalDetailModal;
