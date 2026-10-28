import { describe, expect, it } from "vitest";
import { findOverlappingSavingAccounts, getGoalProgress, isEligibleGoalFundingAccountType } from "./progress";
import { emptyGoalDetails } from "./types";

describe("goal funding and progress", () => {
  it("only accepts asset-like account types as a funding source", () => {
    expect(["debit", "cash", "savings", undefined].every(isEligibleGoalFundingAccountType)).toBe(true);
    expect(isEligibleGoalFundingAccountType("credit")).toBe(false);
  });

  it("detects shared legacy account assignments instead of summing them twice", () => {
    const conflicts = findOverlappingSavingAccounts([
      { id: "trip", name: "Trip", linkedAccountIds: ["cash-1"] },
      { id: "car", name: "Car", linkedAccountIds: ["cash-1"] },
    ]);
    expect(conflicts.get("trip")).toEqual({ accountIds: ["cash-1"], otherNames: ["Car"] });
    expect(conflicts.get("car")?.otherNames).toEqual(["Trip"]);
  });

  it("uses either the manual balance or dedicated account balances, never both", () => {
    const details = emptyGoalDetails();
    expect(getGoalProgress({ targetMinor: 1000, currency: "MXN", manualSavedMinor: 250, details }))
      .toMatchObject({ savedMinor: 250, remainingMinor: 750, source: "manual", status: "manual" });
    expect(getGoalProgress({
      targetMinor: 1000, currency: "MXN", manualSavedMinor: 250, linkedAccountIds: ["a"],
      accountBalances: [{ id: "a", amountMinor: 800, currency: "MXN", primaryAmountMinor: 800 }], details,
    })).toMatchObject({ savedMinor: 800, remainingMinor: 200, source: "accounts", status: "complete" });
  });
});
