import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { GfSwitch } from '@/components/ui/switch';

import { ColorPicker } from '@/components/color-picker';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { CategoryBadge } from '@/components/category-badge';
import { GradientButton } from '@/components/ui/gradient-button';
import { TourTarget } from '@/components/tour/tour-target';
import { TextField } from '@/components/ui/text-field';
import { messageOf } from '@/lib/write';
import { CATEGORY_COLORS, idOf, validateCategoryName } from '@gastify/core/categories/categoryForm';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import { useT } from "@/i18n/client";

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
  const t = useT();
  const [withSub, setWithSub] = useState(false);
  const [subName, setSubName] = useState('');
  const [parent, setParent] = useState<string>(NEW_PARENT);
  const [subError, setSubError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'fluent/label');
  const [color, setColor] = useState<string>(initial?.color ?? CATEGORY_COLORS[0]);
  const parentItems: ChipItem[] = [
    { id: NEW_PARENT, label: name.trim() || t("mobile.esta.categoria") },
    ...existing.map((category) => ({ id: idOf(category), label: category.name || t("dashboard.bulk.category"), icon: category.icon, color: category.color })),
  ];
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const problemKey = validateCategoryName(name);
    const problem = problemKey ? t(problemKey) : null;
    setNameError(problem);
    setFormError(null);
    setSubError(null);
    if (problem) return;
    // A sub-category needs a name and a category to hang from: without them the form does not create it.
    if (withSub && !subName.trim()) return setSubError(t("mobile.escribe.el.nombre.de.la.subcategoria"));
    if (withSub && !parent) return setSubError(t("mobile.elige.la.categoria.donde.va.la.subcategoria"));
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
        <TourTarget id="m-catform-name" className="flex-1 gap-2">
          <TextField label={t("mobile.nombre")} value={name} onChangeText={setName} placeholder={t("mobile.mascotas")} maxLength={40} autoCapitalize="sentences" />
        </TourTarget>
      </View>
      {nameError && <Text className="font-inter text-sm text-red-500">{nameError}</Text>}
      <TourTarget id="m-catform-color" className="gap-2">
        <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.color")}</Text>
        <ColorPicker value={color} onChange={setColor} />
      </TourTarget>
      <TourTarget id="m-catform-icon" className="gap-2">
        <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.icono")}</Text>
        <IconPicker value={icon} onChange={setIcon} />
      </TourTarget>
      {allowSubcategory && (
        <View className="gap-3 rounded-2xl border border-gf-border p-3">
          <TourTarget id="m-catform-sub" className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter-medium text-base text-gf-text">{t("mobile.crear.tambien.una.subcategoria")}</Text>
            <GfSwitch value={withSub} onValueChange={setWithSub} accessibilityLabel={t("mobile.crear.tambien.una.subcategoria")} />
          </TourTarget>
          <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.subform.alsoHint")}</Text>
          {withSub && (
            <>
              <TourTarget id="m-catform-subname"><TextField label={t("mobile.nombre.de.la.subcategoria")} value={subName} onChangeText={setSubName} placeholder={t("mobile.restaurantes")} maxLength={40} autoCapitalize="sentences" /></TourTarget>
              <TourTarget id="m-catform-parent" className="gap-2">
                <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.subform.parentLabelNew")}</Text>
                <ChipPicker items={parentItems} value={parent} onChange={setParent} moreAfter={99} />
              </TourTarget>
              {subError && <Text className="font-inter text-sm text-red-500">{subError}</Text>}
            </>
          )}
        </View>
      )}
      <FormError message={formError} />
      <TourTarget id="m-catform-save"><GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} /></TourTarget>
    </View>
  );
}
