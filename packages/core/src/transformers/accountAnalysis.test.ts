import { describe, expect, it } from "vitest";

import { buildAccountAnalysis, type AnalysisAccount, type AnalysisMovement } from "./accountAnalysis";

const today = new Date(2026, 9, 30, 12);
const range = { start: new Date(2026, 9, 1), end: new Date(2026, 9, 31, 23, 59, 59, 999) };
const day = (month: number, d: number) => new Date(2026, month, d, 12).toISOString();

const accounts: AnalysisAccount[] = [
  { _id: "a", name: "Debit", amount: 8000, currency: "MXN", accountType: "debit" },
  { _id: "b", name: "Savings", amount: 2000, currency: "MXN", accountType: "savings" },
  { _id: "c", name: "Card", amount: -500, currency: "MXN", accountType: "credit" },
];
const move = (partial: Partial<AnalysisMovement> & { account: string; amount: number; isBill: boolean; date: string }): AnalysisMovement => ({ kind: partial.isBill ? "expense" : "income", ...partial });

describe("buildAccountAnalysis", () => {
  const movements: AnalysisMovement[] = [
    move({ account: "a", amount: 3000, isBill: false, date: day(9, 5) }),
    move({ account: "a", amount: 1200, isBill: true, date: day(9, 6), category: { name: "Food" } }),
    move({ account: "a", amount: 300, isBill: true, date: day(9, 7), category: { name: "Fun" } }),
    move({ account: "c", amount: 2000, isBill: true, date: day(9, 8), category: { name: "Tech" } }),
    // A transfer from a to b: moves balance, counts as neither spending nor income.
    { kind: "transfer", account: "a", amount: 500, isBill: true, transferDirection: "out", date: day(9, 9) },
    { kind: "transfer", account: "b", amount: 500, isBill: false, transferDirection: "in", date: day(9, 9) },
  ];
  const result = buildAccountAnalysis({ accounts, movements, range, primary: "MXN", rates: {}, today });

  it("finds the richest account and its share of the money held", () => {
    expect(result.richest?.id).toBe("a");
    expect(result.richest?.balanceShare).toBeCloseTo(0.8);
    expect(result.concentrated).toBe(true);
    expect(result.totalBalance).toBe(9500);
    expect(result.debtTotal).toBe(500);
  });

  it("finds who spends and who earns, leaving transfers out", () => {
    expect(result.topSpender?.id).toBe("c");
    expect(result.topSpender?.expense).toBe(2000);
    expect(result.topSpender?.expenseShare).toBeCloseTo(2000 / 3500);
    expect(result.topEarner?.id).toBe("a");
    expect(result.topEarner?.income).toBe(3000);
    const a = result.accounts.find((row) => row.id === "a")!;
    expect(a.expense).toBe(1500);
    expect(a.net).toBe(1500);
    expect(a.topCategory).toEqual({ name: "Food", amount: 1200 });
    expect(result.accounts.find((row) => row.id === "b")!.count).toBe(0);
  });

  it("rebuilds balances backwards and ends exactly at today's balances", () => {
    const series = result.balanceSeries;
    expect(series).toHaveLength(6);
    const last = series[series.length - 1];
    expect(last.byAccount).toEqual({ a: 8000, b: 2000, c: -500 });
    expect(last.total).toBe(9500);
    // End of September: before this month's movements. a: 8000 - (3000 - 1200 - 300 - 500) = 7000; b: 2000 - 500 = 1500; c: -500 + 2000 = 1500.
    const september = series[series.length - 2];
    expect(september.month).toBe("2026-09-01");
    expect(september.byAccount).toEqual({ a: 7000, b: 1500, c: 1500 });
    expect(september.total).toBe(10000);
  });

  it("converts other currencies and reports the ones without a rate", () => {
    const mixed = buildAccountAnalysis({
      accounts: [{ _id: "u", name: "USD", amount: 100, currency: "USD" }, { _id: "e", name: "EUR", amount: 50, currency: "EUR" }, accounts[0]],
      movements: [],
      range,
      primary: "MXN",
      rates: { USD: 18 },
      today,
    });
    expect(mixed.richest?.id).toBe("a");
    expect(mixed.accounts.find((row) => row.id === "u")!.balance).toBe(1800);
    expect(mixed.accounts.find((row) => row.id === "e")!.balance).toBeNull();
    expect(mixed.missingCurrencies).toEqual(["EUR"]);
    expect(mixed.totalBalance).toBe(9800);
  });

  it("handles one account, no movements and ties", () => {
    const single = buildAccountAnalysis({ accounts: [accounts[0]], movements: [], range, primary: "MXN", rates: {}, today });
    expect(single.concentrated).toBe(false);
    expect(single.topSpender).toBeNull();
    expect(single.topEarner).toBeNull();
    expect(single.dormant).toEqual([{ id: "a", name: "Debit", daysSince: null }]);
    const tie = buildAccountAnalysis({
      accounts: [{ _id: "x", name: "X", amount: 10 }, { _id: "y", name: "Y", amount: 10 }],
      movements: [],
      range,
      primary: "MXN",
      rates: {},
      today,
    });
    expect(tie.richest?.id).toBe("x");
  });

  it("marks accounts with no movement in 60+ days as dormant", () => {
    const old = buildAccountAnalysis({ accounts, movements: [move({ account: "b", amount: 10, isBill: true, date: day(6, 1) })], range, primary: "MXN", rates: {}, today });
    expect(old.dormant.map((item) => item.id).sort()).toEqual(["a", "b", "c"]);
    expect(old.dormant.find((item) => item.id === "b")!.daysSince).toBeGreaterThanOrEqual(60);
  });
});
