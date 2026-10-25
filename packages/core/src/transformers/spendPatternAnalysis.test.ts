import { describe, it, expect } from "vitest";

import { buildSpendPatternAnalysis } from "./spendPatternAnalysis";

const base = {
  biggestTransaction: { name: "Renta", amount: 9000, categoryName: "House" },
  biggestCategory: { name: "House", total: 28000 },
  biggestSubcategory: { name: "Gas", categoryName: "House", total: 900 },
  mostCommonCategoryTag: { name: "casa", count: 4 },
  analysis: { transactionIsInBiggestCategory: true, transactionIsBiggestSubcategory: false, subcategoryBelongsToBiggestCategory: true, categoryShareOfTotal: 61.4, transactionShareOfCategory: 32.1, transactionSharesTopCategoryTag: false },
} as never;

describe("buildSpendPatternAnalysis", () => {
  it("reads out each computed fact in Spanish", () => {
    const bullets = buildSpendPatternAnalysis(base);
    expect(bullets).toHaveLength(5);
    expect(bullets[0]).toContain("sí pertenece a la categoría con más gasto (House)");
    expect(bullets[1]).toContain("61%");
    expect(bullets[2]).toContain("32%");
    expect(bullets[2]).toContain("recurrente");
    expect(bullets[4]).toContain("no lo tiene");
  });
  it("flags an isolated big transaction and a different category", () => {
    const bullets = buildSpendPatternAnalysis({ ...(base as object), analysis: { ...(base as { analysis: object }).analysis, transactionIsInBiggestCategory: false, transactionShareOfCategory: 80 } } as never);
    expect(bullets[0]).toContain("NO pertenece");
    expect(bullets[2]).toContain("gasto aislado");
  });
});
