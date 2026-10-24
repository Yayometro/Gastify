import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { CategoryForm } from '@/components/forms/category-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { sendWrite } from '@/lib/write';
import { idOf } from '@gastify/core/categories/categoryForm';
import type { AppDispatch, RootState } from '@/store';
import { useT } from "@/i18n/client";

export default function NewCategoryScreen() {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const categories = useSelector((state: RootState) => state.categoriesReducer.data.user ?? []);
  return (
    <Screen title={t("mobile.nueva.categoria")} backLabel="Categorías" onBack={() => router.back()}>
      <CategoryForm
        submitLabel="Crear categoría"
        allowSubcategory
        existing={categories}
        onSubmit={async ({ sub, ...values }) => {
          const created = await sendWrite<{ _id?: unknown }>('general-data/categories/new-category', values);
          // The sub-category hangs from the new category, or from the one the person picked.
          if (sub) {
            await sendWrite('general-data/subcategory/new', {
              name: sub.name,
              icon: values.icon,
              color: values.color,
              fatherCategory: sub.parentId ?? idOf(created as never),
            });
          }
          toast.show(sub ? 'Categoría y subcategoría creadas' : 'Categoría creada');
          reloadAfterWrite(dispatch);
          router.back();
        }}
      />
    </Screen>
  );
}
