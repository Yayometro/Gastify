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
    <Screen tutorial="m-catform" title={t("mobile.nueva.categoria")} backLabel={t("mobile.categorias")} onBack={() => router.back()}>
      <CategoryForm
        submitLabel={t("mobile.crear.categoria")}
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
          toast.show(sub ? t("mobile.categoria.y.subcategoria.creadas") : t("mobile.categoria.creada"));
          reloadAfterWrite(dispatch);
          router.back();
        }}
      />
    </Screen>
  );
}
