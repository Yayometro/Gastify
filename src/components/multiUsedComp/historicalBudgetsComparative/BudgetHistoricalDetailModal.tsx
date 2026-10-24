"use client";

import React from "react";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { BudgetHistoricalComparativeRowData } from "@/helpers/transformers/budgetHistoricalComparative";
import { useT } from "@/i18n/client";

export interface BudgetHistoricalDetailModalProps {
  row: BudgetHistoricalComparativeRowData;
  walletPrimaryCurrency?: string;
  close: () => void;
}

// Full month-by-month breakdown for one Budget, opened by clicking its row
// in the Budgets comparative list. Mirrors the mini bar chart's data
// one-to-one, just laid out as an explicit table instead of bars, for
// anyone who wants the exact numbers rather than the at-a-glance shape.
// Renders its own wrapper/close button (matching BasicModal's other
// content components, e.g. ModalContentTopMonthItem) since passing
// `renderContent` bypasses BasicModal's default chrome entirely.
function BudgetHistoricalDetailModal({
  row,
  walletPrimaryCurrency = "MXN",
  close,
}: BudgetHistoricalDetailModalProps): React.JSX.Element {
  const t = useT();
  const { budget, monthlySeries, monthsTracked, monthsMet } = row;

  return (
    <div className="content absolute gf-glass-violet flex flex-col w-full h-full max-w-[640px] max-h-[80%] rounded-2xl items-center overflow-hidden z-[1001]">
      <header className="w-full text-white px-6 py-4">
        <p className="text-lg">{budget.name || "Unnamed budget"}</p>
        <p className="text-xs text-white/80">
          {t("budgets.monthsMet", { p1: monthlySeries[0]?.label, p2: monthlySeries[monthlySeries.length - 1]?.label, p3: monthsMet, p4: monthsTracked })}
        </p>
      </header>
      <div className="w-full flex-1 overflow-y-auto px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gf-text-muted">
              <th className="text-left font-normal pb-2">{t("budgets.comparative.month")}</th>
              <th className="text-right font-normal pb-2">{t("budgets.comparative.actual")}</th>
              <th className="text-right font-normal pb-2">{t("budgets.comparative.goal")}</th>
              <th className="text-right font-normal pb-2">{t("budgets.comparative.result")}</th>
            </tr>
          </thead>
          <tbody>
            {monthlySeries.map((m) => (
              <tr key={m.label} className="border-t border-gf-border">
                <td className="py-2.5">
                  {m.label}
                  {m.estimated && (
                    <span
                      className="text-gf-text-muted cursor-help"
                      title={t("budgets.comparative.estimateNote")}
                    >
                      *
                    </span>
                  )}
                </td>
                <td className="text-right py-2.5">{formatMoneyMajor(m.actual, walletPrimaryCurrency)}</td>
                <td className="text-right py-2.5">{formatMoneyMajor(m.goal, walletPrimaryCurrency)}</td>
                <td className={`text-right py-2.5 font-medium ${m.met ? "text-green-400" : "text-red-400"}`}>
                  {m.met ? "Met" : "Exceeded"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {monthlySeries.some((m) => m.estimated) && (
          <p className="text-[10px] text-gf-text-muted mt-3">
            {t("budgets.comparative.estimateFootnote")}
          </p>
        )}
      </div>
      <button onClick={close}>
        <div className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short z-[100]">
          <CategoIcon type="MdClose" siz={20} />
        </div>
      </button>
    </div>
  );
}

export default BudgetHistoricalDetailModal;
