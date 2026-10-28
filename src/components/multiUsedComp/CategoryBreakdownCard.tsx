"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import UniversalCategoIcon from "./UniversalCategoIcon";
import { InfoTip } from "./InfoTip";
import { BreakdownBubbles, BreakdownMap, BreakdownRing, type BreakdownChartProps } from "./BreakdownCharts";
import useModal from "@/hooks/useModalBasic";
import ModalContentTopMonthItem, { type ModalContentTopMonthItemItem } from "@/components/modals/contents/modalForTopMonthItem/ModalContentTopMonthItem";
import BasicModal from "@/components/modals/basicModal/BasicModal";

import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { categoryBreakdown, type BreakdownSlice } from "@gastify/core/history/categoryBreakdown";
import { ALL_MOVEMENTS, backOne, drillView, openSlice, type DrillState } from "@gastify/core/history/categoryDrill";
import type { TransactionLike } from "@gastify/core/transformers/transactionsChange";
import { useT, useInfo } from "@/i18n/client";
import type { TranslateFn } from "@gastify/core/i18n/translate";

// The category breakdown of the period, the same as the phone's "Resumen de transacciones": one of the charts (ring, bubbles
// or map) on the left and the categories on the right. The chart and the list share one drill-down path, so a tap in either
// opens the same level: categories, then subcategories, then the movements of a subcategory, with a way back at every level.

const EMPTY: never[] = [];
// The map opens first on the web; the ring goes last.
type ChartId = "map" | "bubbles" | "ring";
// The three charts, named in the person's language.
const chartsFor = (t: TranslateFn) =>
  [
    { id: "map", label: t("categories.chart.treemap") },
    { id: "bubbles", label: t("categories.chart.bubbles") },
    { id: "ring", label: t("categories.chart.ring") },
  ] as const;
// The height of the chart panel. On desktop the list on the right stretches to the same height as the card's content.
const PANEL_HEIGHT = "h-[560px]";

// One arrow of the walk through the drill-down. It names itself on hover, and it is dimmed when there is nowhere to go.
function HistoryArrow({ direction, label, disabled, onClick }: { direction: "back" | "forward"; label: string; disabled: boolean; onClick: () => void }): React.JSX.Element {
  const Icon = direction === "back" ? IoIosArrowBack : IoIosArrowForward;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full gf-glass-button text-white transition-all enabled:hover:scale-105 disabled:cursor-default disabled:opacity-30"
    >
      <Icon size={20} />
      <span className="pointer-events-none absolute top-full z-10 mt-1 whitespace-nowrap rounded-md bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

export interface CategoryBreakdownCardProps {
  timePeriod?: [Date, Date] | null;
}

function CategoryBreakdownCard({ timePeriod }: CategoryBreakdownCardProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY;
  const primary = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const [kind, setKind] = useState<"spending" | "incomes">("spending");
  const [chart, setChart] = useState<ChartId>("map");
  // The drill-down path on show: the list and the chart open and close its levels, and the arrows beside the total walk them.
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

  // A movement opens the same transaction modal as the top lists, where it can be edited or deleted.
  const { close, handleClose, renderModal, modalContent } = useModal();
  const openMovement = (movement: BreakdownSlice) => {
    if (!movement.transaction) return;
    renderModal(<ModalContentTopMonthItem item={movement.transaction as unknown as ModalContentTopMonthItemItem} close={handleClose} />);
  };
  // A tap in the chart or the list opens one level deeper. The deepest level is the movements: a tap there opens the transaction.
  const select = (key: string) => {
    if (view.level >= 2) {
      const movement = view.slices.find((slice) => slice.key === key);
      if (movement) openMovement(movement);
      return;
    }
    setPath((current) => openSlice(current, key));
  };
  // The arrows beside the total walk the levels: back goes up one (a subcategory or all movements back to the category's
  // subcategories, a category back to the categories), and forward goes from a category to all of its movements.
  const back = () => setPath((current) => backOne(current));
  const forward = () => setPath((current) => openSlice(current, ALL_MOVEMENTS));

  const chartProps: BreakdownChartProps = {
    slices: view.slices,
    total: view.total,
    level: view.level,
    title: view.current?.name ?? (isSpending ? t("analyzer.bills") : t("analyzer.incomes")),
    currency: primary,
    onSelect: select,
    onBack: back,
  };

  return (
    <section className="gf-glass-card w-full rounded-[32px] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-gf-text">{t("categories.summary.title")}</h2>
          <InfoTip info={APP_INFO.resumen_de_transacciones} />
        </div>
        <div className="flex gap-1 rounded-full gf-glass-inset p-1.5">
          {[
            { id: "spending" as const, label: t("categories.summary.bills") },
            { id: "incomes" as const, label: t("categories.summary.incomes") },
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
            {chartsFor(t).map((option) => (
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
          <div className="flex w-full items-center justify-between px-1">
            <HistoryArrow direction="back" label={t("categories.summary.back")} disabled={path.path.length === 0} onClick={back} />
            <p className="text-2xl font-bold" style={{ color: isSpending ? "#fb7185" : "#4ade80" }}>
              {formatMoneyMajor(total, primary, { showCode: false })}
            </p>
            <HistoryArrow direction="forward" label={t("categories.summary.forward")} disabled={path.path.length !== 1} onClick={forward} />
          </div>
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
              ‹ {view.level === 1 ? t("web.all.categories") : view.current?.name ?? t("common.back")}
            </button>
          )}
          {view.level === 1 && view.current && (
            <button type="button" onClick={forward} className="mb-1 self-start text-sm text-purple-300 hover:text-white">
              {t("categories.summary.seeAll", { p1: view.current.name })}
            </button>
          )}
          {view.slices.length === 0 && <p className="text-sm text-gf-text-muted">{t("categories.summary.none")}</p>}
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto pr-1">
              {view.slices.map((slice) => {
                const percent = view.total > 0 ? Math.round((slice.value / view.total) * 100) : 0;
                const hasChildren = view.level < 2 && slice.children.length > 0;
                return (
                  <button
                    key={slice.key}
                    type="button"
                    onClick={() => (view.level >= 2 ? openMovement(slice) : hasChildren && select(slice.key))}
                    disabled={view.level < 2 && !hasChildren}
                    className="flex shrink-0 items-center gap-3 rounded-2xl border border-gf-border bg-white/5 px-3 py-2 text-left transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-white/10 disabled:cursor-default"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: slice.color }}>
                      <UniversalCategoIcon type={slice.icon} siz={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-gf-text">{slice.name}</span>
                      {hasChildren && <span className="text-xs text-purple-300">{t("categories.summary.seeSub")}</span>}
                      {view.level === 2 && <span className="text-xs text-gf-text-muted">{t("categories.summary.movements", { p1: slice.count, p2: slice.count === 1 ? "" : "s" })}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-base font-bold text-gf-text">{formatMoneyMajor(slice.value, primary, { showCode: false })}</span>
                      {view.level < 2 && (
                        <span className="text-xs text-gf-text-muted">
                          {slice.count} {slice.count === 1 ? t("movements.word.transaction") : "transacciones"} · {percent}%
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {close && <BasicModal close={handleClose} renderContent={modalContent} />}
    </section>
  );
}

export default CategoryBreakdownCard;
