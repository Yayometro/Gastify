"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { useLocale, useT } from "@/i18n/client";
import { fetchCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat } from "@/lib/features/subCategorySlice";
import type { AppDispatch } from "@/lib/store";
import type { PresentedPerson } from "@/lib/people/peopleService";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { shortDate } from "@gastify/core/i18n/dates";
import { sharedMovementIds, analyzePerson, MIN_TRIGGER_DAYS, type ContactFrequency, type ContactPattern, type PeopleMovement, type PersonLike } from "@gastify/core/transformers/peopleAnalysis";

type Person = PresentedPerson;
const EMPTY: never[] = [];
const RELATIONSHIPS = ["partner", "family", "friend", "coworker", "group", "other"] as const;
const FREQUENCIES: ContactFrequency[] = ["daily", "few_per_week", "weekly", "biweekly", "monthly", "sporadic"];
const PATTERNS: ContactPattern[] = ["weekdays", "weekends", "daily", "random", "custom"];
const SUBS = ["food", "outings", "gifts", "transport", "trips", "other"] as const;
const COLORS = ["#a855f7", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#14b8a6", "#ef4444", "#84cc16"];
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

const toLike = (person: Person): PersonLike => ({
  id: person.id,
  categoryId: person.categoryId,
  subCategoryIds: person.subCategoryIds,
  tagNames: person.tagNames,
  accountId: person.accountId,
  contact: { pattern: person.contact.pattern as ContactPattern, days: person.contact.days, frequency: person.contact.frequency as ContactFrequency },
  limit: person.limit,
});

interface Draft {
  name: string;
  relationship: (typeof RELATIONSHIPS)[number];
  frequency: ContactFrequency;
  pattern: ContactPattern;
  days: number[];
  subs: string[];
  tags: string;
  accountId: string;
  limitAmount: string;
  limitPeriod: "monthly" | "per_meeting";
}
const NEW_DRAFT: Draft = { name: "", relationship: "partner", frequency: "weekly", pattern: "weekends", days: [], subs: ["food", "outings"], tags: "", accountId: "", limitAmount: "", limitPeriod: "monthly" };

// "People": the people the spending is around. Each is a category (created with the person) with sub-categories; the analysis
// says how much, how often, whether the day's total changes and how it stands against the limit. Numbers come from core's
// analyzePerson. Wording is neutral on purpose: it describes spending, never the person.
export default function PeopleClient({ session }: { session?: string | null }): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const movements = (useSelector((state: unknown) => (state as { transacctionsReducer?: { data?: PeopleMovement[] } }).transacctionsReducer?.data) ?? EMPTY) as PeopleMovement[];
  const accounts = (useSelector((state: unknown) => (state as { accountsReducer?: { data?: { _id?: string; name?: string }[] } }).accountsReducer?.data) ?? EMPTY) as { _id?: string; name?: string }[];
  const currency = useSelector((state: unknown) => (state as { walletReducer?: { data?: { primaryCurrency?: string } } }).walletReducer?.data?.primaryCurrency) || "MXN";

  const [people, setPeople] = useState<Person[] | null>(null);
  const [wizard, setWizard] = useState(false);
  const [draft, setDraft] = useState<Draft>(NEW_DRAFT);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetcher().post("general-data/people/get", {});
      setPeople((response?.data ?? []) as Person[]);
    } catch {
      setPeople([]);
      runNotify("error", t("people.error"));
    }
  }, [t]);
  useEffect(() => {
    void load();
  }, [load]);

  const likes = useMemo(() => (people ?? []).filter((person) => !person.archived).map(toLike), [people]);
  const sharedIds = useMemo(() => sharedMovementIds(likes, movements), [likes, movements]);
  const analyses = useMemo(() => new Map((people ?? []).map((person) => [person.id, analyzePerson({ person: toLike(person), movements, months: 6, sharedIds })])), [people, movements, sharedIds]);
  const money = (value: number) => formatMoneyMajor(value, currency);
  const phrase = (pattern: string) => t(`people.phrase.${pattern}`);

  const card = "gf-glass-card border border-gf-border rounded-[32px] shadow-sm p-5 flex flex-col gap-3 text-left";
  const chip = (active: boolean) => `rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${active ? "border-purple-400 bg-purple-500/30 text-gf-text" : "border-white/15 bg-white/5 text-gf-text-muted hover:bg-white/10"}`;
  const label = "text-[11px] font-bold uppercase tracking-wide text-gf-text-muted";

  const create = async () => {
    setBusy(true);
    try {
      const body = {
        name: draft.name,
        relationship: draft.relationship,
        color: COLORS[(people?.length ?? 0) % COLORS.length],
        icon: "md/MdFavorite",
        subCategories: draft.subs.map((sub) => t(`people.wiz.sub.${sub}`)),
        tagNames: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        accountId: draft.accountId || null,
        contact: { pattern: draft.pattern, days: draft.pattern === "custom" ? draft.days : [], frequency: draft.frequency },
        limit: Number(draft.limitAmount) > 0 ? { amount: Number(draft.limitAmount), period: draft.limitPeriod } : null,
      };
      const response = await fetcher().post("general-data/people/new", body);
      if (!response?.ok && !response?.data) throw new Error("not saved");
      runNotify("ok", t("people.wiz.created", { p1: draft.name }));
      setWizard(false);
      setDraft(NEW_DRAFT);
      setStep(0);
      await load();
      dispatch(fetchCategories(session));
      dispatch(fetchSubCat(session));
    } catch {
      runNotify("error", t("people.error"));
    } finally {
      setBusy(false);
    }
  };

  const call = async (path: string, body: Record<string, unknown>, okKey: string) => {
    try {
      const response = await fetcher().post(`general-data/people/${path}`, body);
      if (!response?.ok && !response?.data) throw new Error("not saved");
      runNotify("ok", t(okKey));
      await load();
      dispatch(fetchCategories(session));
      dispatch(fetchSubCat(session));
      return true;
    } catch {
      runNotify("error", t("people.error"));
      return false;
    }
  };

  const open = people?.find((person) => person.id === openId) ?? null;
  const openAnalysis = open ? analyses.get(open.id) : null;
  const canNext = step === 0 ? draft.name.trim().length > 0 : true;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <p className="text-xs text-gf-text-muted">{t("people.wiz.q1Help")}</p>
            <label className={label} htmlFor="people-name">{t("people.wiz.name")}</label>
            <input id="people-name" type="text" maxLength={40} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t("people.wiz.namePlaceholder")} />
            <p className={label}>{t("people.wiz.relationship")}</p>
            <div className="flex flex-wrap gap-2">{RELATIONSHIPS.map((rel) => <button key={rel} type="button" onClick={() => setDraft({ ...draft, relationship: rel })} className={chip(draft.relationship === rel)}>{t(`people.relationship.${rel}`)}</button>)}</div>
          </>
        );
      case 1:
        return <div className="flex flex-wrap gap-2">{FREQUENCIES.map((value) => <button key={value} type="button" onClick={() => setDraft({ ...draft, frequency: value })} className={chip(draft.frequency === value)}>{t(`people.wiz.freq.${value}`)}</button>)}</div>;
      case 2:
        return (
          <>
            <p className="text-xs text-gf-text-muted">{t("people.wiz.q3Help")}</p>
            <div className="flex flex-wrap gap-2">{PATTERNS.map((value) => <button key={value} type="button" onClick={() => setDraft({ ...draft, pattern: value })} className={chip(draft.pattern === value)}>{t(`people.wiz.pattern.${value}`)}</button>)}</div>
            {draft.pattern === "custom" && (
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button key={day} type="button" onClick={() => setDraft({ ...draft, days: draft.days.includes(day) ? draft.days.filter((other) => other !== day) : [...draft.days, day] })} className={chip(draft.days.includes(day))}>
                    {new Date(2026, 0, 4 + day).toLocaleDateString(locale, { weekday: "short" })}
                  </button>
                ))}
              </div>
            )}
          </>
        );
      case 3:
        return (
          <>
            <p className="text-xs text-gf-text-muted">{t("people.wiz.q4Help")}</p>
            <div className="flex flex-wrap gap-2">{SUBS.map((sub) => <button key={sub} type="button" onClick={() => setDraft({ ...draft, subs: draft.subs.includes(sub) ? draft.subs.filter((other) => other !== sub) : [...draft.subs, sub] })} className={chip(draft.subs.includes(sub))}>{t(`people.wiz.sub.${sub}`)}</button>)}</div>
          </>
        );
      case 4:
        return (
          <>
            <p className="text-xs text-gf-text-muted">{t("people.wiz.q5Help")}</p>
            <label className={label} htmlFor="people-tags">{t("people.wiz.tags")}</label>
            <input id="people-tags" type="text" value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} />
            <p className={label}>{t("people.wiz.account")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setDraft({ ...draft, accountId: "" })} className={chip(draft.accountId === "")}>{t("people.wiz.noAccount")}</button>
              {accounts.map((account) => <button key={account._id} type="button" onClick={() => setDraft({ ...draft, accountId: String(account._id) })} className={chip(draft.accountId === String(account._id))}>{account.name}</button>)}
            </div>
          </>
        );
      default:
        return (
          <>
            <p className="text-xs text-gf-text-muted">{t("people.wiz.q6Help")}</p>
            <label className={label} htmlFor="people-limit">{t("people.wiz.limitAmount")}</label>
            <input id="people-limit" type="number" inputMode="decimal" min="0" value={draft.limitAmount} onChange={(event) => setDraft({ ...draft, limitAmount: event.target.value })} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraft({ ...draft, limitPeriod: "monthly" })} className={chip(draft.limitPeriod === "monthly")}>{t("people.wiz.limitMonthly")}</button>
              <button type="button" onClick={() => setDraft({ ...draft, limitPeriod: "per_meeting" })} className={chip(draft.limitPeriod === "per_meeting")}>{t("people.wiz.limitMeeting")}</button>
            </div>
            <p className={`${label} pt-2`}>{t("people.wiz.summary")}</p>
            <p className="text-sm text-gf-text">{draft.name} · {t(`people.relationship.${draft.relationship}`)} · {t(`people.wiz.freq.${draft.frequency}`)} · {phrase(draft.pattern)}</p>
          </>
        );
    }
  };

  const wizardTitles = ["people.wiz.q1", "people.wiz.q2", "people.wiz.q3", "people.wiz.q4", "people.wiz.q5", "people.wiz.q6"];

  return (
    <div className="w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
        <div className="w-full py-4 text-center text-white">
          <TitleWithHelp as="h1" title={t("people.title")} info={{ title: t("people.title"), text: t("people.help") }} tour="peopleList" titleClassName="text-2xl sm:text-3xl md:text-4xl font-thin" className="justify-center" />
        </div>
        <div className="content-profile-cont w-full content-wallet-glass text-center items-center mt-[10px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px] min-h-[calc(100dvh-120px)]">
          <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-4">
            <p className="text-sm text-gf-text-muted">{t("people.intro")}</p>
            <div className="flex justify-center">
              <button type="button" data-tour="people-add" onClick={() => { setDraft(NEW_DRAFT); setStep(0); setWizard(true); }} className="gf-glass-button rounded-3xl px-6 py-2 text-white font-semibold">{t("people.add")}</button>
            </div>
            {people !== null && people.length === 0 && <p className="py-6 text-sm text-gf-text-muted">{t("people.empty")}</p>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-tour="people-list">
              {(people ?? []).map((person) => {
                const analysis = analyses.get(person.id);
                const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                const spentMonth = analysis?.monthly.find((month) => month.month === monthKey)?.total ?? 0;
                return (
                  <button key={person.id} type="button" onClick={() => { setOpenId(person.id); setRemoving(false); }} className={`${card} hover:shadow-md ${person.archived ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: person.color || "#8b6acb" }}><UniversalCategoIcon type={person.icon || "md/MdFavorite"} siz={20} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-gf-text">{person.name}</p>
                        <p className="text-[11px] text-gf-text-muted">{t(`people.relationship.${person.relationship}`)} · {t(`people.wiz.freq.${person.contact.frequency}`)}{person.archived ? ` · ${t("people.card.archived")}` : ""}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className={label}>{t("people.card.month")}</p><p className="text-sm font-bold text-gf-text">{money(spentMonth)}</p></div>
                      <div><p className={label}>{t("people.card.avgOuting")}</p><p className="text-sm font-bold text-gf-text">{money(analysis?.totals.avgPerOuting ?? 0)}</p></div>
                    </div>
                    {analysis?.limit && (
                      <div className="flex flex-col gap-1">
                        <div className="h-2 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full" style={{ width: `${Math.min(100, analysis.limit.ratio * 100)}%`, backgroundColor: analysis.limit.ratio >= 1 ? "#ef4444" : analysis.limit.ratio >= 0.8 ? "#f59e0b" : "#a855f7" }} /></div>
                        <p className="text-[11px] text-gf-text-muted">{t("people.card.limit", { p1: money(analysis.limit.amount) })}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {(people ?? []).filter((person) => !person.archived).length > 1 && (
              <div className={card} data-tour="people-compare">
                <TitleWithHelp as="p" title={t("people.compare")} info={{ title: t("people.compare"), text: t("people.compareHelp") }} titleClassName="text-[13px] font-bold text-gf-text" />
                {(() => {
                  const rows = (people ?? []).filter((person) => !person.archived).map((person) => ({ person, total: analyses.get(person.id)?.totals.total ?? 0 })).sort((a, b) => b.total - a.total);
                  const max = Math.max(1, ...rows.map((row) => row.total));
                  return rows.map(({ person, total }) => (
                    <div key={person.id} className="flex items-center gap-2">
                      <span className="w-28 truncate text-xs text-gf-text">{person.name}</span>
                      <div className="h-2 flex-1 rounded-full bg-gf-surface-2 overflow-hidden"><div className="h-full rounded-full bg-purple-400" style={{ width: `${(total / max) * 100}%` }} /></div>
                      <span className="w-28 text-right text-xs font-semibold text-gf-text">{money(total)}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {wizard && (
        <Modal open onCancel={() => setWizard(false)} footer={null} width={520} className="gf-antd-modal-glass" zIndex={20000} title={<span className="inline-flex items-center text-purple-300 font-semibold text-base">{t(wizardTitles[step])}</span>}>
          <div className="flex flex-col gap-3 text-left" data-tour="people-wizard">
            <p className="text-[11px] text-gf-text-muted">{t("people.wiz.step", { p1: step + 1, p2: 6 })}</p>
            {renderStep()}
            <div className="flex justify-between pt-2">
              <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-gf-text-muted disabled:opacity-40">{t("people.wiz.back")}</button>
              {step < 5 ? (
                <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="gf-glass-button rounded-full px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{t("people.wiz.next")}</button>
              ) : (
                <button type="button" disabled={busy || !draft.name.trim()} onClick={() => void create()} className="gf-glass-button rounded-full px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? t("people.wiz.creating") : t("people.wiz.create")}</button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {open && openAnalysis && (
        <Modal open onCancel={() => setOpenId(null)} footer={null} width={640} className="gf-antd-modal-glass" zIndex={20000} title={<span className="inline-flex items-center text-purple-300 font-semibold text-base">{open.name}</span>}>
          <div className="flex flex-col gap-4 text-left" data-tour="people-detail">
            {openAnalysis.totals.count === 0 ? (
              <p className="text-xs text-gf-text-muted">{t("people.detail.empty")}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {[
                    [t("people.detail.total"), money(openAnalysis.totals.total)],
                    [t("people.detail.outings"), String(openAnalysis.totals.outings)],
                    [t("people.detail.avgOuting"), money(openAnalysis.totals.avgPerOuting)],
                    [t("people.detail.avgMonth"), money(openAnalysis.totals.avgPerMonth)],
                    [t("people.detail.share"), `${Math.round(openAnalysis.totals.shareOfSpending * 100)}%`],
                    [t("people.detail.trend"), openAnalysis.totals.trendPct === null ? t("people.detail.trendNone") : `${openAnalysis.totals.trendPct >= 0 ? "+" : ""}${Math.round(openAnalysis.totals.trendPct)}%`],
                  ].map(([name, value]) => (
                    <div key={name} className="rounded-2xl border border-gf-border bg-gf-surface/60 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gf-text-muted">{name}</p>
                      <p className="text-sm font-bold text-gf-text">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <p className={label}>{t("people.detail.monthly")}</p>
                  <div className="flex items-end gap-2" style={{ height: 90 }}>
                    {openAnalysis.monthly.map((month) => {
                      const peak = Math.max(1, ...openAnalysis.monthly.map((row) => row.total));
                      return (
                        <div key={month.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${month.month} · ${money(month.total)}`}>
                          <span className="w-full max-w-[34px] rounded-t-md bg-purple-400/70" style={{ height: `${Math.max(2, (month.total / peak) * 60)}px` }} />
                          <span className="text-[10px] text-gf-text-muted">{new Date(`${month.month}-15T12:00:00`).toLocaleDateString(locale, { month: "short" })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className={label}>{t("people.detail.contact")}</p>
                  <div className="flex items-end gap-2" style={{ height: 70 }}>
                    {WEEKDAYS.map((day) => {
                      const peak = Math.max(1, ...openAnalysis.contact.byWeekday);
                      return (
                        <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                          <span className="w-full max-w-[26px] rounded-t-md bg-pink-400/70" style={{ height: `${Math.max(2, (openAnalysis.contact.byWeekday[day] / peak) * 40)}px` }} />
                          <span className="text-[10px] text-gf-text-muted">{new Date(2026, 0, 4 + day).toLocaleDateString(locale, { weekday: "short" })}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gf-text-muted">
                    {openAnalysis.contact.declared === "match"
                      ? t("people.detail.contactMatch", { p1: phrase(open.contact.pattern) })
                      : openAnalysis.contact.declared === "different"
                        ? t("people.detail.contactDifferent", { p1: phrase(open.contact.pattern), p2: `${Math.round(openAnalysis.contact.weekendShare * 100)}%` })
                        : t("people.detail.contactUnknown", { p1: `${Math.round(openAnalysis.contact.weekendShare * 100)}%` })}{" "}
                    {t("people.detail.perWeek", { p1: openAnalysis.contact.perWeek.toFixed(1) })}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <p className={label}>{t("people.detail.trigger")}</p>
                  <p className="text-sm text-gf-text">
                    {!openAnalysis.trigger.enough || openAnalysis.trigger.liftPct === null
                      ? t("people.detail.triggerNone", { p1: MIN_TRIGGER_DAYS })
                      : Math.abs(openAnalysis.trigger.liftPct) < 5
                        ? t("people.detail.triggerSame")
                        : openAnalysis.trigger.liftPct > 0
                          ? t("people.detail.triggerMore", { p1: `${Math.round(openAnalysis.trigger.liftPct)}%` })
                          : t("people.detail.triggerLess", { p1: `${Math.round(Math.abs(openAnalysis.trigger.liftPct))}%` })}
                  </p>
                  <p className="text-[11px] text-gf-text-muted">{t("people.detail.triggerNote")}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <p className={label}>{t("people.detail.limit")}</p>
                  {openAnalysis.limit ? (
                    openAnalysis.limit.period === "monthly" ? (
                      <>
                        <p className="text-sm text-gf-text">{t("people.detail.limitMonthly", { p1: money(openAnalysis.limit.spent), p2: money(openAnalysis.limit.amount), p3: `${Math.round(openAnalysis.limit.ratio * 100)}%` })}</p>
                        {openAnalysis.limit.projected !== null && <p className="text-xs text-gf-text-muted">{t("people.detail.limitProjected", { p1: money(openAnalysis.limit.projected) })}</p>}
                        {openAnalysis.limit.outingsLeft !== null && <p className="text-xs text-gf-text-muted">{t("people.detail.limitLeft", { p1: openAnalysis.limit.outingsLeft })}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-gf-text">{t("people.detail.limitMeeting", { p1: money(openAnalysis.limit.spent), p2: money(openAnalysis.limit.amount), p3: `${Math.round(openAnalysis.limit.ratio * 100)}%` })}</p>
                    )
                  ) : (
                    <p className="text-xs text-gf-text-muted">{t("people.detail.limitNone")}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <p className={label}>{t("people.detail.subs")}</p>
                  {openAnalysis.subs.map((sub) => (
                    <div key={`${open.id}::${sub.id}`} className="flex items-center gap-2">
                      <span className="w-32 truncate text-xs text-gf-text">{sub.id === "none" ? t("people.detail.noSub") : sub.name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full bg-purple-400" style={{ width: `${sub.share * 100}%` }} /></div>
                      <span className="w-24 text-right text-xs font-semibold text-gf-text">{money(sub.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col">
                  <p className={label}>{t("people.detail.movements")}</p>
                  <div className="flex max-h-56 flex-col overflow-y-auto">
                    {openAnalysis.movements.slice(0, 40).map((movement, index) => (
                      <div key={`${movement.id}-${index}`} className="flex items-center justify-between gap-3 border-t border-gf-border py-1.5 first:border-t-0">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] text-gf-text">{movement.name}{movement.shared && <span title={t("people.detail.sharedNote")} className="ml-2 rounded-full border border-amber-300/50 px-1.5 text-[10px] text-amber-200">{t("people.detail.shared")}</span>}</p>
                          <p className="text-[11px] text-gf-text-muted">{shortDate(new Date(movement.date), locale)}</p>
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold text-red-300">{money(movement.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-gf-border pt-3">
              {removing ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gf-text">{t("people.detail.removeAsk")}</p>
                  <p className="text-[11px] text-gf-text-muted">{t("people.detail.removeNote")}</p>
                  <button type="button" onClick={async () => { if (await call("remove", { id: open.id, deleteCategory: false }, "people.detail.removed")) setOpenId(null); }} className="rounded-full border border-white/20 px-3 py-1 text-xs text-gf-text">{t("people.detail.removeKeep")}</button>
                  <button type="button" onClick={async () => { if (await call("remove", { id: open.id, deleteCategory: true }, "people.detail.removed")) setOpenId(null); }} className="rounded-full border border-red-300/60 px-3 py-1 text-xs text-red-200">{t("people.detail.removeAll")}</button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => void call("update", { id: open.id, archived: !open.archived }, "people.detail.saved")} className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-gf-text-muted">{open.archived ? t("people.detail.restore") : t("people.detail.archive")}</button>
                  <button type="button" onClick={() => setRemoving(true)} className="rounded-full border border-red-300/60 px-3 py-1 text-xs font-semibold text-red-200">{t("people.detail.remove")}</button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
