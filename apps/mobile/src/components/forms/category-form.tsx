import { useState } from 'react';
import { Text, View } from 'react-native';

import { ColorPicker } from '@/components/color-picker';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { CategoryBadge } from '@/components/category-badge';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { messageOf } from '@/lib/write';
import { CATEGORY_COLORS, validateCategoryName } from '@gastify/core/categories/categoryForm';

export type CategorySubmit = { name: string; icon: string; color: string };

// A category: name, color (any) and icon (the whole Fluent library, searchable in Spanish). A preview of the
// badge shows the combination. Used by "Nueva categoría", the edit screen and the "+" menu.
export function CategoryForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: CategorySubmit;
  submitLabel: string;
  onSubmit: (values: CategorySubmit) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'fluent/label');
  const [color, setColor] = useState<string>(initial?.color ?? CATEGORY_COLORS[0]);
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
      await onSubmit({ name: name.trim(), icon, color });
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-5">
      <View className="flex-row items-end gap-3">
        <CategoryBadge icon={icon} color={color} size={56} />
        <View className="flex-1 gap-2">
          <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Mascotas" maxLength={40} autoCapitalize="sentences" />
        </View>
      </View>
      {nameError && <Text className="font-inter text-sm text-red-500">{nameError}</Text>}
      <View className="gap-2">
        <Text className="font-inter-semibold text-base text-gf-text">Color</Text>
        <ColorPicker value={color} onChange={setColor} />
      </View>
      <View className="gap-2">
        <Text className="font-inter-semibold text-base text-gf-text">Ícono</Text>
        <IconPicker value={icon} onChange={setIcon} />
      </View>
      <FormError message={formError} />
      <GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} />
    </View>
  );
}
