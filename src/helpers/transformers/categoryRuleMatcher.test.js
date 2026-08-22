import { describe, it, expect } from "vitest";
import { suggestCategory } from "./categoryRuleMatcher";

// Acceptance tests written by Claude BEFORE delegating the currency-aware
// matcher migration to Gemini (agy), so Gemini has a fixed, independent bar
// to pass rather than grading its own homework. Do not weaken these to make
// an implementation pass - fix the implementation instead.

const CATEGORY_A = { _id: "cat-a", name: "Transport" };
const CATEGORY_B = { _id: "cat-b", name: "Shopping" };

function native(amountMinor, currency = "MXN") {
  return { amountMinor, currency };
}

describe("suggestCategory - name matching (unchanged behavior)", () => {
  it("matches by pattern regardless of amount when the rule has no thresholds", () => {
    const rules = [{ _id: "r1", pattern: "UBER", category: CATEGORY_A, priority: 0 }];
    const result = suggestCategory("UBER *TRIP 123", native(5000, "MXN"), rules);
    expect(result).toEqual({ ruleId: "r1", category: CATEGORY_A, subCategory: null, confidence: "high" });
  });

  it("returns null when no rule's pattern matches", () => {
    const rules = [{ _id: "r1", pattern: "UBER", category: CATEGORY_A }];
    expect(suggestCategory("NETFLIX.COM", native(1000), rules)).toBeNull();
  });

  it("prefers the higher-priority rule when both match", () => {
    const rules = [
      { _id: "broad", pattern: "UBER", category: CATEGORY_A, priority: 0 },
      { _id: "specific", pattern: "UBER EATS", category: CATEGORY_B, priority: 10 },
    ];
    const result = suggestCategory("UBER EATS ORDER", native(2000), rules);
    expect(result.ruleId).toBe("specific");
  });

  it("skips a rule with a malformed regex pattern instead of throwing", () => {
    const rules = [
      { _id: "bad", pattern: "[", category: CATEGORY_A, priority: 10 },
      { _id: "good", pattern: "UBER", category: CATEGORY_B, priority: 0 },
    ];
    const result = suggestCategory("UBER TRIP", native(1000), rules);
    expect(result.ruleId).toBe("good");
  });
});

describe("suggestCategory - currency-aware amount thresholds (minAmountMinor/maxAmountMinor)", () => {
  it("matches when the native amount is within the minor-unit threshold in the same currency", () => {
    const rules = [{
      _id: "r1", pattern: "OXXO", category: CATEGORY_A,
      minAmountMinor: 5000, maxAmountMinor: 20000, amountCurrency: "MXN",
    }];
    expect(suggestCategory("OXXO TIENDA", native(10000, "MXN"), rules)?.ruleId).toBe("r1");
  });

  it("rejects when the native amount (same currency) is below minAmountMinor", () => {
    const rules = [{ _id: "r1", pattern: "OXXO", category: CATEGORY_A, minAmountMinor: 5000, amountCurrency: "MXN" }];
    expect(suggestCategory("OXXO TIENDA", native(1000, "MXN"), rules)).toBeNull();
  });

  it("rejects when the native amount (same currency) is above maxAmountMinor", () => {
    const rules = [{ _id: "r1", pattern: "OXXO", category: CATEGORY_A, maxAmountMinor: 20000, amountCurrency: "MXN" }];
    expect(suggestCategory("OXXO TIENDA", native(50000, "MXN"), rules)).toBeNull();
  });

  it("does NOT block the match when the transaction's native currency differs from the rule's amountCurrency (thresholds aren't comparable across currencies)", () => {
    const rules = [{
      _id: "r1", pattern: "AMAZON", category: CATEGORY_A,
      minAmountMinor: 5000, maxAmountMinor: 20000, amountCurrency: "MXN",
    }];
    // 100000 minor units of USD ($1,000.00) would fail an MXN threshold check
    // if compared directly minor-unit-to-minor-unit - it must not be, since
    // that would be comparing two different currencies' raw numbers.
    const result = suggestCategory("AMAZON.COM", native(100000, "USD"), rules);
    expect(result?.ruleId).toBe("r1");
  });
});

describe("suggestCategory - legacy major-unit thresholds (pre-migration CategoryRule documents)", () => {
  it("still enforces legacy minAmount/maxAmount (implicitly MXN, major units) against an MXN transaction", () => {
    const rules = [{ _id: "r1", pattern: "OXXO", category: CATEGORY_A, minAmount: 50, maxAmount: 200 }];
    expect(suggestCategory("OXXO TIENDA", native(10000, "MXN"), rules)?.ruleId).toBe("r1"); // 100.00 MXN
    expect(suggestCategory("OXXO TIENDA", native(1000, "MXN"), rules)).toBeNull(); // 10.00 MXN, below min
  });

  it("does not block the match on a legacy MXN-implicit threshold when the transaction's native currency isn't MXN", () => {
    const rules = [{ _id: "r1", pattern: "OXXO", category: CATEGORY_A, minAmount: 50, maxAmount: 200 }];
    const result = suggestCategory("OXXO TIENDA", native(5000, "USD"), rules);
    expect(result?.ruleId).toBe("r1");
  });

  it("prefers minAmountMinor/maxAmountMinor over legacy minAmount/maxAmount when both are present on the same rule", () => {
    const rules = [{
      _id: "r1", pattern: "OXXO", category: CATEGORY_A,
      minAmount: 9999999, maxAmount: 9999999, // legacy thresholds that would reject everything
      minAmountMinor: 100, maxAmountMinor: 100000, amountCurrency: "MXN",
    }];
    expect(suggestCategory("OXXO TIENDA", native(10000, "MXN"), rules)?.ruleId).toBe("r1");
  });
});

describe("suggestCategory - defensive", () => {
  it("does not block a match when nativeMoney is missing entirely", () => {
    const rules = [{ _id: "r1", pattern: "OXXO", category: CATEGORY_A, minAmountMinor: 5000, amountCurrency: "MXN" }];
    expect(suggestCategory("OXXO TIENDA", null, rules)?.ruleId).toBe("r1");
  });
});
