import { router, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';

import { BudgetForm } from '@/components/forms/budget-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { useCatalog } from '@/hooks/use-catalog';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { addNewBudget, fetchBudget } from '@gastify/core/features/budgetSlice';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { emptyBudgetValues, type BudgetKind } from '@gastify/core/budgets/budgetForm';
import { idOf } from '@gastify/core/categories/categoryForm';

const TITLES: Record<BudgetKind, string> = { spending: 'Nuevo presupuesto', saving: 'Nueva meta de ahorro', project: 'Nuevo proyecto' };

export default function NewBudgetScreen() {
  const { kind: rawKind, categoryId } = useLocalSearchParams<{ kind?: string; categoryId?: string }>();
  const kind: BudgetKind = rawKind === 'saving' || rawKind === 'project' ? rawKind : 'spending';
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const currency = usePrimaryCurrency();
  const { categories } = useCatalog();
  const category = kind === 'spending' ? categories.find((item) => idOf(item) === categoryId) : undefined;
  const initial = emptyBudgetValues(kind, currency);
  if (category) {
    initial.name = category.name || '';
    initial.categoryIds = [idOf(category)];
  }
  return (
    <Screen title={TITLES[kind]} backLabel="Presupuestos" onBack={() => router.back()}>
      <BudgetForm
        initial={initial}
        submitLabel="Crear"
        onSubmit={async (body) => {
          const created = await sendWrite<Record<string, unknown> | null>('general-data/budget/new', body);
          // Show it at once: the new budget goes into the list as soon as the server answers, the notice appears
          // right away and the full reload (which can take seconds with many movements) runs afterwards.
          if (created && typeof created === 'object' && '_id' in created) dispatch(addNewBudget(created as never));
          toast.show(kind === 'project' ? 'Proyecto creado' : kind === 'saving' ? 'Meta de ahorro creada' : 'Presupuesto creado');
          router.back();
          dispatch(fetchBudget(undefined));
          reloadAfterWrite(dispatch);
        }}
      />
    </Screen>
  );
}
