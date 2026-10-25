import { useSelector } from 'react-redux';

import type { AccountData } from '@gastify/core/features/accountsSlice';
import type { BudgetData } from '@gastify/core/features/budgetSlice';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import type { RootState } from '@/store';

// The lists a movement is built from: the person's own categories first, then the defaults (the
// same order the web uses), the sub-categories, the accounts and the active budgets.
export function useCatalog(): {
  accounts: AccountData[];
  categories: CategoryData[];
  subCategories: SubCategoryData[];
  budgets: BudgetData[];
} {
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const categories = useSelector((state: RootState) => state.categoriesReducer.data);
  const subCategories = useSelector((state: RootState) => state.subCategoryReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  return {
    accounts,
    categories: [...(categories.user ?? []), ...(categories.default ?? [])],
    subCategories: [...(subCategories.subCat ?? []), ...(subCategories.default ?? [])],
    budgets: budgets.filter((budget) => !budget.archived),
  };
}
