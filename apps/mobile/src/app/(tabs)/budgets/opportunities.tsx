import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { DateField } from '@/components/date-field';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TextField } from '@/components/ui/text-field';
import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import type { RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { formatMoneyMajor, formatMoneyMinor, majorToMinor, minorToMajor } from '@gastify/core/money/currencies';
import { resolveOpportunityMoney, scanOpportunityTransactions } from '@gastify/core/opportunities/transactions';
import { compareOpportunityWithGoal, opportunityPrincipal } from '@gastify/core/opportunities/scenarios';
import { projectDatedExpenses, projectSingleDeposit } from '@gastify/core/opportunities/investment';
import type { OpportunityDimension } from '@gastify/core/opportunities/types';
import { isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { dateText } from '@gastify/core/transactions/movementForm';
import { useCatalog } from '@/hooks/use-catalog';
import { useGrowthCategoryPreferences } from '@/hooks/use-growth-category-preferences';
import { calculateBudgetOverage } from '@gastify/core/opportunities/budgetOverage';
import { currentMxCarExample, JAPAN_LODGING_REFERENCE } from '@gastify/core/opportunities/illustrativePrices';
import { idOf } from '@gastify/core/categories/categoryForm';
import { findOverlappingSavingAccounts } from '@gastify/core/goals/progress';
import { useT } from '@/i18n/client';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';

type RangePreset = 'month' | 'quarter' | 'year' | 'custom';
const day = (value: Date): string => dateText(value);
const startFor = (preset: RangePreset, now: Date): Date => preset === 'month'
  ? new Date(now.getFullYear(), now.getMonth(), 1)
  : preset === 'quarter'
    ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    : new Date(now.getFullYear(), 0, 1);

export default function OpportunitiesScreen() {
  const t = useT();
  const { width: screenWidth } = useWindowDimensions();
  const scenarioCardWidth = Math.max(260, Math.min(340, screenWidth - 52));
  const currency = usePrimaryCurrency();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const transactionState = useSelector((state: RootState) => state.transacctionsReducer);
  const storedBudgets = useSelector((state: RootState) => state.budgetReducer.data);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const { categories, subCategories } = useCatalog();
  const growthPreferences = useGrowthCategoryPreferences();
  const { refresh, refreshing } = useRefreshAppData();
  const [preset, setPreset] = useState<RangePreset>('year');
  const [dimension, setDimension] = useState<OpportunityDimension>('all');
  const [selectedId, setSelectedId] = useState('');
  const [concept, setConcept] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [overageSelected, setOverageSelected] = useState(false);
  const [customStart, setCustomStart] = useState(() => day(startFor('year', new Date())));
  const [customEnd, setCustomEnd] = useState(() => day(new Date()));
  const [shareInput, setShareInput] = useState('10');
  const share = Math.min(100, Math.max(0, Number(shareInput) || 0));
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('1');
  const [travelTarget, setTravelTarget] = useState('260000');
  const [showMovements, setShowMovements] = useState(false);
  const [movementLimit, setMovementLimit] = useState(12);
  const now = useMemo(() => new Date(), []);
  const range = useMemo(() => {
    const startDate = preset === 'custom' ? customStart : day(startFor(preset, now));
    const endDate = preset === 'custom' ? customEnd : day(now);
    const [first, last] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    return { startDate: first, endDate: last, complete: transactionState.historyStatus === 'complete' };
  }, [preset, now, customStart, customEnd, transactionState.historyStatus]);
  const filters = useMemo(() => ({
    includeAllExpenses: dimension === 'all',
    categoryIds: dimension === 'category' && selectedId ? [selectedId] : [],
    subCategoryIds: dimension === 'subcategory' && selectedId ? [selectedId] : [],
    tagIds: dimension === 'tag' && selectedId ? [selectedId] : [],
    conceptQuery: dimension === 'concept' ? concept.trim() : '',
    primaryCurrency: currency,
  }), [dimension, selectedId, concept, currency]);
  const regularScan = useMemo(() => scanOpportunityTransactions(transactionState.data as TransactionData[] as never, filters, range), [transactionState.data, filters, range]);
  const allSpendMinor = useMemo(() => scanOpportunityTransactions(transactionState.data as TransactionData[] as never, { includeAllExpenses: true, primaryCurrency: currency }, range).amountMinor, [transactionState.data, currency, range]);
  const featuredCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of transactionState.data as TransactionData[]) {
      const date = tx.date ? new Date(tx.date as Date | string) : null;
      if (!date || Number.isNaN(date.getTime()) || day(date) < range.startDate || day(date) > range.endDate || (tx.state && tx.state !== 'completed') || (tx.kind || (tx.isBill ? 'expense' : 'income')) !== 'expense') continue;
      const id = idOf(tx.category);
      const money = resolveOpportunityMoney(tx, currency);
      if (id && money?.currency === currency) totals.set(id, (totals.get(id) || 0) + Math.abs(money.amountMinor));
    }
    const top = [...totals].sort((a, b) => b[1] - a[1])[0];
    const category = top ? categories.find((item) => idOf(item) === top[0]) : null;
    return category && top ? { id: top[0], name: category.name || '', amountMinor: top[1] } : null;
  }, [transactionState.data, range, currency, categories]);
  const allSourceShare = !advanced && !overageSelected && dimension === 'all' ? share : 10;
  const featuredSourceShare = !advanced && !overageSelected && dimension === 'category' && selectedId === featuredCategory?.id ? share : 10;
  const fxRates = useRatesToPrimary([...storedBudgets.map((item) => item.currency), ...accounts.map((item) => item.currency)], currency);
  const convertedBudgets = convertBudgetsToPrimary(storedBudgets, currency, fxRates);
  const budgetOverage = calculateBudgetOverage({ transactions: transactionState.data as TransactionData[], budgets: convertedBudgets, range, currency });
  const scan = overageSelected ? { ...regularScan, amountMinor: budgetOverage.amountMinor, refundMinor: 0, feeMinor: 0, missingFxCount: budgetOverage.missingFxCount, unmatchedRefundCount: 0, count: new Set(budgetOverage.cycles.flatMap((cycle) => cycle.transactionIds)).size, transactionIds: [...new Set(budgetOverage.cycles.flatMap((cycle) => cycle.transactionIds))] } : regularScan;
  const preferredCategories = growthPreferences.preferences.map((preference) => ({ ...preference, category: categories.find((item) => idOf(item) === preference.categoryId), amountMinor: scanOpportunityTransactions(transactionState.data as TransactionData[] as never, { categoryIds: [preference.categoryId], primaryCurrency: currency }, range).amountMinor })).filter((item) => item.category && item.amountMinor > 0).sort((a, b) => b.amountMinor * b.reductionPercent - a.amountMinor * a.reductionPercent).slice(0, 2);
  const tagOptions = useMemo<ChipItem[]>(() => {
    const tags = new Map<string, string>();
    for (const transaction of transactionState.data as TransactionData[]) for (const tag of transaction.tags || []) {
      const id = idOf(tag);
      const name = typeof tag === 'object' && tag !== null && 'name' in tag ? String(tag.name || '') : '';
      if (id && name) tags.set(id, name);
    }
    return [...tags].map(([id, label]) => ({ id, label: '#' + label }));
  }, [transactionState.data]);
  const dimensionItems: ChipItem[] = dimension === 'category'
    ? categories.map((item) => ({ id: idOf(item), label: item.name || t('opportunities.category'), icon: item.icon, color: item.color }))
    : dimension === 'subcategory'
      ? subCategories.map((item) => ({ id: idOf(item), label: item.name || t('opportunities.subcategory'), icon: item.icon, color: item.color }))
      : dimension === 'tag' ? tagOptions : [];
  const primaryPrincipalMinor = opportunityPrincipal(scan.amountMinor, share / 100) || 0;
  const principal = minorToMajor(primaryPrincipalMinor, currency);
  const goals = convertBudgetsToPrimary(storedBudgets.filter((item) => !item.archived && isSavingBudget(item) && item.goalDetails?.status === 'active'), currency, fxRates);
  const fundingConflicts = findOverlappingSavingAccounts(storedBudgets.filter((budget) => !budget.archived && isSavingBudget(budget)).map((goal) => ({ id: idOf(goal), name: goal.name, linkedAccountIds: (goal.linkedAccounts || []).map(idOf).filter(Boolean) })));
  const selectedGoal = goals[0];
  const linkedIds = (selectedGoal?.linkedAccounts || []).map(idOf);
  const linked = accounts.filter((item) => linkedIds.includes(idOf(item)));
  const linkedGoalTotal = linkedIds.length ? totalInPrimary(linked, currency, fxRates) : null;
  const missingGoalAccounts = linkedIds.filter((id) => !linked.some((item) => idOf(item) === id));
  const goalFundingConflict = selectedGoal ? fundingConflicts.get(idOf(selectedGoal)) : undefined;
  const goalFundingIncomplete = Boolean(selectedGoal && (selectedGoal.conversionUnavailable || goalFundingConflict?.accountIds.length || missingGoalAccounts.length || linkedGoalTotal?.missingCurrencies.length));
  const currentSaved = selectedGoal ? linkedGoalTotal?.total ?? Math.max(0, Number(selectedGoal.savingAmount) || 0) : 0;
  const goalTarget = selectedGoal ? Math.max(0, Number(selectedGoal.goalAmount) || 0) : 0;
  const comparison = selectedGoal && !goalFundingIncomplete ? compareOpportunityWithGoal({ expenseMinor: scan.amountMinor, percent: share / 100, targetMinor: majorToMinor(goalTarget, currency), savedMinor: majorToMinor(currentSaved, currency) }) : null;
  const annualRate = Math.min(1, Math.max(-0.99, Number(rate || 0) / 100));
  const horizon = Math.max(0, Math.min(60, Number(years || 0)));
  const projection = projectSingleDeposit({ principalMinor: primaryPrincipalMinor, currency, annualEffectiveRate: annualRate, years: horizon, asOf: day(now) });
  const transactionIds = new Set(scan.transactionIds);
  const expenses = (overageSelected ? [] : transactionState.data as TransactionData[]).filter((item) => transactionIds.has(idOf(item)) && (item.kind || (item.isBill ? 'expense' : 'income')) === 'expense' && item.date).flatMap((item) => {
    const money = resolveOpportunityMoney(item, currency);
    if (!money) return [];
    const date = new Date(item.date as Date | string);
    return [{ amountMinor: Math.round(Math.abs(money.amountMinor) * share / 100), date: Number.isNaN(date.getTime()) ? '' : day(date) }];
  }).filter((item) => item.amountMinor > 0 && item.date);
  const datedProjection = projectDatedExpenses({ expenses, currency, annualEffectiveRate: annualRate, asOf: day(now) });
  const historicalLoaded = transactionState.historyStatus === 'complete';
  const carExample = currentMxCarExample(day(now), currency);
  const matchedTransactions = (transactionState.data as TransactionData[]).filter((item) => transactionIds.has(idOf(item))).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const dimensionOptions: ChipItem[] = [
    { id: 'all', label: t('opportunities.allExpenses') },
    { id: 'category', label: t('opportunities.category') },
    { id: 'subcategory', label: t('opportunities.subcategory') },
    { id: 'tag', label: t('opportunities.tag') },
    { id: 'concept', label: t('opportunities.concept') },
  ];
  const presets: { id: RangePreset; label: string }[] = [{ id: 'month', label: t('opportunities.preset.month') }, { id: 'quarter', label: t('opportunities.preset.quarter') }, { id: 'year', label: t('opportunities.preset.year') }, { id: 'custom', label: t('opportunities.preset.custom') }];

  return (
    <Screen title={t('opportunities.title')} subtitle={t('opportunities.subtitle')} refreshing={refreshing} onRefresh={refresh}>
      {!historicalLoaded && <Card><Text className="font-inter text-sm leading-5 text-amber-200">{t('opportunities.partial')}</Text></Card>}
      <Card title={t('opportunities.range')}>
        <ChipPicker items={presets} value={preset} onChange={(value) => setPreset(value as RangePreset)} moreAfter={3} />
        <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.del.p1.al.p2', { p1: range.startDate, p2: range.endDate })}</Text>
        {preset === 'custom' && <View className="gap-3"><DateField label={t('mobile.desde')} value={customStart} onChange={setCustomStart} /><DateField label={t('mobile.hasta')} value={customEnd} onChange={setCustomEnd} /></View>}
        <Text className="font-inter text-xs leading-5 text-gf-text-muted">{preset === 'year' ? t('opportunities.periodYtd') : t('opportunities.periodCurrent')}</Text>
      </Card>
      <Card title={t('opportunities.sourceHeading')}>
        <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.simpleIntro')}</Text>
        <Pressable accessibilityRole="button" onPress={() => { setAdvanced((value) => !value); setOverageSelected(false); }} className="self-start rounded-full border border-gf-border px-3 py-2"><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{advanced ? t('opportunities.simple') : t('opportunities.advanced')}</Text></Pressable>
        {!advanced && <View className="gap-2">
          {preferredCategories.map((item) => <Pressable key={item.categoryId} accessibilityRole="button" accessibilityState={{ selected: !overageSelected && dimension === 'category' && selectedId === item.categoryId }} onPress={() => { setOverageSelected(false); setDimension('category'); setSelectedId(item.categoryId); setShareInput(String(item.reductionPercent)); }} className="rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.preferredSource', { p1: item.category?.name || '' })}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.sourceAmount', { p1: formatMoneyMinor(item.amountMinor, currency), p2: formatMoneyMinor(opportunityPrincipal(item.amountMinor, item.reductionPercent / 100) || 0, currency), p3: item.reductionPercent + '%' })}</Text></Pressable>)}
          <Pressable accessibilityRole="button" accessibilityState={{ selected: !overageSelected && dimension === 'all' }} onPress={() => { setOverageSelected(false); setDimension('all'); setSelectedId(''); setShareInput('10'); }} className="rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.sourceAll')}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.sourceAmount', { p1: formatMoneyMinor(allSpendMinor, currency), p2: formatMoneyMinor(opportunityPrincipal(allSpendMinor, allSourceShare / 100) || 0, currency), p3: allSourceShare + '%' })}</Text></Pressable>
          {budgetOverage.amountMinor > 0 && <Pressable accessibilityRole="button" accessibilityState={{ selected: overageSelected }} onPress={() => { setOverageSelected(true); setShareInput('100'); }} className="rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.sourceOverage')}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.overageAmount', { p1: formatMoneyMinor(budgetOverage.amountMinor, currency), p2: budgetOverage.cycles.length })}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.overageNote')}</Text></Pressable>}
          {featuredCategory && <Pressable accessibilityRole="button" accessibilityState={{ selected: !overageSelected && dimension === 'category' && selectedId === featuredCategory.id }} onPress={() => { setOverageSelected(false); setDimension('category'); setSelectedId(featuredCategory.id); setShareInput('10'); }} className="rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.sourceCategory', { p1: featuredCategory.name })}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.sourceAmount', { p1: formatMoneyMinor(featuredCategory.amountMinor, currency), p2: formatMoneyMinor(opportunityPrincipal(featuredCategory.amountMinor, featuredSourceShare / 100) || 0, currency), p3: featuredSourceShare + '%' })}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.sourceCategoryNote')}</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={() => router.push('/more/categories')} className="rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('opportunities.managePreferences')} →</Text></Pressable>
        </View>}
      </Card>
      <Card title={advanced ? t('opportunities.dimension') : t('opportunities.observedTotal')}>
        {advanced && <>
        <ChipPicker items={dimensionOptions} value={dimension} onChange={(value) => { setDimension(value as OpportunityDimension); setSelectedId(''); }} title={t('opportunities.dimension')} moreAfter={3} />
        {dimension === 'category' || dimension === 'subcategory' || dimension === 'tag'
          ? <ChipPicker items={dimensionItems} value={selectedId} onChange={setSelectedId} title={t('opportunities.select')} moreAfter={4} />
          : dimension === 'concept'
            ? <TextField label={t('opportunities.concept')} value={concept} onChangeText={setConcept} placeholder={t('opportunities.search')} />
            : <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.allExpensesHelp')}</Text>}
        </>}
        <View className="flex-row items-end justify-between gap-2"><View><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.selectedSpend')}</Text><Text className="mt-1 font-inter-bold text-2xl text-gf-text">{formatMoneyMajor(minorToMajor(scan.amountMinor, currency), currency)}</Text></View><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.count', { p1: scan.count })}</Text></View>
        {overageSelected && <View className="gap-2 rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.overageBreakdown')}</Text><Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.overageBreakdownHelp')}</Text>{budgetOverage.cycles.map((cycle) => <View key={cycle.key} className="border-t border-gf-border pt-2"><Text className="font-inter-semibold text-sm text-gf-text">{cycle.name || t('budgets.kind.spending')} · +{formatMoneyMinor(cycle.overageMinor, currency)}</Text><Text className="font-inter text-xs text-gf-text-muted">{cycle.periodStart} – {cycle.periodEnd} · {t('opportunities.overageSpentAndLimit', { p1: formatMoneyMinor(cycle.spentMinor, currency), p2: formatMoneyMinor(cycle.limitMinor, currency) })}</Text></View>)}{budgetOverage.conflictCount > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.overageConflicts', { p1: budgetOverage.conflictCount })}</Text>}</View>}
        {scan.refundMinor > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.refunds', { p1: scan.unmatchedRefundCount })} · {formatMoneyMajor(minorToMajor(scan.refundMinor, currency), currency)}</Text>}
        {scan.feeMinor > 0 && <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.fees', { p1: formatMoneyMajor(minorToMajor(scan.feeMinor, currency), currency) })}</Text>}
        {scan.missingFxCount > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.exclude', { p1: scan.missingFxCount })}</Text>}
        {scan.staleFxCount > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.staleFx', { p1: scan.staleFxCount })}</Text>}
        {scan.count > 0 && <View className="gap-2 rounded-2xl border border-gf-border p-3">
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMovements }} onPress={() => setShowMovements((value) => !value)} className="flex-row items-center justify-between"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.movements', { p1: scan.count })}</Text><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{showMovements ? '−' : '+'}</Text></Pressable>
          {showMovements && <View className="gap-2">
            {overageSelected && <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.overageMovementsNote')}</Text>}
            {matchedTransactions.slice(0, movementLimit).map((item) => {
              const money = resolveOpportunityMoney(item, currency);
              const categoryName = typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String(item.category.name || '') : t('history.noCategory');
              const date = item.date ? new Date(item.date as Date | string) : null;
              return <View key={idOf(item)} className="flex-row items-center justify-between gap-3 border-t border-gf-border pt-2"><View className="min-w-0 flex-1"><Text numberOfLines={1} className="font-inter-semibold text-sm text-gf-text">{item.name || t('opportunities.concept')}</Text><Text className="font-inter text-xs text-gf-text-muted">{categoryName}{date && !Number.isNaN(date.getTime()) ? ' · ' + date.toLocaleDateString() : ''}</Text></View><Text className="font-inter-medium text-xs text-gf-text">{money && money.currency === currency ? formatMoneyMinor(money.amountMinor, currency) : '—'}</Text></View>;
            })}
            {matchedTransactions.length > movementLimit && <Pressable accessibilityRole="button" onPress={() => setMovementLimit((current) => Math.min(current + 12, matchedTransactions.length))}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('opportunities.showMore', { p1: Math.min(12, matchedTransactions.length - movementLimit) })}</Text></Pressable>}
          </View>}
        </View>}
      </Card>
      <Card title={t('opportunities.threeExamples')}>
        <TextField label={t('opportunities.customShare')} value={shareInput} onChangeText={setShareInput} keyboardType="number-pad" />
        <View className="flex-row gap-2">{(advanced || overageSelected ? [10, 25, 50, 100] : [5, 10]).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: share === value }} onPress={() => setShareInput(String(value))} className="flex-1 items-center rounded-xl border border-gf-border py-2"><Text className="font-inter-semibold text-sm" style={{ color: share === value ? colors.accent : colors.text }}>{value}%</Text></Pressable>)}</View>
        <Text className="font-inter text-sm text-gf-text">{t('opportunities.sameMoney')}: <Text className="font-inter-bold">{formatMoneyMajor(principal, currency)}</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={scenarioCardWidth + 12} snapToAlignment="start" contentContainerClassName="gap-3 pb-2">
          <View style={{ width: scenarioCardWidth }} className="min-h-[300px] gap-3 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter-semibold text-base text-gf-text">{t('opportunities.investment')}</Text>
            <View className="flex-row gap-3"><TextField label={t('opportunities.rate')} value={rate} onChangeText={setRate} keyboardType="decimal-pad" /><TextField label={t('opportunities.horizon')} value={years} onChangeText={setYears} keyboardType="decimal-pad" /></View>
            <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.todayModel')}: {formatMoneyMajor(minorToMajor(projection?.valueMinor || 0, currency), currency)}{!overageSelected && ` · ${t('opportunities.historyModel')}: ${formatMoneyMajor(minorToMajor(datedProjection?.valueMinor || 0, currency), currency)}`}</Text>
            <Text className="mt-auto font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.noGuarantee')}</Text>
          </View>
          <View style={{ width: scenarioCardWidth }} className="min-h-[300px] gap-3 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter-semibold text-base text-gf-text">{t('opportunities.travel')}</Text>
            <TextField label={t('opportunities.exampleGoal')} value={travelTarget} onChangeText={setTravelTarget} keyboardType="decimal-pad" />
            <Text className="font-inter text-sm text-gf-text">{formatMoneyMajor(principal, currency)} · {Number(travelTarget) > 0 ? Math.min(100, principal / Number(travelTarget) * 100).toFixed(1) : '0'}% {t('opportunities.goalCoverage')}</Text>
            <ProgressBar ratio={Number(travelTarget) > 0 ? Math.min(1, principal / Number(travelTarget)) : 0} color={colors.accent} />
            <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.japanLodgingReference', { p1: formatMoneyMajor(JAPAN_LODGING_REFERENCE.budgetHotelJpyPerNight * JAPAN_LODGING_REFERENCE.nights, 'JPY') })}</Text>
            <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(JAPAN_LODGING_REFERENCE.sourceUrl); }}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('opportunities.sourceLink')}</Text></Pressable>
          </View>
          <View style={{ width: scenarioCardWidth }} className="min-h-[300px] gap-3 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter-semibold text-base text-gf-text">{t('opportunities.downPayment')}</Text>
            {goalFundingIncomplete && <Text className="font-inter text-xs leading-5 text-amber-300">{goalFundingConflict?.accountIds.length ? t('goals.sharedAccounts', { p1: goalFundingConflict.otherNames.join(', ') }) : missingGoalAccounts.length ? t('goals.missingAccounts') : t('goals.partialFx')}</Text>}
            {selectedGoal && comparison ? <><Text className="font-inter text-sm text-gf-text">{selectedGoal.name}: {formatMoneyMajor(currentSaved, currency)} + {formatMoneyMajor(minorToMajor(comparison.principalMinor, currency), currency)} = {formatMoneyMajor(minorToMajor(comparison.simulatedSavedMinor, currency), currency)}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.goalProgress', { p1: `${(comparison.targetCoverage * 100).toFixed(1)}%` })}</Text></> : !goalFundingIncomplete && <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.noPersonalGoal')}</Text>}
            <Pressable accessibilityRole="button" onPress={() => router.push('/budgets/goals')} className="mt-auto"><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t('opportunities.addGoal')} →</Text></Pressable>
          </View>
        </ScrollView>
        {carExample && <Card title={t('opportunities.carExampleTitle')}><Text className="font-inter text-sm text-gf-text">{carExample.model}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.carListPrice', { p1: formatMoneyMajor(carExample.listPriceMxn, 'MXN') })}</Text><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.carIllustrativeDeposit', { p1: formatMoneyMajor(carExample.listPriceMxn * carExample.exampleDepositFraction, 'MXN') })}</Text><Text className="font-inter-bold text-lg text-gf-text">{Math.min(100, principal / (carExample.listPriceMxn * carExample.exampleDepositFraction) * 100).toFixed(1)}% {t('opportunities.goalCoverage')}</Text><Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.carSourceNote', { p1: carExample.checkedOn })}</Text><Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(carExample.sourceUrl); }}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('opportunities.sourceLink')}</Text></Pressable></Card>}
        <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.hypothetical')}</Text>
      </Card>
    </Screen>
  );
}
