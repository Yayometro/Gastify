export const BUDGET_TYPES = {
  SPENDING: "spending",
  SAVING: "saving",
  PROJECT: "project",
};

export function getBudgetType(budget) {
  // `isSaving` predates budgetType. Prefer it for legacy documents because
  // Mongoose may expose the new schema default even when it was never stored.
  if (budget?.isSaving === true) return BUDGET_TYPES.SAVING;
  if (budget?.budgetType === BUDGET_TYPES.PROJECT) return BUDGET_TYPES.PROJECT;
  return BUDGET_TYPES.SPENDING;
}

export const isSpendingBudget = (budget) => getBudgetType(budget) === BUDGET_TYPES.SPENDING;
export const isSavingBudget = (budget) => getBudgetType(budget) === BUDGET_TYPES.SAVING;
export const isProjectBudget = (budget) => getBudgetType(budget) === BUDGET_TYPES.PROJECT;

export function getExplicitBudgetId(transaction) {
  return String(transaction?.budget?._id || transaction?.budget || "");
}
