import { describe, it, expect } from "vitest";
import {
  areDuplicates,
  getDuplicates,
  getDuplicatesToDelete,
  getAllMatchingIds,
  getDuplicatePairs,
} from "./transactionDuplicates";

function makeTransaction({ id, name, date, amountMinor, currency = "MXN", category = null, subCategory = null }) {
  return {
    _id: id,
    name,
    date,
    category,
    subCategory,
    displayMoney: { native: { amountMinor, currency } },
  };
}

const ALL_CRITERIA = { name: true, date: true, amount: true, category: false, subcategory: false };

describe("areDuplicates - currency awareness", () => {
  it("100 MXN and 100 USD are never duplicates merely because both contain the number 100", () => {
    const a = makeTransaction({ id: "a", name: "Coffee", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });
    const b = makeTransaction({ id: "b", name: "Coffee", date: "2026-08-20", amountMinor: 10000, currency: "USD" });

    expect(areDuplicates(a, b, ALL_CRITERIA, 0, 0)) .toBe(false);
  });

  it("still matches when currencies are the same and everything else lines up", () => {
    const a = makeTransaction({ id: "a", name: "Coffee", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });
    const b = makeTransaction({ id: "b", name: "Coffee", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });

    expect(areDuplicates(a, b, ALL_CRITERIA, 0, 0)).toBe(true);
  });

  it("falls back to legacy amount+MXN when displayMoney is missing", () => {
    const a = { _id: "a", name: "Legacy", date: "2026-08-20", amount: 50 };
    const b = { _id: "b", name: "Legacy", date: "2026-08-20", amount: 50 };

    expect(areDuplicates(a, b, ALL_CRITERIA, 0, 0)).toBe(true);
  });

  it("respects amount tolerance in the native currency's major units", () => {
    // 150 minor units apart = 1.50 MXN.
    const a = makeTransaction({ id: "a", name: "Coffee", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });
    const b = makeTransaction({ id: "b", name: "Coffee", date: "2026-08-20", amountMinor: 10150, currency: "MXN" });

    expect(areDuplicates(a, b, ALL_CRITERIA, 0, 1.5)).toBe(true); // exactly within tolerance
    expect(areDuplicates(a, b, ALL_CRITERIA, 0, 1)).toBe(false); // 1.50 MXN apart, exceeds 1.00 tolerance
    expect(areDuplicates(a, b, ALL_CRITERIA, 0, 0)).toBe(false); // no tolerance at all
  });
});

describe("getDuplicates / getDuplicatesToDelete / getAllMatchingIds - currency-aware grouping", () => {
  const mxn1 = makeTransaction({ id: "mxn1", name: "Uber", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });
  const mxn2 = makeTransaction({ id: "mxn2", name: "Uber", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });
  const usd1 = makeTransaction({ id: "usd1", name: "Uber", date: "2026-08-20", amountMinor: 10000, currency: "USD" });
  const unique = makeTransaction({ id: "unique", name: "Groceries", date: "2026-08-21", amountMinor: 5000, currency: "MXN" });

  it("groups only same-currency matches, leaving the cross-currency lookalike out", () => {
    const dups = getDuplicates([mxn1, mxn2, usd1, unique], ALL_CRITERIA, 0, 0);
    const ids = dups.map((t) => t._id).sort();
    expect(ids).toEqual(["mxn1", "mxn2"]);
  });

  it("getDuplicatesToDelete keeps one original per currency-aware group", () => {
    const toDelete = getDuplicatesToDelete([mxn1, mxn2, usd1, unique], ALL_CRITERIA, 0, 0);
    expect(toDelete).toEqual(["mxn2"]);
  });

  it("getAllMatchingIds returns every member of the matched group", () => {
    const all = getAllMatchingIds([mxn1, mxn2, usd1, unique], ALL_CRITERIA, 0, 0);
    expect(all.sort()).toEqual(["mxn1", "mxn2"]);
  });
});

describe("getDuplicatePairs", () => {
  it("pairs a selected duplicate with its group's original", () => {
    const mxn1 = makeTransaction({ id: "mxn1", name: "Uber", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });
    const mxn2 = makeTransaction({ id: "mxn2", name: "Uber", date: "2026-08-20", amountMinor: 10000, currency: "MXN" });

    const pairs = getDuplicatePairs([mxn1, mxn2], ["mxn2"], ALL_CRITERIA, 0, 0);

    expect(pairs).toEqual([{ original: mxn1, duplicate: mxn2 }]);
  });
});
