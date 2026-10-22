import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { ChipPicker } from '@/components/chip-picker';
import { ColorPicker } from '@/components/color-picker';
import { CategoryForm } from '@/components/forms/category-form';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf, subCategoriesOf, validateCategoryName } from '@gastify/core/categories/categoryForm';

type SubDraft = { id?: string; name: string; icon: string; color: string; parentId: string };

// One of the person's categories: its own fields, its sub-categories (each with name, icon, color and the
// category it hangs from) and deleting it. A category's movements are kept; they are left without it.
export default function EditCategoryScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const userCategories = useSelector((state: RootState) => state.categoriesReducer.data.user ?? []);
  const category = userCategories.find((item) => idOf(item) === id);
  const allSubs = useSelector((state: RootState) => state.subCategoryReducer.data.subCat ?? []);
  const subs = subCategoriesOf(allSubs, id);

  const [draft, setDraft] = useState<SubDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/more/categories'));

  if (!category) {
    return (
      <Screen title="Categoría" backLabel="Categorías" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">Esta categoría no se puede editar: o no es tuya, o ya no existe.</Text>
      </Screen>
    );
  }

  const remove = () => {
    Alert.alert('Borrar esta categoría', 'Sus movimientos quedan sin categoría. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/categories/remove-category', id);
            toast.show('Categoría borrada');
            reloadAfterWrite(dispatch);
            back();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  const startSub = (sub?: { _id?: string; name?: string; icon?: string; color?: string }) => {
    setSubError(null);
    setDraft({
      id: sub ? idOf(sub) : undefined,
      name: sub?.name ?? '',
      icon: sub?.icon ?? category.icon ?? 'fluent/label',
      color: sub?.color ?? category.color ?? '#F57C00',
      parentId: id,
    });
  };

  const saveSub = async () => {
    if (!draft) return;
    const problem = validateCategoryName(draft.name);
    if (problem) return setSubError(problem);
    setBusy(true);
    setSubError(null);
    try {
      if (draft.id) {
        await sendWrite('general-data/subcategory/update', { id: draft.id, name: draft.name.trim(), icon: draft.icon, color: draft.color, fatherCategory: draft.parentId });
      } else {
        await sendWrite('general-data/subcategory/new', { name: draft.name.trim(), icon: draft.icon, color: draft.color, fatherCategory: draft.parentId });
      }
      toast.show(draft.id ? 'Subcategoría guardada' : 'Subcategoría creada');
      reloadAfterWrite(dispatch);
      setDraft(null);
    } catch (e) {
      setSubError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const removeSub = (subId: string) => {
    Alert.alert('Borrar esta subcategoría', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/subcategory/remove', subId);
            toast.show('Subcategoría borrada');
            reloadAfterWrite(dispatch);
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  return (
    <Screen title={category.name || 'Categoría'} backLabel="Categorías" onBack={back}>
      <CategoryForm
        key={id}
        initial={{ name: category.name ?? '', icon: category.icon ?? 'fluent/label', color: category.color ?? '#F57C00' }}
        submitLabel="Guardar cambios"
        onSubmit={async (values) => {
          await sendWrite('general-data/categories/update-category', { id, ...values });
          toast.show('Categoría guardada');
          reloadAfterWrite(dispatch);
          back();
        }}
      />

      <Card title="Subcategorías">
        {subs.length === 0 && !draft && <Text className="font-inter text-sm text-gf-text-muted">Todavía no tiene subcategorías.</Text>}
        {subs.map((sub) => {
          const subId = idOf(sub);
          if (draft?.id === subId) return null;
          return (
            <View key={subId} className="flex-row items-center gap-3 border-b border-gf-border pb-3">
              <CategoryBadge icon={sub.icon} color={sub.color} size={36} />
              <Text className="flex-1 font-inter-medium text-base text-gf-text">{sub.name || 'Subcategoría'}</Text>
              <Pressable accessibilityRole="button" onPress={() => startSub(sub)}>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Editar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => removeSub(subId)}>
                <Text className="font-inter-semibold text-sm text-red-500">Borrar</Text>
              </Pressable>
            </View>
          );
        })}

        {draft ? (
          <View className="gap-4">
            <View className="flex-row items-end gap-3">
              <CategoryBadge icon={draft.icon} color={draft.color} size={52} />
              <View className="flex-1">
                <TextField label={draft.id ? 'Nombre' : 'Nueva subcategoría'} value={draft.name} onChangeText={(text) => setDraft({ ...draft, name: text })} placeholder="Restaurantes" maxLength={40} autoCapitalize="sentences" />
              </View>
            </View>
            <View className="gap-2">
              <Text className="font-inter-medium text-sm text-gf-text-muted">Categoría a la que pertenece</Text>
              <ChipPicker
                items={userCategories.map((item) => ({ id: idOf(item), label: item.name || 'Categoría', icon: item.icon, color: item.color }))}
                value={draft.parentId}
                onChange={(parentId) => setDraft({ ...draft, parentId })}
                title="Categorías"
              />
            </View>
            {/* The color and the icon are always open, as in the category form: nothing to tap before choosing. */}
            <View className="gap-2">
              <Text className="font-inter-semibold text-base text-gf-text">Color</Text>
              <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
            </View>
            <View className="gap-2">
              <Text className="font-inter-semibold text-base text-gf-text">Ícono</Text>
              <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
            </View>
            <FormError message={subError} />
            <GradientButton label={draft.id ? 'Guardar subcategoría' : 'Agregar subcategoría'} onPress={saveSub} loading={busy} disabled={busy} />
            <Pressable accessibilityRole="button" onPress={() => setDraft(null)} className="items-center py-1">
              <Text className="font-inter-semibold text-sm text-gf-text-muted">Cancelar</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => startSub()}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Agregar subcategoría</Text>
          </Pressable>
        )}
      </Card>

      <Pressable accessibilityRole="button" onPress={remove} className="items-center py-2">
        <Text className="font-inter-semibold text-base text-red-500">Borrar categoría</Text>
      </Pressable>
    </Screen>
  );
}
