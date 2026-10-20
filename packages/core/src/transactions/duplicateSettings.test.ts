import { describe, it, expect } from "vitest";

import { DUPLICATE_DEFAULTS, toleranceFrom } from "./duplicateSettings";

describe("DUPLICATE_DEFAULTS", () => {
  it("matches the web: name, date and amount on; category and sub-category off; no tolerance", () => {
    expect(DUPLICATE_DEFAULTS).toEqual({
      criteria: { name: true, date: true, amount: true, category: false, subcategory: false },
      dateTolerance: 0,
      amountTolerance: 0,
    });
  });
});

describe("toleranceFrom", () => {
  it("reads a number, accepts a comma, and turns anything else into 0", () => {
    expect(toleranceFrom("0.99")).toBe(0.99);
    expect(toleranceFrom("1,5")).toBe(1.5);
    expect(toleranceFrom("")).toBe(0);
    expect(toleranceFrom("-3")).toBe(0);
    expect(toleranceFrom("abc")).toBe(0);
  });
});
