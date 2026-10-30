import { describe, it, expect } from "vitest";

import { BANKS, bankById, banksForCountry, formatCardNumber, normalizeCardNumber } from "./banks";

describe("banks", () => {
  it("has unique ids", () => {
    expect(new Set(BANKS.map((entry) => entry.id)).size).toBe(BANKS.length);
  });

  it("splits Mexico's banks in main and other", () => {
    const { main, other } = banksForCountry("MX");
    expect(main.map((b) => b.id)).toContain("bbva");
    expect(other.map((b) => b.id)).toContain("nu");
  });

  it("finds a bank by id and returns null for an unknown one", () => {
    expect(bankById("santander")?.name).toBe("Santander");
    expect(bankById("nope")).toBeNull();
    expect(bankById(null)).toBeNull();
  });

  it("keeps only 4 to 19 digits of a card number and drops spaces and dashes", () => {
    expect(normalizeCardNumber("4152 3133-1234 5678")).toEqual({ ok: true, value: "5678" });
    expect(normalizeCardNumber("1234")).toEqual({ ok: true, value: "1234" });
    expect(normalizeCardNumber("")).toEqual({ ok: true, value: null });
    expect(normalizeCardNumber("12")).toMatchObject({ ok: false });
    expect(normalizeCardNumber("12ab5678")).toMatchObject({ ok: false });
  });

  it("hides all but the last four digits unless asked to reveal", () => {
    expect(formatCardNumber("4152313312345678", false)).toBe("•••• 5678");
    expect(formatCardNumber("4152313312345678", true)).toBe("4152 3133 1234 5678");
    expect(formatCardNumber(null, false)).toBe("");
  });
});
