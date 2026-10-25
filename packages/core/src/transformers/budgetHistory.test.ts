import { describe, it, expect } from "vitest";
import {
  getValueActiveInMonth,
  getBudgetBarColor,
  getBudgetBarGradient,
  getBudgetMoodEmoji,
} from "./budgetHistory";

describe("budgetHistory", () => {
  describe("getValueActiveInMonth", () => {
    it("returns null for non-array or empty history", () => {
      expect(getValueActiveInMonth(null, new Date(2026, 0, 1))).toBeNull();
      expect(getValueActiveInMonth(undefined, new Date(2026, 0, 1))).toBeNull();
      expect(getValueActiveInMonth([], new Date(2026, 0, 1))).toBeNull();
    });

    it("returns null when no entries match the given date window", () => {
      const history = [
        {
          effectiveFrom: new Date(2026, 5, 1),
          effectiveTo: new Date(2026, 11, 31),
          goalAmount: 500,
        },
      ];
      expect(getValueActiveInMonth(history, new Date(2026, 0, 1))).toBeNull();
    });

    it("returns the active entry when effectiveTo is null (still active)", () => {
      const history = [
        {
          effectiveFrom: new Date(2025, 0, 1),
          effectiveTo: null,
          goalAmount: 1000,
        },
      ];
      const res = getValueActiveInMonth(history, new Date(2026, 3, 1));
      expect(res).toEqual(history[0]);
    });

    it("returns the latest effectiveFrom candidate when multiple match", () => {
      const history = [
        {
          effectiveFrom: new Date(2025, 0, 1),
          effectiveTo: null,
          goalAmount: 500,
        },
        {
          effectiveFrom: new Date(2025, 6, 1),
          effectiveTo: null,
          goalAmount: 1000,
        },
      ];
      const res = getValueActiveInMonth(history, new Date(2026, 0, 1));
      expect(res).toEqual(history[1]);
    });
  });

  describe("getBudgetBarColor", () => {
    it("handles non-finite / null ratios safely", () => {
      expect(getBudgetBarColor(null, false)).toBe("#4CAF50");
      expect(getBudgetBarColor(NaN, false)).toBe("#4CAF50");
      expect(getBudgetBarColor(Infinity, false)).toBe("#4CAF50");
    });

    it("returns correct colors for spending budgets", () => {
      expect(getBudgetBarColor(1.1, false)).toBe("#B91C1C"); // > 1 -> intense dark red
      expect(getBudgetBarColor(0.85, false)).toBe("#F4664A"); // >= 0.85 -> coral red
      expect(getBudgetBarColor(0.6, false)).toBe("#FFD633"); // >= 0.6 -> yellow
      expect(getBudgetBarColor(0.5, false)).toBe("#4CAF50"); // < 0.6 -> green
    });

    it("returns correct colors for saving budgets", () => {
      expect(getBudgetBarColor(0.85, true)).toBe("#2962FF"); // >= 0.85 -> blue
      expect(getBudgetBarColor(0.35, true)).toBe("#4CAF50"); // >= 0.35 -> green
      expect(getBudgetBarColor(0.2, true)).toBe("#F4664A"); // < 0.35 -> red
    });
  });

  describe("getBudgetBarGradient", () => {
    it("generates a linear-gradient string with lightened start color", () => {
      const gradient = getBudgetBarGradient(0.5, false);
      expect(gradient).toContain("linear-gradient(90deg,");
      expect(gradient).toContain("#4CAF50");
    });
  });

  describe("getBudgetMoodEmoji", () => {
    it("returns correct mood emoji for spending budgets", () => {
      expect(getBudgetMoodEmoji(1.2, false)).toBe("🔥");
      expect(getBudgetMoodEmoji(0.9, false)).toBe("😰");
      expect(getBudgetMoodEmoji(0.7, false)).toBe("😐");
      expect(getBudgetMoodEmoji(0.4, false)).toBe("🙂");
      expect(getBudgetMoodEmoji(0.2, false)).toBe("🤩");
    });

    it("returns correct mood emoji for saving budgets", () => {
      expect(getBudgetMoodEmoji(0.9, true)).toBe("🤩");
      expect(getBudgetMoodEmoji(0.5, true)).toBe("🙂");
      expect(getBudgetMoodEmoji(0.2, true)).toBe("😟");
    });
  });
});
