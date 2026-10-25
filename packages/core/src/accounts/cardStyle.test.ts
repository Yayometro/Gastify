import { describe, expect, it } from "vitest";
import { CARD_COLORS, CARD_PATTERNS, isCardColor, isCardPattern } from "./cardStyle";

describe("card style", () => {
  it("accepts auto and every listed color, nothing else", () => {
    expect(isCardColor("auto")).toBe(true);
    expect(isCardColor("turquoise")).toBe(true);
    expect(isCardColor("rainbow")).toBe(true);
    expect(isCardColor("hotpink-neon")).toBe(false);
    expect(isCardColor(null)).toBe(false);
    expect(isCardColor(42)).toBe(false);
  });

  it("accepts only listed patterns", () => {
    for (const pattern of CARD_PATTERNS) expect(isCardPattern(pattern.id)).toBe(true);
    expect(isCardPattern("confetti")).toBe(false);
    expect(isCardPattern(undefined)).toBe(false);
  });

  it("gives every color a valid set of stops with unique ids", () => {
    const ids = CARD_COLORS.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const option of CARD_COLORS) {
      expect(option.stops.length).toBeGreaterThanOrEqual(2);
      for (const stop of option.stops) expect(stop).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
