export type BudgetOrder = 'spent' | 'ratio' | 'goal' | 'name';

import { tNow } from '@/i18n/now';

// The orders the list can take, with their names in the language on screen.
export function budgetOrders(): { id: BudgetOrder; label: string }[] {
  return [
    { id: 'spent', label: tNow("mobile.mayor.gasto") },
    { id: 'ratio', label: tNow("mobile.mas.cerca.del.limite") },
    { id: 'goal', label: tNow("mobile.meta.mas.grande") },
    { id: 'name', label: tNow("mobile.nombre.a.z") },
  ];
}

type SortableRow = { spent: number; goal: number; ratio: number; budget: { name?: string | null } };

// Budgets are listed from the biggest spending to the smallest unless another order is chosen.
export function sortBudgetRows<T extends SortableRow>(rows: T[], order: BudgetOrder): T[] {
  const copy = [...rows];
  switch (order) {
    case 'ratio': return copy.sort((a, b) => b.ratio - a.ratio);
    case 'goal': return copy.sort((a, b) => b.goal - a.goal);
    case 'name': return copy.sort((a, b) => String(a.budget.name ?? '').localeCompare(String(b.budget.name ?? ''), 'es'));
    default: return copy.sort((a, b) => b.spent - a.spent);
  }
}
