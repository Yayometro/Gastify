import { describe, expect, it } from "vitest";
import { shortDate, shortDateOrEmpty } from "./dates";

describe("shortDateOrEmpty", () => {
  it("writes the date like shortDate, from a Date, a string or a number", () => {
    const date = new Date(2026, 9, 24, 12);
    expect(shortDateOrEmpty(date, "en")).toBe(shortDate(date, "en"));
    expect(shortDateOrEmpty(date.toISOString(), "es")).toBe(shortDate(date, "es"));
    expect(shortDateOrEmpty(date.getTime(), "en")).toBe(shortDate(date, "en"));
  });

  it("gives an empty text, not an error, when there is no date or it is not one", () => {
    expect(shortDateOrEmpty(undefined, "es")).toBe("");
    expect(shortDateOrEmpty(null, "en")).toBe("");
    expect(shortDateOrEmpty("", "en")).toBe("");
    expect(shortDateOrEmpty("not a date", "en")).toBe("");
    expect(shortDateOrEmpty(new Date("nope"), "es")).toBe("");
  });
});
