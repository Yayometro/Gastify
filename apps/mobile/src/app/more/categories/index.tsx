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

// The person's own categories (tap to edit them and their sub-categories) and the defaults that come with
// every account, which can be read but not changed. The search box looks at category and sub-category names.
export default function CategoriesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const categories = useSelector((state: RootState) => state.categoriesReducer.data);
  const subCategories = useSelector((state: RootState) => state.subCategoryReducer.data);
  const { refresh, refreshing } = useRefreshAppData();
  const [query, setQuery] = useState('');

  const ownSubs = subCategories.subCat ?? [];
  const defaultSubs = subCategories.default ?? [];

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

  const subtitle = (category: CategoryData, subs: SubCategoryData[]) => {
    const names = subCategoriesOf(subs, idOf(category)).map((sub) => sub.name).filter(Boolean);
    return names.length === 0 ? 'Sin subcategorías' : names.join(' · ');
  };

  return (
    <Screen title="Categorías" backLabel="Más" onBack={() => router.back()} refreshing={refreshing} onRefresh={refresh}>
      <TextField label="" value={query} onChangeText={setQuery} placeholder="Buscar categoría o subcategoría" autoCorrect={false} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/more/categories/new')} className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
          Nueva categoría
        </Text>
      </Pressable>

      <Card title="Tus categorías">
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

      <Card title="Predeterminadas">
        {defaults.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Ninguna coincide.</Text>}
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
    </Screen>
  );
}
