import { router } from 'expo-router';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import type { RootState } from '@/store';
import { idOf, subCategoriesOf } from '@gastify/core/categories/categoryForm';

// The person's own categories (tap to edit them, with their sub-categories) and the defaults that come
// with every account, which can be read but not changed.
export default function CategoriesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const categories = useSelector((state: RootState) => state.categoriesReducer.data);
  const subCategories = useSelector((state: RootState) => state.subCategoryReducer.data);
  const { refresh, refreshing } = useRefreshAppData();
  const own = categories.user ?? [];
  const defaults = categories.default ?? [];
  const ownSubs = subCategories.subCat ?? [];

  return (
    <Screen title="Categorías" backLabel="Más" onBack={() => router.back()} refreshing={refreshing} onRefresh={refresh}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/more/categories/new')} className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
          Nueva categoría
        </Text>
      </Pressable>

      <Card title="Tus categorías">
        {own.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no creaste ninguna.</Text>}
        {own.map((category) => {
          const id = idOf(category);
          const count = subCategoriesOf(ownSubs, id).length;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/more/categories/[id]', params: { id } })}
              className="flex-row items-center gap-3 py-1.5">
              <CategoryBadge icon={category.icon} color={category.color} size={40} />
              <View className="flex-1">
                <Text className="font-inter-medium text-base text-gf-text">{category.name || 'Categoría'}</Text>
                <Text className="font-inter text-sm text-gf-text-muted">
                  {count === 0 ? 'Sin subcategorías' : count === 1 ? '1 subcategoría' : `${count} subcategorías`}
                </Text>
              </View>
              <Text className="font-inter text-base text-gf-text-muted">›</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card title="Predeterminadas">
        {defaults.map((category) => (
          <View key={idOf(category)} className="flex-row items-center gap-3 py-1.5">
            <CategoryBadge icon={category.icon} color={category.color} size={40} />
            <Text className="flex-1 font-inter-medium text-base text-gf-text">{category.name || 'Categoría'}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
