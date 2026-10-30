import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ChipPicker, MultiChipPicker, type ChipItem } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { ColorPicker } from '@/components/color-picker';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { TourTarget } from '@/components/tour/tour-target';
import { useCatalog } from '@/hooks/use-catalog';
import { messageOf } from '@/lib/write';
import { ACCOUNT_CURRENCIES } from '@gastify/core/accounts/accountForm';
import { BUDGET_PERIODS, buildBudgetBody, validateBudget, type BudgetErrors, type BudgetKind, type BudgetValues } from '@gastify/core/budgets/budgetForm';
import { idOf } from '@gastify/core/categories/categoryForm';
import { useT } from "@/i18n/client";
import { tNow } from '@/i18n/now';
import { emptyGoalDetails, type GoalDetails, type GoalFrequency, type GoalTemplate } from '@gastify/core/goals/types';
import { calculateGoalSchedule } from '@gastify/core/goals/schedule';
import { isEligibleGoalFundingAccountType } from '@gastify/core/goals/progress';
import { formatMoneyMajor, majorToMinor, minorToMajor } from '@gastify/core/money/currencies';
import { dateText } from '@gastify/core/transactions/movementForm';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { isProjectBudget, isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { getApi } from '@gastify/core/api/client';
import { convertMinorAtRate } from '@gastify/core/money/conversion';

type IncomeSourceOption = { _id: string; name?: string; recurrence?: GoalFrequency; anchorDate?: string | Date; active?: boolean };

// The word of each kind of budget (a catalog key, read when the form is shown).
const TITLE_KEYS: Record<BudgetKind, string> = { spending: "mobile.presupuesto.2", saving: "mobile.meta.de.ahorro.2", project: "mobile.proyecto.2" };

// A budget of any kind. Spending: categories and a period. Saving: linked accounts or what is already
// saved. Project: start and end dates and an icon. The body comes from core's buildBudgetBody.
export function BudgetForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  id,
}: {
  initial: BudgetValues;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onDelete?: () => void;
  id?: string;
}) {
  const t = useT();
  const { accounts, categories, subCategories, budgets } = useCatalog();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const [values, setValues] = useState<BudgetValues>(initial);
  const [errors, setErrors] = useState<BudgetErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceOption[]>([]);
  const set = <K extends keyof BudgetValues>(key: K, value: BudgetValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const toggle = (key: 'categoryIds' | 'linkedAccountIds', itemId: string) =>
    setValues((current) => ({ ...current, [key]: current[key].includes(itemId) ? current[key].filter((x) => x !== itemId) : [...current[key], itemId] }));

  const categoryItems: ChipItem[] = categories.map((category) => ({ id: idOf(category), label: category.name || t("dashboard.bulk.category"), icon: category.icon, color: category.color }));
  const tagItems = useMemo<ChipItem[]>(() => {
    const tags = new Map<string, string>();
    for (const transaction of transactions) for (const tag of transaction.tags || []) {
      const id = idOf(tag);
      const name = typeof tag === 'object' && tag !== null && 'name' in tag ? String(tag.name || '') : '';
      if (id && name) tags.set(id, name);
    }
    return [...tags].map(([id, label]) => ({ id, label: '#' + label }));
  }, [transactions]);
  const spendingItems: ChipItem[] = budgets.filter(isSpendingBudget).map((budget) => ({ id: idOf(budget), label: budget.name || t("budgets.kind.spending") }));
  const projectItems: ChipItem[] = budgets.filter(isProjectBudget).map((budget) => ({ id: idOf(budget), label: budget.name || t("budgets.kind.project") }));
  const subcategoryItems: ChipItem[] = subCategories.map((item) => ({ id: idOf(item), label: item.name || t("goals.subcategory"), icon: item.icon, color: item.color }));
  const rates = useRatesToPrimary(accounts.map((account) => account.currency), values.currency);
  const linkedTotal = totalInPrimary(accounts.filter((account) => values.linkedAccountIds.includes(idOf(account))), values.currency, rates);
  const savedValue = values.linkedAccountIds.length ? linkedTotal.total : Number(values.savingAmount) || 0;
  const goalSchedule = values.goalDetails?.schedule && values.goalDetails.targetDate
    ? calculateGoalSchedule({ targetMinor: majorToMinor(values.goalAmount || 0, values.currency), savedMinor: majorToMinor(savedValue, values.currency), today: dateText(new Date()), details: values.goalDetails })
    : null;
  const goalScheduleEnabled = Boolean(values.goalDetails?.schedule);
  useEffect(() => {
    if (!goalScheduleEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await getApi().post<{ ok?: boolean; data?: IncomeSourceOption[] }>('general-data/income-sources/get', {});
        if (!cancelled) setIncomeSources(response.ok && Array.isArray(response.data) ? response.data.filter((source) => source._id && source.active !== false) : []);
      } catch {
        if (!cancelled) setIncomeSources([]);
      }
    })();
    return () => { cancelled = true; };
  }, [goalScheduleEnabled]);
  const patchGoal = (changes: Partial<GoalDetails>) => set('goalDetails', values.goalDetails ? { ...values.goalDetails, ...changes } : null);
  const toggleGoalContext = (field: keyof GoalDetails['context'], itemId: string) => {
    const current = values.goalDetails?.context[field] || [];
    patchGoal({ context: { ...(values.goalDetails?.context || { categoryIds: [], subCategoryIds: [], tagIds: [], spendingBudgetIds: [], projectBudgetIds: [] }), [field]: current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId] } });
  };
  const setGoalSchedule = (mode: 'off' | 'required_by_date' | 'fixed_contribution') => {
    if (mode === 'off') { patchGoal({ schedule: null }); return; }
    const existing = values.goalDetails?.schedule;
    patchGoal({ schedule: { mode, frequency: existing?.frequency || 'monthly', anchorDate: existing?.anchorDate || dateText(new Date()), monthDays: existing?.monthDays || [15, 'last'], incomeSourceId: existing?.incomeSourceId || null, ...(existing || {}), ...(mode === 'fixed_contribution' ? { fixedContributionMoney: existing?.fixedContributionMoney || { amountMinor: majorToMinor(1000, values.currency), currency: values.currency } } : {}) } });
  };
  const setGoalScheduleFrequency = (frequency: GoalFrequency) => {
    if (values.goalDetails?.schedule) patchGoal({ schedule: { ...values.goalDetails.schedule, frequency } });
  };
  const accountItems: ChipItem[] = accounts
    .filter((account) => isEligibleGoalFundingAccountType(account.accountType) || values.linkedAccountIds.includes(idOf(account)))
    .map((account) => ({ id: idOf(account), label: `${account.name} · ${account.currency}${isEligibleGoalFundingAccountType(account.accountType) ? '' : ` · ${t("goals.ineligibleAccountLabel")}`}` }));
  const error = (key?: string) => (key ? <Text className="font-inter text-sm text-red-500">{t(key)}</Text> : null);

  const save = async () => {
    const found = validateBudget(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await onSubmit(buildBudgetBody(values, id));
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  const changeCurrency = async (nextCurrency: string) => {
    const fromCurrency = values.currency;
    if (nextCurrency === fromCurrency) return;
    const targetValue = Number(values.goalAmount.replace(',', '.')) || 0;
    const savedValue = Number(values.savingAmount.replace(',', '.')) || 0;
    const hasAmounts = targetValue !== 0 || savedValue !== 0 ||
      Boolean(values.goalDetails?.assetPriceMoney?.amountMinor || values.goalDetails?.schedule?.fixedContributionMoney?.amountMinor);
    if (!hasAmounts) {
      set('currency', nextCurrency);
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const quote = await getApi().post<{ ok?: boolean; data?: { rate?: string | number } }>('general-data/fx/quote', {
        amountMinor: majorToMinor(1, fromCurrency),
        fromCurrency,
        toCurrency: nextCurrency,
      });
      const rate = Number(quote?.ok ? quote.data?.rate : NaN);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error(t('goals.currencyChangeFailed'));
      const convertMajor = (value: string) => minorToMajor(convertMinorAtRate({
        amountMinor: majorToMinor(Number(value.replace(',', '.')) || 0, fromCurrency),
        fromCurrency,
        toCurrency: nextCurrency,
        rate,
      }), nextCurrency);
      const nextGoalAmount = convertMajor(values.goalAmount);
      const nextSavingAmount = convertMajor(values.savingAmount);
      const convertMoney = (money: { amountMinor: number; currency: string }) => {
        if (money.currency !== fromCurrency) throw new Error(t('goals.currencyChangeFailed'));
        return { amountMinor: convertMinorAtRate({ amountMinor: money.amountMinor, fromCurrency, toCurrency: nextCurrency, rate }), currency: nextCurrency };
      };
      const nextGoalDetails = values.goalDetails ? {
        ...values.goalDetails,
        ...(values.goalDetails.assetPriceMoney ? { assetPriceMoney: convertMoney(values.goalDetails.assetPriceMoney) } : {}),
        ...(values.goalDetails.schedule?.fixedContributionMoney ? {
          schedule: { ...values.goalDetails.schedule, fixedContributionMoney: convertMoney(values.goalDetails.schedule.fixedContributionMoney) },
        } : {}),
      } : null;
      Alert.alert(t('mobile.moneda.de.la.meta'), t('goals.currencyChangeOffer', {
        p1: formatMoneyMajor(targetValue, fromCurrency),
        p2: formatMoneyMajor(nextGoalAmount, nextCurrency),
      }), [
        { text: t('mobile.cancelar'), style: 'cancel' },
        { text: t('mobile.continuar'), onPress: () => setValues((current) => ({
          ...current,
          currency: nextCurrency,
          goalAmount: String(nextGoalAmount),
          savingAmount: String(nextSavingAmount),
          goalDetails: nextGoalDetails,
        })) },
      ]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('goals.currencyChangeFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <TourTarget id="m-budform-name" className="gap-2">
        <TextField label={t("mobile.nombre")} value={values.name} onChangeText={(text) => set('name', text)} placeholder={values.kind === 'project' ? t("mobile.viaje.a.oaxaca") : values.kind === 'saving' ? t("mobile.fondo.de.emergencia") : t("mobile.comida")} maxLength={60} autoCapitalize="sentences" />
        {error(errors.name)}
      </TourTarget>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.moneda.de.la.meta")}</Text>
        <TourTarget id="m-budform-currency"><ChipPicker items={ACCOUNT_CURRENCIES.map((code) => ({ id: code, label: code }))} value={values.currency} onChange={(code) => void changeCurrency(code)} moreAfter={99} /></TourTarget>
        <TourTarget id="m-budform-goal"><TextField label={values.kind === 'saving' && values.goalDetails?.targetMode === 'down_payment' && values.goalDetails.downPaymentInput?.mode === 'amount' ? t("goals.downPaymentAmount") : t("mobile.forms.goalLabel", { p1: values.currency })} value={values.goalAmount} onChangeText={(text) => set('goalAmount', text.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" editable={!(values.kind === 'saving' && values.goalDetails?.targetMode === 'down_payment' && values.goalDetails.downPaymentInput?.mode !== 'amount')} /></TourTarget>
        {error(errors.goalAmount)}
      </View>

      {values.kind === 'spending' && (
        <>
          <TourTarget id="m-budform-period" className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.periodo")}</Text>
            <ChipPicker items={BUDGET_PERIODS.map((period) => ({ id: period.value, label: t(period.label) }))} value={values.period} onChange={(value) => set('period', value)} moreAfter={99} />
          </TourTarget>
          <TourTarget id="m-budform-categories" className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.categorias.que.cubre")}</Text>
            <MultiChipPicker items={categoryItems} values={values.categoryIds} onToggle={(itemId) => toggle('categoryIds', itemId)} title={t("mobile.categorias.del.presupuesto")} />
            {error(errors.categoryIds)}
          </TourTarget>
        </>
      )}

      {values.kind === 'saving' && (
        <>
          <Pressable accessibilityRole="button" onPress={() => {
            if (values.goalDetails) set('goalDetails', null);
            else {
              const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
              setValues((current) => ({ ...current, goalDetails: emptyGoalDetails('custom', timeZone), icon: 'fluent/flag' }));
            }
          }} className="rounded-2xl border border-purple-300/30 bg-purple-300/10 px-4 py-3">
            <Text className="font-inter-semibold text-sm text-gf-text">{values.goalDetails ? t("goals.removeDetails") : t("goals.upgradeSavings")}</Text>
            <Text className="mt-1 font-inter text-xs text-gf-text-muted">{t("goals.plusSummary")}</Text>
          </Pressable>
          {values.goalDetails && <>
            <View className="gap-2">
              <Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.template")}</Text>
              <ChipPicker items={(['custom', 'car', 'home', 'travel', 'business', 'health', 'emergency'] as const).map((template) => ({ id: template, label: t('goals.template.' + template) }))} value={values.goalDetails.template} onChange={(template) => patchGoal({ template: template as GoalTemplate })} title={t("goals.template")} moreAfter={3} />
            </View>
            {values.goalDetails.targetDate
              ? <View className="gap-2">
                  <DateField label={t("goals.targetDate")} value={values.goalDetails.targetDate} onChange={(targetDate) => patchGoal({ targetDate })} />
                  <Pressable accessibilityRole="button" onPress={() => patchGoal({ targetDate: null })}><Text className="font-inter text-xs text-gf-text-muted">{t("mobile.quitar.fecha")}</Text></Pressable>
                </View>
              : <Pressable accessibilityRole="button" onPress={() => { const next = new Date(); next.setMonth(next.getMonth() + 1); patchGoal({ targetDate: dateText(next) }); }} className="rounded-xl border border-gf-border px-4 py-3"><Text className="font-inter-medium text-sm text-gf-text">{t("goals.setTargetDate")}</Text></Pressable>}
            {(values.goalDetails.template === 'car' || values.goalDetails.template === 'home') && <>
              <View className="gap-2">
                <Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.targetMode")}</Text>
                <ChipPicker items={[{ id: 'full', label: t("goals.targetMode.full") }, { id: 'down_payment', label: t("goals.targetMode.down_payment") }]} value={values.goalDetails.targetMode} onChange={(targetMode) => patchGoal({ targetMode: targetMode as GoalDetails['targetMode'] })} moreAfter={99} />
              </View>
              {values.goalDetails.targetMode === 'down_payment' && <>
                <TextField label={t("goals.assetPrice")} value={values.goalDetails.assetPriceMoney ? String(minorToMajor(values.goalDetails.assetPriceMoney.amountMinor, values.goalDetails.assetPriceMoney.currency)) : ''} onChangeText={(text) => {
                  const price = Number(text.replace(',', '.'));
                  const assetPriceMoney = price > 0 ? { amountMinor: majorToMinor(price, values.currency), currency: values.currency } : undefined;
                  const input = values.goalDetails?.downPaymentInput || { mode: 'percent' as const, basisPoints: 2000 };
                  const goalAmount = input.mode === 'percent' && price > 0 ? minorToMajor(Math.round(majorToMinor(price, values.currency) * input.basisPoints / 10000), values.currency) : values.goalAmount;
                  setValues((current) => ({ ...current, goalAmount: String(goalAmount), goalDetails: current.goalDetails ? { ...current.goalDetails, assetPriceMoney, downPaymentInput: input } : null }));
                }} placeholder="0" keyboardType="decimal-pad" />
                <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.downPaymentMethod")}</Text><ChipPicker items={[{ id: 'percent', label: t("goals.downPaymentByPercent") }, { id: 'amount', label: t("goals.downPaymentByAmount") }]} value={values.goalDetails.downPaymentInput?.mode || 'percent'} onChange={(mode) => {
                  if (mode === 'amount') { patchGoal({ downPaymentInput: { mode: 'amount' } }); return; }
                  const priceMinor = values.goalDetails?.assetPriceMoney?.amountMinor || 0;
                  const amountMinor = majorToMinor(Number(values.goalAmount.replace(',', '.')) || 0, values.currency);
                  const basisPoints = priceMinor > 0 ? Math.min(10000, Math.max(100, Math.round(amountMinor / priceMinor * 10000))) : 2000;
                  patchGoal({ downPaymentInput: { mode: 'percent', basisPoints } });
                  if (priceMinor > 0) set('goalAmount', String(minorToMajor(Math.round(priceMinor * basisPoints / 10000), values.currency)));
                }} title={t("goals.downPaymentMethod")} moreAfter={99} />
                {values.goalDetails.downPaymentInput?.mode === 'amount' ? <Text className="font-inter text-xs text-gf-text-muted">{t("goals.downPaymentAmountHelp")}</Text> : <TextField label={t("goals.downPaymentPercent")} value={String((values.goalDetails.downPaymentInput?.mode === 'percent' ? values.goalDetails.downPaymentInput.basisPoints : 2000) / 100)} onChangeText={(text) => {
                  const basisPoints = Math.min(10000, Math.max(100, Math.round(Number(text.replace(',', '.')) * 100)));
                  const price = values.goalDetails?.assetPriceMoney ? minorToMajor(values.goalDetails.assetPriceMoney.amountMinor, values.currency) : 0;
                  if (price > 0) set('goalAmount', String(minorToMajor(majorToMinor(price * basisPoints / 10000, values.currency), values.currency)));
                  patchGoal({ downPaymentInput: { mode: 'percent', basisPoints } });
                }} placeholder="20" keyboardType="decimal-pad" />}</View>
              </>}
            </>}
            <View className="gap-2"><Text className="font-inter-semibold text-base text-gf-text">{t("goals.icon")}</Text><IconPicker value={values.icon || 'fluent/flag'} onChange={(icon) => set('icon', icon)} /></View>
            <View className="gap-2"><Text className="font-inter-semibold text-base text-gf-text">{t("goals.color")}</Text><ColorPicker value={values.color} onChange={(color) => set('color', color)} /></View>
            <View className="gap-2">
              <Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.schedule")}</Text>
              <ChipPicker items={[{ id: 'off', label: t("goals.schedule.off") }, { id: 'required_by_date', label: t("goals.schedule.required") }, { id: 'fixed_contribution', label: t("goals.schedule.fixed") }]} value={values.goalDetails.schedule?.mode || 'off'} onChange={(mode) => setGoalSchedule(mode as 'off' | 'required_by_date' | 'fixed_contribution')} title={t("goals.schedule")} moreAfter={3} />
            </View>
            {values.goalDetails.schedule && <>
              <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.frequency")}</Text><ChipPicker items={(['monthly', 'semimonthly', 'biweekly', 'weekly'] as const).map((frequency) => ({ id: frequency, label: t('goals.frequency.' + frequency) }))} value={values.goalDetails.schedule.frequency} onChange={(frequency) => setGoalScheduleFrequency(frequency as GoalFrequency)} title={t("goals.frequency")} moreAfter={99} /></View>
              <DateField label={t("goals.firstPayment")} value={values.goalDetails.schedule.anchorDate} onChange={(anchorDate) => { if (values.goalDetails?.schedule) patchGoal({ schedule: { ...values.goalDetails.schedule, anchorDate } }); }} />
              <View className="gap-2">
                <Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.incomeSource")}</Text>
                <ChipPicker items={[{ id: '', label: t("goals.incomeSource.none") }, ...incomeSources.map((source) => ({ id: source._id, label: source.name || t("errors.api.incomeSourceFallback") })), ...(values.goalDetails.schedule.incomeSourceId && !incomeSources.some((source) => source._id === values.goalDetails?.schedule?.incomeSourceId) ? [{ id: values.goalDetails.schedule.incomeSourceId, label: t("goals.incomeSource.unavailable") }] : [])]} value={values.goalDetails.schedule.incomeSourceId || ''} onChange={(incomeSourceId) => {
                  const source = incomeSources.find((item) => item._id === incomeSourceId);
                  if (!values.goalDetails?.schedule) return;
                  const anchorDate = source?.anchorDate ? new Date(source.anchorDate) : null;
                  patchGoal({ schedule: { ...values.goalDetails.schedule, incomeSourceId: source?._id || null, ...(source?.recurrence ? { frequency: source.recurrence } : {}), ...(anchorDate && !Number.isNaN(anchorDate.getTime()) ? { anchorDate: dateText(anchorDate) } : {}) } });
                }} title={t("goals.incomeSource")} moreAfter={99} />
                <Text className="font-inter text-xs text-gf-text-muted">{t("goals.incomeSourceHelp")}</Text>
              </View>
              {values.goalDetails.schedule.mode === 'fixed_contribution' && <TextField label={t("goals.fixedContribution")} value={values.goalDetails.schedule.fixedContributionMoney ? String(minorToMajor(values.goalDetails.schedule.fixedContributionMoney.amountMinor, values.currency)) : ''} onChangeText={(text) => { if (values.goalDetails?.schedule) patchGoal({ schedule: { ...values.goalDetails.schedule, fixedContributionMoney: { amountMinor: majorToMinor(text.replace(',', '.'), values.currency), currency: values.currency } } }); }} placeholder="0" keyboardType="decimal-pad" />}
            </>}
            <DateField label={t("goals.savedAsOf")} value={values.goalDetails.manualSavedAsOf || dateText(new Date())} onChange={(manualSavedAsOf) => patchGoal({ manualSavedAsOf })} />
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: values.goalDetails.reminders.enabled }} onPress={() => patchGoal({ reminders: { ...values.goalDetails!.reminders, enabled: !values.goalDetails!.reminders.enabled } })} className="flex-row items-center gap-2"><Text className="text-gf-text">{values.goalDetails.reminders.enabled ? '☑' : '□'}</Text><Text className="font-inter text-sm text-gf-text">{t("goals.reminders")}</Text></Pressable>
            <Text className="font-inter text-xs text-gf-text-muted">{t("goals.contextHelp")}</Text>
            <View className="gap-3">
              <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.category")}</Text><MultiChipPicker items={categoryItems} values={values.goalDetails.context.categoryIds} onToggle={(id) => toggleGoalContext('categoryIds', id)} title={t("goals.category")} /></View>
              <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.subcategory")}</Text><MultiChipPicker items={subcategoryItems} values={values.goalDetails.context.subCategoryIds} onToggle={(id) => toggleGoalContext('subCategoryIds', id)} title={t("goals.subcategory")} /></View>
              <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.tags")}</Text><MultiChipPicker items={tagItems} values={values.goalDetails.context.tagIds} onToggle={(id) => toggleGoalContext('tagIds', id)} title={t("goals.tags")} /></View>
              <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.spendingBudgets")}</Text><MultiChipPicker items={spendingItems} values={values.goalDetails.context.spendingBudgetIds} onToggle={(id) => toggleGoalContext('spendingBudgetIds', id)} title={t("goals.spendingBudgets")} /></View>
              <View className="gap-2"><Text className="font-inter-medium text-sm text-gf-text-muted">{t("goals.project")}</Text><MultiChipPicker items={projectItems} values={values.goalDetails.context.projectBudgetIds} onToggle={(id) => toggleGoalContext('projectBudgetIds', id)} title={t("goals.project")} /></View>
            </View>
            {goalSchedule?.status === 'ready' && goalSchedule.contributionMinor !== null && <Text className="font-inter text-sm text-gf-text-muted">{t("goals.perPayment", { p1: formatMoneyMajor(minorToMajor(goalSchedule.contributionMinor, values.currency), values.currency), p2: goalSchedule.paymentDates.length })}</Text>}
            {goalSchedule?.status === 'underfunded' && <Text className="font-inter text-sm text-amber-300">{t("goals.underfundedPlan")}</Text>}
            {goalSchedule?.status === 'past_due' && <Text className="font-inter text-sm text-amber-300">{t("goals.pastDue")}</Text>}
          </>}
          <TourTarget id="m-budform-accounts" className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.cuentas.que.lo.alimentan.opcional")}</Text>
            <MultiChipPicker items={accountItems} values={values.linkedAccountIds} onToggle={(itemId) => toggle('linkedAccountIds', itemId)} title={t("mobile.cuentas.ligadas")} emptyText={t("mobile.todavia.no.tienes.cuentas")} />
          </TourTarget>
          {values.linkedAccountIds.length === 0 && (
            <View className="gap-2">
              <TourTarget id="m-budform-saved"><TextField label={t("mobile.forms.savedSoFar", { p1: values.currency })} value={values.savingAmount} onChangeText={(text) => set('savingAmount', text)} placeholder="0.00" keyboardType="numbers-and-punctuation" /></TourTarget>
              {error(errors.savingAmount)}
            </View>
          )}
        </>
      )}

      {values.kind === 'project' && (
        <>
          <TourTarget id="m-budform-start"><DateField label={t("mobile.empieza")} value={values.startDate} onChange={(day) => set('startDate', day)} /></TourTarget>
          <TourTarget id="m-budform-end" className="gap-2">
            <DateField label={t("mobile.termina")} value={values.endDate} onChange={(day) => set('endDate', day)} />
            {error(errors.endDate)}
          </TourTarget>
          <TourTarget id="m-budform-icon" className="gap-2">
            <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.icono")}</Text>
            <IconPicker value={values.icon} onChange={(icon) => set('icon', icon)} />
          </TourTarget>
        </>
      )}

      <FormError message={formError} />
      <TourTarget id="m-budform-save"><GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} /></TourTarget>
      {onDelete && (
        <Pressable accessibilityRole="button" disabled={saving} onPress={onDelete} className="items-center py-2">
          <Text className="font-inter-semibold text-base text-red-500">{t("mobile.borrar.p1", { p1: tNow(TITLE_KEYS[values.kind]) })}</Text>
        </Pressable>
      )}
    </View>
  );
}
