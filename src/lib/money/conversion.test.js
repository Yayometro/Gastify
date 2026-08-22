import { describe, it, expect } from "vitest";
import { crossRate, convertMinor, deriveEffectiveRate, percentageDifference } from "./conversion";

// ECB-style rates: currency units per 1 EUR. From the plan's 2026-08-21 live
// check: 1 EUR = 1.1699 USD, 1 EUR = 19.7690 MXN.
const RATES = { USD: "1.1699", MXN: "19.7690", JPY: "172.34" };

describe("crossRate", () => {
  it("returns 1 for same-currency conversion", () => {
    expect(crossRate(RATES, "MXN", "MXN").toString()).toBe("1");
  });

  it("computes MXN -> USD cross rate through EUR (rates[to]/rates[from])", () => {
    // MXN -> USD = rates.USD / rates.MXN
    const rate = crossRate(RATES, "MXN", "USD");
    expect(rate.toNumber()).toBeCloseTo(1.1699 / 19.769, 8);
  });

  it("computes USD -> MXN cross rate matching the plan's documented value (~16.898025)", () => {
    const rate = crossRate(RATES, "USD", "MXN");
    expect(rate.toNumber()).toBeCloseTo(16.898025, 4);
  });

  it("handles EUR as the implicit base (rate 1 per definition)", () => {
    const rate = crossRate(RATES, "EUR", "USD");
    expect(rate.toString()).toBe("1.1699");
  });

  it("throws when a rate is missing", () => {
    expect(() => crossRate({ USD: "1.1699" }, "MXN", "USD")).toThrow();
  });
});

describe("convertMinor", () => {
  it("converts USD minor units to MXN minor units using the cross rate", () => {
    // 100.00 USD -> MXN
    const result = convertMinor({ amountMinor: 10000, fromCurrency: "USD", toCurrency: "MXN", rates: RATES });
    expect(result.currency).toBe("MXN");
    // 100 * 16.898025 = 1689.8025 -> rounds to 168980 minor units (1689.80 MXN)
    expect(result.amountMinor).toBe(168980);
  });

  it("same-currency conversion returns the identical amount", () => {
    const result = convertMinor({ amountMinor: 55000, fromCurrency: "MXN", toCurrency: "MXN", rates: RATES });
    expect(result.amountMinor).toBe(55000);
  });

  it("converts into JPY (0 minor units) without fake decimals", () => {
    const result = convertMinor({ amountMinor: 10000, fromCurrency: "USD", toCurrency: "JPY", rates: RATES });
    expect(result.currency).toBe("JPY");
    expect(Number.isInteger(result.amountMinor)).toBe(true);
  });

  it("only rounds once, at the final minor unit (no intermediate rounding drift)", () => {
    // A value chosen so intermediate 2-decimal rounding would produce a
    // different result than rounding only at the very end.
    const result = convertMinor({ amountMinor: 333, fromCurrency: "USD", toCurrency: "MXN", rates: RATES });
    // 3.33 USD * 16.898025 = 56.269... -> 5627 minor units (56.27 MXN)
    expect(result.amountMinor).toBe(5627);
  });

  it("rejects unsupported currencies", () => {
    expect(() => convertMinor({ amountMinor: 100, fromCurrency: "BTC", toCurrency: "MXN", rates: RATES })).toThrow();
  });
});

describe("deriveEffectiveRate", () => {
  it("derives the rate actually used between a source and target money value", () => {
    const rate = deriveEffectiveRate({
      sourceMoney: { amountMinor: 10000, currency: "USD" }, // 100.00 USD
      targetMoney: { amountMinor: 169128, currency: "MXN" }, // 1691.28 MXN (Google's rate that day)
    });
    expect(Number(rate)).toBeCloseTo(16.9128, 4);
  });

  it("throws when the source amount is zero", () => {
    expect(() =>
      deriveEffectiveRate({
        sourceMoney: { amountMinor: 0, currency: "USD" },
        targetMoney: { amountMinor: 100, currency: "MXN" },
      })
    ).toThrow();
  });
});

describe("percentageDifference", () => {
  it("matches the plan's documented ECB vs Google difference (~0.0874%)", () => {
    const ecbRate = 16.898025;
    const googleRate = 16.9128;
    const diff = percentageDifference(googleRate, ecbRate);
    expect(diff).toBeCloseTo(0.0874, 2);
  });
});
