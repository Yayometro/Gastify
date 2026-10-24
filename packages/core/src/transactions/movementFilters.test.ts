import { describe, it, expect } from "vitest";
import { createTranslator } from "../i18n/translate";
import movementsEs from "../i18n/messages/es/movements";

const t = createTranslator("es", movementsEs);

import { EMPTY_FILTERS, applyMovementFilters, countActiveFilters, isInRange, presetsWithYears, rangeFor, rangePresetLabel, yearsWithMovements, type FilterableMovement } from "./movementFilters";

const food = { _id: "c1", name: "Comida" };
const car = { _id: "c2", name: "Auto" };
const sub = { _id: "s1", name: "Restaurante" };

type Row = FilterableMovement & { _id: string };

const movements: Row[] = [
  { _id: "1", name: "Súper", isBill: true, category: food, account: "a1", displayMoney: { primary: { amountMinor: 25000, currency: "MXN" }, native: { amountMinor: 25000, currency: "MXN" } } },
  { _id: "2", name: "Taco", isBill: true, category: food, subCategory: sub, account: { _id: "a2" }, tags: [{ name: "viaje" }], displayMoney: { primary: { amountMinor: 8000, currency: "MXN" }, native: { amountMinor: 450, currency: "USD" } } },
  { _id: "3", name: "Nómina", isBill: false, category: car, account: "a1", displayMoney: { primary: { amountMinor: 2500000, currency: "MXN" } } },
  { _id: "4", name: "Pago de tarjeta", kind: "transfer", isBill: true, account: "a1" },
];

const ids = (list: Row[]) => list.map((m) => m._id);

describe("applyMovementFilters", () => {
  it("returns everything with no filters", () => {
    expect(ids(applyMovementFilters(movements, EMPTY_FILTERS, "MXN"))).toEqual(["1", "2", "3", "4"]);
  });

  it("filters by type, treating transfers as their own kind", () => {
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, type: "expense" }, "MXN"))).toEqual(["1", "2"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, type: "income" }, "MXN"))).toEqual(["3"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, type: "transfer" }, "MXN"))).toEqual(["4"]);
  });

  it("searches name, category, sub-category and tags ignoring case and accents", () => {
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, query: "SUPER" }, "MXN"))).toEqual(["1"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, query: "comida" }, "MXN"))).toEqual(["1", "2"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, query: "restaurante" }, "MXN"))).toEqual(["2"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, query: "viaje" }, "MXN"))).toEqual(["2"]);
  });

  it("filters by category, sub-category and account (id or populated)", () => {
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, categoryId: "c1" }, "MXN"))).toEqual(["1", "2"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, subCategoryId: "s1" }, "MXN"))).toEqual(["2"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, accountId: "a2" }, "MXN"))).toEqual(["2"]);
  });

  it("matches an exact amount in the main currency or in the account's own", () => {
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, exactAmount: "250" }, "MXN"))).toEqual(["1"]);
    expect(ids(applyMovementFilters(movements, { ...EMPTY_FILTERS, exactAmount: "4.50", exactMode: "native", exactCurrency: "USD" }, "MXN"))).toEqual(["2"]);
  });
});

describe("countActiveFilters", () => {
  it("counts only the filters that are set", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FILTERS, query: " x ", type: "income", accountId: "a1" })).toBe(3);
  });
});

describe("rangeFor and isInRange", () => {
  const now = new Date(2026, 9, 20, 15, 0);

  it("covers the last 7 days including today", () => {
    const range = rangeFor("last7", now, now, { from: null, to: null });
    expect(range.start.getDate()).toBe(14);
    expect(isInRange({ date: new Date(2026, 9, 14, 8) }, range)).toBe(true);
    expect(isInRange({ date: new Date(2026, 9, 13, 23) }, range)).toBe(false);
  });

  it("follows the month cursor for 'month' and swaps a custom range given backwards", () => {
    const month = rangeFor("month", now, new Date(2026, 8, 1), { from: null, to: null });
    expect(month.start.getMonth()).toBe(8);
    const custom = rangeFor("custom", now, now, { from: new Date(2026, 9, 10), to: new Date(2026, 9, 2) });
    expect(custom.start.getDate()).toBe(2);
    expect(custom.end.getDate()).toBe(10);
  });
});

describe("readable filter", () => {
  it("keeps readable, unreadable or all movements", () => {
    const rows = [{ _id: "a", isReadable: true }, { _id: "b", isReadable: false }, { _id: "c" }];
    const pick = (readable: "all" | "readable" | "unreadable") => applyMovementFilters(rows, { ...EMPTY_FILTERS, readable }, "MXN").map((row) => row._id);
    expect(pick("all")).toEqual(["a", "b", "c"]);
    expect(pick("readable")).toEqual(["a"]);
    expect(pick("unreadable")).toEqual(["b", "c"]);
  });
});

describe("the web's period presets", () => {
  const now = new Date(2026, 9, 20); // 20 oct 2026
  const none = { from: null, to: null };
  const month = new Date(2026, 9, 1);

  it("last month, last three months and the quarters are relative to today", () => {
    expect(rangeFor("lastMonth", now, month, none).start).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0));
    expect(rangeFor("lastMonth", now, month, none).end).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999));
    expect(rangeFor("last3", now, month, none).start).toEqual(new Date(2026, 7, 1));
    expect(rangeFor("q4", now, month, none).start).toEqual(new Date(2026, 9, 1));
    expect(rangeFor("q4", now, month, none).end).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
    expect(rangeFor("q1", now, month, none).end).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
  });

  it("halves, last year and whole years cover from January to December", () => {
    expect(rangeFor("h1", now, month, none).end).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999));
    expect(rangeFor("h2", now, month, none).start).toEqual(new Date(2026, 6, 1));
    expect(rangeFor("lastYear", now, month, none).start).toEqual(new Date(2025, 0, 1));
    expect(rangeFor("lastYear", now, month, none).end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
    expect(rangeFor("year:2016", now, month, none).start).toEqual(new Date(2016, 0, 1));
    expect(rangeFor("year:2016", now, month, none).end).toEqual(new Date(2016, 11, 31, 23, 59, 59, 999));
  });

  it("adds an entry per year with data, newest first, and labels them", () => {
    const list = presetsWithYears([2024, 2026, 2025, 2025], t);
    expect(list.map((entry) => entry.label).slice(-4)).toEqual(["Todo 2026", "Todo 2025", "Todo 2024", "Personalizado"]);
    expect(rangePresetLabel("year:2025", t)).toBe("Todo 2025");
    expect(rangePresetLabel("q2", t)).toBe("Trimestre 2");
    expect(yearsWithMovements([{ date: "2025-03-01T12:00:00Z" }, { date: "2026-01-02T12:00:00Z" }, {}]).sort()).toEqual([2025, 2026]);
  });
});
