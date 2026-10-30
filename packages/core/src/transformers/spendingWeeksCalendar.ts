// Pure calendar math for the weekday-pattern views: Monday-first (ISO) weeks
// clipped to the analysed period, and a 7-column calendar grid whose fill
// shows how much was spent on a day relative to the busiest day of the
// period. No copy lives here, only numbers and dates, so the same logic can
// drive the web and the phone. Input days must be one per calendar day, in
// ascending order (the weekday transformers already produce them that way).
import { monthName } from "../i18n/dates";
import type { Locale } from "../i18n/locales";

export interface SpendingDay {
  date: Date;
  total: number;
  count: number;
}

export interface SpendingWeek {
  // 1-based, counted across the whole analysed period (not the visible slice).
  weekNumber: number;
  // First and last day of this week that fall inside the period.
  start: Date;
  end: Date;
  // Days of the week inside the period: 7 for a full week, fewer at the edges.
  daysInPeriod: number;
  total: number;
  count: number;
  daysWithSpend: number;
  // total / daysInPeriod, so a partial week can be compared with a full one.
  avgPerDay: number;
  // Share of the whole period's spend (0 when nothing was spent).
  shareOfTotal: number;
}

export interface WeeklySpending {
  // The weeks to draw: all of them, or only the last `maxWeeks` when truncated.
  weeks: SpendingWeek[];
  totalWeeks: number;
  truncated: boolean;
  periodTotal: number;
  periodDays: number;
}

// The weekly bars show at most this many weeks; longer periods keep the last ones.
export const MAX_WEEKLY_BARS = 8;

// 0 = no spend (grey, no fill); 1..4 = fill quarters of the period's busiest day.
export type CalendarLevel = 0 | 1 | 2 | 3 | 4;

export interface SpendingCalendarCell extends SpendingDay {
  level: CalendarLevel;
}

export interface SpendingCalendar {
  // Rows of 7 cells, Monday first. `null` marks padding outside the shown window.
  rows: (SpendingCalendarCell | null)[][];
  // The busiest day of the WHOLE period, used for every level (even when trimmed).
  periodMax: number;
  windowStart: Date | null;
  windowEnd: Date | null;
  windowDays: number;
}

export interface CalendarOptions {
  // Show only the last N days of the period (modal: 92).
  lastDays?: number;
  // Show only the ISO weeks that contain the last N weeks (card: 5).
  lastWeeks?: number;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

// Monday = 0 ... Sunday = 6.
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfIsoWeek(date: Date): Date {
  return addDays(startOfDay(date), -mondayIndex(date));
}

// Maps a spend ratio (day total / busiest day of the period) to a fill level.
// Boundaries are inclusive on the lower level: exactly 25% is level 1.
export function calendarLevel(total: number, periodMax: number): CalendarLevel {
  if (total <= 0 || periodMax <= 0) return 0;
  const ratio = total / periodMax;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function buildWeeklySpending(days: SpendingDay[], maxWeeks: number = MAX_WEEKLY_BARS): WeeklySpending {
  const periodTotal = days.reduce((sum, d) => sum + d.total, 0);

  const groups: { monday: number; days: SpendingDay[] }[] = [];
  for (const day of days) {
    const monday = startOfIsoWeek(day.date).getTime();
    const current = groups[groups.length - 1];
    if (current && current.monday === monday) current.days.push(day);
    else groups.push({ monday, days: [day] });
  }

  const allWeeks: SpendingWeek[] = groups.map((group, index) => {
    const total = group.days.reduce((sum, d) => sum + d.total, 0);
    const count = group.days.reduce((sum, d) => sum + d.count, 0);
    return {
      weekNumber: index + 1,
      start: startOfDay(group.days[0].date),
      end: startOfDay(group.days[group.days.length - 1].date),
      daysInPeriod: group.days.length,
      total,
      count,
      daysWithSpend: group.days.filter((d) => d.total > 0).length,
      avgPerDay: total / group.days.length,
      shareOfTotal: periodTotal > 0 ? total / periodTotal : 0,
    };
  });

  const truncated = allWeeks.length > maxWeeks;
  return {
    weeks: truncated ? allWeeks.slice(allWeeks.length - maxWeeks) : allWeeks,
    totalWeeks: allWeeks.length,
    truncated,
    periodTotal,
    periodDays: days.length,
  };
}

// "1-7 oct", "27 sep - 3 oct", "29 dic 2025 - 4 ene 2026", or "5 oct" for one day.
export function formatWeekRange(start: Date, end: Date, locale: Locale): string {
  const monthOf = (date: Date) => monthName(date.getMonth(), locale, "short");
  if (start.getTime() === end.getTime()) return `${start.getDate()} ${monthOf(start)}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}-${end.getDate()} ${monthOf(end)}`;
  }
  // The year is written only when the two ends fall in different years.
  const sameYear = start.getFullYear() === end.getFullYear();
  const from = `${start.getDate()} ${monthOf(start)}${sameYear ? "" : ` ${start.getFullYear()}`}`;
  const to = `${end.getDate()} ${monthOf(end)}${sameYear ? "" : ` ${end.getFullYear()}`}`;
  return `${from} - ${to}`;
}

export function buildSpendCalendar(days: SpendingDay[], options: CalendarOptions = {}): SpendingCalendar {
  const periodMax = days.reduce((max, d) => Math.max(max, d.total), 0);

  let shown = days;
  if (options.lastWeeks !== undefined && days.length > 0) {
    const firstMonday = addDays(startOfIsoWeek(days[days.length - 1].date), -7 * (options.lastWeeks - 1));
    shown = days.filter((d) => startOfDay(d.date).getTime() >= firstMonday.getTime());
  } else if (options.lastDays !== undefined) {
    shown = days.slice(Math.max(0, days.length - options.lastDays));
  }

  if (shown.length === 0) {
    return { rows: [], periodMax, windowStart: null, windowEnd: null, windowDays: 0 };
  }

  const windowStart = startOfDay(shown[0].date);
  const windowEnd = startOfDay(shown[shown.length - 1].date);
  const byTime = new Map<number, SpendingDay>();
  for (const day of shown) byTime.set(startOfDay(day.date).getTime(), day);

  const gridEnd = addDays(startOfIsoWeek(windowEnd), 6);
  const cells: (SpendingCalendarCell | null)[] = [];
  for (let cursor = startOfIsoWeek(windowStart); cursor.getTime() <= gridEnd.getTime(); cursor = addDays(cursor, 1)) {
    const day = byTime.get(cursor.getTime());
    cells.push(day ? { date: cursor, total: day.total, count: day.count, level: calendarLevel(day.total, periodMax) } : null);
  }

  const rows: (SpendingCalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return { rows, periodMax, windowStart, windowEnd, windowDays: shown.length };
}
