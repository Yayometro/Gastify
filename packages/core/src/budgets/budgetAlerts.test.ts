import { describe, it, expect } from "vitest";

import { currentBudgetAlert } from "./budgetAlerts";
import { createTranslator } from "../i18n/translate";
import budgetsEs from "../i18n/messages/es/budgets";
import budgetsEn from "../i18n/messages/en/budgets";

const t = createTranslator("es", budgetsEs);
const base = { budgetId: "b1", name: "Comida", kind: "spending" as const, dayOfPeriod: 10, periodKey: "2026-10" };

describe("currentBudgetAlert", () => {
  it("warns at 70, 80 and 90 % and says the limit was reached past 100 %", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.72 }, t)).toMatchObject({ level: 0.7, tone: "warning" });
    expect(currentBudgetAlert({ ...base, ratio: 0.85 }, t)).toMatchObject({ level: 0.8, tone: "warning" });
    expect(currentBudgetAlert({ ...base, ratio: 0.93 }, t)).toMatchObject({ level: 0.9, tone: "danger" });
    expect(currentBudgetAlert({ ...base, ratio: 1.2 }, t)).toMatchObject({ level: 1, tone: "danger" });
  });

  it("is silent while it is under 70 % early in the period", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.4 }, t)).toBeNull();
  });

  it("congratulates a spending budget or a project that is under 50 % from day 15", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.3, dayOfPeriod: 15 }, t)).toMatchObject({ level: 0, tone: "celebrate" });
    expect(currentBudgetAlert({ ...base, kind: "project", ratio: 0.3, dayOfPeriod: 20 }, t)).toMatchObject({ tone: "celebrate" });
    expect(currentBudgetAlert({ ...base, ratio: 0.6, dayOfPeriod: 20 }, t)).toBeNull();
  });

  it("celebrates the progress of a saving goal at 25, 50, 75 and 100 %", () => {
    expect(currentBudgetAlert({ ...base, kind: "saving", ratio: 0.3 }, t)).toMatchObject({ level: 0.25, tone: "celebrate" });
    expect(currentBudgetAlert({ ...base, kind: "saving", ratio: 1 }, t)).toMatchObject({ level: 1 });
    expect(currentBudgetAlert({ ...base, kind: "saving", ratio: 0.1 }, t)).toBeNull();
  });

  it("gives each notice a stable key per budget, period and level", () => {
    expect(currentBudgetAlert({ ...base, ratio: 0.72 }, t)?.key).toBe("b1:2026-10:0.7");
  });

  it("writes the title and the message in the person's language", () => {
    const en = createTranslator("en", budgetsEn);
    expect(currentBudgetAlert({ ...base, ratio: 1.2 }, en)).toMatchObject({
      title: "Comida: you reached the limit",
      message: "You are over 100% of this budget. Keep an eye on your spending.",
    });
    expect(currentBudgetAlert({ ...base, ratio: 1.2 }, t)?.title).toBe("Comida: llegaste al límite");
  });
});
