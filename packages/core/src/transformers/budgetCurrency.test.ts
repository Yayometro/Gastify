import { describe, it, expect } from "vitest";
import {
  convertBudgetToPrimary,
  convertBudgetsToPrimary,
  getForeignBudgetCurrencies,
  getStoredBudget,
} from "./budgetCurrency";

const usdBudget = {
  _id: "b1",
  currency: "USD",
  goalAmount: 500,
  savingAmount: 100,
  history: [
    { goalAmount: 400, savingAmount: 50, effectiveFrom: "2026-01-01" },
    { goalAmount: 500, effectiveFrom: "2026-06-01" },
  ],
};

describe("budgetCurrency", () => {
  it("lists only the foreign currencies, once each", () => {
    expect(
      getForeignBudgetCurrencies([{ currency: "USD" }, { currency: "MXN" }, { currency: "USD" }, {}, { currency: "EUR" }], "MXN").sort()
    ).toEqual(["EUR", "USD"]);
  });

  it("leaves a budget already in the primary currency (or with no currency) untouched", () => {
    const same = { currency: "MXN", goalAmount: 10 };
    const none = { goalAmount: 10 };
    expect(convertBudgetToPrimary(same, "MXN", {})).toBe(same);
    expect(convertBudgetToPrimary(none, "MXN", {})).toBe(none);
  });

  it("converts goal, saving amount and every history entry, rounding to the primary currency", () => {
    const converted = convertBudgetToPrimary(usdBudget, "MXN", { USD: 18.456 });
    expect(converted.currency).toBe("MXN");
    expect(converted.goalAmount).toBe(9228);
    expect(converted.savingAmount).toBe(1845.6);
    expect(converted.history?.[0].goalAmount).toBe(7382.4);
    expect(converted.history?.[0].savingAmount).toBe(922.8);
    expect(converted.history?.[1].goalAmount).toBe(9228);
    expect(converted.history?.[1].savingAmount).toBeUndefined();
    expect(converted.history?.[0].effectiveFrom).toBe("2026-01-01");
  });

  it("rounds to whole units for a zero-decimal primary currency", () => {
    expect(convertBudgetToPrimary({ currency: "USD", goalAmount: 3 }, "JPY", { USD: 149.5 }).goalAmount).toBe(449);
  });

  it("flags the budget instead of guessing when there is no rate", () => {
    const missing = convertBudgetToPrimary(usdBudget, "MXN", {});
    expect(missing.conversionUnavailable).toBe(true);
    expect(missing.goalAmount).toBe(500);
    expect(missing.currency).toBe("USD");
    expect(convertBudgetToPrimary(usdBudget, "MXN", { USD: 0 }).conversionUnavailable).toBe(true);
    expect(convertBudgetToPrimary(usdBudget, "MXN", null).conversionUnavailable).toBe(true);
  });

  it("does not mutate the stored budget and gives it back through getStoredBudget", () => {
    const converted = convertBudgetToPrimary(usdBudget, "MXN", { USD: 20 });
    expect(usdBudget.goalAmount).toBe(500);
    expect(usdBudget.history[0].goalAmount).toBe(400);
    expect(getStoredBudget(converted)).toBe(usdBudget);
    expect(getStoredBudget(usdBudget)).toBe(usdBudget);
  });

  it("converts a list and tolerates null", () => {
    expect(convertBudgetsToPrimary(null, "MXN", {})).toEqual([]);
    const [a, b] = convertBudgetsToPrimary([usdBudget, { _id: "b2", currency: "MXN", goalAmount: 7 }], "MXN", { USD: 2 });
    expect(a.goalAmount).toBe(1000);
    expect(b.goalAmount).toBe(7);
  });
});
