"use client";

import React from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import ColumnChartAntComparative from "../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import { generatePropForBudgetMonthlyChart } from "./propsForBudgetMonthlyChart";

// One row per Budget: a compliance headline (X of Y months met) plus a
// grouped-bar chart (Actual vs. Goal, one pair per month) using the same
// Ant Design Column chart component the rest of History uses - real
// interactive tooltips, full-width responsive bars, instead of a
// hand-rolled div strip. The whole row opens a full month-by-month detail
// modal on click.
function BudgetHistoricalComparativeRow({ row, walletPrimaryCurrency, onOpenDetail }) {
  const { budget, monthlySeries, monthsTracked, monthsMet, monthsEstimated, complianceRate } = row;
  const pct = Math.round((complianceRate || 0) * 100);
  const pctColor = pct >= 70 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-600";

  let defaultCate = budget.category;
  if (budget.subCategory) defaultCate = budget.subCategory;

  const chartProps = generatePropForBudgetMonthlyChart({ monthlySeries, walletPrimaryCurrency });

  return (
    <div
      className="bg-white rounded-2xl p-3 w-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpenDetail(row)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetail(row);
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: defaultCate?.color || "#DADADA" }}
            className="rounded-full w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center border-2 border-white shadow-sm shrink-0"
          >
            <UniversalCategoIcon type={defaultCate?.icon || "md/MdCategory"} siz={18} />
          </div>
          <div className="flex flex-col">
            <p className="text-purple-800 hover:underline">{budget.name || "Unnamed budget"}</p>
            <p className="text-[10px] text-gray-500">
              {monthsMet} of {monthsTracked} months met
              {monthsEstimated > 0 && (
                <span
                  className="text-gray-400 cursor-help"
                  title={`${monthsEstimated} of these month${
                    monthsEstimated === 1 ? "" : "s"
                  } predate this budget's earliest known goal, so they're compared against that earliest goal as an estimate, not a verified historical figure.`}
                >
                  {" "}
                  · {monthsEstimated} estimated
                </span>
              )}
            </p>
          </div>
        </div>
        <p className={`text-sm font-bold ${pctColor}`}>{pct}% compliance</p>
      </div>
      <div className="w-full" style={{ height: 200 }}>
        <ColumnChartAntComparative {...chartProps} />
      </div>
    </div>
  );
}

export default BudgetHistoricalComparativeRow;
