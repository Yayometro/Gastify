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

describe("formatMoneyMajor with bad numbers (bug 82)", () => {
  it("shows a zero amount instead of NaN or Infinity", async () => {
    const { formatMoneyMajor } = await import("./currencies");
    expect(formatMoneyMajor(NaN, "MXN", { showCode: false })).toBe(formatMoneyMajor(0, "MXN", { showCode: false }));
    expect(formatMoneyMajor(Infinity, "USD", { showCode: false })).toBe(formatMoneyMajor(0, "USD", { showCode: false }));
    expect(formatMoneyMajor("abc", "USD", { showCode: false })).toBe(formatMoneyMajor(0, "USD", { showCode: false }));
    expect(formatMoneyMajor(12.5, "USD", { showCode: false })).toBe("$12.50");
  });
});

describe("money helpers (bugs 80, 81, 83)", () => {
  it("majorToMinor never returns -0", async () => {
    const { majorToMinor } = await import("./currencies");
    expect(Object.is(majorToMinor(-0, "MXN"), 0)).toBe(true);
    expect(Object.is(majorToMinor(-0.001, "MXN"), 0)).toBe(true);
    expect(majorToMinor(-1.5, "MXN")).toBe(-150);
    expect(majorToMinor(2.345, "JPY")).toBe(2);
  });
  it("still rejects unsupported currencies and non-finite values", async () => {
    const { majorToMinor, minorToMajor, formatMoneyMinor, formatMoneyMajor } = await import("./currencies");
    expect(() => majorToMinor(1, "XXX")).toThrow("Unsupported currency");
    expect(() => minorToMajor(1, undefined)).toThrow("Unsupported currency");
    expect(() => formatMoneyMinor(1, "XXX")).toThrow("Unsupported currency");
    expect(() => formatMoneyMajor(1, "XXX")).toThrow("Unsupported currency");
    expect(() => majorToMinor(NaN, "MXN")).toThrow("not a finite number");
    expect(() => minorToMajor(NaN, "MXN")).toThrow("not a finite number");
  });
  it("formats the same with the cached formatter on repeated calls", async () => {
    const { formatMoneyMinor, formatMoneyMajor } = await import("./currencies");
    expect(formatMoneyMinor(12550, "MXN", { showCode: false })).toBe("$125.50");
    expect(formatMoneyMinor(12550, "MXN", { showCode: false })).toBe("$125.50");
    expect(formatMoneyMajor(1234.5, "USD")).toBe("USD $1,234.50");
    expect(formatMoneyMajor(1000, "JPY", { showCode: false })).toContain("1,000");
  });
});
