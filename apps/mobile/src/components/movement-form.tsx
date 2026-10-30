import { useEffect, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { CategoryPicker } from '@/components/category-picker';
import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { Segmented } from '@/components/segmented';
import { TourTarget } from '@/components/tour/tour-target';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { messageOf } from '@/lib/write';
import type { RootState } from '@/store';
import { GfSwitch } from '@/components/ui/switch';
import { getApi } from '@gastify/core/api/client';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor, majorToMinor, minorToMajor, SUPPORTED_CURRENCIES } from '@gastify/core/money/currencies';
import { isProjectBudget, isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import {
  buildMovementBody,
  dateText,
  parseMoneyText,
  validateMovement,
  type MovementErrors,
  type MovementType,
  type MovementValues,
} from '@gastify/core/transactions/movementForm';
import { RecurringFields, NO_RECURRING, type RecurringChoice } from '@/components/recurring/recurring-fields';
import { useT } from "@/i18n/client";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import { tNow } from '@/i18n/now';

const TYPE_OPTIONS = (t: TranslateFn): { value: MovementType; label: string }[] => ([
  { value: 'expense', label: t("mobile.gasto") },
  { value: 'income', label: t("mobile.ingreso") },
]);

type FxAnswer = { ok?: boolean; data?: { amountMinor: number; stale?: boolean; effectiveDate?: string } };

export type MovementFormProps = {
  initial?: Partial<MovementValues>;
  submitLabel: string;
  // The add screen picks the type with its own control; the edit screen shows it here.
  hideType?: boolean;
  type?: MovementType;
  // Only the add screen offers "recurring expense": the second argument says how it repeats when the person turned it on.
  allowRecurring?: boolean;
  onSubmit: (body: Record<string, unknown>, recurring?: RecurringChoice) => Promise<void>;
  onDelete?: () => void;
};

// The movement form, used to add (Agregar) and to edit a movement. Only the choices and the validation
// live here: the body comes from core's buildMovementBody. Same fields as the web: name, amount in the
// account's currency (optionally also what the merchant charged in another currency, with the rate
// suggested), account, category, sub-category, budget, date and tags.
export function MovementForm({ initial, submitLabel, hideType = false, type: fixedType, allowRecurring = false, onSubmit, onDelete }: MovementFormProps) {
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const primary = useSelector((state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null)?.primaryCurrency || 'MXN');
  const { accounts, categories, subCategories, budgets } = useCatalog();

  const [values, setValues] = useState<MovementValues>(() => ({
    type: fixedType ?? initial?.type ?? 'expense',
    amount: initial?.amount ?? '',
    name: initial?.name ?? '',
    accountId: initial?.accountId ?? (accounts[0] ? idOf(accounts[0]) : ''),
    categoryId: initial?.categoryId ?? '',
    subCategoryId: initial?.subCategoryId ?? '',
    budgetId: initial?.budgetId ?? '',
    date: initial?.date ?? dateText(new Date()),
    chargedElsewhere: initial?.chargedElsewhere ?? false,
    merchantAmount: initial?.merchantAmount ?? '',
    merchantCurrency: initial?.merchantCurrency ?? 'USD',
    tags: initial?.tags ?? '',
  }));
  const [recurring, setRecurring] = useState<RecurringChoice>(NO_RECURRING);
  const [errors, setErrors] = useState<MovementErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [amountTouched, setAmountTouched] = useState(Boolean(initial?.amount));
  const [quoting, setQuoting] = useState(false);
  const [quoteNote, setQuoteNote] = useState<string | null>(null);

  const type = fixedType ?? values.type;
  const set = <K extends keyof MovementValues>(key: K, value: MovementValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const accountCurrency = accounts.find((account) => idOf(account) === values.accountId)?.currency || primary;
  const rates = useRatesToPrimary([accountCurrency], primary);

  // Like the web: when it was charged in another currency, the amount that left the account is suggested
  // from a live estimate (debounced), unless the person already typed it.
  useEffect(() => {
    if (!values.chargedElsewhere) return;
    const merchant = parseMoneyText(values.merchantAmount);
    if (merchant === null) return;
    if (values.merchantCurrency === accountCurrency) {
      if (!amountTouched) setValues((current) => ({ ...current, amount: current.merchantAmount }));
      setQuoteNote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const answer = await getApi().post<FxAnswer>('general-data/fx/quote', {
          amountMinor: majorToMinor(merchant, values.merchantCurrency),
          fromCurrency: values.merchantCurrency,
          toCurrency: accountCurrency,
        });
        if (cancelled || !answer?.ok || !answer.data) return;
        if (!amountTouched) {
          setValues((current) => ({ ...current, amount: String(minorToMajor(answer.data!.amountMinor, accountCurrency)) }));
        }
        setQuoteNote(answer.data.stale ? t("mobile.tipo.de.cambio.estimado.puede.estar.desactualizado") : t("mobile.tipo.de.cambio.estimado.de.hoy"));
      } catch {
        if (!cancelled) setQuoteNote(t("mobile.no.pudimos.estimar.el.tipo.de.cambio.escribe.el.monto.de.la."));
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [values.chargedElsewhere, values.merchantAmount, values.merchantCurrency, accountCurrency, amountTouched, t]);

  const accountItems: ChipItem[] = accounts.map((account) => ({
    id: idOf(account),
    label: `${account.name} · ${account.currency || primary}`,
    detail: formatMoneyMajor(account.amount ?? 0, account.currency || primary),
  }));
  const budgetItems: ChipItem[] = [
    { id: '', label: t("mobile.ninguno") },
    ...budgets.filter((budget) => isSpendingBudget(budget) || isProjectBudget(budget)).map((budget) => ({ id: idOf(budget), label: budget.name || t("budgets.alert.defaultName"), icon: budget.icon })),
  ];
  const currencyItems: ChipItem[] = SUPPORTED_CURRENCIES.map((code) => ({ id: code, label: code }));

  const typedAmount = parseMoneyText(values.amount);
  const rate = rates[accountCurrency];
  const equivalent = typedAmount !== null && accountCurrency !== primary && rate ? formatMoneyMajor(typedAmount * rate, primary) : null;

  const submit = async () => {
    const found = validateMovement(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    const category = categories.find((item) => idOf(item) === values.categoryId);
    const sub = subCategories.find((item) => idOf(item) === values.subCategoryId);
    const fallbackName = sub?.name || category?.name || t("errors.api.movement");
    setSubmitting(true);
    try {
      await onSubmit(buildMovementBody({ ...values, type }, fallbackName), allowRecurring && type === 'expense' && recurring.on ? recurring : undefined);
    } catch (error) {
      setFormError(messageOf(error));
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (key?: string) => (key ? <Text className="font-inter text-sm text-red-500">{t(key)}</Text> : null);

  return (
    <View className="gap-4">
      <TourTarget id="m-movform-type">{!hideType && <Segmented options={TYPE_OPTIONS(t)} value={type} onChange={(next) => set('type', next)} />}</TourTarget>

      <TourTarget id="m-movform-name"><TextField label={t("mobile.nombre.opcional")} value={values.name} onChangeText={(text) => set('name', text)} placeholder={t("mobile.si.lo.dejas.vacio.usamos")} maxLength={80} autoCapitalize="sentences" /></TourTarget>

      <View className="gap-2">
        <TourTarget id="m-movform-amount">
          <TextField
            label={t("mobile.forms.amountLabel", { p1: accountCurrency })}
            value={values.amount}
            onChangeText={(text) => {
              setAmountTouched(true);
              set('amount', text.replace(/[^0-9.,]/g, ''));
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </TourTarget>
        {equivalent && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.p1.en.tu.moneda.principal", { p1: equivalent })}</Text>}
        {errorText(errors.amount)}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">{t("mobile.cobrado.en.otra.moneda")}</Text>
          <GfSwitch
            value={values.chargedElsewhere}
            accessibilityLabel={t("mobile.cobrado.en.otra.moneda")}
            onValueChange={(on) => {
              set('chargedElsewhere', on);
              if (!on) setQuoteNote(null);
            }}
          />
        </View>
        {values.chargedElsewhere && (
          <TourTarget id="m-movform-currency" className="gap-3 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.moneda.del.cobro")}</Text>
            <ChipPicker items={currencyItems} value={values.merchantCurrency} onChange={(code) => set('merchantCurrency', code)} moreAfter={99} />
            <TextField
              label={t("mobile.forms.merchantCharged", { p1: values.merchantCurrency })}
              value={values.merchantAmount}
              onChangeText={(text) => set('merchantAmount', text.replace(/[^0-9.,]/g, ''))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            {errorText(errors.merchantAmount)}
            <Text className="font-inter text-sm text-gf-text-muted">
              {quoting ? t("mobile.calculando.el.monto.de.la.cuenta") : quoteNote ?? tNow("mobile.el.monto.de.arriba.p1.es.lo.que.salio.de.la.cuenta.puedes.co", { p1: accountCurrency })}
            </Text>
          </TourTarget>
        )}
      </View>

      <TourTarget id="m-movform-account" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.cuenta")}</Text>
        <ChipPicker items={accountItems} value={values.accountId} onChange={(id) => set('accountId', id)} title={t("mobile.cuentas")} emptyText={t("mobile.primero.crea.una.cuenta.en.mas.cuentas")} />
        {errorText(errors.accountId)}
      </TourTarget>

      <TourTarget id="m-movform-category" className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.categoria.y.subcategoria")}</Text>
        <CategoryPicker
          categories={categories}
          subCategories={subCategories}
          allLabel={t("history.noCategory")}
          value={{ categoryId: values.categoryId, subCategoryId: values.subCategoryId }}
          onChange={(next) => setValues((current) => ({ ...current, categoryId: next.categoryId, subCategoryId: next.subCategoryId }))}
        />
        {errorText(errors.categoryId)}
      </TourTarget>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.presupuesto.opcional")}</Text>
        <TourTarget id="m-movform-budget"><ChipPicker items={budgetItems} value={values.budgetId} onChange={(id) => set('budgetId', id)} title={t("mobile.presupuestos")} /></TourTarget>
      </View>

      <View className="gap-2">
        <TourTarget id="m-movform-date"><DateField label={t("mobile.fecha")} value={values.date} onChange={(day) => set('date', day)} /></TourTarget>
        <View className="flex-row gap-2">
          {[
            { label: t("mobile.hoy"), offset: 0 },
            { label: t("mobile.ayer"), offset: -1 },
          ].map((quick) => (
            <Pressable
              key={quick.label}
              accessibilityRole="button"
              onPress={() => {
                const day = new Date();
                day.setDate(day.getDate() + quick.offset);
                set('date', dateText(day));
              }}
              className="rounded-full border px-3 py-1.5"
              style={{ borderColor: colors.border }}>
              <Text className="font-inter-medium text-sm text-gf-text">{quick.label}</Text>
            </Pressable>
          ))}
        </View>
        {errorText(errors.date)}
      </View>

      {allowRecurring && type === 'expense' && <RecurringFields value={recurring} onChange={setRecurring} />}

      <TourTarget id="m-movform-tags"><TextField label={t("mobile.etiquetas.separadas.por.comas")} value={values.tags} onChangeText={(text) => set('tags', text)} placeholder={t("mobile.viaje.trabajo")} autoCapitalize="none" /></TourTarget>

      <FormError message={formError} />
      <TourTarget id="m-movform-save"><GradientButton label={submitLabel} onPress={submit} loading={submitting} disabled={submitting} /></TourTarget>

      {onDelete && (
        <Pressable accessibilityRole="button" onPress={onDelete} className="items-center py-2">
          <Text className="font-inter-semibold text-base text-red-500">{t("mobile.borrar.movimiento")}</Text>
        </Pressable>
      )}
    </View>
  );
}
