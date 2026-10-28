import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, countryName, countryOptions, normalizeCountry } from "./countries";

describe("countries", () => {
  it("accepts the ISO codes in any case and refuses everything else", () => {
    expect(normalizeCountry("mx")).toBe("MX");
    expect(normalizeCountry(" es ")).toBe("ES");
    expect(normalizeCountry("XX")).toBeNull();
    expect(normalizeCountry("UK")).toBeNull();
    expect(normalizeCountry("SU")).toBeNull();
    expect(normalizeCountry("")).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
    expect(normalizeCountry(484)).toBeNull();
  });

  it("has no duplicate codes", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
  });

  it("names a country in the language asked for, and falls back to the code", () => {
    expect(countryName("MX", "es")).toBe("México");
    expect(countryName("MX", "en")).toBe("Mexico");
    expect(countryName("ZZZ", "es")).toBe("ZZZ");
  });

  it("lists every country sorted by its name in the language", () => {
    const options = countryOptions("es");
    expect(options).toHaveLength(COUNTRY_CODES.length);
    const names = options.map((option) => option.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "es-MX", { sensitivity: "base" }));
    expect(names).toEqual(sorted);
    expect(options.find((option) => option.code === "MX")?.name).toBe("México");
  });
});
