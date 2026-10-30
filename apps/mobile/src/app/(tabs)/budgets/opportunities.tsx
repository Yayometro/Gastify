import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { DateField } from '@/components/date-field';
import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TextField } from '@/components/ui/text-field';
import { TourTarget } from '@/components/tour/tour-target';
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
import { projectSingleDeposit } from '@gastify/core/opportunities/investment';
import { affordability, carAffordability, DOWN_PAYMENT_FRACTION, ILLUSTRATIVE_REFERENCE_YEAR, ILLUSTRATIVE_TRIPS, suggestWasteCategories, type IllustrativeItem } from '@gastify/core/opportunities/story';
import type { OpportunityDimension } from '@gastify/core/opportunities/types';
import { isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { dateText } from '@gastify/core/transactions/movementForm';
import { useCatalog } from '@/hooks/use-catalog';
import { useGrowthCategoryPreferences } from '@/hooks/use-growth-category-preferences';
import { calculateBudgetOverage } from '@gastify/core/opportunities/budgetOverage';
import { idOf } from '@gastify/core/categories/categoryForm';
import { findOverlappingSavingAccounts } from '@gastify/core/goals/progress';
import { useInfo, useT } from '@/i18n/client';
import type { InfoText } from '@gastify/core/info/createInfo';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';

type RangePreset = 'month' | 'quarter' | 'year' | 'custom';
type SourceId = 'all' | 'overage' | `cat:${string}`;
const day = (value: Date): string => dateText(value);
const startFor = (preset: RangePreset, now: Date): Date => preset === 'month'
  ? new Date(now.getFullYear(), now.getMonth(), 1)
  : preset === 'quarter'
    ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    : new Date(now.getFullYear(), 0, 1);
// What was typed in a number box: empty is nothing (never a forced 0); the comma counts as a decimal point.
const typed = (value: string): number | null => {
  const text = value.trim().replace(',', '.');
  if (text === '') return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
};
const numeric = (text: string): string => text.replace(/[^0-9.,]/g, '');

// "Growth opportunities" on the phone: the simple view prepares where the money comes from and shows, in four rows, what it
// could have been; the advanced mode keeps every filter. The numbers come from core, the same as the web.
export default function OpportunitiesScreen() {
  const t = useT();
  const { APP_INFO: INFO } = useInfo();
  const info = (key: string): InfoText => (INFO as unknown as Record<string, InfoText>)[key];
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
  const [advanced, setAdvanced] = useState(false);
  const [source, setSource] = useState<SourceId>('all');
  const [dimension, setDimension] = useState<OpportunityDimension>('all');
  const [selectedId, setSelectedId] = useState('');
  const [concept, setConcept] = useState('');
  const [customStart, setCustomStart] = useState(() => day(startFor('year', new Date())));
  const [customEnd, setCustomEnd] = useState(() => day(new Date()));
  const [shareInput, setShareInput] = useState('10');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('1');
  const [tripInput, setTripInput] = useState('');
  const [showMovements, setShowMovements] = useState(false);
  const [movementLimit, setMovementLimit] = useState(12);
  const now = useMemo(() => new Date(), []);
  const transactions = transactionState.data as TransactionData[];
  const isMxn = currency === 'MXN';
  const range = useMemo(() => {
    const startDate = preset === 'custom' ? customStart : day(startFor(preset, now));
    const endDate = preset === 'custom' ? customEnd : day(now);
    const [first, last] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    return { startDate: first, endDate: last, complete: transactionState.historyStatus === 'complete' };
  }, [preset, now, customStart, customEnd, transactionState.historyStatus]);

  const fxRates = useRatesToPrimary([...storedBudgets.map((item) => item.currency), ...accounts.map((item) => item.currency)], currency);
  const convertedBudgets = convertBudgetsToPrimary(storedBudgets, currency, fxRates);
  const budgetOverage = calculateBudgetOverage({ transactions, budgets: convertedBudgets, range, currency });

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of transactions) {
      const date = tx.date ? new Date(tx.date as Date | string) : null;
      if (!date || Number.isNaN(date.getTime()) || day(date) < range.startDate || day(date) > range.endDate || (tx.state && tx.state !== 'completed') || (tx.kind || (tx.isBill ? 'expense' : 'income')) !== 'expense') continue;
      const id = idOf(tx.category);
      const money = resolveOpportunityMoney(tx, currency);
      if (id && money?.currency === currency) totals.set(id, (totals.get(id) || 0) + Math.abs(money.amountMinor));
    }
    return totals;
  }, [transactions, range, currency]);
  const categoryNames = useMemo(() => new Map(categories.map((item) => [idOf(item), item.name || ''])), [categories]);
  const categorySources = useMemo(() => {
    const chosen = growthPreferences.preferences
      .map((preference) => ({ id: preference.categoryId, name: categoryNames.get(preference.categoryId) || '', amountMinor: categoryTotals.get(preference.categoryId) || 0, share: preference.reductionPercent, chosen: true, hint: '' }))
      .filter((item) => item.name && item.amountMinor > 0)
      .sort((a, b) => b.amountMinor * b.share - a.amountMinor * a.share)
      .slice(0, 2);
    if (chosen.length > 0) return chosen;
    return suggestWasteCategories([...categoryTotals].map(([id, amountMinor]) => ({ id, name: categoryNames.get(id) || '', amountMinor })).filter((row) => row.name)).map((item) => ({ id: item.id, name: item.name, amountMinor: item.amountMinor, share: 10, chosen: false, hint: item.kind as string }));
  }, [growthPreferences.preferences, categoryTotals, categoryNames]);

  const sourceCategoryId = !advanced && source.startsWith('cat:') ? source.slice(4) : '';
  const filters = useMemo(() => advanced ? {
    includeAllExpenses: dimension === 'all',
    categoryIds: dimension === 'category' && selectedId ? [selectedId] : [],
    subCategoryIds: dimension === 'subcategory' && selectedId ? [selectedId] : [],
    tagIds: dimension === 'tag' && selectedId ? [selectedId] : [],
    conceptQuery: dimension === 'concept' ? concept.trim() : '',
    primaryCurrency: currency,
  } : sourceCategoryId ? { categoryIds: [sourceCategoryId], primaryCurrency: currency } : { includeAllExpenses: true, primaryCurrency: currency }, [advanced, dimension, selectedId, concept, currency, sourceCategoryId]);
  const regularScan = useMemo(() => scanOpportunityTransactions(transactions as never, filters, range), [transactions, filters, range]);
  const allSpendMinor = useMemo(() => scanOpportunityTransactions(transactions as never, { includeAllExpenses: true, primaryCurrency: currency }, range).amountMinor, [transactions, currency, range]);
  const overageSelected = !advanced && source === 'overage';
  const scan = overageSelected ? { ...regularScan, amountMinor: budgetOverage.amountMinor, refundMinor: 0, feeMinor: 0, missingFxCount: budgetOverage.missingFxCount, unmatchedRefundCount: 0, count: new Set(budgetOverage.cycles.flatMap((cycle) => cycle.transactionIds)).size, transactionIds: [...new Set(budgetOverage.cycles.flatMap((cycle) => cycle.transactionIds))] } : regularScan;
  const share = overageSelected ? 100 : Math.min(100, Math.max(0, typed(shareInput) ?? 0));
  const principalMinor = opportunityPrincipal(scan.amountMinor, share / 100) ?? 0;
  const principal = minorToMajor(principalMinor, currency);
  const money = (value: number) => formatMoneyMajor(value, currency);
  const percent = (ratio: number): string => `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;

  // Your goal
  const goals = convertBudgetsToPrimary(storedBudgets.filter((item) => !item.archived && isSavingBudget(item) && (!item.goalDetails || item.goalDetails.status === 'active')), currency, fxRates);
  const fundingConflicts = findOverlappingSavingAccounts(storedBudgets.filter((budget) => !budget.archived && isSavingBudget(budget)).map((goal) => ({ id: idOf(goal), name: goal.name, linkedAccountIds: (goal.linkedAccounts || []).map(idOf).filter(Boolean) })));
  const selectedGoal = goals[0];
  const linkedIds = (selectedGoal?.linkedAccounts || []).map(idOf);
  const linked = accounts.filter((item) => linkedIds.includes(idOf(item)));
  const linkedGoalTotal = linkedIds.length ? totalInPrimary(linked, currency, fxRates) : null;
  const missingGoalAccounts = linkedIds.filter((id) => !linked.some((item) => idOf(item) === id));
  const goalFundingConflict = selectedGoal ? fundingConflicts.get(idOf(selectedGoal)) : undefined;
  const goalIncomplete = Boolean(selectedGoal && (selectedGoal.conversionUnavailable || goalFundingConflict?.accountIds.length || missingGoalAccounts.length || linkedGoalTotal?.missingCurrencies.length));
  const goalSaved = selectedGoal ? linkedGoalTotal?.total ?? Math.max(0, Number(selectedGoal.savingAmount) || 0) : 0;
  const goalTarget = selectedGoal ? Math.max(0, Number(selectedGoal.goalAmount) || 0) : 0;
  const comparison = selectedGoal && !goalIncomplete ? compareOpportunityWithGoal({ expenseMinor: scan.amountMinor, percent: share / 100, targetMinor: majorToMinor(goalTarget, currency), savedMinor: majorToMinor(goalSaved, currency) }) : null;

  // Investment
  const annualRate = Math.min(1, Math.max(-0.99, (typed(rate) ?? 12) / 100));
  const horizon = Math.max(0, Math.min(60, typed(years) ?? 1));
  const projection = projectSingleDeposit({ principalMinor, currency, annualEffectiveRate: annualRate, years: horizon, asOf: day(now) });
  const yearsText = horizon === 1 ? t('opportunities.row.investYearOne') : t('opportunities.row.investYearMany', { p1: String(horizon) });

  // Trip and car examples
  const itemName = (item: IllustrativeItem): string => t(`opportunities.item.${item.id}`, { p1: formatMoneyMajor(item.priceMxn, 'MXN') });
  const trips = isMxn ? affordability(principal, ILLUSTRATIVE_TRIPS) : null;
  const cars = isMxn ? carAffordability(principal) : null;
  const customTrip = typed(tripInput);

  const transactionIds = new Set(scan.transactionIds);
  const matchedTransactions = transactions.filter((item) => transactionIds.has(idOf(item))).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const tagOptions = useMemo<ChipItem[]>(() => {
    const tags = new Map<string, string>();
    for (const transaction of transactions) for (const tag of transaction.tags || []) {
      const id = idOf(tag);
      const name = typeof tag === 'object' && tag !== null && 'name' in tag ? String(tag.name || '') : '';
      if (id && name) tags.set(id, name);
    }
    return [...tags].map(([id, label]) => ({ id, label: '#' + label }));
  }, [transactions]);
  const dimensionItems: ChipItem[] = dimension === 'category'
    ? categories.map((item) => ({ id: idOf(item), label: item.name || t('opportunities.category'), icon: item.icon, color: item.color }))
    : dimension === 'subcategory'
      ? subCategories.map((item) => ({ id: idOf(item), label: item.name || t('opportunities.subcategory'), icon: item.icon, color: item.color }))
      : dimension === 'tag' ? tagOptions : [];
  const dimensionOptions: ChipItem[] = [
    { id: 'all', label: t('opportunities.adv.byAll') },
    { id: 'category', label: t('opportunities.category') },
    { id: 'subcategory', label: t('opportunities.subcategory') },
    { id: 'tag', label: t('opportunities.tag') },
    { id: 'concept', label: t('opportunities.concept') },
  ];
  const presets: { id: RangePreset; label: string }[] = [{ id: 'month', label: t('opportunities.preset.month') }, { id: 'quarter', label: t('opportunities.preset.quarter') }, { id: 'year', label: t('opportunities.preset.year') }, { id: 'custom', label: t('opportunities.preset.custom') }];
  const periodText = preset === 'custom' ? t('opportunities.period.custom', { p1: range.startDate, p2: range.endDate }) : t(`opportunities.period.${preset}`);
  const pick = (id: SourceId, defaultShare: string) => { setSource(id); setShareInput(defaultShare); };

  const sourceRow = (key: string, active: boolean, onPress: () => void, title: string, line: string, ratio: number, barColor: string, extra?: string, disabled = false) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={onPress} className="gap-1.5 rounded-2xl border p-3.5" style={{ borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentSoft : 'transparent', opacity: disabled ? 0.6 : 1 }}>
      <Text className="font-inter-semibold text-sm text-gf-text">{title}</Text>
      <Text className="font-inter text-xs leading-4 text-gf-text-muted">{line}</Text>
      {extra ? <Text className="font-inter text-[11px] text-gf-text-muted">{extra}</Text> : null}
      {!disabled && <ProgressBar ratio={ratio} color={barColor} />}
    </Pressable>
  );
  const resultCard = (tourId: string, title: string, info: Parameters<typeof InfoTip>[0]['info'], children: React.ReactNode) => (
    <TourTarget id={tourId}>
      <View className="gap-2 rounded-2xl border border-gf-border p-3.5">
        <View className="flex-row items-center gap-2"><Text className="font-inter-semibold text-base text-gf-text">{title}</Text><InfoTip info={info} /></View>
        {children}
      </View>
    </TourTarget>
  );

  return (
    <Screen tutorial="m-opportunities" title={t('opportunities.title')} titleInfo={info('oportunidades_de_crecimiento')} subtitle={t('opportunities.subtitle')} refreshing={refreshing} onRefresh={refresh}>
      {!transactionState.historyStatus || transactionState.historyStatus !== 'complete' ? <Card><Text className="font-inter text-sm leading-5 text-amber-200">{t('opportunities.partial')}</Text></Card> : null}
      <TourTarget id="m-opp-lead">
        <Card>
          <Text className="font-inter text-sm leading-5 text-gf-text">{t('opportunities.lead')}</Text>
          <Text className="font-inter-semibold text-base text-gf-text">{periodText}</Text>
          <ChipPicker items={presets} value={preset} onChange={(value) => setPreset(value as RangePreset)} moreAfter={4} />
          {preset === 'custom' && <View className="gap-3"><DateField label={t('mobile.desde')} value={customStart} onChange={setCustomStart} /><DateField label={t('mobile.hasta')} value={customEnd} onChange={setCustomEnd} /></View>}
        </Card>
      </TourTarget>

      {!advanced ? (
        <TourTarget id="m-opp-sources">
          <Card title={t('opportunities.src.title')} info={info('fuentes_de_oportunidad')}>
            <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.src.sub')}</Text>
            <View className="gap-2.5">
              {sourceRow('all', source === 'all', () => pick('all', '10'), t('opportunities.src.allTitle'), t('opportunities.src.allLine', { p1: `${source === 'all' ? share : 10}%`, p2: formatMoneyMinor(allSpendMinor, currency), p3: formatMoneyMinor(opportunityPrincipal(allSpendMinor, (source === 'all' ? share : 10) / 100) || 0, currency) }), (source === 'all' ? share : 10) / 100, '#22d3ee')}
              {sourceRow('overage', source === 'overage', () => pick('overage', '100'), t('opportunities.src.overageTitle'), budgetOverage.amountMinor > 0 ? t('opportunities.src.overageLine', { p1: formatMoneyMinor(budgetOverage.amountMinor, currency), p2: budgetOverage.cycles.length }) : t('opportunities.src.overageNone'), 1, '#fb7185', undefined, budgetOverage.amountMinor <= 0)}
              {categorySources.map((item) => {
                const active = source === `cat:${item.id}`;
                const shown = active ? share : item.share;
                return sourceRow(item.id, active, () => pick(`cat:${item.id}` as SourceId, String(item.share)), t(item.chosen ? 'opportunities.src.yourCategory' : 'opportunities.src.suggested', { p1: item.name }), t('opportunities.src.categoryLine', { p1: formatMoneyMinor(item.amountMinor, currency), p2: `${shown}%`, p3: formatMoneyMinor(opportunityPrincipal(item.amountMinor, shown / 100) || 0, currency) }), shown / 100, '#fbbf24', !item.chosen && item.hint ? t(`opportunities.src.hint.${item.hint}`) : undefined);
              })}
              <Pressable accessibilityRole="button" onPress={() => router.push('/more/categories')} className="items-center rounded-xl border border-dashed border-gf-border p-2.5"><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('opportunities.src.manage')} →</Text></Pressable>
            </View>
          </Card>
        </TourTarget>
      ) : (
        <TourTarget id="m-opp-advanced">
          <Card title={t('opportunities.adv.title')} info={info('modo_avanzado_oportunidades')}>
            <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.adv.intro')}</Text>
            <View className="flex-row items-center gap-1.5"><Text className="font-inter-medium text-sm text-gf-text-muted">{t('opportunities.dimension')}</Text><InfoTip info={info('filtros_de_oportunidades')} /></View>
            <ChipPicker items={dimensionOptions} value={dimension} onChange={(value) => { setDimension(value as OpportunityDimension); setSelectedId(''); }} title={t('opportunities.dimension')} moreAfter={3} />
            {dimension === 'category' || dimension === 'subcategory' || dimension === 'tag'
              ? <ChipPicker items={dimensionItems} value={selectedId} onChange={setSelectedId} title={t('opportunities.adv.pick')} moreAfter={4} />
              : dimension === 'concept'
                ? <TextField label={t('opportunities.adv.concept')} value={concept} onChangeText={setConcept} placeholder={t('opportunities.search')} />
                : null}
          </Card>
        </TourTarget>
      )}

      <TourTarget id="m-opp-share">
        <Card>
          <View className="flex-row items-end justify-between gap-2"><View><Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{advanced ? t('opportunities.adv.total') : t('opportunities.base.observed')}</Text><Text className="mt-1 font-inter-bold text-2xl text-gf-text">{formatMoneyMinor(scan.amountMinor, currency)}</Text></View><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.count', { p1: scan.count })}</Text></View>
          {!overageSelected && <>
            <View className="flex-row items-center gap-1.5"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.share.label')}</Text><InfoTip info={info('parte_del_gasto')} /></View>
            <View className="flex-row flex-wrap items-center gap-2">
              {(advanced ? [10, 25, 50, 100] : [5, 10]).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: share === value }} onPress={() => setShareInput(String(value))} className="rounded-full border px-4 py-2" style={{ borderColor: share === value ? colors.accent : colors.border, backgroundColor: share === value ? colors.accentSoft : 'transparent' }}><Text className="font-inter-bold text-sm text-gf-text">{value}%</Text></Pressable>)}
            </View>
            <TextField label={t('opportunities.share.other')} value={shareInput} onChangeText={(text) => setShareInput(numeric(text))} keyboardType="decimal-pad" placeholder="10" />
          </>}
          <View className="flex-row items-center justify-between border-t border-gf-border pt-3"><Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.base.title')}</Text><Text className="font-inter-bold text-xl" style={{ color: colors.accent }}>{money(principal)}</Text></View>
          <Text className="font-inter text-[11px] text-gf-text-muted">{t('opportunities.base.hint')}</Text>
          {scan.count === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t('opportunities.noSpend')}</Text>}
          {scan.refundMinor > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.refunds', { p1: scan.unmatchedRefundCount })} · {formatMoneyMajor(minorToMajor(scan.refundMinor, currency), currency)}</Text>}
          {scan.feeMinor > 0 && <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.fees', { p1: formatMoneyMajor(minorToMajor(scan.feeMinor, currency), currency) })}</Text>}
          {scan.missingFxCount > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.exclude', { p1: scan.missingFxCount })}</Text>}
          {scan.staleFxCount > 0 && <Text className="font-inter text-xs text-amber-200">{t('opportunities.staleFx', { p1: scan.staleFxCount })}</Text>}
          {overageSelected && budgetOverage.cycles.length > 0 && <View className="gap-2 rounded-xl border border-gf-border p-3"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.overageBreakdown')}</Text><Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('opportunities.overageBreakdownHelp')}</Text>{budgetOverage.cycles.map((cycle) => <View key={cycle.key} className="border-t border-gf-border pt-2"><View className="flex-row justify-between gap-2"><Text className="flex-1 font-inter-semibold text-xs text-gf-text">{cycle.name || t('budgets.kind.spending')}</Text><Text className="font-inter-semibold text-xs text-red-300">+{formatMoneyMinor(cycle.overageMinor, currency)}</Text></View><Text className="font-inter text-[11px] text-gf-text-muted">{cycle.periodStart} – {cycle.periodEnd} · {t('opportunities.overageSpentAndLimit', { p1: formatMoneyMinor(cycle.spentMinor, currency), p2: formatMoneyMinor(cycle.limitMinor, currency) })}</Text></View>)}</View>}
          {scan.count > 0 && <View className="gap-2 rounded-2xl border border-gf-border p-3">
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMovements }} onPress={() => setShowMovements((value) => !value)} className="flex-row items-center justify-between"><Text className="font-inter-semibold text-sm text-gf-text">{t('opportunities.movements', { p1: scan.count })}</Text><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{showMovements ? '−' : '+'}</Text></Pressable>
            {showMovements && <View className="gap-2">
              {overageSelected && <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.overageMovementsNote')}</Text>}
              {matchedTransactions.slice(0, movementLimit).map((item) => {
                const amount = resolveOpportunityMoney(item, currency);
                const categoryName = typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String(item.category.name || '') : t('history.noCategory');
                return <View key={idOf(item)} className="flex-row items-center justify-between gap-3 border-t border-gf-border pt-2"><View className="min-w-0 flex-1"><Text numberOfLines={1} className="font-inter-semibold text-sm text-gf-text">{item.name || t('opportunities.concept')}</Text><Text className="font-inter text-xs text-gf-text-muted">{categoryName}</Text></View><Text className="font-inter-semibold text-sm text-gf-text">{amount && amount.currency === currency ? formatMoneyMinor(amount.amountMinor, currency) : '—'}</Text></View>;
              })}
              {matchedTransactions.length > movementLimit && <Pressable accessibilityRole="button" onPress={() => setMovementLimit((current) => Math.min(current + 12, matchedTransactions.length))}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('opportunities.showMore', { p1: Math.min(12, matchedTransactions.length - movementLimit) })}</Text></Pressable>}
            </View>}
          </View>}
        </Card>
      </TourTarget>

      <TourTarget id="m-opp-results">
        <Card title={t('opportunities.right.title', { p1: money(principal) })} info={info('tres_alternativas_de_ese_monto')}>
          <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.right.sub')}</Text>
          {resultCard('m-opp-goal', selectedGoal ? t('opportunities.row.goalTitle', { p1: selectedGoal.name || t('goals.untitled') }) : t('goals.title'), info('metas_en_oportunidades'), <>
            {selectedGoal ? (goalIncomplete
              ? <Text className="font-inter text-xs leading-5 text-amber-300">{goalFundingConflict?.accountIds.length ? t('goals.sharedAccounts', { p1: goalFundingConflict.otherNames.join(', ') }) : missingGoalAccounts.length ? t('goals.missingAccounts') : t('goals.partialFx')}</Text>
              : comparison && <><Text className="font-inter text-sm leading-5 text-gf-text">{comparison.simulatedRemainingMinor <= 0 ? t('opportunities.row.goalDone') : t('opportunities.row.goalLine', { p1: money(minorToMajor(comparison.simulatedSavedMinor, currency)), p2: money(goalTarget), p3: percent(comparison.targetCoverage) })}</Text><ProgressBar ratio={comparison.targetCoverage} color="#c084fc" /></>)
              : <Text className="font-inter text-sm leading-5 text-gf-text-muted">{t('opportunities.row.goalNone')}</Text>}
            <Pressable accessibilityRole="button" onPress={() => selectedGoal ? router.push('/budgets/goals') : router.push({ pathname: '/budgets/new', params: { kind: 'saving', goal: '1' } })}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{selectedGoal ? t('opportunities.row.goalOpen') : t('opportunities.row.goalCreate')} →</Text></Pressable>
          </>)}
          {resultCard('m-opp-invest', t('opportunities.row.investTitle'), info('inversion_ilustrativa'), <>
            <Text className="font-inter text-sm leading-5 text-gf-text">{t('opportunities.row.investLine', { p1: String(typed(rate) ?? 12), p2: yearsText, p3: money(minorToMajor(projection?.valueMinor || 0, currency)), p4: money(minorToMajor(projection?.returnMinor || 0, currency)) })}</Text>
            <View className="flex-row gap-3"><View className="flex-1"><TextField label={t('opportunities.row.investRate')} value={rate} onChangeText={(text) => setRate(numeric(text))} keyboardType="decimal-pad" placeholder="12" /></View><View className="flex-1"><TextField label={t('opportunities.row.investYears')} value={years} onChangeText={(text) => setYears(numeric(text))} keyboardType="decimal-pad" placeholder="1" /></View></View>
          </>)}
          {resultCard('m-opp-trip', t('opportunities.row.tripTitle'), info('viaje_en_oportunidades'), isMxn && trips ? <>
            {customTrip && customTrip > 0
              ? <Text className="font-inter text-sm leading-5 text-gf-text">{t('opportunities.row.tripCustomLine', { p1: percent(principal / customTrip) })}</Text>
              : <>
                {trips.reachable && <Text className="font-inter text-sm leading-5 text-gf-text">{t('opportunities.row.tripReach', { p1: itemName(trips.reachable) })}</Text>}
                {trips.next && <Text className="font-inter text-xs leading-5 text-gf-text-muted">{trips.reachable ? t('opportunities.row.tripNext', { p1: itemName(trips.next), p2: percent(trips.nextCoverage) }) : t('opportunities.row.tripNone', { p1: itemName(trips.next), p2: percent(trips.nextCoverage) })}</Text>}
              </>}
            <ProgressBar ratio={customTrip && customTrip > 0 ? principal / customTrip : trips.next ? trips.nextCoverage : 1} color="#2dd4bf" />
            <TextField label={`${t('opportunities.row.tripCustom')} (${currency})`} value={tripInput} onChangeText={(text) => setTripInput(numeric(text))} keyboardType="decimal-pad" placeholder={t('opportunities.row.tripPlaceholder')} />
          </> : <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.row.carOnlyMxn')}</Text>)}
          {resultCard('m-opp-car', t('opportunities.row.carTitle'), info('enganche_de_carro'), isMxn && cars ? <>
            {cars.downPayment && <Text className="font-inter text-sm leading-5 text-gf-text">{t('opportunities.row.carDown', { p1: itemName(cars.downPayment) })}</Text>}
            {cars.cash && <Text className="font-inter text-sm leading-5 text-gf-text">{t('opportunities.row.carCash', { p1: itemName(cars.cash) })}</Text>}
            {cars.nextDownPayment && <Text className="font-inter text-xs leading-5 text-gf-text-muted">{cars.downPayment ? t('opportunities.row.carNext', { p1: itemName(cars.nextDownPayment), p2: percent(cars.nextDownPaymentCoverage) }) : t('opportunities.row.carNone', { p1: itemName(cars.nextDownPayment), p2: percent(cars.nextDownPaymentCoverage) })}</Text>}
            <ProgressBar ratio={cars.nextDownPayment ? cars.nextDownPaymentCoverage : 1} color="#fb923c" />
            <Text className="font-inter text-[11px] text-gf-text-muted">{t('opportunities.row.carDownNote', { p1: Math.round(DOWN_PAYMENT_FRACTION * 100) })}</Text>
          </> : <Text className="font-inter text-xs text-gf-text-muted">{t('opportunities.row.carOnlyMxn')}</Text>)}
          {isMxn && <Text className="font-inter text-[11px] leading-4 text-gf-text-muted">{t('opportunities.examplesNote', { p1: String(ILLUSTRATIVE_REFERENCE_YEAR) })}</Text>}
          <Text className="font-inter text-xs leading-5 text-gf-text-muted"><Text className="font-inter-semibold text-gf-text">{t('opportunities.disclaimerTitle')}: </Text>{t('opportunities.disclaimerBody')}</Text>
        </Card>
      </TourTarget>

      <Pressable accessibilityRole="button" onPress={() => { setAdvanced((value) => !value); if (advanced) { setSource('all'); setShareInput('10'); } }} className="self-start rounded-full border border-gf-border px-4 py-2"><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{advanced ? t('opportunities.simple') : t('opportunities.advanced')}</Text></Pressable>
    </Screen>
  );
}
