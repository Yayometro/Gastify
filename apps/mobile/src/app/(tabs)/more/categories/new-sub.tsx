import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { FormError } from '@/components/auth/auth-layout';
import { CategoryBadge } from '@/components/category-badge';
import { ChipPicker } from '@/components/chip-picker';
import { ColorPicker } from '@/components/color-picker';
import { IconPicker } from '@/components/icon-picker';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { TourTarget } from '@/components/tour/tour-target';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf, validateCategoryName } from '@gastify/core/categories/categoryForm';
import { useT } from "@/i18n/client";

// A sub-category on its own: the category it goes in comes FIRST and is required (without it nothing is created), then
// its name, color and icon (which start as the category's). The "+ sub-category" button of the categories list opens it.
export default function NewSubCategoryScreen() {
  const t = useT();
  const { parentId: rawParent } = useLocalSearchParams<{ parentId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const userCategories = useSelector((state: RootState) => state.categoriesReducer.data.user ?? []);
  const [parent, setParent] = useState<string>(typeof rawParent === 'string' ? rawParent : '');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parentCategory = userCategories.find((category) => idOf(category) === parent);
  // Until the person touches them, the icon and the color are the category's.
  const shownIcon = icon ?? parentCategory?.icon ?? 'fluent/label';
  const shownColor = color ?? parentCategory?.color ?? '#F57C00';
  const back = () => (router.canGoBack() ? router.back() : router.replace('/more/categories'));

  const save = async () => {
    if (!parentCategory) return setError(t("mobile.subform.pickParent"));
    const problemKey = validateCategoryName(name);
    if (problemKey) return setError(t(problemKey));
    setSaving(true);
    setError(null);
    try {
      await sendWrite('general-data/subcategory/new', { name: name.trim(), icon: shownIcon, color: shownColor, fatherCategory: parent });
      toast.show(t("mobile.subcategoria.creada"));
      reloadAfterWrite(dispatch);
      back();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen tutorial="m-subform" title={t("mobile.subform.title")} backLabel={t("mobile.categorias")} onBack={back}>
      {userCategories.length === 0 ? (
        <View className="gap-4 rounded-3xl bg-gf-surface p-5">
          <Text className="font-inter text-base text-gf-text">{t("mobile.subform.noCategories")}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/more/categories/new')} className="items-center rounded-full py-3" style={{ backgroundColor: colors.accentSoft }}>
            <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{t("mobile.subform.createCategory")}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-5">
          <TourTarget id="m-subform-parent" className="gap-3">
            <View className="flex-row items-start gap-2 rounded-2xl p-3" style={{ backgroundColor: colors.accentSoft }}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              <Text className="flex-1 font-inter text-sm text-gf-text">{t("mobile.subform.parentRule")}</Text>
            </View>
            <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.subform.parentLabel")}</Text>
            <ChipPicker
              items={userCategories.map((category) => ({ id: idOf(category), label: category.name || t("dashboard.bulk.category"), icon: category.icon, color: category.color }))}
              value={parent}
              onChange={setParent}
              title={t("mobile.categorias")}
              moreAfter={6}
            />
            <Text className="font-inter text-sm text-gf-text-muted">
              {parentCategory ? t("mobile.subform.willBeIn", { p1: parentCategory.name ?? '' }) : t("mobile.subform.pickParent")}
            </Text>
          </TourTarget>

          <View className="flex-row items-end gap-3">
            <CategoryBadge icon={shownIcon} color={shownColor} size={56} />
            <TourTarget id="m-subform-name" className="flex-1 gap-2">
              <TextField label={t("mobile.nombre")} value={name} onChangeText={setName} placeholder={t("mobile.restaurantes")} maxLength={40} autoCapitalize="sentences" />
            </TourTarget>
          </View>
          <TourTarget id="m-subform-color" className="gap-2">
            <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.color")}</Text>
            <ColorPicker value={shownColor} onChange={setColor} />
          </TourTarget>
          <TourTarget id="m-subform-icon" className="gap-2">
            <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.icono")}</Text>
            <IconPicker value={shownIcon} onChange={setIcon} />
          </TourTarget>
          <FormError message={error} />
          <TourTarget id="m-subform-save">
            <GradientButton label={t("mobile.subform.save")} onPress={save} loading={saving} disabled={saving || !parentCategory} />
          </TourTarget>
        </View>
      )}
    </Screen>
  );
}
