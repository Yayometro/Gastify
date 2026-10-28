import { describe, expect, it } from "vitest";
import { calculateGoalSchedule, goalPaymentDates } from "./schedule";
import { emptyGoalDetails } from "./types";

describe("goal savings schedule", () => {
  it("enumerates semimonthly payments on the 15th and month end", () => {
    expect(goalPaymentDates({ frequency: "semimonthly", anchorDate: "2026-01-01" }, "2026-01-01", "2026-02-28"))
      .toEqual(["2026-01-15", "2026-01-31", "2026-02-15", "2026-02-28"]);
  });

  it("splits a required target without rounding the last installment upward", () => {
    const details = emptyGoalDetails();
    details.targetDate = "2026-01-31";
    details.schedule = { mode: "required_by_date", frequency: "monthly", anchorDate: "2026-01-01", incomeSourceId: null };
    const plan = calculateGoalSchedule({ targetMinor: 100, savedMinor: 0, today: "2026-01-01", details });
    expect(plan).toMatchObject({ status: "ready", contributionMinor: 100, totalPlannedMinor: 100, paymentAmountsMinor: [100] });
  });

  it("marks fixed installments that cannot reach the target by the chosen date", () => {
    const details = emptyGoalDetails();
    details.targetDate = "2026-02-15";
    details.schedule = {
      mode: "fixed_contribution", frequency: "monthly", anchorDate: "2026-01-01", incomeSourceId: null,
      fixedContributionMoney: { amountMinor: 300, currency: "MXN" },
    };
    const plan = calculateGoalSchedule({ targetMinor: 1000, savedMinor: 100, today: "2026-01-01", details });
    expect(plan).toMatchObject({ status: "underfunded", contributionMinor: 300, totalPlannedMinor: 600, paymentAmountsMinor: [300, 300] });
  });

  it("does not divide by zero for past dates or fully funded goals", () => {
    const details = emptyGoalDetails();
    details.targetDate = "2026-01-01";
    expect(calculateGoalSchedule({ targetMinor: 10, savedMinor: 0, today: "2026-01-02", details }).status).toBe("past_due");
    expect(calculateGoalSchedule({ targetMinor: 10, savedMinor: 10, today: "2026-01-02", details }).status).toBe("already_funded");
  });
});
