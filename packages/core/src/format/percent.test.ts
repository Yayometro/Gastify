import { describe, it, expect } from "vitest";
import { percentOf } from "./percent";

describe("percentOf", () => {
  it("rounds to one decimal instead of cutting the text", () => {
    expect(percentOf(12.96, 100)).toBe("13.0");
    expect(percentOf(1, 3)).toBe("33.3");
    expect(percentOf(2, 3)).toBe("66.7");
    expect(percentOf(100, 100)).toBe("100.0");
  });
  it("never shows NaN or Infinity", () => {
    expect(percentOf(5, 0)).toBe("0.0");
    expect(percentOf(0, 0)).toBe("0.0");
    expect(percentOf(undefined, 10)).toBe("0.0");
    expect(percentOf(5, undefined)).toBe("0.0");
    expect(percentOf(NaN, 10)).toBe("0.0");
    expect(percentOf(5, Infinity)).toBe("0.0");
  });
});
