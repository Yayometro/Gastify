import { describe, it, expect } from "vitest";

import { balancesByCurrency, totalInPrimary } from "./accountTotals";

describe("balancesByCurrency", () => {
  it("adds the balances of each currency apart", () => {
    expect(
      balancesByCurrency([
        { amount: 1200.5, currency: "MXN" },
        { amount: "300", currency: "MXN" },
        { amount: 40, currency: "USD" },
        { amount: null, currency: "EUR" },
      ])
    ).toEqual({ MXN: 1500.5, USD: 40, EUR: 0 });
  });
});

describe("totalInPrimary", () => {
  it("converts foreign accounts with their rate and reports the currencies without one", () => {
    const result = totalInPrimary(
      [
        { amount: 1000, currency: "MXN" },
        { amount: 100, currency: "USD" },
        { amount: 50, currency: "EUR" },
      ],
      "MXN",
      { USD: 17.5 }
    );
    expect(result).toEqual({ total: 2750, missingCurrencies: ["EUR"] });
  });

  it("treats an account without currency as the primary one", () => {
    expect(totalInPrimary([{ amount: 10 }], "MXN", {})).toEqual({ total: 10, missingCurrencies: [] });
  });
});
