import { matchBillToBudget } from "./projectionsChange";
import {
  getExplicitBudgetId,
  isSpendingBudget,
  type BudgetTypeInput,
  type TransactionLike,
} from "./budgetTypes";

export interface CategoryEntry {
  category?: unknown;
  subCategory?: unknown;
}

export interface BudgetCoverageInput extends BudgetTypeInput {
  _id?: string | unknown;
  name?: string | null;
  archived?: boolean | null;
  categories?: CategoryEntry[] | null;
  category?: unknown;
  subCategory?: unknown;
}

export interface CoverageCategoryItem {
  _id?: string | unknown;
  name?: string | null;
  color?: string | null;
  icon?: string | null;
  [key: string]: unknown;
}

export interface CoverageTransaction extends TransactionLike {
  _id?: string | unknown;
  name?: string | null;
  date?: string | Date | null;
  createdAt?: string | Date | null;
  amount?: number | string | null;
  isBill?: boolean | null;
  category?: unknown;
  subCategory?: unknown;
}

export interface CoverageGroup {
  key: string;
  name: string;
  category: CoverageCategoryItem | null;
  subCategory: CoverageCategoryItem | null;
  color: string;
  icon: string;
  type: "subcategory" | "category" | "uncategorized";
  amount?: number;
  movements?: CoverageTransaction[];
  [key: string]: unknown;
}

export interface GetBudgetCoverageParams<
  T extends CoverageTransaction = CoverageTransaction,
  B extends BudgetCoverageInput = BudgetCoverageInput
> {
  transactions?: T[] | null;
  budgets?: B[] | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export type BudgetCoverageConflict<
  T extends CoverageTransaction = CoverageTransaction,
  B extends BudgetCoverageInput = BudgetCoverageInput
> = {
  transaction: T;
  budgets: B[];
};

export type BudgetCoverageResult<
  T extends CoverageTransaction = CoverageTransaction,
  B extends BudgetCoverageInput = BudgetCoverageInput
> = {
  bills: T[];
  covered: T[];
  uncovered: T[];
  conflicts: BudgetCoverageConflict<T, B>[];
  groups: CoverageGroup[];
  totalSpent: number;
  coveredSpent: number;
  unbudgetedSpent: number;
  unbudgetedPercentage: number;
};

const asId = (value: unknown): string => String((value as { _id?: unknown })?._id || value || "");
const asAmount = (value: unknown): number => Number(value) || 0;

export function getBudgetCategoryEntries(budget?: BudgetCoverageInput | null): CategoryEntry[] {
  if (Array.isArray(budget?.categories) && budget.categories.length > 0) {
    return budget.categories;
  }
  if (budget?.category || budget?.subCategory) {
    return [{ category: budget.category || null, subCategory: budget.subCategory || null }];
  }
  return [];
}

export function categoryEntriesOverlap(first?: CategoryEntry | null, second?: CategoryEntry | null): boolean {
  const firstCategory = asId(first?.category);
  const secondCategory = asId(second?.category);
  const firstSubCategory = asId(first?.subCategory);
  const secondSubCategory = asId(second?.subCategory);

  if (firstSubCategory && secondSubCategory) {
    return firstSubCategory === secondSubCategory;
  }
  if (!firstCategory || !secondCategory || firstCategory !== secondCategory) {
    return false;
  }
  return !firstSubCategory || !secondSubCategory;
}

export function findCoverageConflicts<T extends BudgetCoverageInput = BudgetCoverageInput>(
  entries?: CategoryEntry[] | null,
  budgets?: T[] | null,
  excludedBudgetId: unknown = null
): T[] {
  const conflicts: T[] = [];
  for (const budget of budgets || []) {
    if (budget?.archived || !isSpendingBudget(budget) || asId(budget?._id) === asId(excludedBudgetId)) {
      continue;
    }
    const overlap = (entries || []).some((entry) =>
      getBudgetCategoryEntries(budget).some((budgetEntry) => categoryEntriesOverlap(entry, budgetEntry))
    );
    if (overlap) conflicts.push(budget);
  }
  return conflicts;
}

function transactionGroup(transaction?: CoverageTransaction | null): CoverageGroup {
  const category = (transaction?.category as CoverageCategoryItem) || null;
  const subCategory = (transaction?.subCategory as CoverageCategoryItem) || null;
  const item = subCategory || category;
  const type: "subcategory" | "category" | "uncategorized" = subCategory ? "subcategory" : category ? "category" : "uncategorized";

  return {
    key: item?._id ? `${type}:${item._id}` : "uncategorized",
    name: item?.name || "No category",
    category,
    subCategory,
    color: item?.color || "#DADADA",
    icon: item?.icon || "md/MdFilterNone",
    type,
  };
}

export function getBudgetCoverage<
  T extends CoverageTransaction = CoverageTransaction,
  B extends BudgetCoverageInput = BudgetCoverageInput
>({ transactions, budgets, startDate, endDate }: GetBudgetCoverageParams<T, B>): BudgetCoverageResult<T, B> {
  const activeBudgets = (budgets || []).filter((budget) => !budget.archived);
  const categoryBudgets = activeBudgets.filter(isSpendingBudget);
  const bills = (transactions || []).filter((transaction) => {
    if (!transaction?.isBill) return false;
    const date = new Date((transaction.date || transaction.createdAt) as string | number | Date);
    // startDate / endDate may arrive as strings: compare timestamps (a string compared with a
    // Date became NaN and the range filtered nothing, bug 113).
    const time = date.getTime();
    return (!startDate || time >= new Date(startDate).getTime()) && (!endDate || time <= new Date(endDate).getTime());
  });

  const uncovered: T[] = [];
  const covered: T[] = [];
  const conflicts: BudgetCoverageConflict<T, B>[] = [];

  for (const transaction of bills) {
    const explicitBudgetId = getExplicitBudgetId(transaction);
    const explicitBudget = explicitBudgetId
      ? activeBudgets.find((budget) => asId(budget?._id) === explicitBudgetId)
      : null;
    const matchingBudgets = explicitBudget
      ? [explicitBudget]
      : categoryBudgets.filter((budget) => matchBillToBudget(transaction, budget));
    if (matchingBudgets.length === 0) uncovered.push(transaction);
    else covered.push(transaction);
    if (matchingBudgets.length > 1) conflicts.push({ transaction, budgets: matchingBudgets });
  }

  const groupMap = new Map<string, CoverageGroup & { amount: number; movements: T[] }>();
  for (const transaction of uncovered) {
    const group = transactionGroup(transaction);
    const existing = groupMap.get(group.key) || { ...group, amount: 0, movements: [] };
    existing.amount += asAmount(transaction.amount);
    existing.movements.push(transaction);
    groupMap.set(group.key, existing);
  }

  const groups = [...groupMap.values()]
    .map((group) => ({
      ...group,
      movements: group.movements.sort(
        (a, b) =>
          (new Date((b.date || b.createdAt) as string | number | Date) as unknown as number) -
          (new Date((a.date || a.createdAt) as string | number | Date) as unknown as number)
      ),
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalSpent = bills.reduce((total, transaction) => total + asAmount(transaction.amount), 0);
  const coveredSpent = covered.reduce((total, transaction) => total + asAmount(transaction.amount), 0);
  const unbudgetedSpent = uncovered.reduce((total, transaction) => total + asAmount(transaction.amount), 0);

  return {
    bills,
    covered,
    uncovered,
    conflicts,
    groups,
    totalSpent,
    coveredSpent,
    unbudgetedSpent,
    unbudgetedPercentage: totalSpent > 0 ? (unbudgetedSpent / totalSpent) * 100 : 0,
  };
}

export function getUncoveredCatalogCategories<
  C extends CoverageCategoryItem = CoverageCategoryItem,
  B extends BudgetCoverageInput = BudgetCoverageInput
>(categories?: C[] | null, budgets?: B[] | null): C[] {
  return (categories || [])
    .filter((category) => category?._id)
    .filter((category) => {
      const candidate: CategoryEntry = { category, subCategory: null };
      return !findCoverageConflicts([candidate], budgets).length;
    })
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}
