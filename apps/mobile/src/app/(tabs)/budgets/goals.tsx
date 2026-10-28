import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { CategoryBadge } from '@/components/category-badge';
import { BudgetMood, BudgetProgress } from '@/components/budget-progress';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import type { RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { idOf } from '@gastify/core/categories/categoryForm';
import { findOverlappingSavingAccounts, isEligibleGoalFundingAccountType } from '@gastify/core/goals/progress';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import { useT, useLocale } from '@/i18n/client';

export default function GoalsScreen() {
  const t = useT();
  const locale = useLocale();
  const currency = usePrimaryCurrency();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const budgetState = useSelector((state: RootState) => state.budgetReducer);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const { refresh, refreshing } = useRefreshAppData();
  const rates = useRatesToPrimary([...budgetState.data.map((item) => item.currency), ...accounts.map((item) => item.currency)], currency);
  const goals = useMemo(() => convertBudgetsToPrimary(budgetState.data.filter((item) => !item.archived && isSavingBudget(item)), currency, rates)
    .sort((a, b) => (a.goalDetails?.priority ?? 3) - (b.goalDetails?.priority ?? 3)), [budgetState.data, currency, rates]);
  const fundingConflicts = useMemo(() => findOverlappingSavingAccounts(goals.map((goal) => ({
    id: idOf(goal), name: goal.name, linkedAccountIds: (goal.linkedAccounts || []).map(idOf).filter(Boolean),
  }))), [goals]);

  return (
    <Screen title={t('goals.title')} subtitle={t('goals.subtitle')} refreshing={refreshing} onRefresh={refresh}>
      <Card>
        <Text className="font-inter text-sm leading-5 text-gf-text-muted">{t('goals.savingsRule')}</Text>
        <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('goals.contextHelp')}</Text>
      </Card>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/budgets/new', params: { kind: 'saving', goal: '1' } })} className="rounded-2xl border border-purple-300/30 bg-purple-300/10 px-4 py-3">
        <Text className="font-inter-semibold text-base text-gf-text">+ {t('goals.new')}</Text>
      </Pressable>
      {goals.length === 0 ? <Card title={t('goals.emptyTitle')}><Text className="font-inter text-sm leading-5 text-gf-text-muted">{t('goals.emptyText')}</Text></Card> : goals.map((goal) => {
        const linkedIds = (goal.linkedAccounts || []).map(idOf).filter(Boolean);
        const linked = accounts.filter((account) => linkedIds.includes(idOf(account)));
        const progress = linkedIds.length ? totalInPrimary(linked, currency, rates) : null;
        const missingAccounts = linkedIds.filter((accountId) => !linked.some((account) => idOf(account) === accountId));
        const ineligibleAccounts = linked.filter((account) => !isEligibleGoalFundingAccountType(account.accountType));
        const fundingConflict = fundingConflicts.get(idOf(goal));
        const accountBalancesComplete = !missingAccounts.length && !progress?.missingCurrencies.length && !ineligibleAccounts.length && !goal.conversionUnavailable;
        const showProvisionalProgress = Boolean(fundingConflict?.accountIds.length) && accountBalancesComplete;
        const fundingIncomplete = Boolean(fundingConflict?.accountIds.length || !accountBalancesComplete);
        const canShowProgress = !fundingIncomplete || showProvisionalProgress;
        const saved = linkedIds.length ? progress?.total ?? 0 : Math.max(0, Number(goal.savingAmount) || 0);
        const target = Math.max(0, Number(goal.goalAmount) || 0);
        const ratio = target > 0 ? saved / target : 0;
        const missingFx = progress?.missingCurrencies.length;
        const date = goal.goalDetails?.targetDate;
        const status = goal.goalDetails?.status || 'active';
        const openGoal = (edit = false) => router.push({ pathname: '/budgets/[id]', params: { id: idOf(goal), ...(edit ? { edit: '1' } : {}) } });
        return (
          <Card key={idOf(goal)}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('mobile.openLabel', { p1: goal.name || t('goals.untitled') })} onPress={() => openGoal()} className="gap-3">
              <View className="flex-row items-center gap-3">
                <CategoryBadge icon={goal.icon || 'fluent/bullseye'} color={goal.color || colors.accent} size={44} />
                <View className="min-w-0 flex-1">
                  <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>{goal.name || t('goals.untitled')}</Text>
                  <Text className="font-inter text-xs text-gf-text-muted">{goal.goalDetails ? t(`goals.template.${goal.goalDetails.template}`) : t('goals.legacySavings')} · {t(`goals.status.${status}`)}</Text>
                </View>
                {canShowProgress ? <BudgetMood ratio={ratio} saving size={44} /> : <Text className="font-inter-semibold text-sm text-gf-text-muted">—</Text>}
              </View>
              {target > 0 && canShowProgress ? <BudgetProgress ratio={ratio} color={getBudgetBarColor(ratio, true)} saving spent={saved} goal={target} currency={currency} suffix={` ${t('mobile.budgets.ofGoal')}`} /> : <View className="flex-row justify-between gap-3"><Text className="font-inter text-sm text-gf-text-muted">{canShowProgress ? formatMoneyMajor(saved, currency) : '—'}</Text><Text className="font-inter text-sm text-gf-text-muted">{formatMoneyMajor(target, currency)} · {t('goals.target')}</Text></View>}
              {fundingConflict?.accountIds.length ? <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.sharedAccounts', { p1: fundingConflict.otherNames.join(', ') })}</Text> : null}
              {missingAccounts.length > 0 && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.missingAccounts')}</Text>}
              {ineligibleAccounts.length > 0 && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.ineligibleAccounts')}</Text>}
              {goal.conversionUnavailable && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.partialFx')}</Text>}
              {showProvisionalProgress && <Text className="font-inter text-xs text-amber-300">{t('goals.linkedBalanceShared')}</Text>}
              {date && <Text className="font-inter text-xs text-gf-text-muted">{t('goals.targetDate')}: {new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</Text>}
              {missingFx !== undefined && missingFx > 0 && <Text className="font-inter text-xs text-amber-300">{t('goals.partialFx')}</Text>}
              {!goal.goalDetails && <Text className="font-inter text-xs text-gf-text-muted">{t('goals.legacySavingsHelp')}</Text>}
              <Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t('goals.open')} →</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('goals.edit')} onPress={() => openGoal(true)} className="self-start rounded-full border border-gf-border px-4 py-2">
              <Text className="font-inter-semibold text-xs text-gf-text">{t('goals.edit')}</Text>
            </Pressable>
          </Card>
        );
      })}
      <Pressable accessibilityRole="button" onPress={() => router.push('/budgets/opportunities')} className="rounded-2xl border border-gf-border px-4 py-3">
        <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t('opportunities.title')} →</Text>
      </Pressable>
    </Screen>
  );
}
