import { describe, expect, it } from "vitest";
import { validateGoalMoneyPair, validateGoalSavingMoneyPair } from "./goalValidation";

describe("goal money validation", () => {
  it("accepts matching goal totals, including zero-decimal currencies", () => {
    expect(validateGoalMoneyPair(125.5, "MXN", { amountMinor: 12_550, currency: "MXN" })).toBe(true);
    expect(validateGoalMoneyPair(1200, "JPY", { amountMinor: 1200, currency: "JPY" })).toBe(true);
  });

  it("rejects a structured target that drifts from the user-facing amount", () => {
    expect(validateGoalMoneyPair(125.5, "MXN", { amountMinor: 12_549, currency: "MXN" })).toBe(false);
    expect(validateGoalMoneyPair(125.5, "USD", { amountMinor: 12_550, currency: "MXN" })).toBe(false);
    expect(validateGoalMoneyPair(Number.MAX_SAFE_INTEGER, "MXN")).toBe(false);
  });

  it("allows an empty manual balance but rejects negative, unsafe, or mismatched balances", () => {
    expect(validateGoalSavingMoneyPair(0, "MXN", { amountMinor: 0, currency: "MXN" })).toBe(true);
    expect(validateGoalSavingMoneyPair(100, "JPY", { amountMinor: 100, currency: "JPY" })).toBe(true);
    expect(validateGoalSavingMoneyPair(-1, "MXN")).toBe(false);
    expect(validateGoalSavingMoneyPair(100, "MXN", { amountMinor: 99, currency: "MXN" })).toBe(false);
  });
});
