import type { BudgetData } from '@gastify/core/features/budgetSlice';
import { isProjectBudget, isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { tNow } from '@/i18n/now';

export type BudgetLook = { icon?: string | null; color?: string | null };

type CategoryLike = { icon?: string | null; color?: string | null };

// How a budget is drawn, as on the web: a project has its own icon (an airplane when none was chosen); a spending or
// saving budget takes its first category's (or sub-category's) icon and color; a saving goal without a category is a
// piggy bank. The server only stores an icon for projects.
export function lookOf(budget: BudgetData, fallbackColor: string): BudgetLook {
  if (isProjectBudget(budget)) return { icon: budget.icon || 'fluent/airplane', color: fallbackColor };
  // A saving goal is always the piggy bank, whatever category it is linked to.
  if (isSavingBudget(budget)) return { icon: 'md/MdSavings', color: '#7e22ce' };
  const first = budget.categories?.[0] as { category?: CategoryLike; subCategory?: CategoryLike } | undefined;
  const picked = (first?.subCategory ?? first?.category ?? budget.subCategory ?? budget.category) as CategoryLike | string | undefined;
  if (picked && typeof picked === 'object' && picked.icon) return { icon: picked.icon, color: picked.color ?? fallbackColor };
  return { icon: budget.icon, color: fallbackColor };
}

// The suffix the web shows after the limit: "/mes", "/año"...; a project is a single total.
export function periodSuffix(budget: BudgetData): string {
  if (isProjectBudget(budget)) return tNow("mobile.en.total.2");
  switch (budget.period) {
    case 'yearly':
      return tNow("mobile.ano");
    case 'quarterly':
      return tNow("mobile.trimestre");
    case 'biannual':
      return tNow("mobile.6.meses");
    default:
      return tNow("mobile.mes.2");
  }
}
