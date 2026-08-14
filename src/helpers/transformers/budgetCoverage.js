import { matchBillToBudget } from "./projectionsChange";

const asId = (value) => String(value?._id || value || "");
const asAmount = (value) => Number(value) || 0;

export function getBudgetCategoryEntries(budget) {
  if (Array.isArray(budget?.categories) && budget.categories.length > 0) {
    return budget.categories;
  }
  if (budget?.category || budget?.subCategory) {
    return [{ category: budget.category || null, subCategory: budget.subCategory || null }];
  }
  return [];
}

export function categoryEntriesOverlap(first, second) {
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

export function findCoverageConflicts(entries, budgets, excludedBudgetId = null) {
  const conflicts = [];
  for (const budget of budgets || []) {
    if (budget?.archived || budget?.isSaving === true || asId(budget?._id) === asId(excludedBudgetId)) {
      continue;
    }
    const overlap = (entries || []).some((entry) =>
      getBudgetCategoryEntries(budget).some((budgetEntry) => categoryEntriesOverlap(entry, budgetEntry))
    );
    if (overlap) conflicts.push(budget);
  }
  return conflicts;
}

function transactionGroup(transaction) {
  const category = transaction?.category || null;
  const subCategory = transaction?.subCategory || null;
  const item = subCategory || category;
  const type = subCategory ? "subcategory" : category ? "category" : "uncategorized";

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

export function getBudgetCoverage({ transactions, budgets, startDate, endDate }) {
  const activeBudgets = (budgets || []).filter((budget) => !budget.archived && budget.isSaving !== true);
  const bills = (transactions || []).filter((transaction) => {
    if (!transaction?.isBill) return false;
    const date = new Date(transaction.date || transaction.createdAt);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  });

  const uncovered = [];
  const covered = [];
  const conflicts = [];

  for (const transaction of bills) {
    const matchingBudgets = activeBudgets.filter((budget) => matchBillToBudget(transaction, budget));
    if (matchingBudgets.length === 0) uncovered.push(transaction);
    else covered.push(transaction);
    if (matchingBudgets.length > 1) conflicts.push({ transaction, budgets: matchingBudgets });
  }

  const groupMap = new Map();
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
        (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
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

export function getUncoveredCatalogCategories(categories, budgets) {
  return (categories || [])
    .filter((category) => category?._id)
    .filter((category) => {
      const candidate = { category, subCategory: null };
      return !findCoverageConflicts([candidate], budgets).length;
    })
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}
