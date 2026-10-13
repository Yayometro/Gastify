"use client";
import React, { useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";

// Column chart for "two or more series per category" comparisons (bills vs
// incomes per month, period A vs period B, a budget's actual vs goal, budgeted
// vs actual per projection bucket). Built on Nivo, like the rest of the app's
// charts, so @ant-design/plots (AntV G2) is no longer needed just for this.
//
// Data is the flat list the callers already produce: one datum per bar, with
// the category in `type` and the series in `transactionType`.
export interface ComparativeColumnDatum {
  type: string;
  transactionType?: string;
  value: number;
  color?: string;
  fillOpacity?: number;
  [key: string]: unknown;
}

export interface ComparativeColumnLegendItem {
  id: string;
  label: string;
  color: string;
}

export interface ComparativeColumnOptions {
  // "grouped": series side by side. "overlay": series share the same x (used
  // with one series negated so it mirrors below zero).
  mode?: "grouped" | "overlay";
  // Text drawn at the end of each bar; false/undefined hides labels.
  label?: ((datum: ComparativeColumnDatum) => string) | false;
  // Tooltip for the hovered category: receives every bar of that category.
  renderTooltip?: (ctx: { title: string; items: ComparativeColumnDatum[] }) => React.ReactNode;
  onBarClick?: (datum: ComparativeColumnDatum) => void;
  // Bars for which this returns true are drawn faded (e.g. not selected).
  isDimmed?: (datum: ComparativeColumnDatum) => boolean;
  legend?: ComparativeColumnLegendItem[];
  // Axis tick format (defaults to a compact number).
  valueFormat?: (value: number) => string;
  // Chart height in px; by default it fills its parent (min 260px).
  height?: number;
}

export interface ComparativeColumnChartProps {
  data?: ComparativeColumnDatum[] | unknown;
  totalValue?: React.ReactNode;
  propPlus?: ComparativeColumnOptions;
}

const DEFAULT_SERIES = "value";
const FALLBACK_COLOR = "#a78bfa";
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

// "#rrggbb" + opacity -> "rgba(...)"; other color formats are returned as is.
function withOpacity(color: string, opacity: number): string {
  if (opacity >= 1) return color;
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (!hex) return color;
  const n = parseInt(hex[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

function ComparativeColumnChart({ data, totalValue, propPlus = {} }: ComparativeColumnChartProps): React.JSX.Element {
  const { mode = "grouped", label, renderTooltip, onBarClick, isDimmed, legend, valueFormat, height } = propPlus;

  const { rows, keys, lookup } = useMemo(() => {
    const list = (Array.isArray(data) ? data : []) as ComparativeColumnDatum[];
    const byType = new Map<string, Record<string, string | number>>();
    const seriesOrder: string[] = [];
    const index = new Map<string, ComparativeColumnDatum>();
    for (const datum of list) {
      const category = String(datum.type);
      const series = datum.transactionType ? String(datum.transactionType) : DEFAULT_SERIES;
      if (!seriesOrder.includes(series)) seriesOrder.push(series);
      const row = byType.get(category) || { type: category };
      row[series] = Number(datum.value) || 0;
      byType.set(category, row);
      index.set(`${category}\u0000${series}`, datum);
    }
    return {
      rows: [...byType.values()],
      keys: seriesOrder,
      lookup: (category: string | number, series: string | number) => index.get(`${category}\u0000${series}`),
    };
  }, [data]);

  const manyCategories = rows.length > 8;

  return (
    <div className="comparative-column-chart w-full h-full flex flex-col">
      {totalValue ? <div className="text-center text-xs">{totalValue}</div> : null}
      {legend && legend.length > 0 && (
        <div className="flex justify-center gap-3 pt-1 text-xs text-gf-text">
          {legend.map((item) => (
            <span key={item.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
      <div className="w-full flex-1" style={height ? { height } : { minHeight: 260 }}>
        <ResponsiveBar
          data={rows}
          keys={keys}
          indexBy="type"
          groupMode={mode === "overlay" ? "stacked" : "grouped"}
          padding={0.3}
          innerPadding={mode === "grouped" ? 2 : 0}
          margin={{ top: label ? 24 : 12, right: 12, bottom: manyCategories ? 56 : 36, left: 56 }}
          colors={(bar) => {
            const datum = lookup(bar.indexValue, bar.id);
            const base = datum?.color || FALLBACK_COLOR;
            const opacity = (datum?.fillOpacity ?? 1) * (datum && isDimmed?.(datum) ? 0.4 : 1);
            return withOpacity(base, opacity);
          }}
          borderRadius={3}
          enableLabel={Boolean(label)}
          label={(bar) => {
            const datum = lookup(bar.indexValue, bar.id);
            return datum && label ? label(datum) : "";
          }}
          labelPosition="end"
          labelOffset={8}
          labelSkipWidth={14}
          labelTextColor="var(--gf-text)"
          enableGridX={false}
          gridYValues={5}
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: manyCategories ? -35 : 0 }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: 5,
            format: (v) => (valueFormat ? valueFormat(Number(v)) : compactNumber.format(Number(v))),
          }}
          theme={{
            text: { fill: "var(--gf-text)" },
            axis: { ticks: { text: { fill: "var(--gf-text-muted)", fontSize: 11 } } },
            grid: { line: { stroke: "var(--gf-border)", strokeWidth: 1 } },
            labels: { text: { fontSize: 11, fontWeight: 600 } },
            tooltip: { container: { background: "transparent", boxShadow: "none", padding: 0 } },
          }}
          tooltip={(bar) => {
            const title = String(bar.indexValue);
            const items = keys.map((k) => lookup(bar.indexValue, k)).filter(Boolean) as ComparativeColumnDatum[];
            if (renderTooltip) return <>{renderTooltip({ title, items })}</>;
            return (
              <div className="max-w-[250px] gf-glass-chip text-gf-text rounded-2xl p-3 flex flex-col gap-1.5">
                <h1 className="text-sm text-center font-bold">{title.toUpperCase()}</h1>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.transactionType}
                    </span>
                    <b>{valueFormat ? valueFormat(item.value) : compactNumber.format(item.value)}</b>
                  </div>
                ))}
              </div>
            );
          }}
          onClick={(bar) => {
            const datum = lookup(bar.indexValue, bar.id);
            if (datum && onBarClick) onBarClick(datum);
          }}
          role="img"
          ariaLabel="Comparative column chart"
        />
      </div>
    </div>
  );
}

export default ComparativeColumnChart;
