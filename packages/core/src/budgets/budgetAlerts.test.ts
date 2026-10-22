import { describe, it, expect } from "vitest";

import { currentBudgetAlert } from "./budgetAlerts";

const base = { budgetId: "b1", name: "Comida", kind: "spending" as const, dayOfPeriod: 10, periodKey: "2026-10" };

describe("currentBudgetAlert", () => {
  it("warns at 70, 80 and 90 % and says the limit was reached past 100 %", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.72 })).toMatchObject({ level: 0.7, tone: "warning" });
    expect(currentBudgetAlert({ ...base, ratio: 0.85 })).toMatchObject({ level: 0.8, tone: "warning" });
    expect(currentBudgetAlert({ ...base, ratio: 0.93 })).toMatchObject({ level: 0.9, tone: "danger" });
    expect(currentBudgetAlert({ ...base, ratio: 1.2 })).toMatchObject({ level: 1, tone: "danger" });
  });

  it("is silent while it is under 70 % early in the period", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.4 })).toBeNull();
  });

  it("congratulates a spending budget or a project that is under 50 % from day 15", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.3, dayOfPeriod: 15 })).toMatchObject({ level: 0, tone: "celebrate" });
    expect(currentBudgetAlert({ ...base, kind: "project", ratio: 0.3, dayOfPeriod: 20 })).toMatchObject({ tone: "celebrate" });
    expect(currentBudgetAlert({ ...base, ratio: 0.6, dayOfPeriod: 20 })).toBeNull();
  });

  it("celebrates the progress of a saving goal at 25, 50, 75 and 100 %", () => {
    expect(currentBudgetAlert({ ...base, kind: "saving", ratio: 0.3 })).toMatchObject({ level: 0.25, tone: "celebrate" });
    expect(currentBudgetAlert({ ...base, kind: "saving", ratio: 1 })).toMatchObject({ level: 1 });
    expect(currentBudgetAlert({ ...base, kind: "saving", ratio: 0.1 })).toBeNull();
  });

  it("gives each notice a stable key per budget, period and level", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.72 })?.key).toBe("b1:2026-10:0.7");
  });
});
