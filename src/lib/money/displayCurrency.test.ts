import { describe, it, expect, afterEach } from "vitest";
import { formatInPrimaryCurrency, getDisplayCurrency, setDisplayCurrency } from "./displayCurrency";

afterEach(() => setDisplayCurrency("MXN"));

describe("display currency", () => {
  it("defaults to MXN and ignores unsupported values", () => {
    expect(getDisplayCurrency()).toBe("MXN");
    setDisplayCurrency("XXX");
    setDisplayCurrency(undefined);
    expect(getDisplayCurrency()).toBe("MXN");
  });

  it("formats in the wallet's primary currency (bugs 51, 59, 101)", () => {
    expect(formatInPrimaryCurrency(1234.5)).toBe("$1,234.50");
    setDisplayCurrency("EUR");
    expect(formatInPrimaryCurrency(1234.5)).toContain("€");
    setDisplayCurrency("JPY");
    expect(formatInPrimaryCurrency(1234)).toMatch(/[¥￥]/);
    expect(formatInPrimaryCurrency(1234)).not.toContain(".");
  });

  it("accepts numeric strings and missing values", () => {
    expect(formatInPrimaryCurrency("10")).toBe("$10.00");
    expect(formatInPrimaryCurrency(null)).toBe("$0.00");
    expect(formatInPrimaryCurrency(NaN)).toBe("$0.00");
  });
});
