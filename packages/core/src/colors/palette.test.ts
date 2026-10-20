import { describe, it, expect } from "vitest";

import { COLOR_GRID, hslToHex, normalizeHex } from "./palette";

describe("hslToHex", () => {
  it("converts the primary hues", () => {
    expect(hslToHex(0, 100, 50)).toBe("#FF0000");
    expect(hslToHex(120, 100, 50)).toBe("#00FF00");
    expect(hslToHex(240, 100, 50)).toBe("#0000FF");
  });
});

describe("normalizeHex", () => {
  it("accepts 3 and 6 digit colors with or without the hash", () => {
    expect(normalizeHex("f57c00")).toBe("#F57C00");
    expect(normalizeHex("#f70")).toBe("#FF7700");
    expect(normalizeHex(" #2196f3 ")).toBe("#2196F3");
  });

  it("rejects anything else", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("rojo")).toBeNull();
  });
});

describe("COLOR_GRID", () => {
  it("has 12 hues x 4 levels plus grays, all valid and distinct", () => {
    expect(COLOR_GRID).toHaveLength(12 * 4 + 6);
    expect(new Set(COLOR_GRID).size).toBe(COLOR_GRID.length);
    expect(COLOR_GRID.every((c) => normalizeHex(c) === c)).toBe(true);
  });
});
