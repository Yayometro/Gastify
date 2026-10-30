"use client";
import React, { useMemo, useState } from "react";
import { Modal } from "antd";
import { useSelector } from "react-redux";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import { BankBadge } from "@/components/multiUsedComp/BankPicker";
import { bankById } from "@gastify/core/banks/banks";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { idOf } from "@gastify/core/categories/categoryForm";
import { buildAccountAnalysis, type AccountPeriodRow, type AnalysisAccount, type AnalysisMovement } from "@gastify/core/transformers/accountAnalysis";
import { movementKind } from "@gastify/core/transactions/monthSummary";
import { movementTime } from "@gastify/core/transactions/historyWindow";
import { getPrimaryAmount } from "@gastify/core/transformers/transactionsChange";
import type { RatesToPrimary } from "@gastify/core/transformers/budgetCurrency";
import { shortDate } from "@gastify/core/i18n/dates";
import { useInfo, useLocale, useT } from "@/i18n/client";
import type { RootState } from "@/lib/store";

export interface AccountsAnalysisSectionProps {
  range: { start: Date; end: Date };
  primary: string;
  // The accounts in another currency, as the analyzer's currency table has them: their value in the primary currency.
  fxRows?: { currency: string; nativeAmount: number; valueInPrimary: number }[];
}

const LINE_COLORS = ["#a855f7", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#ef4444", "#84cc16"];
const EMPTY: never[] = [];

const percent = (share: number): string => `${Math.round(share * 100)}%`;

// "Your accounts" in the analyzer: which account holds the most, spends the most and receives the most, what each one did in
// the period and how every balance moved month by month. The numbers come from core's buildAccountAnalysis.
export default function AccountsAnalysisSection({ range, primary, fxRows }: AccountsAnalysisSectionProps): React.JSX.Element | null {
  const t = useT();
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const accounts = (useSelector((state: RootState) => (state as unknown as { accountsReducer?: { data?: AnalysisAccount[] } }).accountsReducer?.data) ?? EMPTY) as AnalysisAccount[];
  const movements = (useSelector((state: RootState) => (state as unknown as { transacctionsReducer?: { data?: AnalysisMovement[] } }).transacctionsReducer?.data) ?? EMPTY) as AnalysisMovement[];
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<AccountPeriodRow | null>(null);
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);

  const rates = useMemo<RatesToPrimary>(() => {
    const map: RatesToPrimary = {};
    for (const row of fxRows ?? []) if (row.nativeAmount) map[row.currency] = row.valueInPrimary / row.nativeAmount;
    return map;
  }, [fxRows]);

  const analysis = useMemo(
    () => buildAccountAnalysis({ accounts, movements, range, primary, rates, months: 6 }),
    [accounts, movements, range, primary, rates]
  );

  if (accounts.length === 0) return null;
  const money = (value: number) => formatMoneyMajor(value, primary);
  const single = accounts.length === 1;
  const { richest, topSpender, topEarner } = analysis;

  const titleClass = "text-[15px] font-extrabold text-gf-text";
  const subTitleClass = "text-[11px] font-bold uppercase tracking-wide text-gf-text-muted";

  const tile = (title: string, row: AccountPeriodRow | null, line: string | null, extra?: React.ReactNode) => (
    <div className="rounded-2xl border border-gf-border bg-gf-surface/60 p-3.5 flex flex-col gap-1.5 text-left">
      <p className={subTitleClass}>{title}</p>
      {row && line ? (
        <>
          <p className="flex items-center gap-2 text-[15px] font-bold text-gf-text">
            {row.bankId && bankById(row.bankId) ? <BankBadge bank={bankById(row.bankId)!} size={24} /> : null}
            <span className="truncate">{row.name}</span>
          </p>
          <p className="text-xs text-gf-text-muted">{line}</p>
          {extra}
        </>
      ) : (
        <p className="text-xs text-gf-text-muted">{t("analyzer.accounts.none")}</p>
      )}
    </div>
  );

  const flowRows = [...analysis.accounts].sort((a, b) => b.expense - a.expense || b.income - a.income);
  const maxFlow = Math.max(1, ...flowRows.flatMap((row) => [row.income, row.expense]));

  const visible = analysis.accounts.filter((row) => !hidden[row.id] && row.balance !== null);
  const showTotal = !hidden.__total;
  const series = analysis.balanceSeries;
  const values = series.flatMap((point) => [...visible.map((row) => point.byAccount[row.id] ?? 0), ...(showTotal ? [point.total] : [])]);
  const lo = Math.min(0, ...values);
  const hi = Math.max(1, ...values);
  const W = 600;
  const H = 170;
  const x = (index: number) => (series.length <= 1 ? W / 2 : 20 + (index / (series.length - 1)) * (W - 40));
  const y = (value: number) => 10 + (1 - (value - lo) / (hi - lo || 1)) * (H - 30);
  const line = (pick: (point: (typeof series)[number]) => number) => series.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(pick(point)).toFixed(1)}`).join(" ");
  const monthLabel = (month: string) => new Date(`${month}T12:00:00`).toLocaleDateString(locale, { month: "short" });

  const detailMovements = detail
    ? movements
        .filter((movement) => {
          if (idOf(movement.account) !== detail.id) return false;
          const time = movementTime(movement);
          return time !== null && time >= range.start.getTime() && time <= range.end.getTime();
        })
        .sort((a, b) => Math.abs(getPrimaryAmount(b)) - Math.abs(getPrimaryAmount(a)))
    : [];

  return (
    <div className="gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 flex flex-col gap-4" data-tour="ana-accounts">
      <TitleWithHelp as="p" title={t("analyzer.accounts.title")} info={APP_INFO.analizador_cuentas} tour="anaAccounts" titleClassName={titleClass} />

      {single ? (
        <p className="text-xs text-gf-text-muted">{t("analyzer.accounts.single")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-tour="ana-accounts-tiles">
            {tile(
              t("analyzer.accounts.richest"),
              richest,
              richest ? t("analyzer.accounts.richestLine", { p1: percent(richest.balanceShare), p2: richest.name }) : null,
              <>
                <p className="text-sm font-bold text-gf-text">{richest?.balance !== null && richest ? money(richest.balance ?? 0) : ""}</p>
                {analysis.concentrated && <p className="text-[11px] text-amber-300">{t("analyzer.accounts.concentrated")}</p>}
              </>
            )}
            {tile(
              t("analyzer.accounts.topSpender"),
              topSpender,
              topSpender ? t("analyzer.accounts.topSpenderLine", { p1: topSpender.name, p2: percent(topSpender.expenseShare) }) : null,
              <>
                <p className="text-sm font-bold text-red-300">{topSpender ? money(topSpender.expense) : ""}</p>
                {topSpender?.topCategory && <p className="text-[11px] text-gf-text-muted">{t("analyzer.accounts.topSpenderCategory", { p1: topSpender.topCategory.name, p2: money(topSpender.topCategory.amount) })}</p>}
              </>
            )}
            {tile(
              t("analyzer.accounts.topEarner"),
              topEarner,
              topEarner ? t("analyzer.accounts.topEarnerLine", { p1: topEarner.name, p2: percent(topEarner.incomeShare) }) : null,
              <p className="text-sm font-bold text-green-300">{topEarner ? money(topEarner.income) : ""}</p>
            )}
          </div>

          <div data-tour="ana-accounts-flow" className="flex flex-col gap-2">
            <TitleWithHelp as="p" title={t("analyzer.accounts.flow")} info={{ title: t("analyzer.accounts.flow"), text: t("analyzer.accounts.flowHelp") }} titleClassName={subTitleClass} />
            <div className="flex flex-col">
              {flowRows.map((row) => (
                <button key={row.id} type="button" onClick={() => setDetail(row)} className="flex flex-col gap-1 border-t border-gf-border py-2 text-left first:border-t-0 hover:bg-white/5 rounded-lg px-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-gf-text">{row.name}</span>
                    <span className={`text-[12px] font-bold ${row.net >= 0 ? "text-green-300" : "text-red-300"}`}>{t("analyzer.accounts.net")} {money(row.net)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-gf-surface-2 overflow-hidden"><div className="h-full rounded-full bg-green-500/80" style={{ width: `${(row.income / maxFlow) * 100}%` }} /></div>
                    <span className="w-44 shrink-0 whitespace-nowrap text-right text-[11px] text-gf-text-muted">{t("analyzer.accounts.income")} {money(row.income)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-gf-surface-2 overflow-hidden"><div className="h-full rounded-full bg-red-500/80" style={{ width: `${(row.expense / maxFlow) * 100}%` }} /></div>
                    <span className="w-44 shrink-0 whitespace-nowrap text-right text-[11px] text-gf-text-muted">{t("analyzer.accounts.expense")} {money(row.expense)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div data-tour="ana-accounts-history" className="flex flex-col gap-2">
            <TitleWithHelp as="p" title={t("analyzer.accounts.history")} info={{ title: t("analyzer.accounts.history"), text: t("analyzer.accounts.historyHelp") }} titleClassName={subTitleClass} />
            <div className="flex flex-wrap gap-1.5">
              {analysis.accounts.map((row, index) => (
                <button key={row.id} type="button" aria-pressed={!hidden[row.id]} onClick={() => setHidden((current) => ({ ...current, [row.id]: !current[row.id] }))} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${hidden[row.id] ? "border-gf-border text-gf-text-muted opacity-60" : "border-white/30 text-gf-text"}`}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LINE_COLORS[index % LINE_COLORS.length] }} />
                  {row.name}
                </button>
              ))}
              <button type="button" aria-pressed={showTotal} onClick={() => setHidden((current) => ({ ...current, __total: !current.__total }))} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${showTotal ? "border-white/30 text-gf-text" : "border-gf-border text-gf-text-muted opacity-60"}`}>
                <span className="h-0.5 w-3 bg-white/80" />
                {t("analyzer.accounts.total")}
              </button>
            </div>
            <div onMouseLeave={() => setHoverMonth(null)}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[170px] w-full" role="img" aria-label={t("analyzer.accounts.history")}>
                {lo < 0 && <line x1={20} x2={W - 20} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="text-gf-text-muted" />}
                {analysis.accounts.map((row, index) =>
                  hidden[row.id] || row.balance === null ? null : (
                    <path key={row.id} d={line((point) => point.byAccount[row.id] ?? 0)} fill="none" stroke={LINE_COLORS[index % LINE_COLORS.length]} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  )
                )}
                {showTotal && <path d={line((point) => point.total)} fill="none" stroke="currentColor" className="text-gf-text" strokeOpacity={0.8} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
                {hoverMonth !== null && series[hoverMonth] && <line x1={x(hoverMonth)} x2={x(hoverMonth)} y1={4} y2={H - 4} stroke="currentColor" strokeOpacity={0.3} vectorEffect="non-scaling-stroke" className="text-gf-text" />}
              </svg>
              <div className="flex justify-between" style={{ paddingLeft: `${(20 / W) * 100 - 3}%`, paddingRight: `${(20 / W) * 100 - 3}%` }}>
                {series.map((point, index) => (
                  <button key={point.month} type="button" onMouseEnter={() => setHoverMonth(index)} onFocus={() => setHoverMonth(index)} className="w-[6%] min-w-10 text-center text-[11px] font-semibold text-gf-text-muted hover:text-gf-text">
                    {monthLabel(point.month)}
                  </button>
                ))}
              </div>
            </div>
            {hoverMonth !== null && series[hoverMonth] && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gf-text-muted">
                {visible.map((row) => (
                  <span key={row.id}>{row.name}: <b className="text-gf-text">{money(series[hoverMonth].byAccount[row.id] ?? 0)}</b></span>
                ))}
                {showTotal && <span>{t("analyzer.accounts.total")}: <b className="text-gf-text">{money(series[hoverMonth].total)}</b></span>}
              </div>
            )}
            <p className="text-[11px] text-gf-text-muted">{t("analyzer.accounts.historyNote")}</p>
          </div>

          <div className="flex flex-col gap-1 text-[11px] text-gf-text-muted">
            {analysis.debtTotal > 0 && <p>{t("analyzer.accounts.debt", { p1: money(analysis.debtTotal) })}</p>}
            {analysis.dormant.length > 0 && <p>{t("analyzer.accounts.dormant", { p1: analysis.dormant.map((item) => item.name).join(", ") })}</p>}
            {analysis.missingCurrencies.length > 0 && <p className="text-amber-300">{t("analyzer.accounts.missingRate", { p1: analysis.missingCurrencies.join(", ") })}</p>}
          </div>
        </>
      )}

      {detail && (
        <Modal open onCancel={() => setDetail(null)} footer={null} width={560} className="gf-antd-modal-glass" zIndex={20000} title={<span className="text-purple-300 font-semibold text-base">{t("analyzer.accounts.detailTitle", { p1: detail.name })}</span>}>
          {detailMovements.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{t("analyzer.accounts.detailEmpty")}</p>
          ) : (
            <>
              <p className="text-xs text-gf-text-muted mb-2">{t("analyzer.accounts.detailCount", { p1: detailMovements.length })}</p>
              <div className="flex items-center gap-3 mb-3 text-[12px] font-semibold">
                <span className="text-green-300">{t("analyzer.accounts.income")} {money(detail.income)}</span>
                <span className="text-red-300">{t("analyzer.accounts.expense")} {money(detail.expense)}</span>
              </div>
              <div className="flex flex-col">
                {detailMovements.map((movement, index) => {
                  const kind = movementKind(movement as never);
                  const time = movementTime(movement);
                  return (
                    <div key={String((movement as { _id?: unknown })._id ?? index)} className="flex items-center justify-between gap-3 border-t border-gf-border py-1.5 first:border-t-0">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-gf-text">{String((movement as { name?: unknown }).name ?? "")}</p>
                        <p className="text-[11px] text-gf-text-muted">{time !== null ? shortDate(new Date(time), locale) : ""}</p>
                      </div>
                      <span className={`shrink-0 text-[13px] font-semibold ${kind === "expense" ? "text-red-300" : kind === "income" ? "text-green-300" : "text-gf-text-muted"}`}>
                        {formatMoneyMajor(Math.abs(getPrimaryAmount(movement)), primary)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
