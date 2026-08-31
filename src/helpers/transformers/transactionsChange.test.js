import { describe, it, expect } from "vitest";
import {
  getPrimaryAmount,
  get_total_value_of_all_transactions,
  getTotalValue,
  reduceAndTransforToCategories,
  reduceTransCategoriesSliced,
  transactionsToCategories,
  filterBillsOrIncomes,
  orderItemsInRelativeMonth,
  mergeTopElementsForCompareTable,
} from "./transactionsChange";

function tx({ amountMinor, currency = "MXN", legacyAmount, category = null, isBill = true }) {
  const base = { category, isBill, isIncome: !isBill, date: "2026-08-20" };
  if (amountMinor === undefined) return { ...base, amount: legacyAmount };
  return {
    ...base,
    amount: legacyAmount ?? amountMinor / 100,
    displayMoney: { primary: { amountMinor, currency } },
  };
}

describe("getPrimaryAmount", () => {
  it("converts displayMoney.primary to major units when present", () => {
    expect(getPrimaryAmount(tx({ amountMinor: 12550, currency: "MXN" }))).toBe(125.5);
  });

  it("respects zero-decimal currencies (JPY)", () => {
    expect(getPrimaryAmount(tx({ amountMinor: 1500, currency: "JPY" }))).toBe(1500);
  });

  it("falls back to the legacy .amount when displayMoney is absent (old cached data)", () => {
    expect(getPrimaryAmount({ amount: 99.5 })).toBe(99.5);
  });

  it("passes through an already-aggregated synthetic item's .value unchanged", () => {
    expect(getPrimaryAmount({ value: 500, type: "Food" })).toBe(500);
  });

  it("returns 0 for a nullish/malformed item rather than throwing", () => {
    expect(getPrimaryAmount(null)).toBe(0);
    expect(getPrimaryAmount({})).toBe(0);
  });
});

describe("reducers now sum the Wallet-primary equivalent instead of raw .amount", () => {
  it("get_total_value_of_all_transactions sums displayMoney.primary, not native amount", () => {
    // A USD transaction whose native amount is 100 but whose Wallet-primary
    // (MXN) equivalent is 1689.80 - the sum must reflect the converted
    // value, not the raw native number, once displayMoney is attached.
    const transactions = [
      tx({ amountMinor: 168980, currency: "MXN" }), // was $100 USD, converted
      tx({ amountMinor: 5000, currency: "MXN" }),   // $50 MXN native
    ];
    expect(get_total_value_of_all_transactions(transactions)).toBeCloseTo(1689.8 + 50, 5);
  });

  it("getTotalValue works across a mix of raw transactions and pre-aggregated items", () => {
    const items = [tx({ amountMinor: 10000, currency: "MXN" }), { value: 25 }];
    expect(getTotalValue(items)).toBe(125);
  });

  it("reduceAndTransforToCategories buckets by category using the converted amount", () => {
    const cat = { _id: "c1", name: "Food", icon: "icon", color: "#fff" };
    const transactions = [
      tx({ amountMinor: 10000, currency: "MXN", category: cat }),
      tx({ amountMinor: 20000, currency: "MXN", category: cat }),
    ];
    const { array, totalAmount } = reduceAndTransforToCategories(transactions);
    expect(array).toHaveLength(1);
    expect(array[0].value).toBe(300);
    expect(totalAmount).toBe(300);
  });

  it("reduceTransCategoriesSliced sums the converted amount per category", () => {
    const cat = { _id: "c1", name: "Transport", icon: "icon", color: "#fff" };
    const transactions = [tx({ amountMinor: 5000, currency: "MXN", category: cat })];
    const [result] = reduceTransCategoriesSliced(transactions, 5);
    expect(result.value).toBe(50);
  });

  it("transactionsToCategories maps each transaction's converted amount", () => {
    const cat = { _id: "c1", name: "Shopping", icon: "icon", color: "#fff" };
    const [result] = transactionsToCategories([tx({ amountMinor: 7500, currency: "MXN", category: cat })]);
    expect(result.value).toBe(75);
  });

  it("still works for legacy transactions that were never migrated (no displayMoney)", () => {
    const cat = { _id: "c1", name: "Food", icon: "icon", color: "#fff" };
    const transactions = [tx({ legacyAmount: 40, category: cat })];
    const { totalAmount } = reduceAndTransforToCategories(transactions);
    expect(totalAmount).toBe(40);
  });
});

describe("filterBillsOrIncomes", () => {
  it("excludes transfer/exchange legs from both incomes and bills", () => {
    const transactions = [
      { isBill: true, isIncome: false, kind: "expense", amount: 100 },
      { isBill: false, isIncome: true, kind: "income", amount: 200 },
      { isBill: false, isIncome: false, kind: "transfer", amount: 50 },
      { isBill: false, isIncome: false, kind: "exchange", amount: 75 },
    ];
    const { incomes, bills } = filterBillsOrIncomes(transactions);
    expect(bills).toHaveLength(1);
    expect(incomes).toHaveLength(1);
    expect(incomes[0].kind).toBe("income");
  });

  it("still classifies a real income/bill correctly when kind is absent (legacy pre-migration shape)", () => {
    const transactions = [
      { isBill: true, isIncome: false, amount: 100 },
      { isBill: false, isIncome: true, amount: 200 },
    ];
    const { incomes, bills } = filterBillsOrIncomes(transactions);
    expect(bills).toHaveLength(1);
    expect(incomes).toHaveLength(1);
  });
});

describe("orderItemsInRelativeMonth", () => {
  it("buckets items by months-since-rangeStart, keeping every underlying item", () => {
    const rangeStart = new Date(2026, 0, 1);
    const items = [
      { amount: 100, date: new Date(2026, 0, 10) },
      { amount: 50, date: new Date(2026, 0, 20) },
      { amount: 200, date: new Date(2026, 1, 5) },
    ];
    const result = orderItemsInRelativeMonth(items, rangeStart);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ index: 0, value: 150 });
    expect(result[0].childrens).toHaveLength(2);
    expect(result[1]).toMatchObject({ index: 1, value: 200, monthLabel: "February 2026" });
  });

  it("aligns items from different years to the same relative index when they share a rangeStart offset", () => {
    const items2025 = orderItemsInRelativeMonth(
      [{ amount: 10, date: new Date(2025, 2, 15) }],
      new Date(2025, 0, 1)
    );
    const items2026 = orderItemsInRelativeMonth(
      [{ amount: 10, date: new Date(2026, 2, 15) }],
      new Date(2026, 0, 1)
    );
    expect(items2025[0].index).toBe(items2026[0].index);
  });
});

describe("mergeTopElementsForCompareTable", () => {
  it("aligns two periods' relative-month buckets side by side by index", () => {
    const monthsA = [
      { index: 0, monthLabel: "January 2025", childrens: ["a-jan"] },
      { index: 1, monthLabel: "February 2025", childrens: ["a-feb"] },
    ];
    const monthsB = [
      { index: 0, monthLabel: "January 2026", childrens: ["b-jan"] },
    ];
    const rows = mergeTopElementsForCompareTable(monthsA, monthsB);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      index: 0,
      colA: { monthLabel: "January 2025" },
      colB: { monthLabel: "January 2026" },
    });
    expect(rows[1].colA.monthLabel).toBe("February 2025");
    expect(rows[1].colB).toBeNull();
  });

  it("returns an empty array when both periods have no data", () => {
    expect(mergeTopElementsForCompareTable([], [])).toEqual([]);
  });
});
