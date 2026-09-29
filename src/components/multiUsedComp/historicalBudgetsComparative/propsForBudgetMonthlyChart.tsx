import React from "react";
import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { formatMoneyMajor } from "@/lib/money/currencies";
import type { MonthlyBudgetSeriesItem } from "@/helpers/transformers/budgetHistoricalComparative";

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

export interface BudgetMonthlyChartStyleDatum {
  color?: string;
  fillOpacity?: number;
  [key: string]: unknown;
}

export interface BudgetMonthlyChartLegendDatum {
  id?: string;
  [key: string]: unknown;
}

export interface BudgetMonthlyTooltipItem {
  name?: string;
  value?: number;
  color?: string;
  channel?: unknown;
  [key: string]: unknown;
}

export interface BudgetMonthlyTooltipContext {
  items: BudgetMonthlyTooltipItem[];
  title: string | number;
}

export interface BudgetMonthlyChartPropPlus {
  style: {
    fill: (datum: BudgetMonthlyChartStyleDatum) => string | undefined;
    fillOpacity: (datum: BudgetMonthlyChartStyleDatum) => number | undefined;
    inset: number;
  };
  label: boolean;
  legend: {
    color: {
      itemMarkerFill: (datum: BudgetMonthlyChartLegendDatum) => string;
    };
  };
  interaction: {
    elementHighlight: boolean;
    tooltip: {
      crosshairs: boolean;
      render: (_e: unknown, context: BudgetMonthlyTooltipContext) => React.JSX.Element;
    };
  };
}

export interface BudgetMonthlyChartProps {
  data: BudgetMonthlyChartDatum[];
  totalValue: string;
  propPlus: BudgetMonthlyChartPropPlus;
}

export interface GeneratePropForBudgetMonthlyChartParams {
  monthlySeries: MonthlyBudgetSeriesItem[];
  walletPrimaryCurrency?: string;
}

// Turns one budget's monthlySeries into the grouped-bar shape
// ColumnChartAntComparative expects: two bars per month ("Actual",
// colored by met/exceeded and dimmed when estimated; "Goal", a flat
// neutral reference) - this way a per-month goal that changed over time
// still reads correctly, since each month draws its own goal bar instead
// of relying on one shared reference line.
export function generatePropForBudgetMonthlyChart({
  monthlySeries,
  walletPrimaryCurrency = "MXN",
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
      style: {
        fill: ({ color }: BudgetMonthlyChartStyleDatum) => color,
        fillOpacity: ({ fillOpacity }: BudgetMonthlyChartStyleDatum) => fillOpacity,
        inset: 0.2,
      },
      label: false,
      legend: {
        color: {
          itemMarkerFill: (datum: BudgetMonthlyChartLegendDatum) => (datum?.id === "Actual" ? "#94A3B8" : GOAL_COLOR),
        },
      },
      interaction: {
        // @ant-design/plots' Column chart defaults to
        // `elementHighlight: { background: true }` - a separate interaction
        // from the tooltip's own crosshairs, drawing a shaded rect behind
        // the whole hovered x-category. Off since the tooltip already
        // marks what's active.
        elementHighlight: false,
        tooltip: {
          // Column marks also default to a shaded crosshair rect spanning
          // the hovered x-category's full plot height - a big grey backdrop
          // competing with the tooltip's own glass box. The tooltip itself
          // already marks which month/bar is active, so this is redundant.
          crosshairs: false,
          render: (_e: unknown, { items, title }: BudgetMonthlyTooltipContext): React.JSX.Element => {
            // items[].origin isn't a documented/verified shape in this
            // chart library version - look the month up from the closed-
            // over monthlySeries instead of trusting undocumented tooltip
            // item internals for the met/estimated flags.
            const monthData = monthlySeries.find((m) => m.label === title);
            const actual = items.find((it) => it.name === "Actual");
            const goal = items.find((it) => it.name === "Goal");
            return (
              <div
                className="max-w-[240px] gf-glass-chip text-gf-text flex gap-1.5 flex-col items-center justify-center rounded-2xl p-3 font-sans"
                key={title}
              >
                <h1 className="text-sm text-center font-bold">{String(title)}</h1>
                <div className="w-full flex items-center justify-between gap-3 text-xs">
                  <span className="text-gf-text-muted">Actual:</span>
                  <b>{formatMoneyMajor(actual?.value ?? monthData?.actual ?? 0, walletPrimaryCurrency)}</b>
                </div>
                <div className="w-full flex items-center justify-between gap-3 text-xs">
                  <span className="text-gf-text-muted">Goal:</span>
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
      },
    },
  };
}
