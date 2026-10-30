import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryAnalyzer } from '@/components/categories/category-analyzer';
import { CategoryBadge } from '@/components/category-badge';
import { Segmented } from '@/components/segmented';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { ChipPicker } from '@/components/chip-picker';
import { useGrowthCategoryPreferences } from '@/hooks/use-growth-category-preferences';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import type { RootState } from '@/store';
import { idOf, subCategoriesOf } from '@gastify/core/categories/categoryForm';
import type { CategoryData } from '@gastify/core/features/categoriesSlice';
import type { SubCategoryData } from '@gastify/core/features/subCategorySlice';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { useT, useInfo } from "@/i18n/client";
import type { InfoText } from '@gastify/core/info/createInfo';

import { TourPressable, TourTarget } from '@/components/tour/tour-target';
// The person's own categories (tap to edit them and their sub-categories) and the defaults that come with
// every account, which can be read but not changed. The search box looks at category and sub-category names.
// The tab last used, kept while the app is open.
let lastTab: 'analyzer' | 'list' = 'analyzer';

export default function CategoriesScreen() {
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const categories = useSelector((state: RootState) => state.categoriesReducer.data);
  const subCategories = useSelector((state: RootState) => state.subCategoryReducer.data);
  const { refresh, refreshing } = useRefreshAppData();
  const [query, setQuery] = useState('');
  const [tab, setTabState] = useState<'analyzer' | 'list'>(lastTab);
  const setTab = (next: 'analyzer' | 'list') => { lastTab = next; setTabState(next); };
  const [growthCategoryId, setGrowthCategoryId] = useState('');
  const [reductionInput, setReductionInput] = useState('25');
  const [savingGrowth, setSavingGrowth] = useState(false);
  const growthPreferences = useGrowthCategoryPreferences();

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
    return names.length === 0 ? t("mobile.sin.subcategorias") : names.join(' · ');
  };

  return (
    <Screen titleInfo={APP_INFO.categor_as_y_subcategor_as} title={t("mobile.categorias")} backLabel={t("mobile.mas")} onBack={() => router.back()} refreshing={refreshing} onRefresh={refresh}>
      <TourTarget id="m-cat-tabs">
        <Segmented
          options={[{ value: 'analyzer', label: t('categories.tab.analyzer') }, { value: 'list', label: t('categories.tab.list') }]}
          value={tab}
          onChange={setTab}
          tourIds={{ analyzer: 'm-cat-tab-analyzer', list: 'm-cat-tab-list' }}
        />
      </TourTarget>
      {tab === 'analyzer' ? <CategoryAnalyzer /> : (
      <>
      <TourTarget id="m-cat-search"><TextField label="" value={query} onChangeText={setQuery} placeholder={t("mobile.buscar.categoria.o.subcategoria")} autoCorrect={false} /></TourTarget>
      <View className="flex-row gap-3">
        <TourPressable id="m-cat-new" accessibilityRole="button" onPress={() => router.push('/more/categories/new')} className="flex-1 items-center rounded-3xl bg-gf-surface p-4">
          <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
            {t("mobile.nueva.categoria")}
          </Text>
        </TourPressable>
        <TourPressable id="m-cat-newsub" accessibilityRole="button" onPress={() => router.push('/more/categories/new-sub')} className="flex-1 items-center rounded-3xl bg-gf-surface p-4">
          <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
            {t("mobile.subform.newSubButton")}
          </Text>
        </TourPressable>
      </View>
      <Card title={t('opportunities.categoryPreferenceTitle')} info={APP_INFO.categorias_a_reducir as InfoText}>
        <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.categoryPreferenceHelp')}</Text>
        <ChipPicker items={allCategories.map((item) => ({ id: idOf(item), label: item.name || t('opportunities.category'), icon: item.icon, color: item.color }))} value={growthCategoryId} onChange={(value) => { setGrowthCategoryId(value); setReductionInput(String(growthPreferences.preferences.find((item) => item.categoryId === value)?.reductionPercent ?? 25)); }} title={t('opportunities.category')} moreAfter={4} />
        <TextField label={t('opportunities.reductionPercent')} value={reductionInput} onChangeText={setReductionInput} keyboardType="number-pad" />
        <Pressable accessibilityRole="button" disabled={!growthCategoryId || savingGrowth || growthPreferences.loading || !Number.isInteger(Number(reductionInput)) || Number(reductionInput) < 0 || Number(reductionInput) > 100} onPress={async () => { setSavingGrowth(true); await growthPreferences.save(growthCategoryId, Number(reductionInput)); setSavingGrowth(false); }} className="items-center rounded-xl bg-gf-surface-2 px-4 py-3 disabled:opacity-50"><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t('opportunities.savePreference')}</Text></Pressable>
        <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.zeroRemovesPreference')}</Text>
        {growthPreferences.error && <Text className="font-inter text-xs text-red-300">{t('opportunities.preferenceError')}</Text>}
        {growthPreferences.preferences.map((item) => { const category = allCategories.find((candidate) => idOf(candidate) === item.categoryId); return category ? <Text key={item.categoryId} className="font-inter text-xs text-gf-text-muted">{category.name} · −{item.reductionPercent}%</Text> : null; })}
      </Card>

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
                <Text className="flex-1 font-inter-medium text-base text-gf-text">{category.name || t("dashboard.bulk.category")}</Text>
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
                  <Text className="font-inter-medium text-base text-gf-text">{sub.name || t("dashboard.dup.subcategory")}</Text>
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
      <Card tour="m-cat-yours" title={t("mobile.tus.categorias")}>
        {own.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{query ? t("mobile.ninguna.coincide") : t("mobile.todavia.no.creaste.ninguna")}</Text>}
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
                <Text className="font-inter-medium text-base text-gf-text">{category.name || t("dashboard.bulk.category")}</Text>
                <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={2}>{subtitle(category, ownSubs)}</Text>
              </View>
              <Text className="font-inter text-base text-gf-text-muted">›</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card tour="m-cat-defaults" title={t("mobile.predeterminadas")} info={APP_INFO.categor_as_predeterminadas}>
        {defaults.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.ninguna.coincide")}</Text>}
        {defaults.map((category) => (
          <View key={idOf(category)} className="flex-row items-center gap-3 py-1.5">
            <CategoryBadge icon={category.icon} color={category.color} size={40} />
            <View className="flex-1">
              <Text className="font-inter-medium text-base text-gf-text">{category.name || t("dashboard.bulk.category")}</Text>
              <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={2}>{subtitle(category, [...ownSubs, ...defaultSubs])}</Text>
            </View>
          </View>
        ))}
      </Card>
      </>
      )}
      </>
      )}
    </Screen>
  );
}
