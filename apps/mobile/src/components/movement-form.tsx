import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { ChipPicker, type ChipItem } from '@/components/chip-picker';
import { Segmented } from '@/components/segmented';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { messageOf } from '@/lib/write';
import type { RootState } from '@/store';
import { isProjectBudget, isSpendingBudget } from '@gastify/core/transformers/budgetTypes';
import { dateText, validateMovement, buildMovementBody, type MovementErrors, type MovementType, type MovementValues } from '@gastify/core/transactions/movementForm';
import { subCategoriesOf, idOf } from '@gastify/core/categories/categoryForm';

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
];

export type MovementFormProps = {
  initial?: Partial<MovementValues>;
  submitLabel: string;
  // The add screen picks the type with its own control; the edit screen shows it here.
  hideType?: boolean;
  type?: MovementType;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onDelete?: () => void;
};

// The movement form, used to add (Agregar) and to edit a movement. Only the choices and the
// validation live here: the body comes from core's buildMovementBody.
export function MovementForm({ initial, submitLabel, hideType = false, type: fixedType, onSubmit, onDelete }: MovementFormProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const primary = useSelector((state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null)?.primaryCurrency || 'MXN');
  const { accounts, categories, subCategories, budgets } = useCatalog();

  const [values, setValues] = useState<MovementValues>(() => ({
    type: fixedType ?? initial?.type ?? 'expense',
    amount: initial?.amount ?? '',
    name: initial?.name ?? '',
    accountId: initial?.accountId ?? accounts[0]?._id ?? '',
    categoryId: initial?.categoryId ?? '',
    subCategoryId: initial?.subCategoryId ?? '',
    budgetId: initial?.budgetId ?? '',
    date: initial?.date ?? dateText(new Date()),
  }));
  const [errors, setErrors] = useState<MovementErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const type = fixedType ?? values.type;
  const set = <K extends keyof MovementValues>(key: K, value: MovementValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const accountItems: ChipItem[] = accounts.map((account) => ({ id: idOf(account), label: `${account.name} · ${account.currency || primary}` }));
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
  const currency = accounts.find((account) => idOf(account) === values.accountId)?.currency || primary;

  const pickCategory = (id: string) => {
    setValues((current) => ({ ...current, categoryId: id, subCategoryId: '' }));
  };

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

  return (
    <View className="gap-4">
      {!hideType && <Segmented options={TYPE_OPTIONS} value={type} onChange={(next) => set('type', next)} />}

      <View className="gap-2">
        <TextField
          label={`Monto (${currency})`}
          value={values.amount}
          onChangeText={(text) => set('amount', text.replace(/[^0-9.,]/g, ''))}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {errors.amount && <Text className="font-inter text-sm text-red-500">{errors.amount}</Text>}
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Cuenta</Text>
        <ChipPicker items={accountItems} value={values.accountId} onChange={(id) => set('accountId', id)} emptyText="Primero crea una cuenta en Más › Cuentas." />
        {errors.accountId && <Text className="font-inter text-sm text-red-500">{errors.accountId}</Text>}
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Categoría</Text>
        <ChipPicker items={categoryItems} value={values.categoryId} onChange={pickCategory} />
        {errors.categoryId && <Text className="font-inter text-sm text-red-500">{errors.categoryId}</Text>}
      </View>

      {subItems.length > 0 && (
        <View className="gap-2">
          <Text className="font-inter-medium text-sm text-gf-text-muted">Subcategoría</Text>
          <ChipPicker items={subcategoryChoices} value={values.subCategoryId} onChange={(id) => set('subCategoryId', id)} />
        </View>
      )}

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Presupuesto (opcional)</Text>
        <ChipPicker items={budgetItems} value={values.budgetId} onChange={(id) => set('budgetId', id)} />
      </View>

      <View className="gap-2">
        <TextField label="Fecha (AAAA-MM-DD)" value={values.date} onChangeText={(text) => set('date', text)} placeholder="2026-10-19" keyboardType="numbers-and-punctuation" />
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
        {errors.date && <Text className="font-inter text-sm text-red-500">{errors.date}</Text>}
      </View>

      <TextField label="Nombre (opcional)" value={values.name} onChangeText={(text) => set('name', text)} placeholder="Si lo dejas vacío usamos la categoría" maxLength={80} />

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
