"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { InfoTip } from "./InfoTip";
import { BreakdownBubbles, BreakdownMap, BreakdownRing, type BreakdownChartProps } from "./BreakdownCharts";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { categoryBreakdown, type BreakdownSlice } from "@gastify/core/history/categoryBreakdown";
import { ALL_MOVEMENTS, backOne, drillView, openSlice, type DrillState } from "@gastify/core/history/categoryDrill";
import type { TransactionLike } from "@gastify/core/transformers/transactionsChange";

// The category breakdown of the period, the same as the phone's "Resumen de transacciones": one of the charts (ring, bubbles
// or map) on the left and the categories on the right. The chart and the list share one drill-down path, so a tap in either
// opens the same level: categories, then subcategories, then the movements of a subcategory, with a way back at every level.

const EMPTY: never[] = [];
// The map opens first on the web; the ring goes last.
const CHARTS = [
  { id: "map", label: "Mapa" },
  { id: "bubbles", label: "Burbujas" },
  { id: "ring", label: "Anillo" },
] as const;
type ChartId = (typeof CHARTS)[number]["id"];
// The height of the chart panel. On desktop the list on the right stretches to the same height as the card's content.
const PANEL_HEIGHT = "h-[560px]";

export interface CategoryBreakdownCardProps {
  timePeriod?: [Date, Date] | null;
}

function CategoryBreakdownCard({ timePeriod }: CategoryBreakdownCardProps): React.JSX.Element {
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY;
  const primary = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const [kind, setKind] = useState<"spending" | "incomes">("spending");
  const [chart, setChart] = useState<ChartId>("map");
  const [path, setPath] = useState<DrillState>({ path: [] });

  const startMs = timePeriod?.[0] ? new Date(timePeriod[0]).getTime() : null;
  const endMs = timePeriod?.[1] ? new Date(timePeriod[1]).setHours(23, 59, 59, 999) : null;

  // The period's movements, the ones the breakdown is built from.
  const inRange = useMemo(
    () =>
      transactions.filter((tx: TransactionData) => {
        const value = new Date(tx.date as string).getTime();
        if (startMs !== null && value < startMs) return false;
        if (endMs !== null && value > endMs) return false;
        return true;
      }),
    [transactions, startMs, endMs]
  );

  const slices = useMemo<BreakdownSlice[]>(
    () => categoryBreakdown(inRange as unknown as TransactionLike[], kind === "spending" ? "spending" : "incomes"),
    [inRange, kind]
  );
  const total = useMemo(() => slices.reduce((sum, slice) => sum + slice.value, 0), [slices]);
  const view = useMemo(() => drillView(slices, path, total), [slices, path, total]);
  const isSpending = kind === "spending";

  // A tap in the chart or the list opens one level deeper; the deepest level (movements) does not open further, as on the phone.
  const select = (key: string) => {
    if (view.level >= 2) return;
    setPath((current) => openSlice(current, key));
  };
  const back = () => setPath((current) => backOne(current));

  const chartProps: BreakdownChartProps = {
    slices: view.slices,
    total: view.total,
    level: view.level,
    title: view.current?.name ?? (isSpending ? "Gastos" : "Ingresos"),
    currency: primary,
    onSelect: select,
    onBack: back,
  };

  return (
    <section className="gf-glass-card w-full rounded-[32px] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-gf-text">Resumen de transacciones</h2>
          <InfoTip info={APP_INFO.resumen_de_transacciones} />
        </div>
        <div className="flex gap-1 rounded-full gf-glass-inset p-1.5">
          {[
            { id: "spending" as const, label: "Gastos" },
            { id: "incomes" as const, label: "Ingresos" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={kind === option.id}
              onClick={() => {
                setKind(option.id);
                setPath({ path: [] });
              }}
              className={`rounded-full px-5 py-2 text-base font-semibold transition-all ${kind === option.id ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className="flex gap-1 rounded-full gf-glass-inset p-1.5">
            {CHARTS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={chart === option.id}
                onClick={() => setChart(option.id)}
                className={`rounded-full px-5 py-2 text-base font-semibold transition-all ${chart === option.id ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-2xl font-bold" style={{ color: isSpending ? "#fb7185" : "#4ade80" }}>
            {formatMoneyMajor(total, primary, { showCode: false })}
          </p>
          {/* The chart is always inside this box: it fills it and never grows past it. */}
          <div className={`${PANEL_HEIGHT} w-full min-w-0 overflow-hidden`}>
            {chart === "ring" && <BreakdownRing {...chartProps} />}
            {chart === "bubbles" && <BreakdownBubbles {...chartProps} />}
            {chart === "map" && <BreakdownMap {...chartProps} />}
          </div>
        </div>

        {/* On desktop this column stretches to the chart column's height; the list sits in an absolute box so its rows never
            push the card taller, and it scrolls when there are more rows than fit. */}
        <div className={`flex min-h-0 min-w-0 flex-col gap-2 ${PANEL_HEIGHT} lg:h-auto`}>
          {path.path.length > 0 && (
            <button type="button" onClick={back} className="mb-1 flex items-center gap-1 self-start text-base font-semibold text-purple-300 hover:text-white">
              ‹ {view.level === 1 ? "Todas las categorías" : view.current?.name ?? "Volver"}
            </button>
          )}
          {view.level === 1 && view.current && (
            <button type="button" onClick={() => setPath((current) => openSlice(current, ALL_MOVEMENTS))} className="mb-1 self-start text-sm text-purple-300 hover:text-white">
              Ver todas las transacciones de {view.current.name} ›
            </button>
          )}
          {view.slices.length === 0 && <p className="text-sm text-gf-text-muted">Sin movimientos en este periodo.</p>}
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto pr-1">
              {view.slices.map((slice) => {
                const percent = view.total > 0 ? Math.round((slice.value / view.total) * 100) : 0;
                const hasChildren = view.level < 2 && slice.children.length > 0;
                return (
                  <button
                    key={slice.key}
                    type="button"
                    onClick={() => hasChildren && select(slice.key)}
                    disabled={!hasChildren}
                    className="flex shrink-0 items-center gap-3 rounded-2xl border border-gf-border bg-white/5 px-3 py-2 text-left transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-white/10 disabled:cursor-default"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: slice.color }}>
                      <UniversalCategoIcon type={slice.icon} siz={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-gf-text">{slice.name}</span>
                      {hasChildren && <span className="text-xs text-purple-300">Ver subcategorías ›</span>}
                      {view.level === 2 && <span className="text-xs text-gf-text-muted">{slice.count} movimiento{slice.count === 1 ? "" : "s"}</span>}
                    </span>
                    {view.level < 2 && <span className="shrink-0 text-xs text-gf-text-muted">{percent}%</span>}
                    <span className="shrink-0 text-base font-bold text-gf-text">{formatMoneyMajor(slice.value, primary, { showCode: false })}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CategoryBreakdownCard;
