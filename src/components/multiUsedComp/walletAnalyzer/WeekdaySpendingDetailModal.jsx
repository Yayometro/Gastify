"use client";
import React from "react";
import { Modal } from "antd";
import { formatMoneyMajor } from "@/lib/money/currencies";

// The "why" behind the weekday-pattern card: which week of the month hit
// hardest, a plain explanation of the averaging method, and a full
// day-by-day list so the conclusion (e.g. "los miércoles") is traceable
// to the actual daily numbers, not just the 7-bucket averages.
function WeekdaySpendingDetailModal({ open, onClose, weekdaySpending, walletPrimaryCurrency }) {
  if (!open || !weekdaySpending) return null;
  const { weeks, dailyBreakdown, insight, weekdayAvg, weekendAvg } = weekdaySpending;

  const bestWeek = [...weeks].sort((a, b) => b.total - a.total)[0];
  const maxDayTotal = Math.max(1, ...dailyBreakdown.map((d) => d.total));

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={560}
      className="gf-antd-modal-glass"
      zIndex={20000}
      title={<span className="text-purple-300 font-semibold text-base">Patrones por día de la semana — detalle</span>}
    >
      <div className="rounded-xl bg-gf-accent-soft-bg p-3.5 mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-purple-300/70">Semana con más gasto</p>
        <p className="text-base font-extrabold text-purple-300">
          {bestWeek.label} — {formatMoneyMajor(bestWeek.total, walletPrimaryCurrency)}
        </p>
        <p className="text-[11px] text-gf-text-muted">{bestWeek.count} transacciones</p>
      </div>

      <p className="text-xs text-gf-text-muted mb-2">
        <b>{insight}</b> Para llegar a esto, se suma el gasto de cada día de la semana (todos los lunes, todos los
        martes, etc.) a lo largo del mes, y se divide entre cuántas veces cayó ese día — un mes puede tener 4 o 5 de
        cada uno, así que dividir hace la comparación justa. Ese promedio entre semana fue{" "}
        {formatMoneyMajor(weekdayAvg, walletPrimaryCurrency)} y el de fin de semana{" "}
        {formatMoneyMajor(weekendAvg, walletPrimaryCurrency)}.
      </p>

      <p className="text-[11px] font-bold uppercase tracking-wide text-gf-text-muted mt-3 mb-2">Detalle día por día</p>
      <div className="flex flex-col max-h-[320px] overflow-y-auto pr-1">
        {dailyBreakdown.map((d) => (
          <div key={d.dayOfMonth} className="flex items-center gap-3 py-1.5 border-t border-gf-border first:border-t-0">
            <span className="w-16 text-[11px] text-gf-text-muted shrink-0">
              {d.dayName.slice(0, 3)} {d.dayOfMonth}
            </span>
            <div className="flex-1 h-2 rounded-full bg-gf-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-purple-400" style={{ width: `${(d.total / maxDayTotal) * 100}%` }} />
            </div>
            <span className="w-28 text-right text-[12px] font-semibold text-gf-text shrink-0">
              {formatMoneyMajor(d.total, walletPrimaryCurrency)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default WeekdaySpendingDetailModal;
