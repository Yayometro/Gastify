"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IoArrowForward, IoAirplaneOutline, IoSparklesOutline } from "react-icons/io5";
import { GiArcheryTarget } from "react-icons/gi";
import { projectSingleDeposit } from "@gastify/core/opportunities/investment";
import { formatMoneyMinor } from "@gastify/core/money/currencies";
import type { RootState } from "@/lib/store";
import { useT } from "@/i18n/client";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { WalletData } from "@/lib/features/walletSlice";
import { resolveOpportunityMoney } from "@gastify/core/opportunities/transactions";
import { useInfo } from "@/i18n/client";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";
import type { InfoText } from "@gastify/core/info/createInfo";

const refId = (value: unknown): string => String((value as { _id?: unknown } | null)?._id ?? value ?? "");

/** A data-backed, explicitly hypothetical teaser shared by the real wallet and the read-only demo. */
export default function GrowthOpportunityTeaser({ demoMode = false }: { demoMode?: boolean }): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const growthInfo = APP_INFO.oportunidades_de_crecimiento as InfoText;
  const transactionsState = useSelector((state: RootState) => state.transacctionsReducer);
  const categoriesState = useSelector((state: RootState) => state.categoriesReducer.data);
  const currency = useSelector((state: RootState) => (state.walletReducer.data as WalletData)?.primaryCurrency) || "MXN";
  const transactions = transactionsState.data as TransactionData[];
  const year = new Date().getFullYear();
  const asOf = new Date().toISOString().slice(0, 10);
  const top = useMemo(() => {
    const categories = new Map<string, { name: string; amountMinor: number }>();
    const categoryList = [...(categoriesState.user || []), ...(categoriesState.default || [])];
    for (const transaction of transactions) {
      const kind = transaction.kind || (transaction.isIncome ? "income" : transaction.isBill ? "expense" : "income");
      if (kind !== "expense" || (transaction.state && transaction.state !== "completed") || !transaction.date) continue;
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) continue;
      const primary = resolveOpportunityMoney(transaction, currency);
      if (!primary || primary.currency !== currency) continue;
      const category = transaction.category;
      const id = refId(category);
      const found = categoryList.find((item) => refId(item) === id);
      const row = categories.get(id) || { name: category?.name || found?.name || t("history.noCategory"), amountMinor: 0 };
      row.amountMinor += Math.abs(primary.amountMinor);
      categories.set(id || "none", row);
    }
    return [...categories.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.amountMinor - a.amountMinor)[0] || null;
  }, [transactions, categoriesState, currency, year, t]);
  const shareMinor = top ? Math.round(top.amountMinor * 0.25) : 0;
  const projection = top ? projectSingleDeposit({ principalMinor: shareMinor, currency, annualEffectiveRate: 0.06, years: 3, asOf }) : null;
  const href = demoMode ? "/demo/opportunities" : "/dashboard/opportunities";
  const goalHref = demoMode ? "/demo/goals" : "/dashboard/goals";

  return (
    <section className="gf-glass-card relative overflow-hidden rounded-3xl border border-purple-300/15 p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-purple-300/20 bg-purple-300/10 text-purple-200"><IoSparklesOutline size={20} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-purple-300">{t("opportunities.title")}<InfoTip info={growthInfo} /></p>
              {top ? <>
                <h2 className="mt-1 text-base font-semibold text-gf-text">{t("opportunities.teaser.title", { p1: top.name, p2: year })}</h2>
                <p className="mt-1 text-xs text-gf-text-muted">{t("opportunities.teaser.spending", { p1: formatMoneyMinor(top.amountMinor, currency), p2: formatMoneyMinor(shareMinor, currency) })}</p>
              </> : <p className="mt-1 text-sm text-gf-text-muted">{t("opportunities.teaser.empty")}</p>}
              {transactionsState.historyStatus !== "complete" && top && <p className="mt-1 text-[11px] text-amber-200/80">{t("opportunities.partial")}</p>}
            </div>
          </div>
          <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-purple-300/20 bg-purple-300/[.08] px-4 py-2 text-xs font-semibold text-purple-100">
            {t("opportunities.open")}<IoArrowForward aria-hidden="true" />
          </Link>
        </div>

        {top && <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
          <article className="min-w-0 rounded-2xl border border-gf-border/80 bg-gf-surface/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-purple-200">{t("opportunities.growthPath.investment")}</p>
            <p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMinor(projection?.valueMinor || shareMinor, currency)}</p>
            <p className="mt-0.5 text-[11px] text-gf-text-muted">{t("opportunities.teaser.investmentMeta", { p1: formatMoneyMinor(shareMinor, currency) })}</p>
          </article>
          <article className="min-w-0 rounded-2xl border border-gf-border/80 bg-gf-surface/25 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200"><IoAirplaneOutline aria-hidden="true" />{t("opportunities.growthPath.travel")}</p>
            <p className="mt-1 break-words text-lg font-bold text-gf-text">{formatMoneyMinor(shareMinor, currency)}</p>
            <p className="mt-0.5 text-[11px] text-gf-text-muted">{t("opportunities.teaser.travelMeta")}</p>
          </article>
          <Link href={goalHref} className="min-w-0 rounded-2xl border border-gf-border/80 bg-gf-surface/25 p-3 text-left text-gf-text">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200"><GiArcheryTarget aria-hidden="true" />{t("opportunities.growthPath.goal")}</p>
            <p className="mt-1 break-words text-lg font-bold">{formatMoneyMinor(shareMinor, currency)}</p>
            <p className="mt-0.5 text-[11px] text-gf-text-muted">{t("opportunities.teaser.goalMeta")}</p>
          </Link>
        </div>}
        {top && <p className="relative mt-3 text-[10px] leading-relaxed text-gf-text-muted">{t("opportunities.sameAmountNote")} {t("opportunities.noGuarantee")}</p>}
      </div>
    </section>
  );
}
