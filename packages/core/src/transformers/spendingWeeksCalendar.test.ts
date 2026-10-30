import { describe, expect, it } from "vitest";
import {
  buildSpendCalendar,
  buildWeeklySpending,
  calendarLevel,
  formatWeekRange,
  startOfIsoWeek,
  type SpendingDay,
} from "./spendingWeeksCalendar";

// Month is 0-based, like the Date constructor.
const day = (year: number, month: number, date: number) => new Date(year, month, date);

// One entry per consecutive calendar day, starting at `start`.
function daysFrom(start: Date, totals: number[]): SpendingDay[] {
  return totals.map((total, i) => ({
    date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    total,
    count: total > 0 ? 1 : 0,
  }));
}

describe("buildWeeklySpending", () => {
  it("clips the first and last weeks to the period and averages per day inside them", () => {
    // Oct 1 2026 is a Thursday, Oct 31 a Saturday: 5 ISO weeks, 4 days in the first and 6 in the last.
    const oct = daysFrom(day(2026, 9, 1), Array(31).fill(10));
    const result = buildWeeklySpending(oct);

    expect(result.totalWeeks).toBe(5);
    expect(result.truncated).toBe(false);
    expect(result.periodTotal).toBe(310);
    expect(result.periodDays).toBe(31);

    const [first, , , , last] = result.weeks;
    expect(first).toMatchObject({ weekNumber: 1, daysInPeriod: 4, total: 40, avgPerDay: 10, daysWithSpend: 4 });
    expect(first.start.getDate()).toBe(1);
    expect(first.end.getDate()).toBe(4);
    expect(last).toMatchObject({ weekNumber: 5, daysInPeriod: 6, total: 60, avgPerDay: 10 });
    expect(last.start.getDate()).toBe(26);
    expect(last.end.getDate()).toBe(31);
  });

  it("keeps a Sunday that starts a month as a one-day first week", () => {
    // Feb 1 2026 is a Sunday: its ISO week began on Monday Jan 26, so week 1 is that Sunday alone.
    const feb = daysFrom(day(2026, 1, 1), Array(14).fill(5));
    const result = buildWeeklySpending(feb);

    expect(result.weeks.map((w) => w.daysInPeriod)).toEqual([1, 7, 6]);
    expect(result.weeks[0]).toMatchObject({ weekNumber: 1, total: 5, avgPerDay: 5 });
    expect(startOfIsoWeek(day(2026, 1, 1)).getDate()).toBe(26);
  });

  it("splits a period that crosses a month boundary into the right weeks", () => {
    // Sep 25 2026 is a Friday, Oct 6 a Tuesday.
    const crossing = daysFrom(day(2026, 8, 25), Array(12).fill(1));
    const result = buildWeeklySpending(crossing);

    expect(result.weeks.map((w) => w.daysInPeriod)).toEqual([3, 7, 2]);
    expect(formatWeekRange(result.weeks[0].start, result.weeks[0].end, "en")).toBe("25-27 Sep");
    expect(formatWeekRange(result.weeks[1].start, result.weeks[1].end, "en")).toBe("28 Sep - 4 Oct");
    expect(formatWeekRange(result.weeks[2].start, result.weeks[2].end, "en")).toBe("5-6 Oct");
  });

  it("handles a period that crosses a year boundary", () => {
    // Mon Dec 29 2025 to Sun Jan 4 2026: one full ISO week spanning two years.
    const newYear = daysFrom(day(2025, 11, 29), Array(7).fill(3));
    const result = buildWeeklySpending(newYear);

    expect(result.weeks).toHaveLength(1);
    expect(result.weeks[0]).toMatchObject({ daysInPeriod: 7, total: 21, avgPerDay: 3 });
    expect(formatWeekRange(result.weeks[0].start, result.weeks[0].end, "en")).toBe("29 Dec 2025 - 4 Jan 2026");
  });

  it("returns one week for a one-day period", () => {
    const result = buildWeeklySpending([{ date: day(2026, 9, 15), total: 80, count: 2 }]);

    expect(result.weeks).toHaveLength(1);
    expect(result.weeks[0]).toMatchObject({ weekNumber: 1, daysInPeriod: 1, total: 80, avgPerDay: 80, shareOfTotal: 1 });
  });

  it("reports zero totals and zero shares when nothing was spent", () => {
    const quiet = daysFrom(day(2026, 9, 1), Array(14).fill(0));
    const result = buildWeeklySpending(quiet);

    expect(result.periodTotal).toBe(0);
    expect(result.weeks.every((w) => w.total === 0 && w.shareOfTotal === 0 && w.daysWithSpend === 0)).toBe(true);
  });

  it("shows only the last eight weeks but keeps the shares over the whole period", () => {
    // 70 days from Mon Oct 5 2026 = 10 full weeks, 7 per day => 49 per week, 490 in total.
    const longPeriod = daysFrom(day(2026, 9, 5), Array(70).fill(7));
    const result = buildWeeklySpending(longPeriod);

    expect(result.truncated).toBe(true);
    expect(result.totalWeeks).toBe(10);
    expect(result.weeks).toHaveLength(8);
    expect(result.weeks[0].weekNumber).toBe(3);
    expect(result.weeks[7].weekNumber).toBe(10);
    expect(result.periodTotal).toBe(490);
    expect(result.weeks[0].shareOfTotal).toBeCloseTo(0.1);
  });

  it("returns no weeks for an empty period", () => {
    expect(buildWeeklySpending([])).toEqual({ weeks: [], totalWeeks: 0, truncated: false, periodTotal: 0, periodDays: 0 });
  });
});

describe("calendarLevel", () => {
  it("uses inclusive upper bounds at 25, 50 and 75 percent of the busiest day", () => {
    expect(calendarLevel(0, 100)).toBe(0);
    expect(calendarLevel(1, 100)).toBe(1);
    expect(calendarLevel(25, 100)).toBe(1);
    expect(calendarLevel(26, 100)).toBe(2);
    expect(calendarLevel(50, 100)).toBe(2);
    expect(calendarLevel(51, 100)).toBe(3);
    expect(calendarLevel(75, 100)).toBe(3);
    expect(calendarLevel(76, 100)).toBe(4);
    expect(calendarLevel(100, 100)).toBe(4);
  });

  it("is level 0 everywhere when the period has no spend", () => {
    expect(calendarLevel(0, 0)).toBe(0);
    expect(calendarLevel(50, 0)).toBe(0);
  });
});

describe("buildSpendCalendar", () => {
  it("aligns a month that starts on Sunday so day 1 sits in the last column", () => {
    const feb = daysFrom(day(2026, 1, 1), Array(14).fill(5));
    const calendar = buildSpendCalendar(feb);

    expect(calendar.rows).toHaveLength(3);
    expect(calendar.rows[0].slice(0, 6).every((cell) => cell === null)).toBe(true);
    expect(calendar.rows[0][6]?.date.getDate()).toBe(1);
    expect(calendar.windowDays).toBe(14);
  });

  it("marks the one-day period's cell in its weekday column with the top level", () => {
    const calendar = buildSpendCalendar([{ date: day(2026, 9, 15), total: 80, count: 2 }]);

    expect(calendar.rows).toHaveLength(1);
    expect(calendar.rows[0][3]).toMatchObject({ total: 80, level: 4 });
    expect(calendar.rows[0].filter((cell) => cell !== null)).toHaveLength(1);
  });

  it("gives every day level 0 when nothing was spent", () => {
    const calendar = buildSpendCalendar(daysFrom(day(2026, 9, 1), Array(14).fill(0)));

    expect(calendar.periodMax).toBe(0);
    expect(calendar.rows.flat().filter((cell) => cell !== null).every((cell) => cell.level === 0)).toBe(true);
  });

  it("keeps the normal days low when one huge day dominates the period", () => {
    const totals = Array(10).fill(10);
    totals[4] = 1000;
    const calendar = buildSpendCalendar(daysFrom(day(2026, 9, 5), totals));
    const cells = calendar.rows.flat().filter((cell) => cell !== null);

    expect(calendar.periodMax).toBe(1000);
    expect(cells[4].level).toBe(4);
    expect(cells.filter((_, i) => i !== 4).every((cell) => cell.level === 1)).toBe(true);
  });

  it("shows the last five weeks as whole rows when asked for lastWeeks", () => {
    // Last day is Sun Dec 13 2026: the window starts on Mon Nov 9 and fills exactly five rows.
    const calendar = buildSpendCalendar(daysFrom(day(2026, 9, 5), Array(70).fill(7)), { lastWeeks: 5 });

    expect(calendar.windowDays).toBe(35);
    expect(calendar.windowStart?.getMonth()).toBe(10);
    expect(calendar.windowStart?.getDate()).toBe(9);
    expect(calendar.rows).toHaveLength(5);
    expect(calendar.rows.flat().every((cell) => cell !== null)).toBe(true);
  });

  it("trims to the last 92 days but keeps the level scale of the whole period", () => {
    // 120 days: a spike on day 1 (outside the window) must still flatten the window's levels.
    const totals = Array(120).fill(10);
    totals[0] = 1000;
    const calendar = buildSpendCalendar(daysFrom(day(2026, 5, 1), totals), { lastDays: 92 });
    const cells = calendar.rows.flat().filter((cell) => cell !== null);

    expect(calendar.windowDays).toBe(92);
    expect(cells).toHaveLength(92);
    expect(calendar.periodMax).toBe(1000);
    expect(cells.every((cell) => cell.level === 1)).toBe(true);
  });
});

describe("formatWeekRange", () => {
  it("writes one month range as day-day month, as in '1-7 oct'", () => {
    expect(formatWeekRange(day(2026, 9, 1), day(2026, 9, 7), "es")).toBe("1-7 oct");
  });

  it("writes a single day as day month", () => {
    expect(formatWeekRange(day(2026, 9, 5), day(2026, 9, 5), "es")).toBe("5 oct");
  });
});
