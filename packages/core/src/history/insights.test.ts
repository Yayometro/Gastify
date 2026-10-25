import { describe, it, expect } from "vitest";

import { computeInsights } from "./insights";
import { historyRange, summarizePeriod } from "./periodComparison";

const none = { from: null, to: null };
const labels = { locale: "es" as const, noCategory: "Sin categoría" };
const money = (amount: number) => ({ primary: { amountMinor: amount * 100, currency: "MXN" } });
const cat = (name: string) => ({ _id: name, name, icon: "i", color: "#111" });
const bill = (id: string, date: Date, amount: number, category: string) => ({ _id: id, date, isBill: true, isIncome: false, category: cat(category), displayMoney: money(amount) });
const income = (id: string, date: Date, amount: number) => ({ _id: id, date, isBill: false, isIncome: true, category: cat("Nómina"), displayMoney: money(amount) });

describe("computeInsights", () => {
  const now = new Date(2026, 9, 10, 12);
  const movements = [
    income("i", new Date(2026, 9, 1), 1000),
    bill("b1", new Date(2026, 9, 2), 200, "Comida"),
    bill("b2", new Date(2026, 9, 5), 100, "Auto"),
    bill("p", new Date(2026, 8, 5), 150, "Comida"),
  ];
  const range = historyRange("thisMonth", now, none);

  it("reads the pace, the projection, the savings rate and the top category of a period in progress", () => {
    const current = summarizePeriod(movements, range, labels);
    const insights = computeInsights(current, null, now);
    expect(insights.daysElapsed).toBe(10);
    expect(insights.dailyAverage).toBe(30);
    expect(insights.projectedSpending).toBe(930);
    expect(insights.savingsRate).toBeCloseTo(0.7);
    expect(insights.topCategory).toMatchObject({ name: "Comida", value: 200 });
    expect(insights.spendingChange).toBeNull();
    expect(insights.balance).toBe(700);
    expect(insights.movementCount).toBe(3);
    expect(insights.biggestExpense).toMatchObject({ amount: 200 });
    expect(insights.biggestExpense?.share).toBeCloseTo(2 / 3);
    expect(insights.averageExpense).toBe(150);
  });

  it("compares with the previous period and has no projection once the period is over", () => {
    const current = summarizePeriod(movements, historyRange("thisMonth", now, none), labels);
    const previous = summarizePeriod(movements, historyRange("lastMonth", now, none), labels);
    expect(computeInsights(current, previous, now).spendingChange).toBeCloseTo(1); // 300 vs 150
    const over = computeInsights(summarizePeriod(movements, historyRange("lastMonth", now, none), labels), null, now);
    expect(over.projectedSpending).toBeNull();
  });
});
