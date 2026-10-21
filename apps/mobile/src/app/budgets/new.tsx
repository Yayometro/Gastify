import { router, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';

import { BudgetForm } from '@/components/forms/budget-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { useCatalog } from '@/hooks/use-catalog';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
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
          await sendWrite('general-data/budget/new', body);
          toast.show('Presupuesto creado');
          reloadAfterWrite(dispatch);
          router.back();
        }}
      />
    </Screen>
  );
}
