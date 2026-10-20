import { describe, it, expect } from "vitest";

import { dayLabelEs, monthTitleEs } from "../format/spanishDates";
import { groupByDay, monthBounds, monthTotals, movementKind, movementsInMonth, sortNewestFirst, topSpendingCategories } from "./monthSummary";

const food = { _id: "c1", name: "Comida", icon: "fluent/pizza", color: "#f97316" };
const rent = { _id: "c2", name: "Renta", icon: "fluent/house", color: "#3b82f6" };

function movement(id: string, date: string, extra: Record<string, unknown>) {
  return { _id: id, date: new Date(date), isBill: true, isIncome: false, amount: 0, ...extra };
}

describe("monthBounds", () => {
  it("covers the whole month, from the first day to the last millisecond", () => {
    const { start, end } = monthBounds(2026, 1); // February 2026
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(28);
    expect(end.getHours()).toBe(23);
  });
});

describe("movementKind", () => {
  it("treats transfers and exchanges as neither income nor spending", () => {
    expect(movementKind({ kind: "transfer", isBill: true })).toBe("transfer");
    expect(movementKind({ kind: "exchange", isBill: false })).toBe("transfer");
    expect(movementKind({ isBill: true })).toBe("expense");
    expect(movementKind({ isBill: false })).toBe("income");
  });
});

describe("monthTotals", () => {
  it("sums income and spending, leaves transfers out and computes the balance", () => {
    const totals = monthTotals([
      movement("a", "2026-10-02T12:00:00", { amount: 100, displayMoney: { primary: { amountMinor: 10000, currency: "MXN" } } }),
      movement("b", "2026-10-03T12:00:00", { isBill: false, isIncome: true, displayMoney: { primary: { amountMinor: 50000, currency: "MXN" } } }),
      movement("c", "2026-10-04T12:00:00", { kind: "transfer", isBill: true, displayMoney: { primary: { amountMinor: 99900, currency: "MXN" } } }),
    ]);
    expect(totals).toEqual({ incomes: 500, spending: 100, balance: 400, count: 3 });
  });

  it("returns zeros for an empty month", () => {
    expect(monthTotals([])).toEqual({ incomes: 0, spending: 0, balance: 0, count: 0 });
  });
});

describe("topSpendingCategories", () => {
  it("adds up spending per category, biggest first, and names the uncategorized ones", () => {
    const top = topSpendingCategories(
      [
        movement("a", "2026-10-02T12:00:00", { category: food, displayMoney: { primary: { amountMinor: 20000, currency: "MXN" } } }),
        movement("b", "2026-10-05T12:00:00", { category: food, displayMoney: { primary: { amountMinor: 5000, currency: "MXN" } } }),
        movement("c", "2026-10-06T12:00:00", { category: rent, displayMoney: { primary: { amountMinor: 900000, currency: "MXN" } } }),
        movement("d", "2026-10-07T12:00:00", { category: null, displayMoney: { primary: { amountMinor: 100, currency: "MXN" } } }),
      ],
      2
    );
    expect(top.map((row) => [row.name, row.value, row.count])).toEqual([
      ["Renta", 9000, 1],
      ["Comida", 250, 2],
    ]);
  });

  it("does not count income in the categories", () => {
    const top = topSpendingCategories([movement("a", "2026-10-02T12:00:00", { isBill: false, category: food, amount: 500 })]);
    expect(top).toEqual([]);
  });
});

describe("movementsInMonth and sortNewestFirst", () => {
  const all = [
    movement("old", "2026-09-30T23:00:00", {}),
    movement("first", "2026-10-01T08:00:00", {}),
    movement("late", "2026-10-31T20:00:00", {}),
    movement("next", "2026-11-01T00:30:00", {}),
  ];

  it("keeps only the movements of the month, newest first", () => {
    const ids = movementsInMonth(all, monthBounds(2026, 9)).map((m) => m._id);
    expect(ids).toEqual(["late", "first"]);
  });

  it("sorts newest first without touching the input", () => {
    const sorted = sortNewestFirst(all);
    expect(sorted[0]._id).toBe("next");
    expect(all[0]._id).toBe("old");
  });
});

describe("groupByDay", () => {
  it("groups by local day and labels today and yesterday", () => {
    const today = new Date(2026, 9, 19, 10, 0);
    const groups = groupByDay(
      sortNewestFirst([
        movement("a", new Date(2026, 9, 19, 9, 0).toISOString(), {}),
        movement("b", new Date(2026, 9, 19, 7, 0).toISOString(), {}),
        movement("c", new Date(2026, 9, 18, 21, 0).toISOString(), {}),
        movement("d", new Date(2026, 9, 12, 8, 0).toISOString(), {}),
      ]),
      today
    );
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ["Hoy", 2],
      ["Ayer", 1],
      ["lunes 12 de octubre", 1],
    ]);
  });
});

describe("Spanish dates", () => {
  it("titles a month with a capital letter", () => {
    expect(monthTitleEs(new Date(2026, 9, 1))).toBe("Octubre 2026");
  });

  it("adds the year only when it is not the current one", () => {
    const today = new Date(2026, 0, 10);
    expect(dayLabelEs(new Date(2025, 11, 31), today)).toBe("miércoles 31 de diciembre de 2025");
  });
});
