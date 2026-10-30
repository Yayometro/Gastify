import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { BudgetForm } from '@/components/forms/budget-form';
import { BudgetMood, BudgetProgress } from '@/components/budget-progress';
import { lookOf, periodSuffix } from '@/lib/budget-look';
import { CategoryBadge } from '@/components/category-badge';
import { PickerModal } from '@/components/picker-modal';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import type { InfoText } from '@/components/info-tip';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { TourPressable } from '@/components/tour/tour-target';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { budgetToValues } from '@gastify/core/budgets/budgetForm';
import { idOf } from '@gastify/core/categories/categoryForm';
import { calculateGoalSchedule } from '@gastify/core/goals/schedule';
import { monthTitle } from "@gastify/core/i18n/dates";
import { formatMoneyMajor, majorToMinor, minorToMajor } from '@gastify/core/money/currencies';
import { monthBounds, sortNewestFirst } from '@gastify/core/transactions/monthSummary';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import { getExplicitBudgetId, isProjectBudget, isSavingBudget } from '@gastify/core/transformers/budgetTypes';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { getBudgetActualSpend, matchBillToBudget } from '@gastify/core/transformers/projectionsChange';
import { findOverlappingSavingAccounts, isEligibleGoalFundingAccountType } from '@gastify/core/goals/progress';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';

import { useT, useInfo, useLocale } from "@/i18n/client";
import { tNow } from '@/i18n/now';

// One budget: where it stands this month (or in total, for a project), the movements that count toward
// it, and the same form that creates it to change it or delete it.
export default function BudgetDetailScreen() {
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const t = useT();
  const { id: rawId, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const currency = usePrimaryCurrency();
  const stored = useSelector((state: RootState) => state.budgetReducer.data.find((item) => idOf(item) === id));
  const allBudgets = useSelector((state: RootState) => state.budgetReducer.data);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const rates = useRatesToPrimary([stored?.currency, ...accounts.map((account) => account.currency)], currency);
  const fundingConflicts = useMemo(() => findOverlappingSavingAccounts(allBudgets.filter((item) => !item.archived && isSavingBudget(item)).map((goal) => ({
    id: idOf(goal), name: goal.name, linkedAccountIds: (goal.linkedAccounts || []).map(idOf).filter(Boolean),
  }))), [allBudgets]);
  const now = useMemo(() => new Date(), []);
  const bounds = useMemo(() => monthBounds(now.getFullYear(), now.getMonth()), [now]);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/budgets'));
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  // The editor is folded away until it is opened (the web's collapsed edit panel).
  const [editOpen, setEditOpen] = useState(edit === '1');
  const [linkOpen, setLinkOpen] = useState(false);

  const view = useMemo(() => {
    if (!stored) return null;
    const [budget] = convertBudgetsToPrimary([stored], currency, rates);
    const goal = Number(budget.goalAmount) || 0;
    const saving = isSavingBudget(budget);
    const linkedIds = (budget.linkedAccounts || []).map(idOf).filter(Boolean);
    const linkedAccounts = accounts.filter((account) => linkedIds.includes(idOf(account)));
    const linkedTotal = totalInPrimary(linkedAccounts, currency, rates);
    const fundingConflict = fundingConflicts.get(idOf(budget));
    const missingLinkedAccounts = linkedIds.filter((accountId) => !linkedAccounts.some((account) => idOf(account) === accountId));
    const ineligibleAccounts = linkedAccounts.filter((account) => !isEligibleGoalFundingAccountType(account.accountType));
    const accountBalancesComplete = !missingLinkedAccounts.length && !linkedTotal.missingCurrencies.length && !ineligibleAccounts.length && !budget.conversionUnavailable;
    const showProvisionalProgress = saving && Boolean(fundingConflict?.accountIds.length) && accountBalancesComplete;
    const fundingIncomplete = saving && (Boolean(fundingConflict?.accountIds.length) || !accountBalancesComplete);
    const canShowProgress = !fundingIncomplete || showProvisionalProgress;
    let spent = 0;
    let related: typeof transactions = [];
    if (isProjectBudget(budget)) {
      related = transactions.filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx) === id);
      spent = related.reduce((total, tx) => total + getPrimaryAmount(tx), 0);
    } else if (saving) {
      spent = linkedIds.length
        ? linkedTotal.total
        : budget.goalDetails
          ? Math.max(0, Number(budget.savingAmount) || 0)
          : Math.max(Number(budget.savingAmount) || 0, getBudgetActualSpend(budget, transactions, bounds.start, bounds.end));
      const context = budget.goalDetails?.context;
      const categoryIds = new Set(context?.categoryIds || []);
      const subCategoryIds = new Set(context?.subCategoryIds || []);
      const tagIds = new Set(context?.tagIds || []);
      const budgetIds = new Set([...(context?.spendingBudgetIds || []), ...(context?.projectBudgetIds || [])]);
      if (categoryIds.size || subCategoryIds.size || tagIds.size || budgetIds.size) {
        related = transactions.filter((tx) => {
          const isExpense = tx.kind === 'expense' || (!tx.kind && tx.isBill && !tx.isIncome);
          if (!isExpense || tx.state === 'pending' || tx.state === 'failed' || tx.state === 'reverted') return false;
          const tags = (tx.tags || []).map(idOf);
          return categoryIds.has(idOf(tx.category)) || subCategoryIds.has(idOf(tx.subCategory)) || tags.some((tagId) => tagIds.has(tagId)) || budgetIds.has(getExplicitBudgetId(tx));
        });
      }
    } else {
      spent = getBudgetActualSpend(budget, transactions, bounds.start, bounds.end);
      related = transactions.filter((tx) => {
        const when = new Date((tx.date ?? tx.createdAt) as string).getTime();
        return tx.isBill && when >= bounds.start.getTime() && when <= bounds.end.getTime() && matchBillToBudget(tx as never, budget as never);
      });
    }
    const distributionMap = new Map<string, { key: string; name: string; icon?: string; color: string; amount: number }>();
    for (const tx of related) {
      const category = tx.category;
      const subcategory = tx.subCategory;
      const key = `${category?._id ?? category?.name ?? 'none'}:${subcategory?._id ?? subcategory?.name ?? 'none'}`;
      const row = distributionMap.get(key) ?? {
        key,
        name: `${category?.name || t("history.noCategory")}${subcategory?.name ? ` · ${subcategory.name}` : ''}`,
        icon: subcategory?.icon || category?.icon,
        color: subcategory?.color || category?.color || colors.accent,
        amount: 0,
      };
      row.amount += Math.max(0, getPrimaryAmount(tx));
      distributionMap.set(key, row);
    }
    const distribution = [...distributionMap.values()].filter((row) => row.amount > 0).sort((a, b) => b.amount - a.amount);
    const distributionTotal = distribution.reduce((sum, row) => sum + row.amount, 0);
    const byCurrency = new Map<string, number>();
    for (const account of linkedAccounts) {
      const code = account.currency || currency;
      byCurrency.set(code, (byCurrency.get(code) ?? 0) + (Number(account.amount) || 0));
    }
    const schedule = saving && !fundingIncomplete && budget.goalDetails?.schedule && budget.goalDetails.targetDate
      ? calculateGoalSchedule({
          targetMinor: majorToMinor(goal, currency),
          savedMinor: majorToMinor(spent, currency),
          today: new Intl.DateTimeFormat('en-CA', { timeZone: budget.goalDetails.timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
          details: budget.goalDetails,
        })
      : null;
    return {
      budget,
      goal,
      spent: Math.round(spent * 100) / 100,
      related: sortNewestFirst(related),
      distribution,
      distributionTotal,
      linkedAccounts,
      byCurrency: [...byCurrency.entries()].map(([code, amount]) => ({ code, amount })),
      fundingConflict,
      fundingIncomplete,
      showProvisionalProgress,
      canShowProgress,
      schedule,
      missingLinkedAccounts,
      ineligibleAccounts,
      missingFx: linkedTotal.missingCurrencies,
    };
  }, [stored, currency, rates, transactions, accounts, bounds, id, colors.accent, t, fundingConflicts]);

  if (!stored || !view) {
    return (
      <Screen title={t("mobile.presupuesto")} backLabel={t("budgets.title")} onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">{t("mobile.no.encontramos.este.presupuesto.puede")}</Text>
      </Screen>
    );
  }

  const { budget, goal, spent, related, distribution, distributionTotal, linkedAccounts, byCurrency, fundingConflict, fundingIncomplete, showProvisionalProgress, canShowProgress, schedule, missingLinkedAccounts, ineligibleAccounts, missingFx } = view;
  const saving = isSavingBudget(budget);
  const project = isProjectBudget(budget);
  const ratio = goal > 0 ? spent / goal : 0;
  const diff = goal - spent;
  const reached = saving && canShowProgress && !showProvisionalProgress && goal > 0 && spent >= goal;
  // Project movements that can still be linked: bills not tied to any budget yet, or tied to another one.
  const linkable = transactions.filter((tx) => tx.isBill && !tx.isIncome && getExplicitBudgetId(tx) !== id);

  const linkMovement = async (transactionId: string, budgetId: string | null) => {
    try {
      await sendWrite('general-data/transactions/link-budget', { transactionId, budgetId });
      toast.show(budgetId ? t("mobile.movimiento.vinculado") : t("mobile.movimiento.desvinculado"));
      reloadAfterWrite(dispatch);
    } catch (e) {
      toast.show(messageOf(e), 'error');
    }
  };

  const remove = () => {
    Alert.alert(t("mobile.borrar.este.presupuesto"), t("mobile.los.movimientos.ligados.se.conservan"), [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.borrar"),
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/budget/remove', { id });
            toast.show(t("mobile.presupuesto.borrado"));
            reloadAfterWrite(dispatch);
            back();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  const editForm = (
    <BudgetForm
      key={id}
      id={id}
      initial={budgetToValues(stored)}
      submitLabel={t("mobile.guardar.cambios")}
      onSubmit={async (body) => {
        await sendWrite('general-data/budget/update', body);
        toast.show(t("mobile.presupuesto.guardado"));
        reloadAfterWrite(dispatch);
        back();
      }}
      onDelete={remove}
    />
  );

  return (
    <Screen tutorial="m-bud-detail" title={stored.name || t("budgets.alert.defaultName")} subtitle={project ? t("budgets.kind.project") : saving ? t("mobile.meta.de.ahorro") : monthTitle(now, locale)} backLabel={t("budgets.title")} onBack={back} titleInfo={saving ? APP_INFO.objetivos_de_ahorro as InfoText : undefined}>
      <Card tour="m-bud-detail-spent" title={saving ? t('goals.detail.progressTitle') : project ? t("mobile.gastado.en.total") : t("mobile.gastado.este.mes")}>
        {goal > 0 && (
          <>
            <View className="flex-row items-center gap-3">
              <CategoryBadge icon={lookOf(budget, colors.accentSoft).icon} color={lookOf(budget, colors.accentSoft).color} size={44} />
              <View className="min-w-0 flex-1">
                <Text className="font-inter-semibold text-base text-gf-text">{saving ? t('goals.detail.saved') : diff >= 0 ? tNow("mobile.quedan.p1", { p1: formatMoneyMajor(diff, currency) }) : tNow("mobile.excedido.por.p1", { p1: formatMoneyMajor(-diff, currency) })}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">{canShowProgress ? formatMoneyMajor(spent, currency) : '—'}{saving && showProvisionalProgress ? ` · ${t('goals.linkedBalanceShared')}` : ''}</Text>
              </View>
              {canShowProgress && <BudgetMood ratio={ratio} saving={saving} size={48} />}
            </View>
            {canShowProgress
              ? <BudgetProgress ratio={ratio} color={getBudgetBarColor(ratio, saving)} saving={saving} spent={spent} goal={goal} currency={currency} suffix={saving ? ` ${t('mobile.budgets.ofGoal')}` : periodSuffix(budget)} />
              : <View className="flex-row justify-between gap-3"><Text className="font-inter-bold text-lg text-gf-text">—</Text><Text className="font-inter text-sm text-gf-text-muted">{formatMoneyMajor(goal, currency)} · {t('goals.target')}</Text></View>}
          </>
        )}
        {goal <= 0 && <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(spent, currency)}</Text>}
        {reached && (
          <View className="flex-row items-center gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: colors.accentSoft }}>
            <Ionicons name="trophy" size={22} color="#f59e0b" />
            <Text className="flex-1 font-inter-semibold text-base text-gf-text">{t("mobile.meta.alcanzada.felicidades")}</Text>
          </View>
        )}
        {fundingConflict?.accountIds.length ? <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.sharedAccounts', { p1: fundingConflict.otherNames.join(', ') })}</Text> : null}
        {missingLinkedAccounts.length > 0 && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.missingAccounts')}</Text>}
        {ineligibleAccounts.length > 0 && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.ineligibleAccounts')}</Text>}
        {missingFx.length > 0 && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.partialFx')}</Text>}
        {fundingIncomplete && !showProvisionalProgress && <Text className="font-inter text-xs text-amber-300">{t('goals.fundingNeedsReview')}</Text>}
        {saving && byCurrency.length > 0 && (
          <View className="gap-1 pt-1">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.en.tus.cuentas.ligadas")}</Text>
            {byCurrency.map((row) => (
              <View key={row.code} className="flex-row justify-between">
                <Text className="font-inter text-sm text-gf-text-muted">{row.code}</Text>
                <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.amount, row.code)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {saving && <Card title={t('goals.detail.planTitle')}>
        <View className="gap-3">
          <View className="flex-row items-start gap-3 rounded-xl bg-gf-surface-2 p-3"><Text className="font-inter text-xs text-gf-text-muted">1</Text><View className="flex-1"><Text className="font-inter-semibold text-sm text-gf-text">{t('goals.detail.stepSaved')}</Text><Text className="font-inter text-xs text-gf-text-muted">{canShowProgress ? formatMoneyMajor(spent, currency) : t('goals.fundingNeedsReview')}</Text></View></View>
          <View className="flex-row items-start gap-3 rounded-xl bg-gf-surface-2 p-3"><Text className="font-inter text-xs text-gf-text-muted">2</Text><View className="flex-1"><Text className="font-inter-semibold text-sm text-gf-text">{t('goals.detail.stepTarget')}</Text><Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(goal, currency)}{budget.goalDetails?.targetDate ? ` · ${new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${budget.goalDetails.targetDate}T12:00:00Z`))}` : ''}</Text></View></View>
          <View className="flex-row items-start gap-3 rounded-xl bg-gf-surface-2 p-3"><Text className="font-inter text-xs text-gf-text-muted">3</Text><View className="flex-1"><Text className="font-inter-semibold text-sm text-gf-text">{t('goals.detail.stepNext')}</Text><Text className="font-inter text-xs text-gf-text-muted">{schedule?.status === 'ready' && schedule.contributionMinor !== null ? t('goals.perPayment', { p1: formatMoneyMajor(minorToMajor(schedule.contributionMinor, currency), currency), p2: schedule.paymentDates.length }) : budget.goalDetails?.schedule ? t('goals.noPayments') : t('goals.schedule.off')}</Text></View></View>
        </View>
        {schedule?.status === 'underfunded' && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.underfundedPlan')}</Text>}
        {schedule?.status === 'past_due' && <Text className="font-inter text-xs leading-5 text-amber-300">{t('goals.pastDue')}</Text>}
        {schedule?.paymentDates[0] && <Text className="font-inter text-xs text-gf-text-muted">{t('goals.detail.nextPayment', { p1: new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${schedule.paymentDates[0]}T12:00:00Z`)) })}</Text>}
      </Card>}

      {!saving && distribution.length > 0 && (
        <Card tour="m-bud-detail-distribution" title={t("mobile.distribucion.del.gasto.por.categoria")} info={APP_INFO.distribuci_n_del_gasto}>
          <View className="flex-row overflow-hidden rounded-full" style={{ height: 14 }} accessibilityLabel={t("mobile.distribucion.del.gasto.por.categoria")}>
            {distribution.map((row) => <View key={row.key} style={{ flex: row.amount, backgroundColor: row.color }} />)}
          </View>
          {distribution.map((row) => (
            <View key={row.key} className="flex-row items-center gap-3">
              <CategoryBadge icon={row.icon} color={row.color} size={30} />
              <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{row.name}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{distributionTotal > 0 ? Math.round((row.amount / distributionTotal) * 100) : 0}%</Text>
              <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.amount, currency)}</Text>
            </View>
          ))}
        </Card>
      )}

      {saving && (
        <Card title={t("mobile.cuentas.ligadas")}>
          {linkedAccounts.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.esta.meta.no.tiene.cuentas")}</Text>}
          {linkedAccounts.map((account) => (
            <View key={idOf(account)} className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{account.name || t("dashboard.bulk.account")}</Text>
              <Text className="font-inter text-sm text-gf-text-muted">{formatMoneyMajor(account.amount ?? 0, account.currency || currency)}</Text>
            </View>
          ))}
        </Card>
      )}

      {saving && (
        <Card title={t('goals.detail.contextTitle')}>
          <Text className="font-inter text-xs leading-5 text-gf-text-muted">{t('goals.detail.contextWarning')}</Text>
          {related.length === 0 ? <Text className="font-inter text-sm text-gf-text-muted">{t('goals.detail.noContextMovements')}</Text> : <>
            <View className="flex-row overflow-hidden rounded-full" style={{ height: 14 }} accessibilityLabel={t('goals.detail.categoryChart')}>
              {distribution.map((row) => <View key={row.key} style={{ flex: row.amount, backgroundColor: row.color }} />)}
            </View>
            {distribution.map((row) => (
              <View key={row.key} className="flex-row items-center gap-3">
                <CategoryBadge icon={row.icon} color={row.color} size={28} />
                <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{row.name}</Text>
                <Text className="font-inter-semibold text-xs text-gf-text">{distributionTotal > 0 ? Math.round((row.amount / distributionTotal) * 100) : 0}%</Text>
                <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.amount, currency)}</Text>
              </View>
            ))}
            {related.slice(0, 12).map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: `/budgets/${id}` } })} />)}
            {related.length > 12 && <Text className="font-inter text-xs text-gf-text-muted">{t('mobile.y.p1.mas.en.movimientos', { p1: related.length - 12 })}</Text>}
          </>}
        </Card>
      )}

      {!saving && (
        <Card tour="m-bud-detail-movements" title={project ? t("mobile.movimientos.del.proyecto") : t("mobile.movimientos.que.cuentan")}>
          {project && (
            <View className="flex-row gap-2">
              <Pressable accessibilityRole="button" onPress={() => setLinkOpen(true)} className="flex-1 items-center rounded-full border border-gf-border py-2.5">
                <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.vincular.existente")}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/add')} className="flex-1 items-center rounded-full border border-gf-border py-2.5">
                <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.crear.movimiento")}</Text>
              </Pressable>
            </View>
          )}
          {related.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.todavia.no.hay.movimientos")}</Text>}
          {related.slice(0, 25).map((movement) => (
            <View key={String(movement._id)} className="gap-1">
              <MovementRow movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: `/budgets/${id}` } })} />
              {project && (
                <Pressable accessibilityRole="button" onPress={() => linkMovement(String(movement._id), null)} className="self-end px-2 pb-1">
                  <Text className="font-inter-medium text-xs" style={{ color: colors.expense }}>{t("mobile.desvincular")}</Text>
                </Pressable>
              )}
            </View>
          ))}
          {related.length > 25 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.y.p1.mas.en.movimientos", { p1: related.length - 25 })}</Text>}
        </Card>
      )}

      {saving && <Pressable accessibilityRole="button" accessibilityState={{ expanded: editOpen }} onPress={() => setEditOpen((open) => !open)} className="self-start rounded-full border border-gf-border px-4 py-2.5">
        <Text className="font-inter-semibold text-sm text-gf-text">{editOpen ? t('mobile.ocultar.edicion') : t('goals.edit')}</Text>
      </Pressable>}
      {saving && editOpen && <Card title={t('goals.edit')}>{editForm}</Card>}
      {!saving && <Card
        tour="m-budform"
        title={t("mobile.editar")}
        onHeaderPress={() => setEditOpen((open) => !open)}
        action={
          <TourPressable id="m-budform-open" accessibilityRole="button" accessibilityState={{ expanded: editOpen }} accessibilityLabel={editOpen ? t("mobile.ocultar.edicion") : t("mobile.mostrar.edicion")} onPress={() => setEditOpen((open) => !open)} hitSlop={10}>
            <Ionicons name={editOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.text} />
          </TourPressable>
        }>
        {editOpen && editForm}
      </Card>}

      {project && (
        <PickerModal
          visible={linkOpen}
          title={t("mobile.vincular.un.movimiento")}
          searchPlaceholder={t("mobile.buscar.movimiento")}
          items={linkable.map((tx) => ({ id: String(tx._id), label: tx.name || t("errors.api.movement"), detail: `${formatMoneyMajor(getPrimaryAmount(tx), currency)} · ${new Date((tx.date ?? tx.createdAt) as string).toLocaleDateString('es-MX')}` }))}
          isSelected={() => false}
          onSelect={(transactionId) => {
            setLinkOpen(false);
            linkMovement(transactionId, id);
          }}
          onClose={() => setLinkOpen(false)}
        />
      )}
    </Screen>
  );
}
