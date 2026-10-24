import { idOf } from "../categories/categoryForm";
import { dateText, parseDateText, parseMoneyText, parseSignedMoneyText } from "../transactions/movementForm";

// Rules for the budget forms (new and edit). Three kinds, like the web: "spending" (a goal for some
// categories over a period), "saving" (a goal fed by linked accounts or a saved amount) and "project"
// (a goal for an event with start and end dates and its own icon).
export type BudgetKind = "spending" | "saving" | "project";

// The labels are catalog keys ("budgets.kind.spending"): the screen shows them with t(label).
export const BUDGET_KINDS: { value: BudgetKind; label: string }[] = [
  { value: "spending", label: "budgets.kind.spending" },
  { value: "saving", label: "budgets.kind.saving" },
  { value: "project", label: "budgets.kind.project" },
];

export const BUDGET_PERIODS = [
  { value: "monthly", label: "budgets.period.monthly" },
  { value: "quarterly", label: "budgets.period.quarterly" },
  { value: "biannual", label: "budgets.period.biannual" },
  { value: "yearly", label: "budgets.period.yearly" },
] as const;

export interface BudgetValues {
  kind: BudgetKind;
  name: string;
  goalAmount: string;
  currency: string;
  period: string;
  // Spending: the categories the budget covers.
  categoryIds: string[];
  // Saving: what is already saved (used when no account is linked) and the accounts that feed it.
  savingAmount: string;
  linkedAccountIds: string[];
  // Project: AAAA-MM-DD and its icon.
  startDate: string;
  endDate: string;
  icon: string;
}

export type BudgetErrors = Partial<Record<"name" | "goalAmount" | "categoryIds" | "savingAmount" | "endDate", string>>;

export function emptyBudgetValues(kind: BudgetKind, currency = "MXN", today: Date = new Date()): BudgetValues {
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    kind,
    name: "",
    goalAmount: "",
    currency,
    period: "monthly",
    categoryIds: [],
    savingAmount: "0",
    linkedAccountIds: [],
    startDate: dateText(today),
    endDate: dateText(end),
    icon: "fluent/airplane",
  };
}

// The errors are catalog keys ("budgets.error.name"): the screen shows them with t(key).
export function validateBudget(values: BudgetValues): BudgetErrors {
  const errors: BudgetErrors = {};
  if (!values.name.trim()) errors.name = "budgets.error.name";
  if (parseMoneyText(values.goalAmount) === null) errors.goalAmount = "budgets.error.goal";
  if (values.kind === "spending" && values.categoryIds.length === 0) errors.categoryIds = "budgets.error.categories";
  if (values.kind === "saving" && values.linkedAccountIds.length === 0 && parseSignedMoneyText(values.savingAmount) === null) {
    errors.savingAmount = "budgets.error.saving";
  }
  if (values.kind === "project") {
    const start = parseDateText(values.startDate);
    const end = parseDateText(values.endDate);
    if (!start || !end || end < start) errors.endDate = "budgets.error.endDate";
  }
  return errors;
}

// The body the budget routes expect. With an id it is an update.
export function buildBudgetBody(values: BudgetValues, id?: string): Record<string, unknown> {
  const kind = values.kind;
  const body: Record<string, unknown> = {
    name: values.name.trim(),
    goalAmount: parseMoneyText(values.goalAmount) ?? 1,
    budgetType: kind,
    isSaving: kind === "saving",
    currency: values.currency,
    period: kind === "project" ? "yearly" : values.period,
    category: kind === "spending" ? values.categoryIds[0] ?? null : null,
    subCategory: null,
    categories: kind === "spending" ? values.categoryIds.map((category) => ({ category, subCategory: null })) : [],
    savingAmount: kind === "saving" ? parseSignedMoneyText(values.savingAmount) ?? 0 : 0,
    linkedAccounts: kind === "saving" ? values.linkedAccountIds : [],
    linkedTags: [],
  };
  if (kind === "project") {
    body.icon = values.icon;
    body.eventStartDate = (parseDateText(values.startDate) ?? new Date()).toISOString();
    body.eventEndDate = (parseDateText(values.endDate) ?? new Date()).toISOString();
  }
  if (id) body.id = id;
  return body;
}

interface BudgetLike {
  _id?: unknown;
  name?: string;
  goalAmount?: number;
  budgetType?: string;
  isSaving?: boolean;
  currency?: string;
  period?: string;
  category?: unknown;
  categories?: { category?: unknown }[];
  savingAmount?: number;
  linkedAccounts?: unknown[];
  eventStartDate?: Date | string | null;
  eventEndDate?: Date | string | null;
  icon?: string | null;
}

// An existing budget as form values (for the edit screen).
export function budgetToValues(budget: BudgetLike, today: Date = new Date()): BudgetValues {
  const kind: BudgetKind = budget.budgetType === "project" ? "project" : budget.budgetType === "saving" || budget.isSaving ? "saving" : "spending";
  const base = emptyBudgetValues(kind, budget.currency || "MXN", today);
  const fromList = (budget.categories ?? []).map((item) => idOf(item.category)).filter(Boolean);
  const categoryIds = fromList.length > 0 ? fromList : budget.category ? [idOf(budget.category)] : [];
  return {
    ...base,
    name: budget.name ?? "",
    goalAmount: budget.goalAmount !== undefined ? String(budget.goalAmount) : "",
    period: budget.period || "monthly",
    categoryIds,
    savingAmount: String(budget.savingAmount ?? 0),
    linkedAccountIds: (budget.linkedAccounts ?? []).map(idOf).filter(Boolean),
    startDate: budget.eventStartDate ? dateText(new Date(budget.eventStartDate)) : base.startDate,
    endDate: budget.eventEndDate ? dateText(new Date(budget.eventEndDate)) : base.endDate,
    icon: budget.icon || base.icon,
  };
}
