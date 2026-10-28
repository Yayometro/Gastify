import { describe, expect, it } from "vitest";
import { buildProjectionAccuracyReport } from "@/helpers/transformers/projectionsChange";
import { DEMO_PROJECTION_BASELINE } from "./demoData";

describe("public demo projection accuracy fixtures", () => {
  it("provides closed months for the projected-versus-actual table without API data", () => {
    const rows = buildProjectionAccuracyReport({
      transactions: [
        { date: "2026-01-03", amount: 54_000, isIncome: true, isBill: false },
        { date: "2026-01-04", amount: 42_000, isIncome: false, isBill: true },
      ],
      budgets: [],
      incomeSources: [],
      projectionSettings: { monthlyBuffers: [] },
      projectionBaseline: DEMO_PROJECTION_BASELINE,
      year: 2026,
      today: new Date(2026, 9, 26),
    });

    expect(rows).toHaveLength(9);
    expect(rows[0]).toMatchObject({ projectedIncome: 65_000, actualIncome: 54_000, projectedExpense: 39_000, actualExpense: 42_000 });
  });
});
