import { describe, it, expect } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  isSupportedCurrency,
  assertSupportedCurrency,
  getMinorUnits,
  majorToMinor,
  minorToMajor,
  formatMoneyMinor,
} from "./currencies";

describe("currencies metadata", () => {
  it("supports exactly MXN, USD, EUR, JPY", () => {
    expect(SUPPORTED_CURRENCIES).toEqual(["MXN", "USD", "EUR", "JPY"]);
  });

  it("rejects unsupported currencies", () => {
    expect(isSupportedCurrency("BTC")).toBe(false);
    expect(() => assertSupportedCurrency("BTC")).toThrow();
  });

  it("MXN/USD/EUR use 2 minor units, JPY uses 0", () => {
    expect(getMinorUnits("MXN")).toBe(2);
    expect(getMinorUnits("USD")).toBe(2);
    expect(getMinorUnits("EUR")).toBe(2);
    expect(getMinorUnits("JPY")).toBe(0);
  });
});

describe("major/minor conversion", () => {
  it("converts MXN major to minor units (cents)", () => {
    expect(majorToMinor(1250.5, "MXN")).toBe(125050);
    expect(majorToMinor(0.01, "MXN")).toBe(1);
  });

  it("converts JPY major to minor units (whole yen, no decimals)", () => {
    expect(majorToMinor(5000, "JPY")).toBe(5000);
    expect(majorToMinor(5000.7, "JPY")).toBe(5001); // rounds to nearest yen
  });

  it("round-trips minor -> major correctly", () => {
    expect(minorToMajor(125050, "MXN")).toBeCloseTo(1250.5, 5);
    expect(minorToMajor(5000, "JPY")).toBe(5000);
  });

  it("handles negative account balances", () => {
    expect(majorToMinor(-100.25, "USD")).toBe(-10025);
    expect(minorToMajor(-10025, "USD")).toBeCloseTo(-100.25, 5);
  });

  it("does not introduce classic float drift (0.1 + 0.2 style errors)", () => {
    // 19.99 is a notorious float-drift trap
    expect(majorToMinor(19.99, "USD")).toBe(1999);
  });

  it("rejects non-finite values", () => {
    expect(() => majorToMinor(NaN, "MXN")).toThrow();
    expect(() => majorToMinor(Infinity, "MXN")).toThrow();
  });
});

describe("formatMoneyMinor", () => {
  it("formats MXN with 2 decimals and code prefix by default", () => {
    expect(formatMoneyMinor(125050, "MXN")).toContain("MXN");
    expect(formatMoneyMinor(125050, "MXN")).toContain("1,250.50");
  });

  it("formats JPY with zero decimals (no fake cents)", () => {
    const formatted = formatMoneyMinor(500000, "JPY");
    expect(formatted).toContain("JPY");
    expect(formatted).not.toMatch(/\.\d/); // no decimal point followed by digits
  });
});
