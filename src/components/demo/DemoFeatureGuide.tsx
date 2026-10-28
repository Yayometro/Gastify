"use client";

import { useState } from "react";
import {
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoBulbOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from "react-icons/io5";
import { useT } from "@/i18n/client";
import type { DemoSection } from "@/app/demo/DemoWorkspace";

type GuideSection = Exclude<DemoSection, "dashboard">;

const guideSections: Record<GuideSection, { title: string; steps: readonly [string, string, string] }> = {
  profile: { title: "shared.demo.guide.profile.title", steps: ["shared.demo.guide.profile.step1", "shared.demo.guide.profile.step2", "shared.demo.guide.profile.step3"] },
  movements: { title: "shared.demo.guide.movements.title", steps: ["shared.demo.guide.movements.step1", "shared.demo.guide.movements.step2", "shared.demo.guide.movements.step3"] },
  budgets: { title: "shared.demo.guide.budgets.title", steps: ["shared.demo.guide.budgets.step1", "shared.demo.guide.budgets.step2", "shared.demo.guide.budgets.step3"] },
  projections: { title: "shared.demo.guide.projections.title", steps: ["shared.demo.guide.projections.step1", "shared.demo.guide.projections.step2", "shared.demo.guide.projections.step3"] },
  analyzer: { title: "shared.demo.guide.analyzer.title", steps: ["shared.demo.guide.analyzer.step1", "shared.demo.guide.analyzer.step2", "shared.demo.guide.analyzer.step3"] },
  accounts: { title: "shared.demo.guide.accounts.title", steps: ["shared.demo.guide.accounts.step1", "shared.demo.guide.accounts.step2", "shared.demo.guide.accounts.step3"] },
  history: { title: "shared.demo.guide.history.title", steps: ["shared.demo.guide.history.step1", "shared.demo.guide.history.step2", "shared.demo.guide.history.step3"] },
  categories: { title: "shared.demo.guide.categories.title", steps: ["shared.demo.guide.categories.step1", "shared.demo.guide.categories.step2", "shared.demo.guide.categories.step3"] },
};

export default function DemoFeatureGuide({ section }: { section: GuideSection }): React.JSX.Element {
  const t = useT();
  const [stepIndex, setStepIndex] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const guide = guideSections[section];
  const stepKey = guide.steps[stepIndex];

  return (
    <section className="mb-4 rounded-2xl border border-purple-200/20 bg-gradient-to-r from-purple-400/10 via-indigo-400/5 to-transparent p-3.5 shadow-[inset_0_1px_rgba(255,255,255,.04)] sm:mb-5 sm:p-4" aria-label={t("shared.demo.guide.ariaLabel", { p1: t(guide.title) })}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-purple-200/20 bg-purple-300/10 text-purple-100" aria-hidden="true">
          <IoBulbOutline size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-purple-200">{t("shared.demo.guide.eyebrow")}</span>
            <span className="rounded-full border border-white/10 bg-black/10 px-2 py-0.5 text-[9px] text-purple-100/70">{t("shared.demo.guide.sampleData")}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white sm:text-base">{t(guide.title)}</h2>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-purple-100/80 transition hover:bg-white/5 hover:text-white"
            >
              {expanded ? t("shared.demo.guide.hide") : t("shared.demo.guide.show")}
              {expanded ? <IoChevronUpOutline aria-hidden="true" /> : <IoChevronDownOutline aria-hidden="true" />}
            </button>
          </div>

          {expanded && (
            <div className="mt-2.5" aria-live="polite">
              <p className="max-w-4xl text-xs leading-relaxed text-purple-50/85 sm:text-[13px]">{t(stepKey)}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5" role="group" aria-label={t("shared.demo.guide.steps") }>
                  {guide.steps.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-current={index === stepIndex ? "step" : undefined}
                      aria-label={t("shared.demo.guide.showStep", { p1: index + 1 })}
                      onClick={() => setStepIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-7 bg-purple-200" : "w-3 bg-purple-100/25 hover:bg-purple-100/50"}`}
                    />
                  ))}
                  <span className="ml-1 text-[10px] tabular-nums text-purple-100/65">{t("shared.demo.guide.stepCount", { p1: stepIndex + 1, p2: guide.steps.length })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" aria-label={t("shared.demo.guide.previous")} onClick={() => setStepIndex((current) => (current + guide.steps.length - 1) % guide.steps.length)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[.03] text-purple-100 transition hover:bg-white/10">
                    <IoArrowBackOutline aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={t("shared.demo.guide.next")} onClick={() => setStepIndex((current) => (current + 1) % guide.steps.length)} className="grid h-8 w-8 place-items-center rounded-full border border-purple-200/25 bg-purple-300/10 text-purple-50 transition hover:bg-purple-300/20">
                    <IoArrowForwardOutline aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
