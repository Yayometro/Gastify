import { describe, expect, it } from "vitest";
import { DEMO_BUDGETS, DEMO_CATEGORIES, DEMO_PROJECT, DEMO_SEED, getDemoAccountBalance } from "./demoData";
import { selectCategoryTotals, selectMonthSummary, selectMonthTransactions, selectProjectSpend, selectUnbudgetedCategories } from "./demoSelectors";

describe("public demo data and selectors", () => {
  it("ships a stable two-year sample with unique movements and no personal identifiers", () => {
    expect(DEMO_SEED.months).toHaveLength(24);
    expect(new Set(DEMO_SEED.transactions.map((transaction) => transaction.id)).size).toBe(DEMO_SEED.transactions.length);
    expect(new Set(DEMO_SEED.accounts.map((account) => account.currency))).toEqual(new Set(["MXN", "USD", "JPY"]));
    expect(DEMO_SEED.transactions.some((transaction) => transaction.type === "transfer")).toBe(true);
    expect(DEMO_SEED.transactions.every((transaction) => !transaction.description.includes("@"))).toBe(true);
    expect(selectMonthTransactions(DEMO_SEED.transactions, "2026-10")).toHaveLength(36);
    expect(selectMonthTransactions(DEMO_SEED.transactions, "2026-09")).toHaveLength(15);
    expect(selectMonthTransactions(DEMO_SEED.transactions, "2026-08")).toHaveLength(10);
  });

  it("keeps transfers out of income and expense totals", () => {
    const summary = selectMonthSummary(DEMO_SEED.transactions, "2026-10");
    const transfer = summary.transactions.find((transaction) => transaction.type === "transfer");
    expect(transfer).toBeDefined();
    expect(summary.income).toBe(summary.incomes.reduce((sum, transaction) => sum + transaction.reportAmount, 0));
    expect(summary.spending).toBe(summary.expenses.reduce((sum, transaction) => sum + transaction.reportAmount, 0));
    expect(summary.transactions.length).toBeGreaterThan(summary.incomes.length + summary.expenses.length);
  });

  it("keeps category, unbudgeted, and project rollups consistent with the same expense set", () => {
    const summary = selectMonthSummary(DEMO_SEED.transactions, "2026-10");
    const categories = selectCategoryTotals(summary.expenses, DEMO_CATEGORIES);
    const categorizedSpending = summary.expenses
      .filter((transaction) => transaction.categoryId)
      .reduce((sum, transaction) => sum + transaction.reportAmount, 0);
    const uncategorizedSpending = summary.expenses
      .filter((transaction) => !transaction.categoryId)
      .reduce((sum, transaction) => sum + transaction.reportAmount, 0);
    expect(categories.reduce((sum, category) => sum + category.amount, 0)).toBe(categorizedSpending);
    expect(uncategorizedSpending).toBe(680);
    expect(selectUnbudgetedCategories(categories, DEMO_BUDGETS).some((category) => category.id === "travel")).toBe(true);
    expect(selectProjectSpend(DEMO_SEED.transactions, DEMO_PROJECT.id)).toBeGreaterThan(0);
  });

  it("updates a transfer recipient account without double-counting it as spending", () => {
    const account = DEMO_SEED.accounts.find((item) => item.id === "revolut")!;
    const balance = getDemoAccountBalance(account, DEMO_SEED.transactions);
    expect(balance).toBeGreaterThan(account.openingBalance);
  });
});
