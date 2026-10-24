import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import type { RootState } from '@/store';
import { idOf, subCategoriesOf } from '@gastify/core/categories/categoryForm';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { useT } from "@/i18n/client";

// The person's own categories (tap to edit them and their sub-categories) and the defaults that come with
// every account, which can be read but not changed. The search box looks at category and sub-category names.
export default function CategoriesScreen() {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const categories = useSelector((state: RootState) => state.categoriesReducer.data);
  const subCategories = useSelector((state: RootState) => state.subCategoryReducer.data);
  const { refresh, refreshing } = useRefreshAppData();
  const [query, setQuery] = useState('');

  const ownSubs = useMemo(() => subCategories.subCat ?? [], [subCategories.subCat]);
  const defaultSubs = useMemo(() => subCategories.default ?? [], [subCategories.default]);

  const filter = (list: CategoryData[], subs: SubCategoryData[]) => {
    const needle = normalizeText(query);
    if (!needle) return list;
    return list.filter(
      (category) =>
        normalizeText(category.name ?? '').includes(needle) ||
        subCategoriesOf(subs, idOf(category)).some((sub) => normalizeText(sub.name ?? '').includes(needle))
    );
  };
  const own = useMemo(() => filter(categories.user ?? [], ownSubs), [categories.user, ownSubs, query]); // eslint-disable-line react-hooks/exhaustive-deps
  const defaults = useMemo(() => filter(categories.default ?? [], [...ownSubs, ...defaultSubs]), [categories.default, ownSubs, defaultSubs, query]); // eslint-disable-line react-hooks/exhaustive-deps

  // While searching, the categories and the sub-categories are listed apart: a sub-category opens its category.
  const searching = normalizeText(query) !== '';
  const allCategories = useMemo(() => [...(categories.user ?? []), ...(categories.default ?? [])], [categories.user, categories.default]);
  const needle = normalizeText(query);
  const matchingSubs = searching ? [...ownSubs, ...defaultSubs].filter((sub) => normalizeText(sub.name ?? '').includes(needle)) : [];
  const parentName = (sub: SubCategoryData) => allCategories.find((category) => idOf(category) === idOf(sub.fatherCategory))?.name ?? '';

  const subtitle = (category: CategoryData, subs: SubCategoryData[]) => {
    const names = subCategoriesOf(subs, idOf(category)).map((sub) => sub.name).filter(Boolean);
    return names.length === 0 ? 'Sin subcategorías' : names.join(' · ');
  };

  return (
    <Screen title={t("mobile.categorias")} backLabel="Más" onBack={() => router.back()} refreshing={refreshing} onRefresh={refresh}>
      <TextField label="" value={query} onChangeText={setQuery} placeholder={t("mobile.buscar.categoria.o.subcategoria")} autoCorrect={false} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/more/categories/new')} className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
          {t("mobile.nueva.categoria")}
        </Text>
      </Pressable>

      {searching && (
        <>
          <Card title={t("mobile.categorias")}>
            {own.length + defaults.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.ninguna.categoria.coincide")}</Text>}
            {[...own, ...defaults].map((category) => (
              <Pressable
                key={idOf(category)}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/more/categories/[id]', params: { id: idOf(category) } })}
                className="flex-row items-center gap-3 py-1.5">
                <CategoryBadge icon={category.icon} color={category.color} size={40} />
                <Text className="flex-1 font-inter-medium text-base text-gf-text">{category.name || 'Categoría'}</Text>
                <Text className="font-inter text-base text-gf-text-muted">›</Text>
              </Pressable>
            ))}
          </Card>
          <Card title={t("mobile.subcategorias")}>
            {matchingSubs.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.ninguna.subcategoria.coincide")}</Text>}
            {matchingSubs.map((sub) => (
              <Pressable
                key={idOf(sub)}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/more/categories/[id]', params: { id: idOf(sub.fatherCategory) } })}
                className="flex-row items-center gap-3 py-1.5">
                <CategoryBadge icon={sub.icon} color={sub.color} size={34} />
                <View className="flex-1">
                  <Text className="font-inter-medium text-base text-gf-text">{sub.name || 'Subcategoría'}</Text>
                  <Text className="font-inter text-sm text-gf-text-muted">{parentName(sub)}</Text>
                </View>
                <Text className="font-inter text-base text-gf-text-muted">›</Text>
              </Pressable>
            ))}
          </Card>
        </>
      )}

      {!searching && (
      <>
      <Card title={t("mobile.tus.categorias")}>
        {own.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{query ? 'Ninguna coincide.' : 'Todavía no creaste ninguna.'}</Text>}
        {own.map((category) => {
          const id = idOf(category);
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/more/categories/[id]', params: { id } })}
              className="flex-row items-center gap-3 py-1.5">
              <CategoryBadge icon={category.icon} color={category.color} size={40} />
              <View className="flex-1">
                <Text className="font-inter-medium text-base text-gf-text">{category.name || 'Categoría'}</Text>
                <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={2}>{subtitle(category, ownSubs)}</Text>
              </View>
              <Text className="font-inter text-base text-gf-text-muted">›</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card title={t("mobile.predeterminadas")}>
        {defaults.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.ninguna.coincide")}</Text>}
        {defaults.map((category) => (
          <View key={idOf(category)} className="flex-row items-center gap-3 py-1.5">
            <CategoryBadge icon={category.icon} color={category.color} size={40} />
            <View className="flex-1">
              <Text className="font-inter-medium text-base text-gf-text">{category.name || 'Categoría'}</Text>
              <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={2}>{subtitle(category, [...ownSubs, ...defaultSubs])}</Text>
            </View>
          </View>
        ))}
      </Card>
      </>
      )}
    </Screen>
  );
}
