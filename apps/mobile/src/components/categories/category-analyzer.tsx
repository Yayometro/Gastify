import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryBadge } from '@/components/category-badge';
import { TourTarget } from '@/components/tour/tour-target';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useLocale, useT } from '@/i18n/client';
import type { RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { shortDate } from '@gastify/core/i18n/dates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { normalizeText } from '@gastify/core/search/normalizeText';
import { movementKind } from '@gastify/core/transactions/monthSummary';
import { analyzeCategory, NO_SUBCATEGORY, type CategoryAnalysisKind, type CategoryAnalysisMovement } from '@gastify/core/transformers/categoryAnalysis';

type CategoryLike = { _id?: string; name?: string; icon?: string; color?: string };
const RANGES = [3, 6, 12] as const;

// The analyzer of one category (the first tab of Categorías): pick a category and see its total month by month, how it
// splits among its sub-categories and tags, and its biggest movements. Same numbers as the web: core's analyzeCategory.
export function CategoryAnalyzer({ initialCategoryId = '' }: { initialCategoryId?: string }) {
  const t = useT();
  const locale = useLocale();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const categoriesState = useSelector((state: RootState) => state.categoriesReducer.data) as unknown as { user?: CategoryLike[]; default?: CategoryLike[] };
  const subState = useSelector((state: RootState) => state.subCategoryReducer.data) as unknown as { subCat?: CategoryLike[]; default?: CategoryLike[] };
  const movements = useSelector((state: RootState) => state.transacctionsReducer.data) as unknown as CategoryAnalysisMovement[];
  const currency = useSelector((state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null)?.primaryCurrency) || 'MXN';

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<CategoryAnalysisKind>('expense');
  const [months, setMonths] = useState<(typeof RANGES)[number]>(6);
  const [subIndex, setSubIndex] = useState(0);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const categories = useMemo(() => [...(categoriesState?.user ?? []), ...(categoriesState?.default ?? [])], [categoriesState]);
  const subNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const sub of [...(subState?.subCat ?? []), ...(subState?.default ?? [])]) if (sub._id) names[String(sub._id)] = sub.name || '';
    return names;
  }, [subState]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const movement of movements) {
      if (movementKind(movement as never) === 'transfer') continue;
      const id = idOf(movement.category);
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [movements]);
  const ranked = useMemo(() => categories.filter((category) => counts.has(String(category._id))).sort((a, b) => (counts.get(String(b._id)) ?? 0) - (counts.get(String(a._id)) ?? 0)), [categories, counts]);

  const selected = categories.find((category) => String(category._id) === categoryId) ?? null;
  const analysis = useMemo(() => (selected ? analyzeCategory({ categoryId, movements, kind, months, subNames }) : null), [selected, categoryId, movements, kind, months, subNames]);

  const money = (value: number) => formatMoneyMajor(value, currency);
  const monthLabel = (key: string, long = false) => new Date(`${key}-15T12:00:00`).toLocaleDateString(locale, long ? { month: 'long', year: 'numeric' } : { month: 'short' });
  const needle = normalizeText(query);
  const matches = needle ? categories.filter((category) => normalizeText(category.name || '').includes(needle)) : ranked.slice(0, 12);
  const subName = (id: string, fallback: string) => (id === NO_SUBCATEGORY ? t('categories.analyzer.noSub') : fallback || subNames[id] || '');
  const tone = kind === 'expense' ? colors.expense : colors.income;

  const chip = (label: string, active: boolean, onPress: () => void, key: string, icon?: { icon?: string; color?: string }, extra?: string) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5" style={{ borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentSoft : 'transparent' }}>
      {icon ? <CategoryBadge icon={icon.icon} color={icon.color} size={20} /> : null}
      <Text className="font-inter-medium text-sm text-gf-text">{label}</Text>
      {extra ? <Text className="font-inter text-[11px] text-gf-text-muted">{extra}</Text> : null}
    </Pressable>
  );

  const rowOf = (movement: { id: string; name: string; date: number; amount: number }, index: number) => (
    <Pressable key={`${movement.id}-${index}`} accessibilityRole="button" disabled={!movement.id} onPress={() => { setOpenMonth(null); router.push({ pathname: '/movements/[id]', params: { id: movement.id, returnTo: '/more/categories' } }); }} className="flex-row items-center justify-between gap-3 border-t border-gf-border py-2.5">
      <View className="flex-1">
        <Text className="font-inter-medium text-sm text-gf-text" numberOfLines={1}>{movement.name}</Text>
        <Text className="font-inter text-xs text-gf-text-muted">{shortDate(new Date(movement.date), locale)}</Text>
      </View>
      <Text className="font-inter-semibold text-sm" style={{ color: tone }}>{money(movement.amount)}</Text>
    </Pressable>
  );

  const maxMonth = analysis ? Math.max(1, ...analysis.months.map((month) => month.total)) : 1;
  const keyOfTime = (time: number) => `${new Date(time).getFullYear()}-${String(new Date(time).getMonth() + 1).padStart(2, '0')}`;
  const monthDetail = analysis && openMonth ? analysis.movements.filter((row) => keyOfTime(row.date) === openMonth).sort((a, b) => b.amount - a.amount) : [];
  const safeSub = analysis ? Math.min(subIndex, Math.max(0, analysis.subs.length - 1)) : 0;
  const activeSub = analysis?.subs[safeSub];

  return (
    <View className="gap-4">
      <Card tour="m-cat-an-selector" tutorial="m-cat-analyzer" title={t('categories.analyzer.pick')} info={{ title: t('categories.analyzer.pick'), text: t('categories.analyzer.pickHelp') }}>
        <TextField label="" value={query} onChangeText={setQuery} placeholder={t('categories.analyzer.search')} autoCorrect={false} />
        {!needle && !selected && <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('categories.analyzer.shortcuts')}</Text>}
        <View className="flex-row flex-wrap gap-2">
          {matches.map((category) => chip(category.name || '', categoryId === String(category._id), () => { setCategoryId(String(category._id)); setSubIndex(0); }, String(category._id), category, t('categories.analyzer.moves', { p1: counts.get(String(category._id)) ?? 0 })))}
          {needle && matches.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t('categories.analyzer.noMatch', { p1: query })}</Text>}
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {chip(t('categories.analyzer.expenses'), kind === 'expense', () => setKind('expense'), 'k-expense')}
          {chip(t('categories.analyzer.incomes'), kind === 'income', () => setKind('income'), 'k-income')}
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {RANGES.map((range) => chip(t(`categories.analyzer.range${range}`), months === range, () => setMonths(range), `r-${range}`))}
        </View>
      </Card>

      {!selected || !analysis ? (
        <Text className="py-4 text-center font-inter text-sm text-gf-text-muted">{t('categories.analyzer.emptyPick')}</Text>
      ) : analysis.stats.count === 0 ? (
        <Text className="py-4 text-center font-inter text-sm text-gf-text-muted">{t('categories.analyzer.noMoves')}</Text>
      ) : (
        <>
          <Card tour="m-cat-an-bars" title={`${t('categories.analyzer.byMonth')} · ${selected.name}`} info={{ title: t('categories.analyzer.byMonth'), text: t('categories.analyzer.byMonthHelp') }}>
            <View className="flex-row flex-wrap gap-2">
              {[
                [t('categories.analyzer.total'), money(analysis.stats.total)],
                [t('categories.analyzer.average'), money(analysis.stats.avgMonthly)],
                [t('categories.analyzer.highest'), analysis.stats.max ? `${monthLabel(analysis.stats.max.month)} · ${money(analysis.stats.max.total)}` : '—'],
                [t('categories.analyzer.change'), analysis.stats.deltaPct === null ? t('categories.analyzer.changeNone') : `${analysis.stats.deltaPct >= 0 ? '+' : ''}${Math.round(analysis.stats.deltaPct)}%`],
              ].map(([label, value]) => (
                <View key={label} className="min-w-[46%] flex-1 rounded-2xl border border-gf-border p-3">
                  <Text className="font-inter-bold text-[10px] uppercase text-gf-text-muted">{label}</Text>
                  <Text className="font-inter-bold text-sm text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 150 }} className="flex-row items-end gap-1.5">
              {analysis.months.map((month, position) => {
                const current = position === analysis.months.length - 1;
                return (
                  <Pressable key={month.month} accessibilityRole="button" accessibilityLabel={`${monthLabel(month.month, true)} ${money(month.total)}`} onPress={() => setOpenMonth(month.month)} className="h-full flex-1 items-center justify-end gap-1">
                    <View style={{ width: '70%', maxWidth: 40, height: Math.max(2, (month.total / maxMonth) * 108), borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: current ? colors.accent : colors.accentSoft, borderWidth: 1, borderColor: colors.accent }} />
                    <Text className="font-inter-medium text-[11px] text-gf-text-muted">{monthLabel(month.month)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="font-inter text-xs text-gf-text-muted">{t('categories.analyzer.averageLine', { p1: money(analysis.stats.avgMonthly) })}</Text>
          </Card>

          <Card tour="m-cat-an-tags" title={t('categories.analyzer.tags')} info={{ title: t('categories.analyzer.tags'), text: t('categories.analyzer.tagsHelp') }}>
            {analysis.tags.length === 0 ? (
              <Text className="font-inter text-sm text-gf-text-muted">{t('categories.analyzer.noTags')}</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {analysis.tags.map((tag) => (
                  <View key={tag.id} className="rounded-full border border-gf-border px-3 py-1.5">
                    <Text className="font-inter text-xs text-gf-text">{tag.name} · {money(tag.total)} ({tag.count})</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card tour="m-cat-an-subs" title={t('categories.analyzer.subs')} info={{ title: t('categories.analyzer.subs'), text: t('categories.analyzer.subsHelp') }}>
            {activeSub && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {analysis.subs.map((sub, position) => chip(subName(sub.id, sub.name), position === safeSub, () => setSubIndex(position), `${categoryId}::${sub.id}`))}
                </ScrollView>
                <Text className="font-inter-bold text-base text-gf-text">{subName(activeSub.id, activeSub.name)} · {money(activeSub.total)}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">{t('categories.analyzer.subShare', { p1: `${Math.round(activeSub.share * 100)}%` })}</Text>
                <View style={{ height: 100 }} className="flex-row items-end gap-1.5">
                  {analysis.months.map((month, position) => {
                    const peak = Math.max(1, ...activeSub.monthly);
                    return (
                      <View key={month.month} className="h-full flex-1 items-center justify-end gap-1">
                        <View style={{ width: '70%', maxWidth: 34, height: Math.max(2, (activeSub.monthly[position] / peak) * 70), borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.accent, opacity: 0.8 }} />
                        <Text className="font-inter text-[10px] text-gf-text-muted">{monthLabel(month.month)}</Text>
                      </View>
                    );
                  })}
                </View>
                <View>{analysis.movements.filter((movement) => movement.subCategoryId === activeSub.id).sort((a, b) => b.amount - a.amount).slice(0, 5).map(rowOf)}</View>
              </>
            )}
          </Card>

          <Card tour="m-cat-an-top" title={t('categories.analyzer.top')} info={{ title: t('categories.analyzer.top'), text: t('categories.analyzer.topHelp') }}>
            <View>{analysis.top.map(rowOf)}</View>
          </Card>

          <Card tour="m-cat-an-list" title={t('categories.analyzer.list')} info={{ title: t('categories.analyzer.list'), text: t('categories.analyzer.listHelp') }}>
            <View>{analysis.movements.slice(0, 40).map(rowOf)}</View>
          </Card>
        </>
      )}

      <BottomSheet visible={openMonth !== null && analysis !== null} onClose={() => setOpenMonth(null)} maxHeight="80%">
        <View className="gap-1 px-6 pb-2 pt-5">
          <Text className="font-inter-bold text-xl text-gf-text">{t('categories.analyzer.monthTitle', { p1: selected?.name ?? '', p2: openMonth ? monthLabel(openMonth, true) : '' })}</Text>
          {analysis && openMonth && <Text className="font-inter-semibold text-base" style={{ color: tone }}>{money(analysis.months.find((month) => month.month === openMonth)?.total ?? 0)}</Text>}
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {monthDetail.length === 0 ? <Text className="font-inter text-sm text-gf-text-muted">{t('categories.analyzer.monthEmpty')}</Text> : monthDetail.map(rowOf)}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
