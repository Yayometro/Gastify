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
import { useT, useInfo } from '@/i18n/client';
import { tNow } from '@/i18n/now';

// The title of each kind of new budget: a catalog key, read when the screen is shown.
const TITLE_KEYS: Record<BudgetKind, string> = { spending: "budgets.new", saving: "mobile.nueva.meta.de.ahorro", project: "mobile.nuevo.proyecto" };

export default function NewBudgetScreen() {
  const t = useT();
  const { APP_INFO } = useInfo();
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
    <Screen tutorial="m-budform" titleInfo={APP_INFO.formulario_presupuesto} title={tNow(TITLE_KEYS[kind])} backLabel={t("budgets.title")} onBack={() => router.back()}>
      <BudgetForm
        initial={initial}
        submitLabel={t("mobile.crear")}
        onSubmit={async (body) => {
          const created = await sendWrite<Record<string, unknown> | null>('general-data/budget/new', body);
          // Show it at once: the new budget goes into the list as soon as the server answers, the notice appears
          // right away and the full reload (which can take seconds with many movements) runs afterwards.
          if (created && typeof created === 'object' && '_id' in created) dispatch(addNewBudget(created as never));
          toast.show(kind === 'project' ? t("mobile.proyecto.creado") : kind === 'saving' ? t("mobile.meta.de.ahorro.creada") : t("mobile.presupuesto.creado"));
          router.back();
          dispatch(fetchBudget(undefined));
          reloadAfterWrite(dispatch);
        }}
      />
    </Screen>
  );
}
