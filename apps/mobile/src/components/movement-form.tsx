import { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { Segmented } from '@/components/segmented';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { messageOf } from '@/lib/write';
import type { RootState } from '@/store';
import { getApi } from '@gastify/core/api/client';
import { idOf, subCategoriesOf } from '@gastify/core/categories/categoryForm';
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

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
];

type FxAnswer = { ok?: boolean; data?: { amountMinor: number; stale?: boolean; effectiveDate?: string } };

export type MovementFormProps = {
  initial?: Partial<MovementValues>;
  submitLabel: string;
  // The add screen picks the type with its own control; the edit screen shows it here.
  hideType?: boolean;
  type?: MovementType;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onDelete?: () => void;
};

// The movement form, used to add (Agregar) and to edit a movement. Only the choices and the validation
// live here: the body comes from core's buildMovementBody. Same fields as the web: name, amount in the
// account's currency (optionally also what the merchant charged in another currency, with the rate
// suggested), account, category, sub-category, budget, date and tags.
export function MovementForm({ initial, submitLabel, hideType = false, type: fixedType, onSubmit, onDelete }: MovementFormProps) {
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
        setQuoteNote(answer.data.stale ? 'Tipo de cambio estimado (puede estar desactualizado).' : 'Tipo de cambio estimado de hoy.');
      } catch {
        if (!cancelled) setQuoteNote('No pudimos estimar el tipo de cambio; escribe el monto de la cuenta.');
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [values.chargedElsewhere, values.merchantAmount, values.merchantCurrency, accountCurrency, amountTouched]);

  const accountItems: ChipItem[] = accounts.map((account) => ({
    id: idOf(account),
    label: `${account.name} · ${account.currency || primary}`,
    detail: formatMoneyMajor(account.amount ?? 0, account.currency || primary),
  }));
  const categoryItems: ChipItem[] = categories.map((category) => ({ id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color }));
  const subItems = useMemo(() => subCategoriesOf(subCategories, values.categoryId), [subCategories, values.categoryId]);
  const subcategoryChoices: ChipItem[] = [
    { id: '', label: 'Ninguna' },
    ...subItems.map((sub) => ({ id: idOf(sub), label: sub.name || 'Subcategoría', icon: sub.icon, color: sub.color })),
  ];
  const budgetItems: ChipItem[] = [
    { id: '', label: 'Ninguno' },
    ...budgets.filter((budget) => isSpendingBudget(budget) || isProjectBudget(budget)).map((budget) => ({ id: idOf(budget), label: budget.name || 'Presupuesto', icon: budget.icon })),
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
    const fallbackName = sub?.name || category?.name || 'Movimiento';
    setSubmitting(true);
    try {
      await onSubmit(buildMovementBody({ ...values, type }, fallbackName));
    } catch (error) {
      setFormError(messageOf(error));
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (text?: string) => (text ? <Text className="font-inter text-sm text-red-500">{text}</Text> : null);

  return (
    <View className="gap-4">
      {!hideType && <Segmented options={TYPE_OPTIONS} value={type} onChange={(next) => set('type', next)} />}

      <TextField label="Nombre (opcional)" value={values.name} onChangeText={(text) => set('name', text)} placeholder="Si lo dejas vacío usamos la categoría" maxLength={80} autoCapitalize="sentences" />

      <View className="gap-2">
        <TextField
          label={`Monto (${accountCurrency})`}
          value={values.amount}
          onChangeText={(text) => {
            setAmountTouched(true);
            set('amount', text.replace(/[^0-9.,]/g, ''));
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {equivalent && <Text className="font-inter text-sm text-gf-text-muted">≈ {equivalent} (en tu moneda principal)</Text>}
        {errorText(errors.amount)}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter-medium text-base text-gf-text">Cobrado en otra moneda</Text>
          <Switch
            value={values.chargedElsewhere}
            onValueChange={(on) => {
              set('chargedElsewhere', on);
              if (!on) setQuoteNote(null);
            }}
            trackColor={{ true: colors.accent }}
          />
        </View>
        {values.chargedElsewhere && (
          <View className="gap-3 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Moneda del cobro</Text>
            <ChipPicker items={currencyItems} value={values.merchantCurrency} onChange={(code) => set('merchantCurrency', code)} moreAfter={99} />
            <TextField
              label={`Lo que cobró el comercio (${values.merchantCurrency})`}
              value={values.merchantAmount}
              onChangeText={(text) => set('merchantAmount', text.replace(/[^0-9.,]/g, ''))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            {errorText(errors.merchantAmount)}
            <Text className="font-inter text-sm text-gf-text-muted">
              {quoting ? 'Calculando el monto de la cuenta…' : quoteNote ?? `El monto de arriba (${accountCurrency}) es lo que salió de la cuenta; puedes corregirlo.`}
            </Text>
          </View>
        )}
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Cuenta</Text>
        <ChipPicker items={accountItems} value={values.accountId} onChange={(id) => set('accountId', id)} title="Cuentas" emptyText="Primero crea una cuenta en Más › Cuentas." />
        {errorText(errors.accountId)}
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Categoría</Text>
        <ChipPicker items={categoryItems} value={values.categoryId} onChange={(id) => setValues((current) => ({ ...current, categoryId: id, subCategoryId: '' }))} title="Categorías" />
        {errorText(errors.categoryId)}
      </View>

      {subItems.length > 0 && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">Subcategoría</Text>
          <ChipPicker items={subcategoryChoices} value={values.subCategoryId} onChange={(id) => set('subCategoryId', id)} title="Subcategorías" />
        </View>
      )}

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Presupuesto (opcional)</Text>
        <ChipPicker items={budgetItems} value={values.budgetId} onChange={(id) => set('budgetId', id)} title="Presupuestos" />
      </View>

      <View className="gap-2">
        <DateField label="Fecha" value={values.date} onChange={(day) => set('date', day)} />
        <View className="flex-row gap-2">
          {[
            { label: 'Hoy', offset: 0 },
            { label: 'Ayer', offset: -1 },
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

      <TextField label="Etiquetas (separadas por comas)" value={values.tags} onChangeText={(text) => set('tags', text)} placeholder="viaje, trabajo" autoCapitalize="none" />

      <FormError message={formError} />
      <GradientButton label={submitLabel} onPress={submit} loading={submitting} disabled={submitting} />

      {onDelete && (
        <Pressable accessibilityRole="button" onPress={onDelete} className="items-center py-2">
          <Text className="font-inter-semibold text-base text-red-500">Borrar movimiento</Text>
        </Pressable>
      )}
    </View>
  );
}
