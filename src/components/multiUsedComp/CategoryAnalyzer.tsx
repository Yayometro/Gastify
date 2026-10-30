"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "antd";
import { useSelector } from "react-redux";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import { idOf } from "@gastify/core/categories/categoryForm";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { shortDate } from "@gastify/core/i18n/dates";
import { normalizeText } from "@gastify/core/search/normalizeText";
import { movementKind } from "@gastify/core/transactions/monthSummary";
import { analyzeCategory, NO_SUBCATEGORY, type CategoryAnalysisKind, type CategoryAnalysisMovement } from "@gastify/core/transformers/categoryAnalysis";
import { useLocale, useT } from "@/i18n/client";
import type { RootState } from "@/lib/store";

interface CategoryLike {
  _id?: string;
  name?: string;
  icon?: string;
  color?: string;
}

const RANGES = [3, 6, 12] as const;
const EMPTY: never[] = [];

// The analyzer of one category (the "Analizador" tab of Categorías): pick a category and see its total month by month, how it
// splits among its sub-categories and tags, and its biggest movements. The numbers come from core's analyzeCategory.
export default function CategoryAnalyzer({ initialCategoryId = "" }: { initialCategoryId?: string }): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const categoriesState = useSelector((state: RootState) => (state as unknown as { categoriesReducer?: { data?: { user?: CategoryLike[]; default?: CategoryLike[] } } }).categoriesReducer?.data);
  const subState = useSelector((state: RootState) => (state as unknown as { subCategoryReducer?: { data?: { subCat?: CategoryLike[]; default?: CategoryLike[] } } }).subCategoryReducer?.data);
  const movements = (useSelector((state: RootState) => (state as unknown as { transacctionsReducer?: { data?: CategoryAnalysisMovement[] } }).transacctionsReducer?.data) ?? EMPTY) as CategoryAnalysisMovement[];
  const currency = useSelector((state: RootState) => (state as unknown as { walletReducer?: { data?: { primaryCurrency?: string } } }).walletReducer?.data?.primaryCurrency) || "MXN";

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<CategoryAnalysisKind>("expense");
  const [months, setMonths] = useState<(typeof RANGES)[number]>(6);
  const [subIndex, setSubIndex] = useState(0);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const categories = useMemo(() => [...(categoriesState?.user ?? []), ...(categoriesState?.default ?? [])], [categoriesState]);
  const subNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const sub of [...(subState?.subCat ?? []), ...(subState?.default ?? [])]) if (sub._id) names[String(sub._id)] = sub.name || "";
    return names;
  }, [subState]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const movement of movements) {
      if (movementKind(movement as never) === "transfer") continue;
      const id = idOf(movement.category);
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [movements]);
  const ranked = useMemo(() => [...categories].filter((category) => counts.has(String(category._id))).sort((a, b) => (counts.get(String(b._id)) ?? 0) - (counts.get(String(a._id)) ?? 0)), [categories, counts]);

  const selected = categories.find((category) => String(category._id) === categoryId) ?? null;
  const analysis = useMemo(
    () => (selected ? analyzeCategory({ categoryId, movements, kind, months, subNames }) : null),
    [selected, categoryId, movements, kind, months, subNames]
  );

  const money = (value: number) => formatMoneyMajor(value, currency);
  const monthLabel = (key: string, long = false) => new Date(`${key}-15T12:00:00`).toLocaleDateString(locale, long ? { month: "long", year: "numeric" } : { month: "short" });
  const needle = normalizeText(query);
  const matches = needle ? categories.filter((category) => normalizeText(category.name || "").includes(needle)) : ranked.slice(0, 12);
  const subName = (id: string, fallback: string) => (id === NO_SUBCATEGORY ? t("categories.analyzer.noSub") : fallback || subNames[id] || "");

  const sectionTitle = "text-[13px] font-bold text-gf-text";
  const chip = (active: boolean) => `rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${active ? "border-purple-400 bg-purple-500/30 text-gf-text" : "border-white/15 bg-white/5 text-gf-text-muted hover:bg-white/10"}`;
  const card = "gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 flex flex-col gap-3 text-left";

  const maxMonth = analysis ? Math.max(1, ...analysis.months.map((month) => month.total)) : 1;
  const keyOfTime = (time: number) => `${new Date(time).getFullYear()}-${String(new Date(time).getMonth() + 1).padStart(2, "0")}`;
  const monthDetail = analysis && openMonth ? analysis.movements.filter((row) => keyOfTime(row.date) === openMonth).sort((a, b) => b.amount - a.amount) : [];
  const safeSubIndex = analysis ? Math.min(subIndex, Math.max(0, analysis.subs.length - 1)) : 0;
  const activeSub = analysis?.subs[safeSubIndex];

  const row = (movement: { id: string; name: string; date: number; amount: number }, index: number) => (
    <div key={`${movement.id}-${index}`} className="flex items-center justify-between gap-3 border-t border-gf-border py-1.5 first:border-t-0">
      <div className="min-w-0">
        <p className="truncate text-[13px] text-gf-text">{movement.name}</p>
        <p className="text-[11px] text-gf-text-muted">{shortDate(new Date(movement.date), locale)}</p>
      </div>
      <span className={`shrink-0 text-[13px] font-semibold ${kind === "expense" ? "text-red-300" : "text-green-300"}`}>{money(movement.amount)}</span>
    </div>
  );

  return (
    <div className="flex w-full max-w-[1100px] flex-col gap-4" data-tour="cat-an">
      <div className={card} data-tour="cat-an-selector">
        <TitleWithHelp as="p" title={t("categories.analyzer.pick")} info={{ title: t("categories.analyzer.pick"), text: t("categories.analyzer.pickHelp") }} tour="catAnalyzer" titleClassName={sectionTitle} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("categories.analyzer.search")} className="h-10 w-full rounded-3xl gf-glass-inset px-4 text-gf-text" />
        {!needle && !selected && <p className="text-[11px] font-bold uppercase tracking-wide text-gf-text-muted">{t("categories.analyzer.shortcuts")}</p>}
        <div className="flex flex-wrap gap-2">
          {matches.map((category) => (
            <button key={String(category._id)} type="button" onClick={() => { setCategoryId(String(category._id)); setSubIndex(0); }} className={`${chip(categoryId === String(category._id))} flex items-center gap-1.5`}>
              <span className="grid h-5 w-5 place-items-center rounded-full text-white" style={{ backgroundColor: category.color || "#8b6acb" }}>
                <UniversalCategoIcon type={category.icon || "md/MdCategory"} siz={12} />
              </span>
              {category.name}
              <span className="text-[10px] font-normal opacity-70">{t("categories.analyzer.moves", { p1: counts.get(String(category._id)) ?? 0 })}</span>
            </button>
          ))}
          {needle && matches.length === 0 && <p className="text-xs text-gf-text-muted">{t("categories.analyzer.noMatch", { p1: query })}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" onClick={() => setKind("expense")} className={chip(kind === "expense")}>{t("categories.analyzer.expenses")}</button>
          <button type="button" onClick={() => setKind("income")} className={chip(kind === "income")}>{t("categories.analyzer.incomes")}</button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-purple-300/40" />
          {RANGES.map((range) => (
            <button key={range} type="button" onClick={() => setMonths(range)} className={chip(months === range)}>{t(`categories.analyzer.range${range}`)}</button>
          ))}
        </div>
      </div>

      {!selected || !analysis ? (
        <p className="py-6 text-center text-sm text-gf-text-muted">{t("categories.analyzer.emptyPick")}</p>
      ) : analysis.stats.count === 0 ? (
        <p className="py-6 text-center text-sm text-gf-text-muted">{t("categories.analyzer.noMoves")}</p>
      ) : (
        <>
          <div className={card} data-tour="cat-an-bars">
            <TitleWithHelp as="p" title={`${t("categories.analyzer.byMonth")} · ${selected.name}`} info={{ title: t("categories.analyzer.byMonth"), text: t("categories.analyzer.byMonthHelp") }} titleClassName={sectionTitle} />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                [t("categories.analyzer.total"), money(analysis.stats.total)],
                [t("categories.analyzer.average"), money(analysis.stats.avgMonthly)],
                [t("categories.analyzer.highest"), analysis.stats.max ? `${monthLabel(analysis.stats.max.month)} · ${money(analysis.stats.max.total)}` : "—"],
                [t("categories.analyzer.change"), analysis.stats.deltaPct === null ? t("categories.analyzer.changeNone") : `${analysis.stats.deltaPct >= 0 ? "+" : ""}${Math.round(analysis.stats.deltaPct)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-gf-border bg-gf-surface/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gf-text-muted">{label}</p>
                  <p className="text-sm font-bold text-gf-text">{value}</p>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="flex items-end gap-2" style={{ height: 150 }}>
                {analysis.months.map((month, position) => {
                  const current = position === analysis.months.length - 1;
                  return (
                    <button key={month.month} type="button" onClick={() => setOpenMonth(month.month)} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" aria-label={`${monthLabel(month.month, true)} ${money(month.total)}`}>
                      <span className="text-[10px] font-semibold text-gf-text-muted opacity-0 transition-opacity group-hover:opacity-100">{money(month.total)}</span>
                      <span className={`w-full max-w-[44px] rounded-t-md transition-colors ${current ? "bg-purple-400 group-hover:bg-purple-300" : "bg-purple-500/60 group-hover:bg-purple-400"}`} style={{ height: `${Math.max(2, (month.total / maxMonth) * 108)}px` }} />
                      <span className="text-[11px] font-semibold text-gf-text-muted">{monthLabel(month.month)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-white/40" style={{ bottom: 20 + (analysis.stats.avgMonthly / maxMonth) * 108 }}>
                <span className="absolute left-0 -top-4 text-[10px] text-gf-text-muted">{t("categories.analyzer.averageLine", { p1: money(analysis.stats.avgMonthly) })}</span>
              </div>
            </div>
          </div>

          <div className={card} data-tour="cat-an-tags">
            <TitleWithHelp as="p" title={t("categories.analyzer.tags")} info={{ title: t("categories.analyzer.tags"), text: t("categories.analyzer.tagsHelp") }} titleClassName={sectionTitle} />
            {analysis.tags.length === 0 ? (
              <p className="text-xs text-gf-text-muted">{t("categories.analyzer.noTags")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analysis.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-gf-text">
                    {tag.name} · {money(tag.total)} <span className="opacity-60">({tag.count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={card} data-tour="cat-an-subs">
            <TitleWithHelp as="p" title={t("categories.analyzer.subs")} info={{ title: t("categories.analyzer.subs"), text: t("categories.analyzer.subsHelp") }} titleClassName={sectionTitle} />
            {activeSub && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" aria-label={t("categories.analyzer.prev")} disabled={safeSubIndex === 0} onClick={() => setSubIndex(safeSubIndex - 1)} className="rounded-full border border-white/20 px-2.5 py-1 text-xs disabled:opacity-40">←</button>
                  {analysis.subs.map((sub, position) => (
                    <button key={`${categoryId}::${sub.id}`} type="button" onClick={() => setSubIndex(position)} className={chip(position === safeSubIndex)}>{subName(sub.id, sub.name)}</button>
                  ))}
                  <button type="button" aria-label={t("categories.analyzer.next")} disabled={safeSubIndex >= analysis.subs.length - 1} onClick={() => setSubIndex(safeSubIndex + 1)} className="rounded-full border border-white/20 px-2.5 py-1 text-xs disabled:opacity-40">→</button>
                </div>
                <p className="text-sm font-bold text-gf-text">{subName(activeSub.id, activeSub.name)} · {money(activeSub.total)} <span className="text-xs font-normal text-gf-text-muted">({t("categories.analyzer.subShare", { p1: `${Math.round(activeSub.share * 100)}%` })})</span></p>
                <div className="flex items-end gap-2" style={{ height: 110 }}>
                  {analysis.months.map((month, position) => {
                    const peak = Math.max(1, ...activeSub.monthly);
                    return (
                      <div key={month.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${monthLabel(month.month, true)} · ${money(activeSub.monthly[position])}`}>
                        <span className="w-full max-w-[36px] rounded-t-md bg-purple-400/70" style={{ height: `${Math.max(2, (activeSub.monthly[position] / peak) * 76)}px` }} />
                        <span className="text-[10px] font-semibold text-gf-text-muted">{monthLabel(month.month)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col">
                  {analysis.movements.filter((movement) => movement.subCategoryId === activeSub.id).sort((a, b) => b.amount - a.amount).slice(0, 5).map(row)}
                </div>
              </>
            )}
          </div>

          <div className={card} data-tour="cat-an-top">
            <TitleWithHelp as="p" title={t("categories.analyzer.top")} info={{ title: t("categories.analyzer.top"), text: t("categories.analyzer.topHelp") }} titleClassName={sectionTitle} />
            <div className="flex flex-col">{analysis.top.map(row)}</div>
          </div>

          <div className={card} data-tour="cat-an-list">
            <TitleWithHelp as="p" title={t("categories.analyzer.list")} info={{ title: t("categories.analyzer.list"), text: t("categories.analyzer.listHelp") }} titleClassName={sectionTitle} />
            <div className="flex max-h-[420px] flex-col overflow-y-auto pr-1">{analysis.movements.map(row)}</div>
          </div>
        </>
      )}

      {openMonth && analysis && (
        <Modal open onCancel={() => setOpenMonth(null)} footer={null} width={560} className="gf-antd-modal-glass" zIndex={20000} title={<span className="text-purple-300 font-semibold text-base">{t("categories.analyzer.monthTitle", { p1: selected?.name ?? "", p2: monthLabel(openMonth, true) })}</span>}>
          {monthDetail.length === 0 ? (
            <p className="text-xs text-gf-text-muted">{t("categories.analyzer.monthEmpty")}</p>
          ) : (
            <>
              <p className="mb-2 text-sm font-bold text-gf-text">{money(analysis.months.find((month) => month.month === openMonth)?.total ?? 0)}</p>
              <div className="flex flex-col">{monthDetail.map(row)}</div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
