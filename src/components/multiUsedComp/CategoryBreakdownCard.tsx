"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { InfoTip } from "./InfoTip";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { categoryBreakdown, type BreakdownSlice } from "@gastify/core/history/categoryBreakdown";
import { ALL_MOVEMENTS, backOne, drillView, openSlice, type DrillState } from "@gastify/core/history/categoryDrill";
import type { TransactionLike } from "@gastify/core/transformers/transactionsChange";

// The category breakdown of the period, the same as the phone's "Resumen de transacciones": a chart on the left (ring,
// bubbles or bars), the categories on the right. Opening a category shows its subcategories, and opening a subcategory its
// movements, with a way back at every level. It follows the period chosen at the top of the page.

const EMPTY: never[] = [];
const CHARTS = [
  { id: "ring", label: "Anillo" },
  { id: "bubbles", label: "Burbujas" },
  { id: "map", label: "Mapa" },
] as const;
type ChartId = (typeof CHARTS)[number]["id"];

export interface CategoryBreakdownCardProps {
  timePeriod?: [Date, Date] | null;
}

function inPeriod(date: unknown, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return true;
  const value = new Date(date as string);
  return value >= start && value <= end;
}

function CategoryBreakdownCard({ timePeriod }: CategoryBreakdownCardProps): React.JSX.Element {
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY;
  const primary = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const [kind, setKind] = useState<"spending" | "incomes">("spending");
  const [chart, setChart] = useState<ChartId>("ring");
  const [path, setPath] = useState<DrillState>({ path: [] });

  const start = timePeriod?.[0] ? new Date(timePeriod[0]) : null;
  const end = timePeriod?.[1] ? new Date(timePeriod[1]) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const startMs = start ? start.getTime() : null;
  const endMs = end ? end.getTime() : null;

  const slices = useMemo<BreakdownSlice[]>(() => {
    const movements = transactions.filter((tx) => inPeriod(tx.date, startMs !== null ? new Date(startMs) : null, endMs !== null ? new Date(endMs) : null));
    return categoryBreakdown(movements as unknown as TransactionLike[], kind === "spending" ? "spending" : "incomes");
  }, [transactions, kind, startMs, endMs]);

  const total = useMemo(() => slices.reduce((sum, slice) => sum + slice.value, 0), [slices]);
  const view = useMemo(() => drillView(slices, path, total), [slices, path, total]);
  const shown = view.slices;
  const shownTotal = view.total;

  return (
    <section className="gf-glass-card w-full rounded-[32px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-extrabold text-gf-text">Resumen de transacciones</h2>
          <InfoTip info={APP_INFO.resumen_de_transacciones} />
        </div>
        <div className="flex gap-1 rounded-full gf-glass-inset p-1">
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
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${kind === option.id ? "gf-glass-button text-white" : "text-purple-200/80 hover:text-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1 rounded-full gf-glass-inset p-1">
            {CHARTS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={chart === option.id}
                onClick={() => setChart(option.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${chart === option.id ? "gf-glass-button text-white" : "text-purple-200/80 hover:text-white"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-2xl font-bold" style={{ color: kind === "spending" ? "#fb7185" : "#4ade80" }}>
            {formatMoneyMajor(shownTotal, primary, { showCode: false })}
          </p>
          {chart === "ring" && <Ring slices={shown} total={shownTotal} onOpen={(key) => setPath((current) => openSlice(current, key))} centerLabel={view.current?.name ?? (kind === "spending" ? "Gastos" : "Ingresos")} />}
          {chart === "bubbles" && <Bubbles slices={shown} onOpen={(key) => setPath((current) => openSlice(current, key))} primary={primary} />}
          {chart === "map" && <Bars slices={shown} total={shownTotal} onOpen={(key) => setPath((current) => openSlice(current, key))} primary={primary} />}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          {path.path.length > 0 && (
            <button type="button" onClick={() => setPath((current) => backOne(current))} className="mb-1 flex items-center gap-1 self-start text-sm font-semibold text-purple-300 hover:text-white">
              ‹ {view.level === 1 ? "Todas las categorías" : view.current?.name ?? "Volver"}
            </button>
          )}
          {view.level === 1 && view.current && (
            <button type="button" onClick={() => setPath((current) => openSlice(current, ALL_MOVEMENTS))} className="mb-1 self-start text-sm text-purple-300 hover:text-white">
              Ver todas las transacciones de {view.current.name} ›
            </button>
          )}
          {shown.length === 0 && <p className="text-sm text-gf-text-muted">Sin movimientos en este periodo.</p>}
          {shown.map((slice) => {
            const percent = shownTotal > 0 ? Math.round((slice.value / shownTotal) * 100) : 0;
            const hasChildren = view.level < 2 && slice.children.length > 0;
            return (
              <button
                key={slice.key}
                type="button"
                onClick={() => hasChildren && setPath((current) => openSlice(current, slice.key))}
                disabled={!hasChildren}
                className="flex items-center gap-3 rounded-2xl border border-gf-border bg-white/5 px-3 py-2.5 text-left transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-white/10 disabled:cursor-default"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: slice.color }}>
                  <UniversalCategoIcon type={slice.icon} siz={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gf-text">{slice.name}</span>
                  {hasChildren && <span className="text-[11px] text-purple-300">Ver subcategorías ›</span>}
                  {view.level === 2 && <span className="text-[11px] text-gf-text-muted">{slice.count} movimiento{slice.count === 1 ? "" : "s"}</span>}
                </span>
                {view.level < 2 && <span className="shrink-0 text-xs text-gf-text-muted">{percent}%</span>}
                <span className="shrink-0 text-sm font-bold text-gf-text">{formatMoneyMajor(slice.value, primary, { showCode: false })}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// The ring: each slice is a stroke of the same circle, starting where the one before it ends.
function Ring({ slices, total, onOpen, centerLabel }: { slices: BreakdownSlice[]; total: number; onOpen: (key: string) => void; centerLabel: string }): React.JSX.Element {
  const radius = 90;
  const length = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg viewBox="0 0 240 240" className="h-[240px] w-[240px]" role="img" aria-label={centerLabel}>
      <g transform="rotate(-90 120 120)">
        <circle cx={120} cy={120} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={28} />
        {slices.map((slice) => {
          const share = total > 0 ? slice.value / total : 0;
          const dash = Math.max(0, share * length - 2);
          const element = (
            <circle
              key={slice.key}
              cx={120}
              cy={120}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={28}
              strokeDasharray={`${dash} ${length}`}
              strokeDashoffset={-offset}
              onClick={() => onOpen(slice.key)}
              style={{ cursor: slice.children.length > 0 ? "pointer" : "default" }}
            />
          );
          offset += share * length;
          return element;
        })}
      </g>
      <text x={120} y={112} textAnchor="middle" className="fill-purple-200 text-[11px]">{centerLabel}</text>
    </svg>
  );
}

function Bubbles({ slices, onOpen, primary }: { slices: BreakdownSlice[]; onOpen: (key: string) => void; primary: string }): React.JSX.Element {
  const max = Math.max(1, ...slices.map((slice) => slice.value));
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2">
      {slices.map((slice) => {
        const size = 56 + Math.sqrt(slice.value / max) * 120;
        return (
          <button
            key={slice.key}
            type="button"
            onClick={() => slice.children.length > 0 && onOpen(slice.key)}
            className="flex flex-col items-center justify-center rounded-full text-center text-white shadow-lg transition-transform hover:scale-105"
            style={{ width: size, height: size, background: slice.color }}
          >
            <span className="max-w-[90%] truncate text-xs font-bold">{slice.name}</span>
            <span className="text-[11px] opacity-90">{formatMoneyMajor(slice.value, primary, { showCode: false })}</span>
          </button>
        );
      })}
    </div>
  );
}

function Bars({ slices, total, onOpen, primary }: { slices: BreakdownSlice[]; total: number; onOpen: (key: string) => void; primary: string }): React.JSX.Element {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex h-7 w-full overflow-hidden rounded-full gf-glass-inset">
        {slices.map((slice) => (
          <button
            key={slice.key}
            type="button"
            title={`${slice.name} · ${formatMoneyMajor(slice.value, primary, { showCode: false })}`}
            onClick={() => slice.children.length > 0 && onOpen(slice.key)}
            style={{ width: `${total > 0 ? (slice.value / total) * 100 : 0}%`, background: slice.color }}
          />
        ))}
      </div>
    </div>
  );
}

export default CategoryBreakdownCard;
