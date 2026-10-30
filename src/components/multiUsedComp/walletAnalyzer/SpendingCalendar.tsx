"use client";
import React, { useMemo } from "react";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import {
  buildSpendCalendar,
  formatWeekRange,
  type CalendarLevel,
  type SpendingCalendarCell,
  type SpendingDay,
} from "@gastify/core/transformers/spendingWeeksCalendar";
import { useLocale, useT } from "@/i18n/client";

export interface SpendingCalendarProps {
  days: SpendingDay[];
  walletPrimaryCurrency?: string;
  // Modal: the last 92 days. Card: the last 5 weeks. Omit both to show the whole period.
  lastDays?: number;
  lastWeeks?: number;
  compact?: boolean;
}

// Fill height and colour per level. Level 0 is a grey cell with no fill.
const FILL: Record<CalendarLevel, { height: string; color: string }> = {
  0: { height: "0%", color: "" },
  1: { height: "25%", color: "bg-blue-500" },
  2: { height: "50%", color: "bg-green-300" },
  3: { height: "75%", color: "bg-orange-500" },
  4: { height: "100%", color: "bg-red-600" },
};

const LEVELS: CalendarLevel[] = [0, 1, 2, 3, 4];

function CalendarFill({ level }: { level: CalendarLevel }): React.JSX.Element | null {
  if (level === 0) return null;
  return <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 ${FILL[level].color}`} style={{ height: FILL[level].height }} />;
}

// A 7-column calendar of the period (Monday first). Each cell's fill shows the
// day's spend relative to the busiest day of the WHOLE period, so the scale
// stays the same when the modal or the card shows only a slice of it.
export default function SpendingCalendar({ days, walletPrimaryCurrency, lastDays, lastWeeks, compact = false }: SpendingCalendarProps): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const calendar = useMemo(() => buildSpendCalendar(days, { lastDays, lastWeeks }), [days, lastDays, lastWeeks]);
  const weekdayHeads = [0, 1, 2, 3, 4, 5, 6].map((i) => t(`analyzer.weekday.${i}`).slice(0, 3));
  const gap = compact ? "gap-[3px]" : "gap-1.5";
  const windowNote = calendar.windowDays < days.length ? t("analyzer.calendar.window", { p1: calendar.windowDays }) : null;

  const describe = (cell: SpendingCalendarCell): string => {
    const dateLabel = formatWeekRange(cell.date, cell.date, locale);
    return cell.total > 0
      ? t("analyzer.calendar.cell", { p1: dateLabel, p2: formatMoneyMajor(cell.total, walletPrimaryCurrency) })
      : t("analyzer.calendar.cellEmpty", { p1: dateLabel });
  };

  return (
    <div className={compact ? "max-w-[420px]" : undefined}>
      <div className={`grid grid-cols-7 ${gap} mb-1`} aria-hidden="true">
        {weekdayHeads.map((name, i) => (
          <span key={i} className="text-center text-[10px] font-semibold text-gf-text-muted">
            {name}
          </span>
        ))}
      </div>
      <div className={`grid grid-cols-7 ${gap}`}>
        {calendar.rows.flat().map((cell, i) =>
          cell === null ? (
            <span key={`pad-${i}`} aria-hidden="true" />
          ) : (
            <div
              key={cell.date.getTime()}
              role="img"
              aria-label={describe(cell)}
              title={describe(cell)}
              className={`relative overflow-hidden rounded-[4px] border border-gf-border bg-gf-surface-2 ${compact ? "h-[22px]" : "h-[26px]"}`}
            >
              <CalendarFill level={cell.level} />
            </div>
          )
        )}
      </div>

      <div className={`mt-2 flex flex-wrap items-center ${compact ? "gap-x-2" : "gap-x-3"} gap-y-1 text-[10px] text-gf-text-muted`}>
        {!compact && <span className="font-semibold">{t("analyzer.calendar.legend")}</span>}
        {LEVELS.map((level) => {
          const label = t(`analyzer.calendar.level.${level}`);
          return (
            <span key={level} className="inline-flex items-center gap-1" title={label}>
              <span aria-hidden="true" className="relative inline-block h-3 w-3 overflow-hidden rounded-[3px] border border-gf-border bg-gf-surface-2">
                <CalendarFill level={level} />
              </span>
              {compact ? <span className="sr-only">{label}</span> : label}
            </span>
          );
        })}
      </div>

      {windowNote && <p className="text-[11px] text-gf-text-muted mt-2">{windowNote}</p>}
    </div>
  );
}
