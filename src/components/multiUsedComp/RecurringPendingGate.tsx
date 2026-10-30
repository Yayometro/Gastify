"use client";

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import type { AppDispatch } from "@/lib/store";
import { useT } from "@/i18n/client";
import { closePendingRecurring, pendingKey, setPendingRecurring, usePendingRecurring, type PendingRecurringItem } from "@/lib/recurring/pendingStore";

// Runs the recurring-expense catch-up once per page load (fixed-price charges are created by themselves) and, when a
// variable-price charge is due, opens the window that asks for its amount. The bell keeps reminding while any is left.
export default function RecurringPendingGate(): React.JSX.Element | null {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const { items, open } = usePendingRecurring();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetcher().post("general-data/recurring/sync", {});
        const data = (response?.data ?? {}) as { created?: number; pending?: PendingRecurringItem[] };
        if (!alive) return;
        if ((data.created ?? 0) > 0) dispatch(fetchTrans(""));
        const pending = data.pending ?? [];
        setPendingRecurring(pending, pending.length > 0);
      } catch {
        // The catch-up is a convenience: if it fails now, the next page load tries again.
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

  if (!open || items.length === 0) return null;

  const answer = async (item: PendingRecurringItem, skip: boolean): Promise<boolean> => {
    const key = pendingKey(item);
    const typed = amounts[key];
    const amount = typed === undefined || typed === "" ? item.amount : Number(typed);
    if (!skip && (!Number.isFinite(amount) || amount < 0)) {
      runNotify("error", t("recurring.pending.error"));
      return false;
    }
    setBusy(key);
    try {
      const response = await fetcher().post("general-data/recurring/confirm", { id: item.recurringId, dueDate: item.dueDate, amount, skip });
      if (!response?.ok && !response?.data) throw new Error("not saved");
      runNotify("ok", t(skip ? "recurring.pending.skipped" : "recurring.pending.created"));
      if (!skip) dispatch(fetchTrans(""));
      return true;
    } catch {
      runNotify("error", t("recurring.pending.error"));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const finish = async (item: PendingRecurringItem, skip: boolean) => {
    if (await answer(item, skip)) {
      const rest = items.filter((other) => pendingKey(other) !== pendingKey(item));
      setPendingRecurring(rest, rest.length > 0);
    }
  };

  const confirmAll = async () => {
    let rest = items;
    for (const item of items) {
      if (!(await answer(item, false))) break;
      rest = rest.filter((other) => pendingKey(other) !== pendingKey(item));
      setPendingRecurring(rest, rest.length > 0);
    }
  };

  return (
    <BasicModal
      zIndexClass="z-[20010]"
      close={closePendingRecurring}
      renderBodyContent={
        <div className="flex w-full flex-col gap-3 p-5 text-gf-text" data-tour="recurring-pending">
          <h2 className="text-lg font-bold">{t("recurring.pending.title")}</h2>
          <p className="text-xs text-gf-text-muted">{t("recurring.pending.intro")}</p>
          <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
            {items.map((item) => {
              const key = pendingKey(item);
              return (
                <li key={key} className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs text-gf-text-muted">{dayjs(item.dueDate).format("DD MMM YYYY")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gf-text-muted" htmlFor={`rec-${key}`}>{t("recurring.pending.amount")}</label>
                    <input
                      id={`rec-${key}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className="w-32"
                      value={amounts[key] ?? String(item.amount)}
                      onChange={(event) => setAmounts((current) => ({ ...current, [key]: event.target.value }))}
                    />
                    <button type="button" disabled={busy === key} onClick={() => finish(item, false)} className="gf-glass-button rounded-full px-3 py-1 text-xs font-semibold text-white">
                      {t("recurring.pending.confirm")}
                    </button>
                    <button type="button" disabled={busy === key} onClick={() => finish(item, true)} className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-gf-text-muted">
                      {t("recurring.pending.skip")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closePendingRecurring} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-gf-text-muted">
              {t("recurring.pending.later")}
            </button>
            {items.length > 1 && (
              <button type="button" disabled={busy !== null} onClick={confirmAll} className="gf-glass-button rounded-full px-4 py-1.5 text-xs font-semibold text-white">
                {t("recurring.pending.confirmAll")}
              </button>
            )}
          </div>
        </div>
      }
    />
  );
}
