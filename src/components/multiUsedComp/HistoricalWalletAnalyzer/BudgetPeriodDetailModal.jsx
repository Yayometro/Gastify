"use client";

import React from "react";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import { formatMoneyMajor } from "@/lib/money/currencies";

// Month-by-month breakdown for one budget's period-vs-period comparison
// row - the two-period sibling of BudgetHistoricalDetailModal (which shows
// a single period). Renders both periods' monthlySeries stacked, reusing
// the exact same table shape twice.
function PeriodTable({ label, periodData, walletPrimaryCurrency }) {
  if (!periodData) {
    return (
      <div>
        <p className="text-sm font-semibold text-gf-text mb-1">{label}</p>
        <p className="text-xs text-gf-text-muted">Sin datos para este presupuesto en este periodo.</p>
      </div>
    );
  }
  const { monthlySeries, monthsTracked, monthsMet } = periodData;
  return (
    <div>
      <p className="text-sm font-semibold text-gf-text mb-1">
        {label} · {monthsMet} de {monthsTracked} meses cumplidos
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-gf-text-muted">
            <th className="text-left font-normal pb-2">Mes</th>
            <th className="text-right font-normal pb-2">Real</th>
            <th className="text-right font-normal pb-2">Límite</th>
            <th className="text-right font-normal pb-2">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {monthlySeries.map((m) => (
            <tr key={m.label} className="border-t border-gf-border">
              <td className="py-2">{m.label}</td>
              <td className="text-right py-2">{formatMoneyMajor(m.actual, walletPrimaryCurrency)}</td>
              <td className="text-right py-2">{formatMoneyMajor(m.goal, walletPrimaryCurrency)}</td>
              <td className={`text-right py-2 font-medium ${m.met ? "text-green-400" : "text-red-400"}`}>
                {m.met ? "Cumplido" : "Excedido"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetPeriodDetailModal({ row, labelA, labelB, walletPrimaryCurrency, close }) {
  return (
    <div className="content absolute gf-glass-violet flex flex-col w-full h-full max-w-[640px] max-h-[80%] rounded-2xl items-center overflow-hidden z-[1001]">
      <header className="w-full text-white px-6 py-4">
        <p className="text-lg">{row.budget?.name || row.category}</p>
        <p className="text-xs text-white/80">Comparativo de cumplimiento entre periodos</p>
      </header>
      <div className="w-full flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
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
