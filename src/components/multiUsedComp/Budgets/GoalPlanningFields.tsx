"use client";

import React, { useEffect, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import type { GoalDetails, GoalFrequency, GoalTemplate } from "@gastify/core/goals/types";
import { majorToMinor, minorToMajor } from "@gastify/core/money/currencies";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import IconDisplayerMenu from "../IconDisplayerMenu";
import CategoryColorPicker from "../CategoryColorPicker";
import fetcher from "@/helpers/fetcher";

export interface GoalContextChoice {
  id: string;
  label: string;
}

function dayInBrowserTimeZone(): string {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

export default function GoalPlanningFields({
  details,
  onChange,
  currency,
  amount,
  onAmountChange,
  icon,
  onIconChange,
  color,
  onColorChange,
  categories,
  subCategories,
  tags,
  spendingBudgets,
  projects,
  t,
}: {
  details: GoalDetails;
  onChange: (next: GoalDetails) => void;
  currency: string;
  amount: string | number;
  onAmountChange: (amount: number) => void;
  icon: string;
  onIconChange: (icon: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  categories: GoalContextChoice[];
  subCategories: GoalContextChoice[];
  tags: GoalContextChoice[];
  spendingBudgets: GoalContextChoice[];
  projects: GoalContextChoice[];
  t: TranslateFn;
}): React.JSX.Element {
  const [incomeSources, setIncomeSources] = useState<Array<{ _id: string; name?: string; recurrence?: GoalFrequency; anchorDate?: string | Date }>>([]);
  const scheduleEnabled = Boolean(details.schedule);
  useEffect(() => {
    if (!scheduleEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetcher().post("general-data/income-sources/get", {}) as { ok?: boolean; data?: Array<{ _id?: string; name?: string; recurrence?: GoalFrequency; anchorDate?: string | Date }> };
        if (cancelled || !response.ok || !Array.isArray(response.data)) return;
        setIncomeSources(response.data.filter((item): item is { _id: string; name?: string; recurrence?: GoalFrequency; anchorDate?: string | Date } => typeof item._id === "string"));
      } catch {
        if (!cancelled) setIncomeSources([]);
      }
    })();
    return () => { cancelled = true; };
  }, [scheduleEnabled]);
  const patch = (changes: Partial<GoalDetails>) => onChange({ ...details, ...changes });
  const setSchedule = (changes: Partial<NonNullable<GoalDetails["schedule"]>> | null) => {
    if (!changes) return patch({ schedule: null });
    patch({
      schedule: {
        mode: details.schedule?.mode || "required_by_date",
        frequency: details.schedule?.frequency || "monthly",
        anchorDate: details.schedule?.anchorDate || dayInBrowserTimeZone(),
        monthDays: details.schedule?.monthDays || [15, "last"],
        incomeSourceId: details.schedule?.incomeSourceId || null,
        ...(details.schedule || {}),
        ...changes,
      },
    });
  };
  const setContext = (key: keyof GoalDetails["context"], id: string) => {
    const values = details.context[key];
    patch({
      context: {
        ...details.context,
        [key]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id],
      },
    });
  };
  const percent = details.downPaymentInput?.mode === "percent" ? details.downPaymentInput.basisPoints / 100 : 20;
  const setDownPaymentMode = (mode: "percent" | "amount") => {
    if (mode === "amount") {
      patch({ downPaymentInput: { mode: "amount" } });
      return;
    }
    const priceMinor = details.assetPriceMoney?.amountMinor || 0;
    const amountMinor = majorToMinor(Number(amount) || 0, currency);
    const basisPoints = priceMinor > 0
      ? Math.min(10000, Math.max(100, Math.round(amountMinor / priceMinor * 10000)))
      : 2000;
    patch({ downPaymentInput: { mode: "percent", basisPoints } });
    if (priceMinor > 0) onAmountChange(minorToMajor(Math.round(priceMinor * basisPoints / 10000), currency));
  };
  const setPercent = (value: number) => {
    const basisPoints = Math.min(10000, Math.max(100, Math.round(value * 100)));
    const price = details.assetPriceMoney ? minorToMajor(details.assetPriceMoney.amountMinor, details.assetPriceMoney.currency) : 0;
    patch({ downPaymentInput: { mode: "percent", basisPoints } });
    if (price > 0) onAmountChange(minorToMajor(majorToMinor(price * basisPoints / 10000, currency), currency));
  };
  const selectedTags = new Set(details.context.tagIds);

  return (
    <section className="mt-2 flex flex-col gap-3 rounded-2xl border border-purple-300/20 bg-purple-400/5 p-4">
      <div>
        <p className="font-semibold text-purple-200">{t("goals.template")}</p>
        <select value={details.template} onChange={(event) => patch({ template: event.target.value as GoalTemplate })} className="etm-selector mt-2 w-full bg-gf-surface">
          {(["custom", "car", "home", "travel", "business", "health", "emergency"] as const).map((template) => <option key={template} value={template}>{t("goals.template." + template)}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="label-tfp">{t("goals.targetDate")}</span>
          <DatePicker allowClear format="DD/MM/YYYY" value={details.targetDate ? dayjs(details.targetDate) : null} onChange={(value) => patch({ targetDate: value?.format("YYYY-MM-DD") || null })} className="h-10 w-full" />
        </label>
        <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.priority")}</span><select value={details.priority} onChange={(event) => patch({ priority: Number(event.target.value) })} className="etm-selector bg-gf-surface"><option value={1}>{t("goals.priority.high")}</option><option value={3}>{t("goals.priority.normal")}</option><option value={5}>{t("goals.priority.low")}</option></select></label>
      </div>
      {(details.template === "car" || details.template === "home") && <>
        <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.targetMode")}</span><select value={details.targetMode} onChange={(event) => patch({ targetMode: event.target.value as GoalDetails["targetMode"] })} className="etm-selector bg-gf-surface"><option value="full">{t("goals.targetMode.full")}</option><option value="down_payment">{t("goals.targetMode.down_payment")}</option></select></label>
        {details.targetMode === "down_payment" && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.assetPrice")}</span><input type="number" min="1" value={details.assetPriceMoney ? minorToMajor(details.assetPriceMoney.amountMinor, details.assetPriceMoney.currency) : ""} onChange={(event) => {
            const price = Number(event.target.value);
            const money = price > 0 ? { amountMinor: majorToMinor(price, currency), currency } : undefined;
            const input = details.downPaymentInput || { mode: "percent" as const, basisPoints: 2000 };
            patch({ assetPriceMoney: money, downPaymentInput: input });
            if (input.mode === "percent") onAmountChange(price > 0 ? minorToMajor(Math.round(majorToMinor(price, currency) * input.basisPoints / 10000), currency) : 0);
          }} className="w-full" /></label>
          <div className="flex flex-col gap-2">
            <span className="label-tfp">{t("goals.downPaymentMethod")}</span>
            <select aria-label={t("goals.downPaymentMethod")} value={details.downPaymentInput?.mode || "percent"} onChange={(event) => setDownPaymentMode(event.target.value as "percent" | "amount")} className="etm-selector bg-gf-surface">
              <option value="percent">{t("goals.downPaymentByPercent")}</option>
              <option value="amount">{t("goals.downPaymentByAmount")}</option>
            </select>
            {details.downPaymentInput?.mode === "percent"
              ? <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.downPaymentPercent")}</span><div className="flex items-center gap-2"><input type="number" min="1" max="100" value={percent} onChange={(event) => setPercent(Number(event.target.value))} className="w-full" /><span>%</span></div></label>
              : <p className="text-[11px] text-gf-text-muted">{t("goals.downPaymentAmountHelp")}</p>}
          </div>
        </div>}
      </>}
      <div>
        <p className="label-tfp">{t("goals.icon")}</p>
        <IconDisplayerMenu idmValue={icon || "fluent/bullseye"} idmIcon={onIconChange} />
      </div>
      <details className="rounded-xl border border-gf-border bg-gf-surface/50 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-gf-text">{t("goals.color")}</summary>
        <div className="mt-3"><CategoryColorPicker value={color} onChange={onColorChange} /></div>
      </details>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.schedule")}</span><select value={details.schedule?.mode || "off"} onChange={(event) => setSchedule(event.target.value === "off" ? null : { mode: event.target.value as "required_by_date" | "fixed_contribution" })} className="etm-selector bg-gf-surface"><option value="off">{t("goals.schedule.off")}</option><option value="required_by_date">{t("goals.schedule.required")}</option><option value="fixed_contribution">{t("goals.schedule.fixed")}</option></select></label>
        {details.schedule && <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.frequency")}</span><select value={details.schedule.frequency} onChange={(event) => setSchedule({ frequency: event.target.value as GoalFrequency })} className="etm-selector bg-gf-surface">{(["monthly", "semimonthly", "biweekly", "weekly"] as const).map((frequency) => <option key={frequency} value={frequency}>{t("goals.frequency." + frequency)}</option>)}</select></label>}
      </div>
      {details.schedule && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.firstPayment")}</span><DatePicker format="DD/MM/YYYY" value={dayjs(details.schedule.anchorDate)} onChange={(value) => value && setSchedule({ anchorDate: value.format("YYYY-MM-DD") })} className="h-10 w-full" /></label>
        {details.schedule.mode === "fixed_contribution" && <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.fixedContribution")}</span><input type="number" min="1" value={details.schedule.fixedContributionMoney ? minorToMajor(details.schedule.fixedContributionMoney.amountMinor, currency) : ""} onChange={(event) => setSchedule({ fixedContributionMoney: { amountMinor: majorToMinor(Number(event.target.value || 0), currency), currency } })} /></label>}
      </div>}
      {details.schedule && <label className="flex flex-col gap-1"><span className="label-tfp">{t("goals.incomeSource")}</span><select value={details.schedule.incomeSourceId || ""} onChange={(event) => {
        const source = incomeSources.find((item) => item._id === event.target.value);
        setSchedule(source ? {
          incomeSourceId: source._id,
          ...(source.recurrence ? { frequency: source.recurrence } : {}),
          ...(source.anchorDate && dayjs(source.anchorDate).isValid() ? { anchorDate: dayjs(source.anchorDate).format("YYYY-MM-DD") } : {}),
        } : { incomeSourceId: null });
      }} className="etm-selector bg-gf-surface"><option value="">{t("goals.incomeSource.none")}</option>{details.schedule.incomeSourceId && !incomeSources.some((item) => item._id === details.schedule?.incomeSourceId) && <option value={details.schedule.incomeSourceId}>{t("goals.incomeSource.unavailable")}</option>}{incomeSources.map((source) => <option key={source._id} value={source._id}>{source.name || t("errors.api.incomeSourceFallback")}</option>)}</select><span className="text-[10px] text-gf-text-muted">{t("goals.incomeSourceHelp")}</span></label>}
      <label className="flex flex-col gap-1">
        <span className="label-tfp">{t("goals.savedAsOf")}</span>
        <DatePicker allowClear format="DD/MM/YYYY" value={details.manualSavedAsOf ? dayjs(details.manualSavedAsOf) : null} onChange={(value) => patch({ manualSavedAsOf: value?.format("YYYY-MM-DD") || undefined })} className="h-10 w-full" />
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-gf-text"><input type="checkbox" checked={details.reminders.enabled} onChange={(event) => patch({ reminders: { ...details.reminders, enabled: event.target.checked } })} />{t("goals.reminders")}</label>
        {details.reminders.enabled && <label className="flex items-center gap-2 text-xs text-gf-text-muted">{t("goals.remindersBefore")}<input type="number" min="0" max="30" value={details.reminders.daysBefore} onChange={(event) => patch({ reminders: { ...details.reminders, daysBefore: Number(event.target.value) } })} className="w-16" /></label>}
      </div>
      {details.reminders.enabled && <p className="text-[11px] text-gf-text-muted">{t("goals.remindersHelp")}</p>}
      <p className="text-[11px] text-gf-text-muted">{t("goals.contextHelp")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { field: "categoryIds" as const, title: t("goals.category"), options: categories },
          { field: "subCategoryIds" as const, title: t("goals.subcategory"), options: subCategories },
          { field: "tagIds" as const, title: t("goals.tags"), options: tags },
          { field: "spendingBudgetIds" as const, title: t("goals.spendingBudgets"), options: spendingBudgets },
          { field: "projectBudgetIds" as const, title: t("goals.project"), options: projects },
        ].map((group) => <div key={group.field}>
          <p className="label-tfp mb-1">{group.title}</p>
          <div className="flex max-h-24 flex-wrap gap-1 overflow-auto">
            {group.options.map((item) => {
              const selected = group.field === "tagIds" ? selectedTags.has(item.id) : details.context[group.field].includes(item.id);
              return <button key={item.id} type="button" aria-pressed={selected} onClick={() => setContext(group.field, item.id)} className={"rounded-full border px-2 py-1 text-[10px] " + (selected ? "border-purple-300 bg-purple-400/20 text-purple-100" : "border-gf-border text-gf-text-muted")}>{item.label}</button>;
            })}
          </div>
        </div>)}
      </div>
      <p className="text-[10px] text-gf-text-muted">{t("goals.amountInfo", { p1: String(amount), p2: currency })}</p>
    </section>
  );
}
