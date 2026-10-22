export type BudgetOrder = 'spent' | 'ratio' | 'goal' | 'name';

export const BUDGET_ORDERS: { id: BudgetOrder; label: string }[] = [
  { id: 'spent', label: 'Mayor gasto' },
  { id: 'ratio', label: 'Más cerca del límite' },
  { id: 'goal', label: 'Meta más grande' },
  { id: 'name', label: 'Nombre (A–Z)' },
];

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
