import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generate_timeperiod_ranges_array_for_dashboard,
  getDateInYearMonthDay,
  getEndOfDay,
  getLast3MonthsPeriod,
  getTimeperiodRangesArray,
  getYearMonthDateRange,
  monthObjects,
  shiftPeriodBackOneYear,
} from "./timeFunctions";

afterEach(() => vi.useRealTimers());

describe("getLast3MonthsPeriod", () => {
  it("runs from the 1st of two months ago to the end of today", () => {
    const [start, end] = getLast3MonthsPeriod(new Date(2026, 9, 7, 8, 30));
    expect(start).toEqual(new Date(2026, 7, 1));
    expect(end).toEqual(new Date(2026, 9, 7, 23, 59, 59));
  });
  it("respects the year it is asked for (bug 20)", () => {
    const [start, end] = getLast3MonthsPeriod(new Date(2026, 9, 7), 2025);
    expect(start).toEqual(new Date(2025, 7, 1));
    expect(end).toEqual(new Date(2025, 9, 7, 23, 59, 59));
  });
});

describe("getTimeperiodRangesArray (bug 19)", () => {
  it("is built for the year it is asked for, not the year the module loaded in", () => {
    const q1For2030 = getTimeperiodRangesArray(2030).find((p) => p.name === "First quarter (Q1)")!;
    expect(String(q1For2030.value)).toContain("2030");
    const all2031 = getTimeperiodRangesArray(2031).find((p) => p.name === "All 2031");
    expect(all2031).toBeTruthy();
  });
  it("follows the clock when no year is given", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2031, 0, 2));
    expect(getTimeperiodRangesArray().some((p) => p.name === "All 2031")).toBe(true);
  });
  it("the dashboard list uses the year it is given for the quarters too", () => {
    const list = generate_timeperiod_ranges_array_for_dashboard(2024);
    expect(list.some((p) => p.name === "All 2024")).toBe(true);
    expect(list.some((p) => p.name === "All 2023")).toBe(true);
  });
});

describe("shiftPeriodBackOneYear (bug 18)", () => {
  it("moves both ends back exactly one year", () => {
    const [a, b] = shiftPeriodBackOneYear([new Date(2026, 7, 1), new Date(2026, 9, 7, 23, 59, 59)]);
    expect(a).toEqual(new Date(2025, 7, 1));
    expect(b).toEqual(new Date(2025, 9, 7));
  });
});

describe("getEndOfDay", () => {
  it("is the same instant for any time of the same day", () => {
    expect(getEndOfDay(new Date(2026, 9, 7, 0, 0, 1))).toEqual(getEndOfDay(new Date(2026, 9, 7, 23, 0, 0)));
  });
});

describe("month palette (bug 21)", () => {
  it("getYearMonthDateRange paints each month with the colour of monthObjects", () => {
    const ranges = getYearMonthDateRange(new Date(2026, 0, 1));
    for (const month of monthObjects) expect(ranges.get(month.name)?.color).toBe(month.color);
  });
});

describe("getDateInYearMonthDay", () => {
  it("shows the LOCAL calendar day, also for the end of a day (23:59:59)", () => {
    expect(getDateInYearMonthDay(new Date(2026, 9, 7, 23, 59, 59))).toBe("2026-10-07");
    expect(getDateInYearMonthDay(new Date(2026, 9, 7, 0, 0, 0))).toBe("2026-10-07");
    expect(getDateInYearMonthDay(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
  it("keeps reporting an invalid date", () => {
    expect(getDateInYearMonthDay("nope")).toBe("Date invalid to parse");
  });
});
