import { describe, it, expect } from "vitest";
import {
  getPrimaryAmount,
  get_total_value_of_all_transactions,
  getTotalValue,
  reduceAndTransforToCategories,
  reduceTransCategoriesSliced,
  transactionsToCategories,
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
