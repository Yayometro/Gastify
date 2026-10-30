"use client";

import TutorialTip from "@/components/tour/TutorialTip";
import React from "react";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { SumBudgetSeriesResult, BudgetPeriodChangeRow } from "@/helpers/transformers/walletAnalyzer";
import { useT } from "@/i18n/client";

export interface PeriodTableProps {
  label: string;
  periodData?: SumBudgetSeriesResult | null;
  walletPrimaryCurrency?: string;
}

// Month-by-month breakdown for one budget's period-vs-period comparison
// row - the two-period sibling of BudgetHistoricalDetailModal (which shows
// a single period). Renders both periods' monthlySeries stacked, reusing
// the exact same table shape twice.
function PeriodTable({ label, periodData, walletPrimaryCurrency }: PeriodTableProps): React.JSX.Element {
  const t = useT();
  if (!periodData) {
    return (
      <div>
        <p className="text-sm font-semibold text-gf-text mb-1">{label}</p>
        <p className="text-xs text-gf-text-muted">{t("analyzer.budget.noData")}</p>
      </div>
    );
  }
  const { monthlySeries, monthsTracked, monthsMet } = periodData;
  return (
    <div>
      <p className="text-sm font-semibold text-gf-text mb-1">
        {t("analyzer.budget.monthsMet", { p1: label, p2: monthsMet, p3: monthsTracked })}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-gf-text-muted">
            <th className="text-left font-normal pb-2">{t("analyzer.table.month")}</th>
            <th className="text-right font-normal pb-2">{t("analyzer.table.actual")}</th>
            <th className="text-right font-normal pb-2">{t("analyzer.table.limit")}</th>
            <th className="text-right font-normal pb-2">{t("analyzer.table.result")}</th>
          </tr>
        </thead>
        <tbody>
          {monthlySeries.map((m) => (
            <tr key={m.label} className="border-t border-gf-border">
              <td className="py-2">{m.label}</td>
              <td className="text-right py-2">{formatMoneyMajor(m.actual, walletPrimaryCurrency)}</td>
              <td className="text-right py-2">{formatMoneyMajor(m.goal, walletPrimaryCurrency)}</td>
              <td className={`text-right py-2 font-medium ${m.met ? "text-green-400" : "text-red-400"}`}>
                {m.met ? t("web.met") : t("web.over")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface BudgetPeriodDetailModalProps {
  row: BudgetPeriodChangeRow;
  labelA: string;
  labelB: string;
  walletPrimaryCurrency?: string;
  close: () => void;
}

function BudgetPeriodDetailModal({
  row,
  labelA,
  labelB,
  walletPrimaryCurrency,
  close,
}: BudgetPeriodDetailModalProps): React.JSX.Element {
  const t = useT();
  const budget = row.budget as { name?: string } | null | undefined;
  return (
    <div className="content absolute gf-glass-violet flex flex-col w-full h-full max-w-[640px] max-h-[80%] rounded-2xl items-center overflow-hidden z-[1001]">
      <header className="w-full text-white px-6 py-4">
        <p className="flex items-center text-lg">{budget?.name || row.category}<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="hisBudgetPeriod" label={budget?.name || row.category} /></p>
        <p data-tour="bp-summary" className="text-xs text-white/80">{t("analyzer.compliance.title")}</p>
      </header>
      <div data-tour="bp-tables" className="w-full flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        <PeriodTable label={labelB} periodData={row.periodB} walletPrimaryCurrency={walletPrimaryCurrency} />
        <PeriodTable label={labelA} periodData={row.periodA} walletPrimaryCurrency={walletPrimaryCurrency} />
      </div>
      <button onClick={close}>
        <div className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short z-[100]">
          <CategoIcon type="MdClose" siz={20} />
        </div>
      </button>
    </div>
  );
}

export default BudgetPeriodDetailModal;
