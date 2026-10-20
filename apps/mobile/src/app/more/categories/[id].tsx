import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ColorSwatches } from '@/components/color-swatches';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { CATEGORY_COLORS, idOf, subCategoriesOf, validateCategoryName } from '@gastify/core/categories/categoryForm';

// One of the person's categories: name, icon and color, its sub-categories, and deleting it. A
// category's movements are kept; they are left without a category when it is deleted.
export default function EditCategoryScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const category = useSelector((state: RootState) => (state.categoriesReducer.data.user ?? []).find((item) => idOf(item) === id));
  const allSubs = useSelector((state: RootState) => state.subCategoryReducer.data.subCat ?? []);
  const subs = subCategoriesOf(allSubs, id);

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? 'fluent/label');
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_COLORS[0]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newSub, setNewSub] = useState('');
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [subName, setSubName] = useState('');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/more/categories'));

  if (!category) {
    return (
      <Screen title="Categoría" backLabel="Categorías" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">Esta categoría no se puede editar: o no es tuya, o ya no existe.</Text>
      </Screen>
    );
  }

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setFormError(null);
    try {
      await action();
      reloadAfterWrite(dispatch);
      after?.();
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const problem = validateCategoryName(name);
    setNameError(problem);
    if (problem) return;
    run(() => sendWrite('general-data/categories/update-category', { id, name: name.trim(), icon, color }), back);
  };

  const remove = () => {
    Alert.alert('Borrar esta categoría', 'Sus movimientos quedan sin categoría. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => run(() => sendWrite('general-data/categories/remove-category', id), back) },
    ]);
  };

  const addSub = () => {
    const problem = validateCategoryName(newSub);
    if (problem) return setFormError(problem);
    run(
      () => sendWrite('general-data/subcategory/new', { name: newSub.trim(), fatherCategory: id, icon, color }),
      () => setNewSub('')
    );
  };

  const saveSub = (subId: string) => {
    const problem = validateCategoryName(subName);
    if (problem) return setFormError(problem);
    const sub = subs.find((item) => idOf(item) === subId);
    run(
      () => sendWrite('general-data/subcategory/update', { id: subId, name: subName.trim(), icon: sub?.icon ?? icon, color: sub?.color ?? color, fatherCategory: id }),
      () => setEditingSub(null)
    );
  };

  const removeSub = (subId: string) => {
    run(() => sendWrite('general-data/subcategory/remove', subId));
  };

  return (
    <Screen title={category.name || 'Categoría'} backLabel="Categorías" onBack={back}>
      <View className="gap-2">
        <TextField label="Nombre" value={name} onChangeText={setName} maxLength={40} />
        {nameError && <Text className="font-inter text-sm text-red-500">{nameError}</Text>}
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Color</Text>
        <ColorSwatches value={color} onChange={setColor} />
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Ícono</Text>
        <IconPicker value={icon} onChange={setIcon} />
      </View>
      <FormError message={formError} />
      <GradientButton label="Guardar cambios" onPress={save} loading={busy} disabled={busy} />

      <Card title="Subcategorías">
        {subs.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no tiene subcategorías.</Text>}
        {subs.map((sub) => {
          const subId = idOf(sub);
          const editing = editingSub === subId;
          return (
            <View key={subId} className="gap-2 border-b border-gf-border pb-3">
              {editing ? (
                <>
                  <TextField label="Nombre" value={subName} onChangeText={setSubName} maxLength={40} />
                  <View className="flex-row gap-4">
                    <Pressable accessibilityRole="button" onPress={() => saveSub(subId)} disabled={busy}>
                      <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Guardar</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setEditingSub(null)}>
                      <Text className="font-inter-semibold text-sm text-gf-text-muted">Cancelar</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 font-inter-medium text-base text-gf-text">{sub.name || 'Subcategoría'}</Text>
                  <Pressable accessibilityRole="button" onPress={() => { setEditingSub(subId); setSubName(sub.name ?? ''); }}>
                    <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Editar</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={() => removeSub(subId)}>
                    <Text className="font-inter-semibold text-sm text-red-500">Borrar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
        <TextField label="Nueva subcategoría" value={newSub} onChangeText={setNewSub} placeholder="Restaurantes" maxLength={40} />
        <Pressable accessibilityRole="button" disabled={busy || !newSub.trim()} onPress={addSub}>
          <Text className="font-inter-semibold text-sm" style={{ color: newSub.trim() ? colors.accent : colors.textSecondary }}>
            Agregar subcategoría
          </Text>
        </Pressable>
      </Card>

      <Pressable accessibilityRole="button" disabled={busy} onPress={remove} className="items-center py-2">
        <Text className="font-inter-semibold text-base text-red-500">Borrar categoría</Text>
      </Pressable>
    </Screen>
  );
}
