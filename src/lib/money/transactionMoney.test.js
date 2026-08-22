import { describe, it, expect } from "vitest";
import {
  buildAccountMoney,
  buildMerchantMoney,
  buildManualReportingMoney,
  buildSameCurrencyReportingMoney,
} from "./transactionMoney";

describe("buildAccountMoney", () => {
  it("converts a major-unit amount into the Account's native currency", () => {
    expect(buildAccountMoney({ amount: 33, currency: "USD" })).toEqual({
      amountMinor: 3300,
      currency: "USD",
    });
  });

  it("handles zero-decimal JPY", () => {
    expect(buildAccountMoney({ amount: 1500, currency: "JPY" })).toEqual({
      amountMinor: 1500,
      currency: "JPY",
    });
  });
});

describe("buildMerchantMoney", () => {
  it("returns null when no merchant amount/currency was supplied", () => {
    expect(buildMerchantMoney({ amount: undefined, currency: undefined })).toBeNull();
    expect(buildMerchantMoney({ amount: "", currency: "USD" })).toBeNull();
    expect(buildMerchantMoney({ amount: 10, currency: undefined })).toBeNull();
  });

  it("builds merchant money when both fields are present", () => {
    expect(buildMerchantMoney({ amount: 1200, currency: "JPY" })).toEqual({
      amountMinor: 1200,
      currency: "JPY",
    });
  });
});

describe("buildSameCurrencyReportingMoney", () => {
  it("is exact by construction - rate 1, source same_currency", () => {
    const account = { amountMinor: 125000, currency: "MXN" };
    const result = buildSameCurrencyReportingMoney({ accountMoney: account, effectiveDate: new Date("2026-08-21") });
    expect(result).toEqual({
      amountMinor: 125000,
      currency: "MXN",
      rate: "1",
      source: "same_currency",
      effectiveDate: new Date("2026-08-21"),
      estimated: false,
    });
  });
});

describe("buildManualReportingMoney", () => {
  it("derives the effective rate actually used from the two asserted amounts", () => {
    const accountMoney = { amountMinor: 3300, currency: "USD" }; // $33.00
    const result = buildManualReportingMoney({
      amount: 557.63,
      currency: "MXN",
      accountMoney,
      effectiveDate: new Date("2026-08-21"),
    });
    expect(result.amountMinor).toBe(55763);
    expect(result.currency).toBe("MXN");
    expect(Number(result.rate)).toBeCloseTo(16.898, 2);
    expect(result.source).toBe("manual");
    expect(result.estimated).toBe(false);
  });

  it("defaults effectiveDate to now when not provided", () => {
    const accountMoney = { amountMinor: 10000, currency: "EUR" };
    const result = buildManualReportingMoney({ amount: 200, currency: "USD", accountMoney });
    expect(result.effectiveDate).toBeInstanceOf(Date);
  });
});
