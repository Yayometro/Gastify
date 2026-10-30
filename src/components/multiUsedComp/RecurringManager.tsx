"use client";

import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { useInfo, useT } from "@/i18n/client";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { PresentedRecurring } from "@/lib/recurring/recurringService";

type Rule = PresentedRecurring;

// The recurring expenses the person declared: a button on the Movements page that opens the list. Each rule can be paused,
// have its reference amount changed or be deleted (the charges it already created stay as ordinary movements).
export default function RecurringManager(): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const primaryCurrency: string = useSelector((state: { walletReducer?: { data?: { primaryCurrency?: string } } }) => state.walletReducer?.data?.primaryCurrency) || "MXN";
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetcher().post("general-data/recurring/get", {});
      setRules((response?.data ?? []) as Rule[]);
    } catch {
      setRules([]);
      runNotify("error", t("recurring.manage.loadError"));
    }
  }, [t]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const run = async (id: string, path: string, body: Record<string, unknown>, okKey: string) => {
    setBusy(id);
    try {
      const response = await fetcher().post(`general-data/recurring/${path}`, { id, ...body });
      if (!response?.ok && !response?.data) throw new Error("not saved");
      runNotify("ok", t(okKey));
      await load();
    } catch {
      runNotify("error", t("recurring.manage.error"));
    } finally {
      setBusy(null);
      setEditing(null);
      setRemoving(null);
    }
  };

  const saveAmount = (rule: Rule) => {
    const amount = Number(editing?.value);
    if (!Number.isFinite(amount) || amount < 0) return runNotify("error", t("recurring.pending.error"));
    void run(rule.id, "update", { amount }, "recurring.manage.saved");
  };

  const chip = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  const action = "rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-gf-text-muted transition-colors hover:text-white disabled:opacity-50";

  return (
    <>
      <button
        type="button"
        data-tour="mov-recurring"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full gf-glass-card px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
      >
        <CategoIcon type="MdOutlineRepeat" siz={18} />
        {t("recurring.manage.button")}
      </button>
      {open && (
        <BasicModal
          zIndexClass="z-[3000]"
          close={() => setOpen(false)}
          renderContent={
            <div className="content absolute gf-glass-violet flex flex-col w-[94vw] max-w-[640px] max-h-[90vh] rounded-3xl overflow-hidden z-[3001]">
              <div className="px-6 pt-6 pb-3 pr-14 text-center">
                <TitleWithHelp as="h2" title={t("recurring.manage.title")} info={APP_INFO.gastos_recurrentes} tour="movRecurring" titleClassName="text-xl font-semibold text-gf-text" className="justify-center" />
              </div>
              <div data-tour="mov-recurring-list" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
                {rules === null ? null : rules.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gf-text-muted">{t("recurring.manage.empty")}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {rules.map((rule, index) => {
                      const isEditing = editing?.id === rule.id;
                      return (
                        <li key={rule.id} className={`flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/5 p-3 text-left ${rule.active ? "" : "opacity-70"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-sm font-semibold text-gf-text">{rule.name}</span>
                              <span className="text-xs text-gf-text-muted">
                                {t(`recurring.frequency.${rule.frequency}`)} · {rule.active ? t("recurring.manage.next", { p1: dayjs(rule.nextDueDate).format("DD MMM YYYY") }) : t("recurring.manage.paused")}
                              </span>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="text-sm font-bold text-gf-text">{formatMoneyMajor(rule.amount, rule.currency || primaryCurrency, { showCode: false })}</span>
                              <span className={`${chip} ${rule.isVariable ? "border-amber-300/60 text-amber-200" : "border-emerald-300/60 text-emerald-200"}`}>
                                {rule.isVariable ? t("recurring.manage.variable") : t("recurring.manage.fixed")}
                              </span>
                            </div>
                          </div>
                          {isEditing ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <input type="number" inputMode="decimal" step="0.01" className="w-32" autoFocus value={editing.value} onChange={(event) => setEditing({ id: rule.id, value: event.target.value })} />
                              <button type="button" disabled={busy === rule.id} onClick={() => saveAmount(rule)} className="gf-glass-button rounded-full px-3 py-1 text-xs font-semibold text-white">{t("recurring.manage.save")}</button>
                              <button type="button" onClick={() => setEditing(null)} className={action}>{t("recurring.manage.cancel")}</button>
                            </div>
                          ) : removing === rule.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gf-text-muted">{t("recurring.manage.removeSure")}</span>
                              <button type="button" disabled={busy === rule.id} onClick={() => void run(rule.id, "remove", {}, "recurring.manage.removed")} className="rounded-full border border-red-300/60 px-3 py-1 text-xs font-semibold text-red-200">{t("recurring.manage.removeYes")}</button>
                              <button type="button" onClick={() => setRemoving(null)} className={action}>{t("recurring.manage.cancel")}</button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" data-tour={index === 0 ? "mov-recurring-pause" : undefined} disabled={busy === rule.id} onClick={() => void run(rule.id, "update", { active: !rule.active }, "recurring.manage.saved")} className={action}>
                                {rule.active ? t("recurring.manage.pause") : t("recurring.manage.resume")}
                              </button>
                              <button type="button" data-tour={index === 0 ? "mov-recurring-edit" : undefined} onClick={() => setEditing({ id: rule.id, value: String(rule.amount) })} className={action}>{t("recurring.manage.edit")}</button>
                              <button type="button" data-tour={index === 0 ? "mov-recurring-remove" : undefined} onClick={() => setRemoving(rule.id)} className={action}>{t("recurring.manage.remove")}</button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <button
                type="button"
                aria-label={t("recurring.manage.close")}
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 rounded-full gf-glass-card p-1.5 text-purple-100 transition-colors hover:text-white"
              >
                <CategoIcon type="MdClose" siz={18} />
              </button>
            </div>
          }
        />
      )}
    </>
  );
}
