"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IoArrowDown, IoArrowUp, IoChevronForward } from "react-icons/io5";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { getBudgetActualSpend } from "@/helpers/transformers/projectionsChange";
import { isSpendingBudget } from "@/helpers/transformers/budgetTypes";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { useT } from "@/i18n/client";
import type { RootState } from "@/lib/store";
import type { BudgetData } from "@/lib/features/budgetSlice";
import type { TransactionData } from "@/lib/features/transacctionsSlice";

interface DemoBudgetComparisonCardProps {
  startDate?: Date;
  endDate?: Date;
  context: "dashboard" | "analyzer";
}

function shiftMonth(date: Date, amount: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const finalDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), finalDay));
  target.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return target;
}

export default function DemoBudgetComparisonCard({ startDate, endDate, context }: DemoBudgetComparisonCardProps): React.JSX.Element {
  const t = useT();
  const budgets = useSelector((state: RootState) => state.budgetReducer.data) as BudgetData[];
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data) as TransactionData[];
  const currency = useSelector((state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null)?.primaryCurrency) || "MXN";

  const range = useMemo(() => {
    const today = new Date();
    const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    if (start.getFullYear() === today.getFullYear() && start.getMonth() === today.getMonth()) {
      end.setTime(Math.min(end.getTime(), new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime()));
    }
    const previousStart = shiftMonth(start, -1);
    const previousEnd = shiftMonth(end, -1);
    return { start, end, previousStart, previousEnd };
  }, [startDate, endDate]);

  const rows = useMemo(() => budgets
    .filter((budget) => isSpendingBudget(budget) && !budget.archived)
    .map((budget) => ({
      budget,
      current: getBudgetActualSpend(budget as never, transactions as never, range.start, range.end),
      previous: getBudgetActualSpend(budget as never, transactions as never, range.previousStart, range.previousEnd),
    }))
    .sort((a, b) => b.current - a.current)
    .slice(0, 4), [budgets, transactions, range]);

  const currentTotal = rows.reduce((sum, row) => sum + row.current, 0);
  const previousTotal = rows.reduce((sum, row) => sum + row.previous, 0);
  const delta = currentTotal - previousTotal;
  const deltaPercent = previousTotal > 0 ? Math.round((delta / previousTotal) * 100) : null;

  return (
    <section className="gf-glass-card overflow-hidden rounded-[28px] border border-purple-200/10 p-4 sm:p-5" aria-labelledby={`demo-budget-compare-${context}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-purple-300">{t("shared.demo.budgetCompare.eyebrow")}</p>
          <h2 id={`demo-budget-compare-${context}`} className="mt-1 text-base font-semibold text-white sm:text-lg">{t("shared.demo.budgetCompare.title")}</h2>
          <p className="mt-1 text-[11px] text-gf-text-muted">{t("shared.demo.budgetCompare.periods")}</p>
        </div>
        <div className="rounded-2xl border border-white/[.08] bg-white/[.035] px-3 py-2 text-right">
          <p className="text-[9px] text-gf-text-muted">{t("shared.demo.budgetCompare.total")}</p>
          <p className="text-sm font-semibold text-purple-100">{formatMoneyMajor(currentTotal, currency)}</p>
          <span className={`inline-flex items-center justify-end gap-1 text-[10px] ${delta <= 0 ? "text-emerald-200" : "text-amber-200"}`}>
            {delta <= 0 ? <IoArrowDown aria-hidden="true" /> : <IoArrowUp aria-hidden="true" />}
            {deltaPercent === null ? t("shared.demo.budgetCompare.noPrevious") : `${Math.abs(deltaPercent)}% ${t(delta <= 0 ? "shared.demo.budgetCompare.less" : "shared.demo.budgetCompare.more")}`}
          </span>
        </div>
      </div>

      {rows.length ? <div className="mt-3 divide-y divide-white/[.07]">
        {rows.map(({ budget, current, previous }) => {
          const category = (budget.categories?.[0]?.category || budget.category) as { name?: string; icon?: string; color?: string } | undefined;
          const limit = Number(budget.goalAmount || 0);
          const progress = limit > 0 ? Math.min(1, current / limit) : 0;
          const percentChange = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
          return <div key={budget._id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2.5 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full" style={{ backgroundColor: category?.color || "#9874d7" }}><UniversalCategoIcon type={category?.icon || "md/MdOutlineCategory"} siz={15} /></span>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2"><strong className="truncate text-[11px] text-white">{budget.name || category?.name}</strong><span className="shrink-0 text-[10px] text-purple-100/70">{formatMoneyMajor(current, currency)} <span className="text-gf-text-muted">/ {formatMoneyMajor(limit, currency)}</span></span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${progress >= 1 ? "bg-rose-300" : progress >= .8 ? "bg-amber-200" : "bg-purple-300"}`} style={{ width: `${progress * 100}%` }} /></div>
            </div>
            <span className={`min-w-[52px] text-right text-[10px] font-semibold ${percentChange === null ? "text-gf-text-muted" : percentChange <= 0 ? "text-emerald-200" : "text-amber-200"}`}>
              {percentChange === null ? "—" : <>{percentChange > 0 ? "+" : ""}{percentChange}%</>}
              <span className="block text-[8px] font-normal text-gf-text-muted">{formatMoneyMajor(previous, currency)}</span>
            </span>
          </div>;
        })}
      </div> : <p className="mt-4 rounded-xl border border-white/[.08] p-3 text-xs text-gf-text-muted">{t("shared.demo.budgetCompare.empty")}</p>}

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[.07] pt-3 text-[9px] text-gf-text-muted">
        <span>{t("shared.demo.budgetCompare.fictional")}</span>
        <Link href="/demo/history" className="inline-flex shrink-0 items-center gap-1 font-semibold text-purple-200 hover:text-white">{t("shared.demo.budgetCompare.historyLink")}<IoChevronForward aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
