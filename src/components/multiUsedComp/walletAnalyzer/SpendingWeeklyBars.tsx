"use client";
import React, { useState } from "react";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { WalletAnalyzerWeeklySpending } from "@gastify/core/transformers/walletAnalyzer";
import { useT } from "@/i18n/client";

export interface SpendingWeeklyBarsProps {
  weekly: WalletAnalyzerWeeklySpending;
  walletPrimaryCurrency?: string;
  variant: "card" | "detail";
}

// One bar per ISO week of the period (only the last 8 when there are more).
// "card" is the compact column chart with a hover tooltip; "detail" is a list
// that also shows each week's share of the period and its days with spend.
export default function SpendingWeeklyBars({ weekly, walletPrimaryCurrency, variant }: SpendingWeeklyBarsProps): React.JSX.Element {
  const t = useT();
  const [hovered, setHovered] = useState<number | null>(null);
  const weeks = weekly.weeks;

  if (weeks.length === 0) {
    return <p className="text-xs text-gf-text-muted">{t("analyzer.weekly.empty")}</p>;
  }

  const money = (value: number) => formatMoneyMajor(value, walletPrimaryCurrency);
  const percent = (share: number) => `${Math.round(share * 100)}%`;
  const maxTotal = Math.max(1, ...weeks.map((w) => w.total));
  const topIndex = weeks.reduce((best, w, i) => (w.total > weeks[best].total ? i : best), 0);
  const truncatedNote = weekly.truncated ? (
    <p className="text-[11px] text-gf-text-muted mt-2">{t("analyzer.weekly.truncated", { p1: weeks.length })}</p>
  ) : null;

  if (variant === "card") {
    const barAreaHeight = 76;
    return (
      <div>
        <div className="flex items-end gap-2" style={{ height: barAreaHeight + 20 }}>
          {weeks.map((week, i) => (
            <div
              key={week.weekNumber}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {hovered === i && (
                <div className="absolute bottom-full mb-2 z-10 w-max max-w-[220px] bg-gf-surface-2 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                  <p className="font-bold mb-1">{week.label}</p>
                  <p>{money(week.total)}</p>
                  <p className="text-slate-300">{t("analyzer.weekly.perDay", { p1: money(week.avgPerDay) })}</p>
                  <p className="text-slate-300">{t("analyzer.weekly.share", { p1: percent(week.shareOfTotal) })}</p>
                </div>
              )}
              <div className="w-full flex items-end justify-center" style={{ height: barAreaHeight }}>
                <div
                  className={`w-full max-w-[36px] rounded-t-sm transition-colors ${hovered === i ? "bg-purple-600" : "bg-purple-500/70"}`}
                  style={{ height: `${Math.max(2, (week.total / maxTotal) * barAreaHeight)}px` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-gf-text-muted whitespace-nowrap">{t("analyzer.weekly.short", { p1: week.weekNumber })}</span>
            </div>
          ))}
        </div>
        {truncatedNote}
      </div>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-2.5">
        {weeks.map((week, i) => {
          const isTop = i === topIndex && week.total > 0;
          return (
            <li key={week.weekNumber} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-gf-text-muted">{week.label}</span>
                <span className="font-semibold text-gf-text shrink-0">{money(week.total)}</span>
              </div>
              <div className="h-2 rounded-full bg-gf-surface-2 overflow-hidden">
                <div className={`h-full rounded-full ${isTop ? "bg-purple-300" : "bg-purple-400"}`} style={{ width: `${(week.total / maxTotal) * 100}%` }} />
              </div>
              <p className="text-[11px] text-gf-text-muted">
                {t("analyzer.weekly.perDay", { p1: money(week.avgPerDay) })} · {t("analyzer.weekly.share", { p1: percent(week.shareOfTotal) })} ·{" "}
                {t("analyzer.weekly.daysWithSpend", { p1: week.daysWithSpend, p2: week.daysInPeriod })}
                {isTop && (
                  <>
                    {" "}
                    · <span className="font-bold text-gf-text">{t("analyzer.weekday.topWeek")}</span>
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      {truncatedNote}
    </div>
  );
}
