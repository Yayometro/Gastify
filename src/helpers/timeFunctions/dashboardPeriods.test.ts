import { describe, it, expect, vi, afterEach } from "vitest";
import { generate_timeperiod_ranges_array_for_dashboard } from "./timeFunctions";

const last3Months = (year: number) =>
    generate_timeperiod_ranges_array_for_dashboard(year).find((p) => p.name === "Last 3 months")!;

afterEach(() => vi.useRealTimers());

describe("generate_timeperiod_ranges_array_for_dashboard - Last 3 months", () => {
    it("keeps the same value across renders (a select needs a stable value to stay selected)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 1, 7, 17, 25));
        const first = last3Months(2026).value;
        vi.setSystemTime(new Date(2026, 9, 1, 7, 17, 31));
        expect(last3Months(2026).value).toBe(first);
        vi.setSystemTime(new Date(2026, 9, 1, 21, 5, 0));
        expect(last3Months(2026).value).toBe(first);
    });

    it("starts on the 1st of two months ago and ends at the end of today", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 1, 7, 17, 25));
        const [start, end] = String(last3Months(2026).value).split("*").map((d) => new Date(d));
        expect(start).toEqual(new Date(2026, 7, 1));
        expect(end).toEqual(new Date(2026, 9, 1, 23, 59, 59));
    });

    it("moves to the next day's value once the day changes", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 1, 23, 0, 0));
        const today = last3Months(2026).value;
        vi.setSystemTime(new Date(2026, 9, 2, 0, 0, 1));
        expect(last3Months(2026).value).not.toBe(today);
    });
});
