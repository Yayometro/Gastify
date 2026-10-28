import type { DemoBudget, DemoCategory, DemoTransaction } from "./demoData";

export interface DemoCategoryTotal extends DemoCategory {
  amount: number;
  count: number;
}

export interface DemoMonthSummary {
  transactions: DemoTransaction[];
  expenses: DemoTransaction[];
  incomes: DemoTransaction[];
  spending: number;
  income: number;
  balance: number;
}

export function selectMonthTransactions(transactions: DemoTransaction[], monthKey: string): DemoTransaction[] {
  return transactions.filter((transaction) => transaction.date.startsWith(`${monthKey}-`));
}

export function selectMonthSummary(transactions: DemoTransaction[], monthKey: string): DemoMonthSummary {
  const monthTransactions = selectMonthTransactions(transactions, monthKey);
  const expenses = monthTransactions.filter((transaction) => transaction.type === "expense");
  const incomes = monthTransactions.filter((transaction) => transaction.type === "income");
  const spending = expenses.reduce((total, transaction) => total + transaction.reportAmount, 0);
  const income = incomes.reduce((total, transaction) => total + transaction.reportAmount, 0);
  return { transactions: monthTransactions, expenses, incomes, spending, income, balance: income - spending };
}

export function selectCategoryTotals(transactions: DemoTransaction[], categories: DemoCategory[]): DemoCategoryTotal[] {
  return categories.filter((category) => category.id !== "income").map((category) => {
    const categoryTransactions = transactions.filter((transaction) => transaction.type === "expense" && transaction.categoryId === category.id);
    return { ...category, amount: categoryTransactions.reduce((total, transaction) => total + transaction.reportAmount, 0), count: categoryTransactions.length };
  }).filter((category) => category.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function selectBudgetSpend(transactions: DemoTransaction[], budget: DemoBudget): number {
  return transactions.filter((transaction) => transaction.type === "expense" && transaction.categoryId === budget.categoryId)
    .reduce((total, transaction) => total + transaction.reportAmount, 0);
}

export function selectUnbudgetedCategories(categoryTotals: DemoCategoryTotal[], budgets: DemoBudget[]): DemoCategoryTotal[] {
  const budgetedIds = new Set(budgets.map((budget) => budget.categoryId));
  return categoryTotals.filter((category) => !budgetedIds.has(category.id));
}

export function selectProjectSpend(transactions: DemoTransaction[], projectId: string): number {
  return transactions.filter((transaction) => transaction.type === "expense" && transaction.projectId === projectId)
    .reduce((total, transaction) => total + transaction.reportAmount, 0);
}

export function selectMonthlySpending(transactions: DemoTransaction[], monthKey: string): number {
  return selectMonthSummary(transactions, monthKey).spending;
}
