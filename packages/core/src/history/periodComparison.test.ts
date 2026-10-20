import { describe, it, expect } from "vitest";

import { compareCategories, compareRange, historyRange, percentChange, summarizePeriod } from "./periodComparison";

const now = new Date(2026, 9, 20, 12);
const none = { from: null, to: null };
const money = (amount: number) => ({ primary: { amountMinor: amount * 100, currency: "MXN" } });
const cat = (name: string) => ({ _id: name, name, icon: "fluent/label", color: "#111111" });
const bill = (id: string, date: Date, amount: number, category: string) => ({ _id: id, date, isBill: true, isIncome: false, category: cat(category), displayMoney: money(amount) });
const income = (id: string, date: Date, amount: number) => ({ _id: id, date, isBill: false, isIncome: true, category: cat("Nómina"), displayMoney: money(amount) });

describe("historyRange", () => {
  it("covers the last 3 months, the quarters and the years", () => {
    const last3 = historyRange("last3", now, none);
    expect([last3.start.getMonth(), last3.end.getMonth()]).toEqual([7, 9]);
    const thisQuarter = historyRange("thisQuarter", now, none);
    expect([thisQuarter.start.getMonth(), thisQuarter.end.getMonth()]).toEqual([9, 11]);
    const lastQuarter = historyRange("lastQuarter", now, none);
    expect([lastQuarter.start.getMonth(), lastQuarter.end.getMonth()]).toEqual([6, 8]);
    expect(historyRange("lastYear", now, none).start.getFullYear()).toBe(2025);
  });
});

describe("compareRange", () => {
  it("shifts a year back or takes the stretch right before", () => {
    const base = historyRange("thisMonth", now, none);
    const yearAgo = compareRange("yearAgo", base, none);
    expect([yearAgo.start.getFullYear(), yearAgo.start.getMonth()]).toEqual([2025, 9]);
    const previous = compareRange("previous", base, none);
    expect(previous.end.getTime()).toBe(base.start.getTime() - 1);
  });
});

describe("summarizePeriod", () => {
  const movements = [
    income("i1", new Date(2026, 7, 1), 1000),
    bill("b1", new Date(2026, 7, 5), 200, "Comida"),
    bill("b2", new Date(2026, 8, 5), 300, "Comida"),
    bill("b3", new Date(2026, 8, 9), 500, "Auto"),
    bill("old", new Date(2026, 5, 9), 999, "Auto"),
  ];

  it("totals only what is in the range, month by month and by category", () => {
    const summary = summarizePeriod(movements, historyRange("last3", now, none));
    expect(summary.totals).toMatchObject({ incomes: 1000, spending: 1000, balance: 0 });
    expect(summary.months.map((m) => [m.label, m.incomes, m.spending])).toEqual([["ago", 1000, 200], ["sep", 0, 800], ["oct", 0, 0]]);
    expect(summary.spendingByCategory.map((c) => [c.name, c.value]).sort()).toEqual([["Auto", 500], ["Comida", 500]]);
    expect(summary.biggest).toHaveLength(3);
  });
});

describe("compareCategories", () => {
  it("lines the categories up and fills the missing side with zero", () => {
    const rows = compareCategories(
      [{ name: "Comida", icon: "i", color: "c", value: 300, count: 1 }],
      [{ name: "Comida", icon: "i", color: "c", value: 100, count: 1 }, { name: "Auto", icon: "i", color: "c", value: 500, count: 1 }]
    );
    expect(rows.map((r) => [r.name, r.a, r.b])).toEqual([["Auto", 0, 500], ["Comida", 300, 100]]);
  });
});

describe("percentChange", () => {
  it("is a fraction, or null with nothing to compare", () => {
    expect(percentChange(150, 100)).toBe(0.5);
    expect(percentChange(50, 100)).toBe(-0.5);
    expect(percentChange(10, 0)).toBeNull();
  });
});
