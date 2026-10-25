import { describe, it, expect } from "vitest";

import { budgetToValues, buildBudgetBody, emptyBudgetValues, validateBudget } from "./budgetForm";

const today = new Date(2026, 9, 20);

describe("validateBudget", () => {
  it("asks for a name, a goal and, for spending, at least one category", () => {
    const errors = validateBudget(emptyBudgetValues("spending", "MXN", today));
    expect(Object.keys(errors).sort()).toEqual(["categoryIds", "goalAmount", "name"]);
  });

  it("accepts a saving budget with a linked account and no saved amount", () => {
    const values = { ...emptyBudgetValues("saving", "MXN", today), name: "Fondo", goalAmount: "5000", linkedAccountIds: ["acc1"], savingAmount: "" };
    expect(validateBudget(values)).toEqual({});
  });

  it("checks that a project ends on or after the day it starts", () => {
    const values = { ...emptyBudgetValues("project", "MXN", today), name: "Viaje", goalAmount: "8000", startDate: "2026-10-20", endDate: "2026-10-01" };
    expect(validateBudget(values).endDate).toBeDefined();
  });
});

describe("buildBudgetBody", () => {
  it("builds a spending budget with its categories (legacy single category included)", () => {
    const values = { ...emptyBudgetValues("spending", "MXN", today), name: " Comida ", goalAmount: "6,000", categoryIds: ["c1", "c2"] };
    expect(buildBudgetBody(values)).toMatchObject({
      name: "Comida",
      goalAmount: 6000,
      budgetType: "spending",
      isSaving: false,
      category: "c1",
      categories: [{ category: "c1", subCategory: null }, { category: "c2", subCategory: null }],
      period: "monthly",
    });
  });

  it("builds a project with its dates and icon, always yearly", () => {
    const values = { ...emptyBudgetValues("project", "MXN", today), name: "Oaxaca", goalAmount: "8000", startDate: "2026-08-01", endDate: "2026-10-28" };
    const body = buildBudgetBody(values);
    expect(body).toMatchObject({ budgetType: "project", period: "yearly", icon: "fluent/airplane" });
    expect(typeof body.eventStartDate).toBe("string");
  });

  it("adds the id for an update", () => {
    expect(buildBudgetBody({ ...emptyBudgetValues("spending", "MXN", today), name: "x", goalAmount: "1", categoryIds: ["c"] }, "b1").id).toBe("b1");
  });
});

describe("budgetToValues", () => {
  it("reads a stored budget back into form values", () => {
    const values = budgetToValues({ _id: "b1", name: "Casa", goalAmount: 10000, budgetType: "spending", currency: "USD", period: "yearly", categories: [{ category: { _id: "c9" } }] }, today);
    expect(values).toMatchObject({ kind: "spending", name: "Casa", goalAmount: "10000", currency: "USD", period: "yearly", categoryIds: ["c9"] });
  });

  it("falls back to the legacy single category and detects saving budgets", () => {
    expect(budgetToValues({ category: "c3", budgetType: "spending" }, today).categoryIds).toEqual(["c3"]);
    expect(budgetToValues({ isSaving: true }, today).kind).toBe("saving");
  });
});
