import { describe, it, expect } from "vitest";
import { chooseLocale, countryOf, localeFromCountry } from "./locales";

describe("countryOf", () => {
  it("reads the region of a language tag", () => {
    expect(countryOf("es-MX")).toBe("MX");
    expect(countryOf("en_US")).toBe("US");
    expect(countryOf("en")).toBeNull();
    expect(countryOf(null)).toBeNull();
  });
});

describe("localeFromCountry", () => {
  it("gives Spanish to the Spanish-speaking countries and English to the rest", () => {
    expect(localeFromCountry("MX")).toBe("es");
    expect(localeFromCountry("es")).toBe("es");
    expect(localeFromCountry("US")).toBe("en");
    expect(localeFromCountry("BR")).toBe("en");
  });

  it("has no answer for a missing, malformed or unknown country", () => {
    expect(localeFromCountry(null)).toBeNull();
    expect(localeFromCountry("MEX")).toBeNull();
    expect(localeFromCountry("XX")).toBeNull();
    expect(localeFromCountry("T1")).toBeNull();
  });
});

describe("chooseLocale", () => {
  it("the account's language wins over everything", () => {
    expect(chooseLocale({ account: "en", device: "es", country: "MX", language: "es-MX" })).toBe("en");
  });

  it("then the choice this device remembers", () => {
    expect(chooseLocale({ account: null, device: "en", country: "MX" })).toBe("en");
  });

  it("then where the person is", () => {
    expect(chooseLocale({ country: "US", language: "es-MX" })).toBe("en");
    expect(chooseLocale({ country: "MX", language: "en-US" })).toBe("es");
  });

  it("then what the browser or the phone asks for, and Spanish when nothing says anything", () => {
    expect(chooseLocale({ language: "en-US,en;q=0.9" })).toBe("en");
    expect(chooseLocale({})).toBe("es");
    expect(chooseLocale({ account: "fr" as string })).toBe("es");
  });
});
