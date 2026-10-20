import { router } from 'expo-router';
import { useDispatch } from 'react-redux';

import { CategoryForm } from '@/components/forms/category-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';

export default function NewCategoryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  return (
    <Screen title="Nueva categoría" backLabel="Categorías" onBack={() => router.back()}>
      <CategoryForm
        submitLabel="Crear categoría"
        onSubmit={async (values) => {
          await sendWrite('general-data/categories/new-category', values);
          toast.show('Categoría creada');
          reloadAfterWrite(dispatch);
          router.back();
        }}
      />
    </Screen>
  );
}
