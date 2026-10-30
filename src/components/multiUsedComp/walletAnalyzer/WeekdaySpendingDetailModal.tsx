"use client";
import TutorialTip from "@/components/tour/TutorialTip";
import React from "react";
import { Modal } from "antd";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { formatWeekRange } from "@gastify/core/transformers/spendingWeeksCalendar";
import type { WalletAnalyzerWeekdaySpendingData } from "./WalletAnalyzerView";
import { useLocale, useT } from "@/i18n/client";
import SpendingSectionTitle from "./SpendingSectionTitle";
import SpendingWeeklyBars from "./SpendingWeeklyBars";
import SpendingCalendar from "./SpendingCalendar";

export interface WeekdaySpendingDetailModalProps {
  open: boolean;
  onClose: () => void;
  weekdaySpending?: WalletAnalyzerWeekdaySpendingData | null;
  walletPrimaryCurrency?: string;
}

// The "why" behind the weekday-pattern card, in reading order: the plain
// explanation of the averaging method, the weekly totals, a calendar of the
// last 92 days, and the full day-by-day list so every number stays traceable.
function WeekdaySpendingDetailModal({
  open,
  onClose,
  weekdaySpending,
  walletPrimaryCurrency,
}: WeekdaySpendingDetailModalProps): React.JSX.Element | null {
  const t = useT();
  const locale = useLocale();
  if (!open || !weekdaySpending) return null;
  const { weekly, dailyBreakdown, insight, weekdayAvg, weekendAvg } = weekdaySpending;
  const maxDayTotal = Math.max(1, ...(dailyBreakdown || []).map((d) => d.total));

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={560}
      className="gf-antd-modal-glass"
      zIndex={20000}
      title={<span className="inline-flex items-center text-purple-300 font-semibold text-base">{t("analyzer.weekday.detail")}<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="anaWeekdayDetail" label={t("analyzer.weekday.detail")} /></span>}
    >
      <p data-tour="wd-method" className="text-xs text-gf-text-muted mb-4">
        <b>{insight}</b> {t("analyzer.weekday.method")}{" "}
        {formatMoneyMajor(weekdayAvg, walletPrimaryCurrency)} {t("analyzer.weekday.weekend")}{" "}
        {formatMoneyMajor(weekendAvg, walletPrimaryCurrency)}.
      </p>

      <div data-tour="wd-weekly" className="mb-5">
        <SpendingSectionTitle variant="modal" title={t("analyzer.weekly.title")} help={t("analyzer.weekly.help")} tour="anaWeeklyDetail" />
        <div className="mt-2">
          <SpendingWeeklyBars weekly={weekly} walletPrimaryCurrency={walletPrimaryCurrency} variant="detail" />
        </div>
      </div>

      <div data-tour="wd-calendar" className="mb-5">
        <SpendingSectionTitle variant="modal" title={t("analyzer.calendar.title")} help={t("analyzer.calendar.help")} tour="anaCalendarDetail" />
        <div className="mt-2">
          <SpendingCalendar days={dailyBreakdown || []} lastDays={92} walletPrimaryCurrency={walletPrimaryCurrency} />
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wide text-gf-text-muted mt-3 mb-2">{t("analyzer.weekday.dayByDay")}</p>
      <div data-tour="wd-days" className="flex flex-col pr-1">
        {(dailyBreakdown || []).map((d) => (
          <div key={d.date.getTime()} className="flex items-center gap-3 py-1.5 border-t border-gf-border first:border-t-0">
            <span className="w-24 text-[11px] text-gf-text-muted shrink-0">
              {d.dayName.slice(0, 3)} {formatWeekRange(d.date, d.date, locale)}
            </span>
            <div className="flex-1 h-2 rounded-full bg-gf-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-purple-400" style={{ width: `${(d.total / maxDayTotal) * 100}%` }} />
            </div>
            <span className="w-28 text-right text-[12px] font-semibold text-gf-text shrink-0">
              {formatMoneyMajor(d.total, walletPrimaryCurrency)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default WeekdaySpendingDetailModal;
