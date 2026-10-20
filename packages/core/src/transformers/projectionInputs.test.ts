import { describe, it, expect } from "vitest";

import { convertBaselineToPrimary, convertSourcesToPrimary, foreignCurrenciesOf } from "./projectionInputs";

describe("convertSourcesToPrimary", () => {
  it("converts foreign sources with their rate, keeps main-currency ones and reports missing rates", () => {
    const result = convertSourcesToPrimary(
      [
        { name: "Nómina", amount: 20000, currency: "MXN" },
        { name: "Freelance", amount: 100, currency: "USD" },
        { name: "Renta", amount: 50, currency: "EUR" },
      ],
      "MXN",
      { USD: 18.5 }
    );
    expect(result.sources.map((s) => s.amount)).toEqual([20000, 1850, 50]);
    expect(result.missing).toEqual(["EUR"]);
  });
});

describe("convertBaselineToPrimary", () => {
  it("converts the money of each entry in minor units and leaves the rest alone", () => {
    const result = convertBaselineToPrimary(
      { incomeHistory: [{ incomeMoney: { amountMinor: 10000, currency: "USD" } }], expenseHistory: [{ expenseMoney: { amountMinor: 500000, currency: "MXN" } }] },
      "MXN",
      { USD: 18.5 }
    );
    expect(result.baseline?.incomeHistory?.[0].incomeMoney).toEqual({ amountMinor: 185000, currency: "MXN" });
    expect(result.baseline?.expenseHistory?.[0].expenseMoney).toEqual({ amountMinor: 500000, currency: "MXN" });
    expect(result.missing).toEqual([]);
  });

  it("passes null through", () => {
    expect(convertBaselineToPrimary(null, "MXN", {})).toEqual({ baseline: null, missing: [] });
  });
});

describe("foreignCurrenciesOf", () => {
  it("lists every non-main currency found in the sources and the baseline", () => {
    const found = foreignCurrenciesOf([{ currency: "USD" }, { currency: "MXN" }], { incomeHistory: [{ incomeMoney: { amountMinor: 1, currency: "EUR" } }] }, "MXN");
    expect(found.sort()).toEqual(["EUR", "USD"]);
  });
});
