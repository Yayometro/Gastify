"use client";

import React from "react";
import UniversalCategoIcon from "../UniversalCategoIcon";
import ColumnChartAntComparative from "../chartsComponents/columnChartAntComparative/ColumnChartAntComparative";
import { generatePropForBudgetMonthlyChart } from "./propsForBudgetMonthlyChart";
import type { BudgetHistoricalComparativeRowData } from "@/helpers/transformers/budgetHistoricalComparative";

export interface BudgetCategoryLike {
  color?: string | null;
  icon?: string | null;
  name?: string | null;
  [key: string]: unknown;
}

export interface BudgetHistoricalComparativeRowProps {
  row: BudgetHistoricalComparativeRowData;
  walletPrimaryCurrency?: string;
  onOpenDetail: (row: BudgetHistoricalComparativeRowData) => void;
}



// One row per Budget: a compliance headline (X of Y months met) plus a
// grouped-bar chart (Actual vs. Goal, one pair per month) using the same
// Ant Design Column chart component the rest of History uses - real
// interactive tooltips, full-width responsive bars, instead of a
// hand-rolled div strip. The whole row opens a full month-by-month detail
// modal on click.
function BudgetHistoricalComparativeRow({
  row,
  walletPrimaryCurrency,
  onOpenDetail,
}: BudgetHistoricalComparativeRowProps): React.JSX.Element {
  const { budget, monthlySeries, monthsTracked, monthsMet, monthsEstimated, complianceRate } = row;
  // No month tracked yet (complianceRate null) is "no data", not 0% in red.
  const hasRate = complianceRate !== null && complianceRate !== undefined;
  const pct = Math.round((complianceRate || 0) * 100);
  const pctColor = !hasRate ? "text-gf-text-muted" : pct >= 70 ? "text-green-400" : pct >= 40 ? "text-yellow-400" : "text-red-400";

  let defaultCate = budget.category as BudgetCategoryLike | null | undefined;
  if (budget.subCategory) defaultCate = budget.subCategory as BudgetCategoryLike | null | undefined;

  const chartProps = generatePropForBudgetMonthlyChart({ monthlySeries, walletPrimaryCurrency });

  return (
    <div
      className="gf-glass-row rounded-2xl p-3 w-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpenDetail(row)}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          // Space would otherwise also scroll the page (bug 33).
          e.preventDefault();
          onOpenDetail(row);
        }
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
            <p className="text-purple-300 hover:underline">{budget.name || "Unnamed budget"}</p>
            <p className="text-[10px] text-gf-text-muted">
              {monthsMet} of {monthsTracked} months met
              {monthsEstimated > 0 && (
                <span
                  className="text-gf-text-muted cursor-help"
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
        <p className={`text-sm font-bold ${pctColor}`}>{hasRate ? `${pct}% compliance` : "No data yet"}</p>
      </div>
      <div className="w-full" style={{ height: 200 }}>
        <ColumnChartAntComparative {...chartProps} />
      </div>
    </div>
  );
}

export default BudgetHistoricalComparativeRow;
