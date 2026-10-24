import type { TranslateFn } from "@gastify/core/i18n/translate";
import React from "react";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { MonthlyBudgetSeriesItem } from "@/helpers/transformers/budgetHistoricalComparative";
import type { ComparativeColumnOptions } from "@/components/multiUsedComp/chartsComponents/comparativeColumnChart/ComparativeColumnChart";

const GOAL_COLOR = "#D1D5DB"; // neutral reference bar - never color-coded, it's not a result

export interface BudgetMonthlyChartDatum {
  type: string;
  transactionType: "Actual" | "Goal" | string;
  value: number;
  color: string;
  fillOpacity: number;
  met: boolean | null;
  estimated: boolean;
  [key: string]: unknown;
}

export interface BudgetMonthlyChartProps {
  data: BudgetMonthlyChartDatum[];
  totalValue: string;
  propPlus: ComparativeColumnOptions;
}

export interface GeneratePropForBudgetMonthlyChartParams {
  t: TranslateFn;
  monthlySeries: MonthlyBudgetSeriesItem[];
  walletPrimaryCurrency?: string;
}

// Turns one budget's monthlySeries into the grouped-bar shape
// ComparativeColumnChart expects: two bars per month ("Actual",
// colored by met/exceeded and dimmed when estimated; "Goal", a flat
// neutral reference) - this way a per-month goal that changed over time
// still reads correctly, since each month draws its own goal bar instead
// of relying on one shared reference line.
export function generatePropForBudgetMonthlyChart({
  monthlySeries,
  walletPrimaryCurrency = "MXN",
  t,
}: GeneratePropForBudgetMonthlyChartParams): BudgetMonthlyChartProps {
  const data: BudgetMonthlyChartDatum[] = monthlySeries.flatMap((m) => {
    const ratio = m.goal > 0 ? m.actual / m.goal : m.actual > 0 ? 1.5 : 0;
    return [
      {
        type: m.label,
        transactionType: "Actual",
        value: m.actual,
        color: getBudgetBarColor(ratio, false),
        fillOpacity: m.estimated ? 0.5 : 1,
        met: m.met,
        estimated: m.estimated,
      },
      {
        type: m.label,
        transactionType: "Goal",
        value: m.goal,
        color: GOAL_COLOR,
        fillOpacity: 1,
        met: null,
        estimated: m.estimated,
      },
    ];
  });

  return {
    data,
    totalValue: "",
    propPlus: {
      mode: "grouped",
      label: false,
      height: 170,
      legend: [
        { id: "Actual", label: t("budgets.comparative.actual"), color: "#94A3B8" },
        { id: "Goal", label: t("budgets.comparative.goal"), color: GOAL_COLOR },
      ],
      valueFormat: (value) => formatMoneyMajor(value, walletPrimaryCurrency),
      renderTooltip: ({ title, items }) => {
        const monthData = monthlySeries.find((m) => m.label === title);
        const actual = items.find((it) => it.transactionType === "Actual");
        const goal = items.find((it) => it.transactionType === "Goal");
        return (
          <div
            className="max-w-[240px] gf-glass-chip text-gf-text flex gap-1.5 flex-col items-center justify-center rounded-2xl p-3 font-sans"
            key={title}
          >
            <h1 className="text-sm text-center font-bold">{String(title)}</h1>
            <div className="w-full flex items-center justify-between gap-3 text-xs">
              <span className="text-gf-text-muted">{t("budgets.actualLabel")}</span>
              <b>{formatMoneyMajor(actual?.value ?? monthData?.actual ?? 0, walletPrimaryCurrency)}</b>
            </div>
            <div className="w-full flex items-center justify-between gap-3 text-xs">
              <span className="text-gf-text-muted">{t("budgets.goalLabel")}</span>
              <b>{formatMoneyMajor(goal?.value ?? monthData?.goal ?? 0, walletPrimaryCurrency)}</b>
            </div>
            {monthData && (
              <p className={`text-xs font-semibold ${monthData.met ? "text-green-400" : "text-red-400"}`}>
                {monthData.met ? "Met" : "Exceeded"}
                {monthData.estimated ? " (estimated goal)" : ""}
              </p>
            )}
          </div>
        );
      },
    },
  };
}
