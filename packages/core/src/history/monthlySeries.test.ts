import { describe, it, expect } from "vitest";

import { monthlySeries } from "./monthlySeries";

const at = (y: number, m: number, d: number) => new Date(y, m, d, 12);
const bill = (id: string, date: Date, amount: number) => ({ _id: id, date, isBill: true, isIncome: false, displayMoney: { primary: { amountMinor: amount * 100, currency: "MXN" } } });

describe("monthlySeries", () => {
  it("returns the months oldest first, ending with the month of now", () => {
    const series = monthlySeries([], at(2026, 9, 19), 12);
    expect(series).toHaveLength(12);
    expect(series[0].label).toBe("nov");
    expect(series[11].label).toBe("oct");
  });

  it("puts each movement in its own month", () => {
    const series = monthlySeries([bill("a", at(2026, 9, 2), 300), bill("b", at(2026, 8, 30), 100)], at(2026, 9, 19), 3);
    expect(series.map((p) => p.spending)).toEqual([0, 100, 300]);
  });
});
