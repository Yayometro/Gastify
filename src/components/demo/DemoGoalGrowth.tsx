"use client";

import { useState } from "react";
import Link from "next/link";
import { IoArrowForward, IoPause, IoPlay, IoSparkles, IoWalletOutline } from "react-icons/io5";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { useT } from "@/i18n/client";
import type { DemoSection } from "@/app/demo/DemoWorkspace";

function SampleBadge() {
  const t = useT();
  return <span className="rounded-full border border-rose-200/20 bg-rose-300/10 px-2.5 py-1 text-[10px] font-medium text-rose-100">{t("shared.demo.guide.sampleData")}</span>;
}

export default function DemoGoalGrowth({ section }: { section: Extract<DemoSection, "goals" | "opportunities"> }): React.JSX.Element {
  const t = useT();
  const [paused, setPaused] = useState(false);
  const [targetDate, setTargetDate] = useState("2027-01-15");
  const [share, setShare] = useState(25);
  const [category, setCategory] = useState("smoking");

  if (section === "goals") {
    const target = 260_000;
    const saved = 78_000;
    const spentOnProject = 24_770;
    const percent = saved / target;
    return (
      <main className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="gf-glass-card rounded-3xl border border-gf-border p-4 sm:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-2xl">✈️</span><div><p className="text-xs uppercase tracking-widest text-purple-200">{t("goals.template.travel")}</p><h1 className="mt-1 text-2xl font-semibold text-gf-text">{t("goals.demo.japanTitle")}</h1></div></div>
            <SampleBadge />
          </header>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gf-border bg-gf-surface/50 p-4"><p className="text-xs text-gf-text-muted">{t("goals.progress")}</p><strong className="mt-2 block text-xl text-gf-text">{formatMoneyMajor(saved, "MXN")}</strong></div>
            <div className="rounded-2xl border border-gf-border bg-gf-surface/50 p-4"><p className="text-xs text-gf-text-muted">{t("goals.target")}</p><strong className="mt-2 block text-xl text-gf-text">{formatMoneyMajor(target, "MXN")}</strong></div>
            <div className="rounded-2xl border border-gf-border bg-gf-surface/50 p-4"><p className="text-xs text-gf-text-muted">{t("goals.remaining")}</p><strong className="mt-2 block text-xl text-gf-text">{formatMoneyMajor(target - saved, "MXN")}</strong></div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-purple-300" style={{ width: `${percent * 100}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs text-gf-text-muted"><span>{t("goals.status." + (paused ? "paused" : "active"))}</span><span>{Math.round(percent * 100)}%</span></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-gf-border p-4"><h2 className="font-semibold text-gf-text">{t("goals.targetDate")}</h2><div className="mt-3 flex gap-2">{["2027-01-15", "2027-02-15"].map((date) => <button key={date} type="button" aria-pressed={targetDate === date} onClick={() => setTargetDate(date)} className={`rounded-xl border px-3 py-2 text-xs ${targetDate === date ? "border-purple-300 bg-purple-300/10 text-purple-100" : "border-gf-border text-gf-text-muted"}`}>{date === "2027-01-15" ? "Enero 2027" : "Febrero 2027"}</button>)}</div><p className="mt-3 text-xs text-gf-text-muted">{t("goals.demo.step1")}</p></article>
            <article className="rounded-2xl border border-gf-border p-4"><h2 className="font-semibold text-gf-text">{t("goals.context")}</h2><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-purple-300/10 px-3 py-1.5 text-xs text-purple-100">Proyecto: Viaje a Japón</span><span className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100">Etiqueta: #viaje-a-japon</span></div><p className="mt-3 text-xs text-gf-text-muted">{t("goals.demo.step2")}</p></article>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/[.04] p-4"><div><p className="text-sm font-semibold text-gf-text">{t("goals.demo.projectSpendingTitle")}</p><p className="mt-1 text-xs text-gf-text-muted">{t("goals.demo.projectSpendingInfo")}</p></div><strong className="text-lg text-amber-100">{formatMoneyMajor(spentOnProject, "MXN")}</strong></div>
          <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => setPaused((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-gf-border px-4 py-2 text-sm text-gf-text">{paused ? <IoPlay /> : <IoPause />}{paused ? t("goals.resume") : t("goals.pause")}</button><Link href="/demo/budgets" className="ml-auto inline-flex items-center gap-2 rounded-full border border-gf-border px-4 py-2 text-sm text-purple-100">{t("goals.backToBudgets")}<IoArrowForward /></Link></div>
          <p className="mt-4 text-xs leading-relaxed text-gf-text-muted">{t("goals.demo.step3")}</p>
        </section>
        <aside className="grid content-start gap-4">
          <section className="gf-glass-card rounded-3xl border border-gf-border p-5"><div className="flex items-center gap-2 text-purple-200"><IoWalletOutline /><h2 className="font-semibold text-gf-text">{t("goals.demo.planTitle")}</h2></div><p className="mt-3 text-sm leading-relaxed text-gf-text-muted">{t("goals.demo.planExplanation")}</p><div className="mt-4 rounded-2xl border border-gf-border p-4"><p className="text-xs text-gf-text-muted">{t("goals.targetDate")}</p><strong className="mt-1 block text-lg text-gf-text">{targetDate === "2027-01-15" ? t("goals.demo.selectedDateJanuary") : t("goals.demo.selectedDateFebruary")}</strong><p className="mt-2 text-xs text-gf-text-muted">{t("goals.demo.dateExplanation")}</p></div></section>
          <Link href="/demo/opportunities" className="gf-glass-card flex items-center justify-between gap-4 rounded-3xl border border-purple-300/15 p-5"><span><span className="block text-xs uppercase tracking-widest text-purple-200">{t("opportunities.title")}</span><span className="mt-1 block text-sm text-gf-text">{t("goals.demo.opportunityCta")}</span></span><IoArrowForward className="shrink-0 text-purple-200" /></Link>
        </aside>
      </main>
    );
  }

  const recorded = category === "smoking" ? 53_000 : category === "oxxo" ? 38_420 : 24_770;
  const principal = recorded * share / 100;
  const futureValue = principal * Math.pow(1.06, 3);
  const interest = futureValue - principal;
  const travelCoverage = Math.min(100, principal / 260_000 * 100);
  const carGoalCoverage = Math.min(100, (10_000 + principal) / 60_000 * 100);
  return (
    <main className="mx-auto w-full max-w-7xl">
      <section className="gf-glass-card rounded-3xl border border-gf-border p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-purple-200">{t("opportunities.title")}</p><h1 className="mt-2 text-2xl font-semibold text-gf-text">{t("opportunities.demo.heading")}</h1><p className="mt-2 max-w-3xl text-sm text-gf-text-muted">{t("opportunities.demo.intro")}</p></div><SampleBadge /></header>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-gf-border bg-gf-surface/40 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-gf-text-muted">{t("opportunities.selectedSpend")}</p><strong className="mt-1 block text-3xl text-gf-text">{formatMoneyMajor(recorded, "MXN")}</strong></div><div className="flex gap-2">{["smoking", "oxxo", "travel"].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-3 py-1.5 text-xs ${category === item ? "border-purple-300 bg-purple-300/10 text-purple-100" : "border-gf-border text-gf-text-muted"}`}>{item === "smoking" ? "Cigarros" : item === "oxxo" ? "OXXO" : "Vuelos"}</button>)}</div></div><div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-2 text-xs text-gf-text-muted">{t("opportunities.customShare")}</span>{[25, 50, 100].map((item) => <button key={item} type="button" aria-pressed={share === item} onClick={() => setShare(item)} className={`rounded-full border px-4 py-2 text-sm ${share === item ? "border-purple-300 bg-purple-300/10 text-purple-100" : "border-gf-border text-gf-text-muted"}`}>{item}%</button>)}<strong className="ml-auto text-sm text-purple-100">{formatMoneyMajor(principal, "MXN")}</strong></div><p className="mt-3 text-xs leading-relaxed text-gf-text-muted">{t("opportunities.rangeWarning")}</p></div>
          <div className="rounded-2xl border border-purple-300/15 bg-purple-300/[.04] p-4"><div className="flex items-center gap-2"><IoSparkles className="text-purple-200" /><h2 className="font-semibold text-gf-text">{t("opportunities.demo.sameMoneyHeading")}</h2></div><p className="mt-3 text-sm leading-relaxed text-gf-text-muted">{t("opportunities.demo.step2")}</p></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-gf-border bg-gf-surface/35 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200"><IoSparkles size={19} /></span><h2 className="mt-3 font-semibold text-gf-text">{t("opportunities.investment")}</h2><p className="mt-2 text-xs text-gf-text-muted">{t("opportunities.todayModel")} · 6% anual ilustrativo · 3 años</p><strong className="mt-3 block text-xl text-gf-text">{formatMoneyMajor(futureValue, "MXN")}</strong><p className="mt-1 text-xs text-emerald-200">+{formatMoneyMajor(interest, "MXN")} en este supuesto</p></article>
          <article className="rounded-2xl border border-gf-border bg-gf-surface/35 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">✈️</span><h2 className="mt-3 font-semibold text-gf-text">{t("opportunities.travel")}</h2><p className="mt-2 text-xs text-gf-text-muted">Viaje de ejemplo · meta editable de $260,000</p><strong className="mt-3 block text-xl text-gf-text">{travelCoverage.toFixed(1)}% de la meta</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${travelCoverage}%` }} /></div></article>
          <article className="rounded-2xl border border-gf-border bg-gf-surface/35 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/10 text-amber-200">🚗</span><h2 className="mt-3 font-semibold text-gf-text">{t("opportunities.downPayment")}</h2><p className="mt-2 text-xs text-gf-text-muted">Meta de enganche de ejemplo · $60,000, con $10,000 actuales</p><strong className="mt-3 block text-xl text-gf-text">{carGoalCoverage.toFixed(1)}% de la meta</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-gf-surface-2"><div className="h-full rounded-full bg-amber-300" style={{ width: `${carGoalCoverage}%` }} /></div></article>
        </div>
        <p className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-200/[.04] p-4 text-xs leading-relaxed text-amber-50/80">{t("opportunities.demo.step3")}</p>
        <Link href="/demo/goals" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-100">{t("goals.title")}<IoArrowForward /></Link>
      </section>
    </main>
  );
}
