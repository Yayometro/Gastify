import { router, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';

import { BudgetForm } from '@/components/forms/budget-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { emptyBudgetValues, type BudgetKind } from '@gastify/core/budgets/budgetForm';

const TITLES: Record<BudgetKind, string> = { spending: 'Nuevo presupuesto', saving: 'Nueva meta de ahorro', project: 'Nuevo proyecto' };

export default function NewBudgetScreen() {
  const { kind: rawKind } = useLocalSearchParams<{ kind?: string }>();
  const kind: BudgetKind = rawKind === 'saving' || rawKind === 'project' ? rawKind : 'spending';
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const currency = usePrimaryCurrency();
  return (
    <Screen title={TITLES[kind]} backLabel="Presupuestos" onBack={() => router.back()}>
      <BudgetForm
        initial={emptyBudgetValues(kind, currency)}
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
