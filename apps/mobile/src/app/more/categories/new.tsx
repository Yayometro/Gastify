import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ColorSwatches } from '@/components/color-swatches';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { Screen } from '@/components/screen';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { CATEGORY_COLORS, validateCategoryName } from '@gastify/core/categories/categoryForm';

// A new category: name, icon and color, as in the web's category editor.
export default function NewCategoryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('fluent/label');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const problem = validateCategoryName(name);
    setNameError(problem);
    setFormError(null);
    if (problem) return;
    setSaving(true);
    try {
      await sendWrite('general-data/categories/new-category', { name: name.trim(), icon, color });
      reloadAfterWrite(dispatch);
      router.back();
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Nueva categoría" backLabel="Categorías" onBack={() => router.back()}>
      <View className="gap-2">
        <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Mascotas" maxLength={40} />
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
      <GradientButton label="Crear categoría" onPress={save} loading={saving} disabled={saving} />
    </Screen>
  );
}
