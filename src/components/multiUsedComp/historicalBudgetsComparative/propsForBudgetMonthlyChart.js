import { getBudgetBarColor } from "@/helpers/transformers/budgetHistory";
import { formatMoneyMajor } from "@/lib/money/currencies";

const GOAL_COLOR = "#D1D5DB"; // neutral reference bar - never color-coded, it's not a result

// Turns one budget's monthlySeries into the grouped-bar shape
// ColumnChartAntComparative expects: two bars per month ("Actual",
// colored by met/exceeded and dimmed when estimated; "Goal", a flat
// neutral reference) - this way a per-month goal that changed over time
// still reads correctly, since each month draws its own goal bar instead
// of relying on one shared reference line.
export function generatePropForBudgetMonthlyChart({ monthlySeries, walletPrimaryCurrency = "MXN" }) {
  const data = monthlySeries.flatMap((m) => {
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
        fill: ({ color }) => color,
        fillOpacity: ({ fillOpacity }) => fillOpacity,
        inset: 0.2,
      },
      label: false,
      legend: {
        color: {
          itemMarkerFill: (datum) => (datum?.id === "Actual" ? "#94A3B8" : GOAL_COLOR),
        },
      },
      interaction: {
        tooltip: {
          render: (e, { items, title }) => {
            // items[].origin isn't a documented/verified shape in this
            // chart library version - look the month up from the closed-
            // over monthlySeries instead of trusting undocumented tooltip
            // item internals for the met/estimated flags.
            const monthData = monthlySeries.find((m) => m.label === title);
            const actual = items.find((it) => it.name === "Actual");
            const goal = items.find((it) => it.name === "Goal");
            return (
              <div
                className="max-w-[240px] flex gap-1 flex-col items-center justify-center rounded-lg p-2 font-sans"
                key={title}
              >
                <h1 className="text-sm text-center font-bold">{String(title)}</h1>
                <p className="text-xs">
                  Actual: <b>{formatMoneyMajor(actual?.value ?? monthData?.actual ?? 0, walletPrimaryCurrency)}</b>
                </p>
                <p className="text-xs">
                  Goal: <b>{formatMoneyMajor(goal?.value ?? monthData?.goal ?? 0, walletPrimaryCurrency)}</b>
                </p>
                {monthData && (
                  <p className={`text-xs font-semibold ${monthData.met ? "text-green-600" : "text-red-600"}`}>
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
