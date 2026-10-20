import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { GfSwitch } from '@/components/ui/switch';

import { ColorPicker } from '@/components/color-picker';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { CategoryBadge } from '@/components/category-badge';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { messageOf } from '@/lib/write';
import { CATEGORY_COLORS, idOf, validateCategoryName } from '@gastify/core/categories/categoryForm';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';

// `sub` is set when the form also creates a sub-category. Its parent is the new category (parentId null) or
// one the person already has.
export type CategorySubmit = { name: string; icon: string; color: string; sub?: { name: string; parentId: string | null } };

const NEW_PARENT = 'new';

// A category: name, color (any) and icon (the whole Fluent library, searchable in Spanish). A preview of the
// badge shows the combination. Used by "Nueva categoría", the edit screen and the "+" menu.
export function CategoryForm({
  initial,
  submitLabel,
  onSubmit,
  allowSubcategory = false,
  existing = [],
}: {
  initial?: CategorySubmit;
  submitLabel: string;
  onSubmit: (values: CategorySubmit) => Promise<void>;
  // "Nueva categoría" can also create a sub-category in the same step (the web's switch).
  allowSubcategory?: boolean;
  existing?: CategoryData[];
}) {
  const [withSub, setWithSub] = useState(false);
  const [subName, setSubName] = useState('');
  const [parent, setParent] = useState<string>(NEW_PARENT);
  const [subError, setSubError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'fluent/label');
  const [color, setColor] = useState<string>(initial?.color ?? CATEGORY_COLORS[0]);
  const parentItems: ChipItem[] = [
    { id: NEW_PARENT, label: name.trim() || 'Esta categoría' },
    ...existing.map((category) => ({ id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color })),
  ];
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const problem = validateCategoryName(name);
    setNameError(problem);
    setFormError(null);
    setSubError(null);
    if (problem) return;
    // A sub-category needs a name and a category to hang from: without them the form does not create it.
    if (withSub && !subName.trim()) return setSubError('Escribe el nombre de la subcategoría.');
    if (withSub && !parent) return setSubError('Elige la categoría donde va la subcategoría.');
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        icon,
        color,
        ...(withSub ? { sub: { name: subName.trim(), parentId: parent === NEW_PARENT ? null : parent } } : {}),
      });
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
      {allowSubcategory && (
        <View className="gap-3 rounded-2xl border border-gf-border p-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter-medium text-base text-gf-text">Crear también una subcategoría</Text>
            <GfSwitch value={withSub} onValueChange={setWithSub} accessibilityLabel="Crear también una subcategoría" />
          </View>
          {withSub && (
            <>
              <TextField label="Nombre de la subcategoría" value={subName} onChangeText={setSubName} placeholder="Restaurantes" maxLength={40} autoCapitalize="sentences" />
              <View className="gap-2">
                <Text className="font-inter-medium text-sm text-gf-text-muted">Va dentro de</Text>
                <ChipPicker items={parentItems} value={parent} onChange={setParent} moreAfter={99} />
              </View>
              {subError && <Text className="font-inter text-sm text-red-500">{subError}</Text>}
            </>
          )}
        </View>
      )}
      <FormError message={formError} />
      <GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} />
    </View>
  );
}
