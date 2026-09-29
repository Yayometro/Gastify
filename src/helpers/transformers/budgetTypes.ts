export const BUDGET_TYPES = {
  SPENDING: "spending",
  SAVING: "saving",
  PROJECT: "project",
} as const;

export type BudgetType = (typeof BUDGET_TYPES)[keyof typeof BUDGET_TYPES];

export interface BudgetTypeInput {
  isSaving?: boolean | null;
  budgetType?: string | null;
}

export function getBudgetType(budget?: BudgetTypeInput | null): BudgetType {
  // `isSaving` predates budgetType. Prefer it for legacy documents because
  // Mongoose may expose the new schema default even when it was never stored.
  if (budget?.isSaving === true) return BUDGET_TYPES.SAVING;
  if (budget?.budgetType === BUDGET_TYPES.PROJECT) return BUDGET_TYPES.PROJECT;
  return BUDGET_TYPES.SPENDING;
}

export const isSpendingBudget = (budget?: BudgetTypeInput | null): boolean =>
  getBudgetType(budget) === BUDGET_TYPES.SPENDING;
export const isSavingBudget = (budget?: BudgetTypeInput | null): boolean =>
  getBudgetType(budget) === BUDGET_TYPES.SAVING;
export const isProjectBudget = (budget?: BudgetTypeInput | null): boolean =>
  getBudgetType(budget) === BUDGET_TYPES.PROJECT;

export interface TransactionBudgetRef {
  _id?: string | { toString(): string } | unknown;
}

export interface TransactionLike {
  budget?: TransactionBudgetRef | string | null | unknown;
}

export function getExplicitBudgetId(transaction?: TransactionLike | null): string {
  return String((transaction?.budget as TransactionBudgetRef)?._id || transaction?.budget || "");
}
