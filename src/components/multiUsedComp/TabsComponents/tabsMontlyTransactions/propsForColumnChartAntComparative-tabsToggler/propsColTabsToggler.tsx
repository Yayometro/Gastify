import React from "react";
import AtomicTop from "@/components/multiUsedComp/top3/atomicTop/AtomicTop";
import TooltipForChart, {
  type TooltipForChartItem,
} from "@/components/toltips/tooltipsForCharts/TooltipForChart";
import { formatMoneyMajor } from "@/lib/money/currencies";
import type { ComparativeColumnOptions } from "@/components/multiUsedComp/chartsComponents/comparativeColumnChart/ComparativeColumnChart";

export interface ClickedItem {
  type?: string | number;
  value?: number | string;
  isBill?: boolean | number;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface GeneratePropForChartColAntTogglerTabsOptions {
  data: unknown[][];
  clickedItems: ClickedItem[];
  setClickedItems: React.Dispatch<React.SetStateAction<ClickedItem[]>>;
  totalAmount: number[];
  walletPrimaryCurrency?: string;
}

export const generatePropForChartColAntTogglerTabs = ({
  data,
  clickedItems,
  setClickedItems,
  totalAmount,
  walletPrimaryCurrency = "MXN",
}: GeneratePropForChartColAntTogglerTabsOptions) => {
  return {
    data: data[2],
    totalValue: (
      <div className="w-full flex flex-col justify-center items-center">
        {clickedItems.length <= 0 ? (
          ""
        ) : (
          <div className="w-full flex flex-col justify-center items-center">
            <section className="w-full flex justify-center items-center py-2 gap-4">
              <button
                className=" py-2 px-2 bg-purple-600 rounded-full hover:bg-purple-800 gap-4 text-white"
                onClick={() => setClickedItems([])}
              >
                Clear
              </button>
              <p className=" text-xs">Selected: </p>
            </section>
            <div className="w-full grid grid-cols-2 items-center gap-2 min-[452px]:flex min-[452px]:justify-start min-[452px]:flex-wrap">
              {clickedItems.map((item, index) => (
                <AtomicTop
                  key={(item.type as string) + (item.value as number) + (item.isBill as boolean) + index}
                  index={index}
                  color={item.color}
                  icon={item.icon}
                  name={String(item.type).toUpperCase()}
                  isBill={item.isBill ? true : false}
                  value={item.value as number | string}
                  fatherStyle={
                    "flex relative justify-between gap-1 items-center flex-1 rounded-3xl px-2 py-2 hover:mix-blend-multiply min-[352px]:justify-center min-[352px]:flex-col min-[352px]:px-2"
                  }
                  tooltip={
                    <div className="flex flex-col justify-center items-center">
                      <b>Type: {item.type}</b>
                      <b>Value: {formatMoneyMajor(item.value as number, walletPrimaryCurrency)}</b>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        )}
        <div className="w-full pt-2 flex flex-col items-center gap-0.5 text-sm">
          <p className="text-emerald-400">
            Total incomes: <b>{formatMoneyMajor(totalAmount[0] || 0, walletPrimaryCurrency)}</b>
          </p>
          <p className="text-red-500">
            Total bills: <b>{formatMoneyMajor(totalAmount[1] || 0, walletPrimaryCurrency)}</b>
          </p>
          <div className="border-t border-gf-border w-48 my-1"></div>
          <p className={`font-semibold ${(totalAmount[0] || 0) - (totalAmount[1] || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            Balance (Incomes - Bills):{" "}
            <b>{formatMoneyMajor((totalAmount[0] || 0) - (totalAmount[1] || 0), walletPrimaryCurrency)}</b>
          </p>
        </div>
      </div>
    ),
    propPlus: {
      mode: "grouped",
      legend: [
        { id: "income", label: "income", color: "#88FFE3" },
        { id: "bill", label: "bill", color: "#ff8c8c" },
      ],
      // A clicked bar is added to the "Selected" list above the chart; while
      // something is selected the other bars are drawn faded.
      isDimmed:
        clickedItems.length > 0
          ? (datum) => !clickedItems.some((c) => c.type === datum.type && Boolean(c.isBill) === Boolean(datum.isBill))
          : undefined,
      onBarClick: (datum) => {
        const item = datum as unknown as ClickedItem;
        setClickedItems((prev) => {
          const isRepeated = new Set(prev.map((i) => JSON.stringify(i)));
          return isRepeated.has(JSON.stringify(item)) ? [...prev] : [...prev, item];
        });
      },
      label: (datum) => {
        const total = datum.isBill ? totalAmount[1] : totalAmount[0];
        return total ? ((datum.value / total) * 100).toFixed(1) + "%" : "";
      },
      renderTooltip: ({ title, items }) => (
        <div
          className="max-w-[250px] gf-glass-chip text-gf-text flex gap-1.5 flex-col items-center justify-center rounded-2xl p-3 font-sans"
          key={title}
        >
          <h1 className="text-base text-center text-wrap font-bold">{String(title).toUpperCase()}</h1>
          {items.map((transMonth) => (
            <TooltipForChart
              item={transMonth as TooltipForChartItem}
              value={transMonth.value}
              color={transMonth.color}
              key={String(transMonth.transactionType) + transMonth.value}
              totalValue={transMonth.isBill ? totalAmount[1] : totalAmount[0]}
              walletPrimaryCurrency={walletPrimaryCurrency}
            />
          ))}
        </div>
      ),
    } satisfies ComparativeColumnOptions,
  };
};

export interface PeriodCompareDatum {
  type: string;
  value: number;
  color?: string;
  transactionType?: string;
  absValue?: number;
  [key: string]: unknown;
}

export interface PeriodCompareTotals {
  incomeA?: number;
  billA?: number;
  incomeB?: number;
  billB?: number;
}

export interface GeneratePropForChartColAntPeriodCompareOptions {
  compareData: PeriodCompareDatum[];
  totals: PeriodCompareTotals;
  labelA: string;
  labelB: string;
  walletPrimaryCurrency?: string;
}

// Props for the "Compare periods" tab: two independent [start,end] ranges,
// each split into income/bill, bucketed by position-within-range (so bars
// pair up even when the two ranges span different years) and grouped side
// by side per relative month via the same Column chart used for the
// bill-vs-income comparative.
export const generatePropForChartColAntPeriodCompare = ({
  compareData,
  totals,
  labelA,
  labelB,
  walletPrimaryCurrency = "MXN",
}: GeneratePropForChartColAntPeriodCompareOptions) => {
  const balanceA = (totals.incomeA || 0) - (totals.billA || 0);
  const balanceB = (totals.incomeB || 0) - (totals.billB || 0);
  // Each x-axis bucket is "Month N Income"/"Month N Bill", so a 3-month
  // comparison is 6 buckets and reads fine with inline labels - a full-year
  // comparison is 24, and $XX,XXX.XX-formatted labels are wider than each
  // bucket gets at that count, so they visually pile on top of each other.
  // Past ~6 months (12 buckets) the tooltip (already shows the same figures
  // on hover) takes over instead of fighting for space on the chart itself.
  const showInlineLabels = new Set(compareData.map((d) => d.type)).size <= 12;
  return {
    data: compareData,
    // Side by side with a VS between them - lets the two periods' figures be
    // read straight across (income vs income, bills vs bills) instead of
    // scrolled past one after the other.
    totalValue: (
      <div className="w-full flex items-center justify-center gap-3 text-sm flex-wrap">
        <div className="flex flex-col items-center">
          <b className="text-xs text-gf-text-muted">{labelA}</b>
          <p className="text-emerald-400">
            Income: <b>{formatMoneyMajor(totals.incomeA || 0, walletPrimaryCurrency)}</b>
          </p>
          <p className="text-red-500">
            Bills: <b>{formatMoneyMajor(totals.billA || 0, walletPrimaryCurrency)}</b>
          </p>
          <p className={`font-semibold ${balanceA >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            Balance: <b>{formatMoneyMajor(balanceA, walletPrimaryCurrency)}</b>
          </p>
        </div>
        <span className="text-purple-300 font-bold shrink-0">VS</span>
        <div className="flex flex-col items-center">
          <b className="text-xs text-gf-text-muted">{labelB}</b>
          <p className="text-emerald-400">
            Income: <b>{formatMoneyMajor(totals.incomeB || 0, walletPrimaryCurrency)}</b>
          </p>
          <p className="text-red-500">
            Bills: <b>{formatMoneyMajor(totals.billB || 0, walletPrimaryCurrency)}</b>
          </p>
          <p className={`font-semibold ${balanceB >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            Balance: <b>{formatMoneyMajor(balanceB, walletPrimaryCurrency)}</b>
          </p>
        </div>
      </div>
    ),
    propPlus: {
      // Both periods share each x position: period A drawn from 0 upward, period
      // B (negated upstream) mirrored below zero, so they read straight across.
      mode: "overlay",
      // Past ~6 months (12 buckets) inline amounts no longer fit; the tooltip
      // (same figures on hover) takes over. Shows the absolute amount so a
      // downward bar doesn't read as "negative spending".
      label: showInlineLabels ? (datum) => formatMoneyMajor(Math.abs(datum.value), walletPrimaryCurrency) : false,
      valueFormat: (value) => formatMoneyMajor(Math.abs(value), walletPrimaryCurrency),
      renderTooltip: ({ title, items }) => (
        <div
          className="max-w-[280px] gf-glass-chip text-gf-text flex gap-1.5 flex-col items-center justify-center rounded-2xl p-3 font-sans"
          key={title}
        >
          <h1 className="text-base text-center text-wrap font-bold">{String(title).toUpperCase()}</h1>
          {items.map((entry) => (
            <div key={String(entry.transactionType)} className="w-full flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                {entry.transactionType}:
              </span>
              <b className="font-semibold">{formatMoneyMajor(Math.abs(entry.value), walletPrimaryCurrency)}</b>
            </div>
          ))}
        </div>
      ),
    } satisfies ComparativeColumnOptions,
  };
};
