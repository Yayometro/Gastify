import { describe, expect, it } from "vitest";
import { resolveOpportunityMoney, scanOpportunityTransactions } from "./transactions";

describe("growth opportunity transaction selection", () => {
  const range = { startDate: "2026-01-01", endDate: "2026-12-31", complete: true };

  it("includes only completed expenses and matches categories, tags, and concepts", () => {
    const result = scanOpportunityTransactions([
      { _id: "1", name: "OXXO", date: "2026-02-01", kind: "expense", state: "completed", category: "cat", tags: ["tag"], displayMoney: { primary: { amountMinor: 10000, currency: "MXN" } } },
      { _id: "2", name: "OXXO pending", date: "2026-02-02", kind: "expense", state: "pending", category: "cat", displayMoney: { primary: { amountMinor: 5000, currency: "MXN" } } },
      { _id: "3", name: "OXXO other category", date: "2026-02-03", kind: "expense", state: "completed", category: "other", displayMoney: { primary: { amountMinor: 4000, currency: "MXN" } } },
    ], { categoryIds: ["cat"], conceptQuery: "oxxo", primaryCurrency: "MXN" }, range);
    expect(result).toMatchObject({ amountMinor: 10000, count: 1, excludedCount: 1, missingFxCount: 0 });
  });

  it("keeps refunds and fees separate, and reports missing or stale exchange rates", () => {
    const result = scanOpportunityTransactions([
      { _id: "expense", date: "2026-02-01", kind: "expense", state: "completed", displayMoney: { primary: { amountMinor: 10000, currency: "MXN", stale: true } } },
      { _id: "refund", date: "2026-02-02", kind: "refund", state: "completed", displayMoney: { primary: { amountMinor: -2000, currency: "MXN" } } },
      { _id: "fee", date: "2026-02-03", kind: "fee", state: "completed", displayMoney: { primary: { amountMinor: 100, currency: "MXN" } } },
      { _id: "no-fx", date: "2026-02-04", kind: "expense", state: "completed", displayMoney: { primary: null } },
    ], { includeAllExpenses: true, primaryCurrency: "MXN" }, range);
    expect(result).toMatchObject({ amountMinor: 10000, refundMinor: 2000, feeMinor: 100, unmatchedRefundCount: 1, missingFxCount: 1, staleFxCount: 1, count: 4 });
  });

  it("prefers a fresh primary amount, then reporting amount, and labels stale fallback", () => {
    expect(resolveOpportunityMoney({ displayMoney: { primary: { amountMinor: 90, currency: "MXN", stale: true } }, money: { reporting: { amountMinor: 80, currency: "MXN" } } }, "MXN"))
      .toEqual({ amountMinor: 80, currency: "MXN", stale: false });
    expect(resolveOpportunityMoney({ displayMoney: { primary: { amountMinor: 90, currency: "MXN", stale: true } } }, "MXN"))
      .toEqual({ amountMinor: 90, currency: "MXN", stale: true });
  });
});
