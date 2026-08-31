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
  buildCategoryHierarchy,
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

describe("buildCategoryHierarchy", () => {
  const CAT_FOOD = { _id: "cat-food", name: "Food", color: "#f00", icon: "md/MdFastfood" };
  const SUB_RESTAURANT = { _id: "sub-restaurant", name: "Restaurant", color: "#0f0", icon: "md/MdRestaurant" };
  const CAT_HEALTH = { _id: "cat-health", name: "Health", color: "#00f", icon: "md/MdHealth" };

  it("returns an empty-children root when there are no transactions", () => {
    const result = buildCategoryHierarchy([], true);
    expect(result).toMatchObject({ name: "Total expenses", children: [] });
  });

  it("groups a category-only transaction under its category with no children", () => {
    const result = buildCategoryHierarchy([{ amount: 100, category: CAT_FOOD }], true);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toMatchObject({ name: "Food", loc: 100, children: [] });
  });

  it("nests a subcategory transaction as a child leaf under its category", () => {
    const result = buildCategoryHierarchy(
      [{ amount: 50, category: CAT_FOOD, subCategory: SUB_RESTAURANT }],
      true
    );
    expect(result.children).toHaveLength(1);
    expect(result.children[0].name).toBe("Food");
    expect(result.children[0].children).toHaveLength(1);
    expect(result.children[0].children[0]).toMatchObject({ name: "Restaurant", loc: 50 });
    // The category node's own `loc` only tallies its *direct* (non-subcategorized)
    // spend, not its children's - it stays 0 here since every transaction in
    // this category was subcategorized. This isn't a display bug: both
    // consumers (Nivo's d3-hierarchy .sum() for the bubble chart, G2 treemap's
    // ignoreParentValue) recompute each parent's true total by summing its
    // whole subtree themselves, ignoring this raw field whenever children
    // exist - so the category circle/tile still shows the correct combined
    // amount on screen either way.
    expect(result.children[0].loc).toBe(0);
  });

  it("keeps a category's direct spend and its subcategory's spend as separate fields, not pre-summed", () => {
    const result = buildCategoryHierarchy(
      [
        { amount: 100, category: CAT_FOOD },
        { amount: 50, category: CAT_FOOD, subCategory: SUB_RESTAURANT },
      ],
      true
    );
    expect(result.children).toHaveLength(1);
    // Direct-only spend (the category-with-no-subcategory transaction).
    expect(result.children[0].loc).toBe(100);
    expect(result.children[0].children).toHaveLength(1);
    expect(result.children[0].children[0].loc).toBe(50);
  });

  it("accumulates repeated subcategory transactions into one leaf instead of duplicating it", () => {
    const result = buildCategoryHierarchy(
      [
        { amount: 20, category: CAT_FOOD, subCategory: SUB_RESTAURANT },
        { amount: 30, category: CAT_FOOD, subCategory: SUB_RESTAURANT },
      ],
      true
    );
    expect(result.children[0].children).toHaveLength(1);
    expect(result.children[0].children[0].loc).toBe(50);
  });

  it("groups every categoryless transaction into one 'No category' bucket", () => {
    const result = buildCategoryHierarchy(
      [{ amount: 10, category: null }, { amount: 15, category: null }],
      true
    );
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toMatchObject({ name: "No category", loc: 25 });
  });

  it("keeps separate categories as separate top-level entries", () => {
    const result = buildCategoryHierarchy(
      [{ amount: 10, category: CAT_FOOD }, { amount: 20, category: CAT_HEALTH }],
      true
    );
    expect(result.children).toHaveLength(2);
    const names = result.children.map((c) => c.name).sort();
    expect(names).toEqual(["Food", "Health"]);
  });

  it("uses the incomes root name/color when isBill is false", () => {
    const result = buildCategoryHierarchy([], false);
    expect(result.name).toBe("Total incomes");
    expect(result.color).toBe("#A7E295");
  });
});
