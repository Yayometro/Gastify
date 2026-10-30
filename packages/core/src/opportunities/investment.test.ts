import { describe, expect, it } from "vitest";
import { projectDatedExpenses, projectSingleDeposit } from "./investment";
import { opportunityPrincipal, compareOpportunityWithGoal } from "./scenarios";

describe("growth opportunity scenarios", () => {
  it("keeps same-day principal separate from simulated return", () => {
    expect(projectSingleDeposit({ principalMinor: 10000, currency: "MXN", annualEffectiveRate: 0.06, years: 1, asOf: "2026-01-01" }))
      .toMatchObject({ principalMinor: 10000, valueMinor: 10600, returnMinor: 600, method: "single_deposit" });
    expect(projectSingleDeposit({ principalMinor: 10000, currency: "MXN", annualEffectiveRate: -1, years: 1, asOf: "2026-01-01" })).toBeNull();
  });

  it("does not apply a full year of return to expenses from yesterday", () => {
    const result = projectDatedExpenses({ expenses: [{ amountMinor: 10000, date: "2026-01-01" }], currency: "MXN", annualEffectiveRate: 0.06, asOf: "2026-01-02" });
    expect(result?.principalMinor).toBe(10000);
    expect(result?.returnMinor).toBe(2);
    expect(projectDatedExpenses({ expenses: [{ amountMinor: 100, date: "2026-01-03" }], currency: "MXN", annualEffectiveRate: 0.06, asOf: "2026-01-02" })).toBeNull();
  });

  it("caps redirected principal and compares it without mutating the goal", () => {
    expect(opportunityPrincipal(10000, 1)).toBe(10000);
    expect(opportunityPrincipal(10000, 1.5)).toBeNull();
    expect(opportunityPrincipal(10000, -1)).toBeNull();
    expect(compareOpportunityWithGoal({ expenseMinor: 10000, percent: 0.25, targetMinor: 20000, savedMinor: 5000 }))
      .toMatchObject({ principalMinor: 2500, simulatedSavedMinor: 7500, simulatedRemainingMinor: 12500, targetCoverage: 0.375 });
  });
});
