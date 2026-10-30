import { describe, expect, it } from "vitest";
import { calculateBudgetOverage } from "./budgetOverage";

const range = { startDate: "2026-01-01", endDate: "2026-03-31", complete: true };
const expense = (id: string, date: string, category: string, amountMinor: number, subCategory?: string, budget?: string) => ({
  _id: id, date, category, subCategory, budget, kind: "expense", state: "completed",
  displayMoney: { primary: { amountMinor, currency: "MXN" } },
});

describe("budget overage opportunities", () => {
  it("assigns an overlapping expense to one budget, preferring the more specific one", () => {
    const result = calculateBudgetOverage({ currency: "MXN", range,
      budgets: [
        { _id: "broad", name: "Food", category: "food", goalAmount: 100, period: "monthly" },
        { _id: "specific", name: "Restaurants", category: "food", subCategory: "restaurants", goalAmount: 50, period: "monthly" },
      ], transactions: [expense("t1", "2026-01-12", "food", 8000, "restaurants")],
    });
    expect(result).toMatchObject({ amountMinor: 3000, conflictCount: 1 });
    expect(result.cycles).toHaveLength(1);
    expect(result.cycles[0].budgetId).toBe("specific");
  });

  it("honors explicit budget links and excludes savings and projects", () => {
    const result = calculateBudgetOverage({ currency: "MXN", range,
      budgets: [
        { _id: "broad", category: "food", goalAmount: 20, period: "monthly" },
        { _id: "specific", category: "food", subCategory: "restaurants", goalAmount: 10, period: "monthly" },
        { _id: "saving", budgetType: "saving", category: "food", goalAmount: 1 },
        { _id: "project", budgetType: "project", category: "food", goalAmount: 1 },
      ], transactions: [expense("t1", "2026-02-01", "food", 5000, "restaurants", "broad")],
    });
    expect(result.amountMinor).toBe(3000);
    expect(result.cycles[0].budgetId).toBe("broad");
  });

  it("skips incomplete opening cycles and unavailable currency conversions", () => {
    const result = calculateBudgetOverage({ currency: "MXN", range: { startDate: "2026-02-10", endDate: "2026-03-31", complete: true },
      budgets: [{ _id: "monthly", category: "food", goalAmount: 20, period: "monthly" }, { _id: "fx", category: "travel", goalAmount: 1, conversionUnavailable: true }],
      transactions: [expense("feb", "2026-02-15", "food", 5000), expense("mar", "2026-03-15", "food", 5000), expense("fx", "2026-03-15", "travel", 5000)],
    });
    expect(result.amountMinor).toBe(3000);
    expect(result.cycles[0].periodStart).toBe("2026-03-01");
  });

  it("uses the historical limit active at the start of each cycle", () => {
    const result = calculateBudgetOverage({ currency: "MXN", range,
      budgets: [{ _id: "food", category: "food", goalAmount: 80, period: "monthly", history: [
        { goalAmount: 30, effectiveFrom: "2026-01-01", effectiveTo: "2026-02-01" },
        { goalAmount: 70, effectiveFrom: "2026-02-01" },
      ] }], transactions: [expense("jan", "2026-01-12", "food", 5000), expense("feb", "2026-02-12", "food", 10000)],
    });
    expect(result.amountMinor).toBe(5000);
  });

  it("does not reassign project-linked spending or duplicate a movement ID", () => {
    const linked = expense("project-flight", "2026-01-12", "travel", 10000, undefined, "project");
    const regular = expense("hotel", "2026-01-13", "travel", 5000);
    const result = calculateBudgetOverage({ currency: "MXN", range,
      budgets: [{ _id: "spending", category: "travel", goalAmount: 20, period: "monthly" }, { _id: "project", budgetType: "project", category: "travel", goalAmount: 10 }],
      transactions: [linked, regular, regular],
    });
    expect(result.amountMinor).toBe(3000);
    expect(result.cycles[0].transactionIds).toEqual(["hotel"]);
  });
});
