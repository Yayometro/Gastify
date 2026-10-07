import React, { useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { useSelector } from "react-redux";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { getPrimaryAmount } from "@/helpers/transformers/transactionsChange";
import { getMonthCurrencyBreakdown } from "@/helpers/transformers/projectionsChange";
import { formatMoneyMajor, formatMoneyMinor } from "@/lib/money/currencies";
import type { RootState } from "@/lib/store";
import { percentOf } from "@/helpers/percent";

export interface TabsTransCategoryRef {
  _id?: string;
  name?: string;
  color?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface TabsTransMovement {
  category?: unknown;
  amount?: number | string | null;
  [key: string]: unknown;
}

export interface TabsTransItem {
  type: string;
  value: number;
  idCategory: string;
  color: string;
  icon: string;
  transaction: TabsTransMovement;
  transactions: TabsTransMovement[];
  [key: string]: unknown;
}

export interface TabsTransProps {
  ttTrans?: TabsTransMovement[] | null;
  ttIsbill?: boolean;
}

function TabsTrans({ ttTrans, ttIsbill }: TabsTransProps): React.JSX.Element {
  const [newData, setNewData] = useState<TabsTransItem[]>([]);
  // Categories hidden by clicking their legend dot. Kept as native amount-0
  // in the chart data (rather than filtered out) so the axis/legend don't
  // reflow - clicking again brings the bar right back where it was.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const reduxWalletPrimaryCurrency = (useSelector((state: RootState) => state.walletReducer?.data) as { primaryCurrency?: string })?.primaryCurrency;
  const walletPrimaryCurrency = reduxWalletPrimaryCurrency || "MXN";

  const toggleCategory = (datum: { id?: string | number }) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(datum.id as string)) next.delete(datum.id as string);
      else next.add(datum.id as string);
      return next;
    });
  };

  const chartData = newData.map((d) => (hiddenIds.has(d.idCategory) ? { ...d, value: 0 } : d));
  // The tooltip's "Total spent/earned" should reflect only what's currently
  // shown - hiding a category via the legend discounts it from this total
  // too, not just from its own bar.
  const visibleTotal = chartData.reduce((sum, d) => sum + d.value, 0);
  const legendData = newData.map((d) => ({
    id: d.idCategory,
    label: d.type,
    color: hiddenIds.has(d.idCategory) ? "#D3D1C7" : d.color,
  }));

  useEffect(() => {
    if (ttTrans) {
      // These bars are labeled in the Wallet's primary currency, so each
      // transaction must be converted before summing - raw trans.amount is
      // in that transaction's own native currency, which only happens to
      // match the Wallet primary when every transaction shares one currency.
      const createNewOrder = ttTrans.map((trans) => {
        const category = trans.category as TabsTransCategoryRef | null | undefined;
        return {
          type: category ? (category.name as string) : "No category",
          value: getPrimaryAmount(trans),
          idCategory: category ? (category._id as string) : "ID-nocategory",
          color: (category && category.color) || "#ABABAB",
          icon: (category && category.icon) || "MdFilterNone",
          transaction: trans,
        };
      });
      const reducedData = createNewOrder.reduce<Record<string, TabsTransItem>>((acc, item) => {
        if (acc[item.idCategory]) {
          acc[item.idCategory].value += item.value;
          acc[item.idCategory].transactions.push(item.transaction);
        } else {
          acc[item.idCategory] = { ...item, transactions: [item.transaction] };
        }
        return acc;
      }, {});
      const finalArray = Object.values(reducedData).sort((a, b) => b.value - a.value);
      setNewData(finalArray);
    }
  }, [ttTrans]);
  return (
    <div className="tt-tabs-cont w-[100%] h-[400px] min-h-[300px] max-h-[600px] flex flex-col">
      <span className="text-center text-xs shrink-0 pb-1">
        {ttIsbill ? "Total spent" : "Total earned"}:{" "}
        <b>{formatMoneyMajor(visibleTotal, walletPrimaryCurrency)}</b>
      </span>
      <div className="flex-1 min-h-0">
      <ResponsiveBar
        data={chartData as unknown as readonly Record<string, string | number>[]}
        indexBy="type"
        keys={["value"]}
        margin={{ top: 10, right: 100, bottom: 50, left: 60 }}
        padding={0.15}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        valueFormat=" >-$0,~r"
        colors={(cData) => {
          return String(cData.data[`color`]);
        }}
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        theme={{
          text: { fill: "var(--gf-text)" },
          axis: {
            ticks: { text: { fill: "var(--gf-text-muted)", fontSize: 11 } },
            legend: { text: { fill: "var(--gf-text)", fontSize: 12, fontWeight: 600 } },
          },
          legends: { text: { fill: "var(--gf-text)", fontSize: 11 } },
          grid: { line: { stroke: "var(--gf-border)" } },
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Categories",
          legendPosition: "middle",
          legendOffset: 40,
          truncateTickAt: 3,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Amount",
          legendPosition: "middle",
          legendOffset: -50,
          truncateTickAt: 0,
        }}
        enableGridX={true}
        labelSkipWidth={10}
        labelSkipHeight={1}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", "2.3" as unknown as number]],
        }}
        legends={[
          {
            data: legendData,
            anchor: "right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemWidth: 100,
            itemHeight: 20,
            itemsSpacing: 2,
            symbolSize: 20,
            itemDirection: "left-to-right",
            onClick: toggleCategory,
            itemOpacity: 1,
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: "rgba(0, 0, 0, .03)",
                },
              },
            ],
          } as unknown as NonNullable<React.ComponentProps<typeof ResponsiveBar>["legends"]>[number],
        ]}
        tooltip={(dataa) => {
          // console.log(dataa);
          return (
            <div
              style={{
                padding: 10,
                boxShadow: `0px 7px 16px 0px ${
                  dataa.color ? dataa.color : "rgba(0,0,0,0.27)"
                }`,
                display: "flex",
                gap: "5px",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "16px",
              }}
              className="max-w-[250px] gf-glass-chip text-gf-text"
            >
              <h1 className="text-base text-center text-wrap font-bold">
                {dataa.data.type}
              </h1>
              <div className="flex gap-2">
                <div
                  style={{
                    backgroundColor: `${dataa.color}`,
                  }}
                  className="flex items-center justify-center text-[17px] min-w-[60px] h-[60px] rounded-3xl"
                >
                  <UniversalCategoIcon type={dataa.data.icon as string} siz={15} />
                </div>
                <div className="flex flex-col text-[13px] font-semibold">
                  <div className="flex gap-2">
                    <p className="font-semibold">
                      {ttIsbill ? "Total spent:" : "Total earned:"}
                    </p>
                    {formatMoneyMajor(visibleTotal, walletPrimaryCurrency, { showCode: false })}
                  </div>
                  <div className="flex gap-2 underline">
                    <p className="font-semibold">Amount:</p>
                    {dataa.formattedValue}
                  </div>
                  <div className="flex gap-2">
                    <p className="font-semibold">Percentage:</p>
                    {percentOf(dataa.value, visibleTotal)}%
                  </div>
                </div>
              </div>
              {(() => {
                const { breakdown, isMultiCurrency } = getMonthCurrencyBreakdown(
                  dataa.data.transactions as unknown as Parameters<typeof getMonthCurrencyBreakdown>[0],
                  walletPrimaryCurrency
                );
                if (!isMultiCurrency) return null;
                return (
                  <div className="flex flex-wrap gap-1 justify-center w-full font-normal">
                    {breakdown.map((g) => (
                      <div
                        key={g.currency}
                        className="bg-gf-surface rounded-full px-2 py-0.5 text-[10px] border border-gf-border"
                      >
                        {formatMoneyMinor(g.nativeAmountMinor, g.currency, { showCode: true })}
                        {g.currency !== walletPrimaryCurrency && (
                          <> → {formatMoneyMinor(g.primaryAmountMinor, walletPrimaryCurrency, { showCode: true })}</>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        }}
        motionConfig="gentle"
        role="application"
        label={(d) => {
          // console.log(d)
          return d.formattedValue;
        }}
      />
      </div>
    </div>
  );
}

export default TabsTrans;
