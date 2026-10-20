import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChipPicker, MultiChipPicker, type ChipItem } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { FormError } from '@/components/auth/auth-layout';
import { IconPicker } from '@/components/icon-picker';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { useCatalog } from '@/hooks/use-catalog';
import { messageOf } from '@/lib/write';
import { ACCOUNT_CURRENCIES } from '@gastify/core/accounts/accountForm';
import { BUDGET_PERIODS, buildBudgetBody, validateBudget, type BudgetErrors, type BudgetKind, type BudgetValues } from '@gastify/core/budgets/budgetForm';
import { idOf } from '@gastify/core/categories/categoryForm';

const TITLE: Record<BudgetKind, string> = { spending: 'presupuesto', saving: 'meta de ahorro', project: 'proyecto' };

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
  const { accounts, categories } = useCatalog();
  const [values, setValues] = useState<BudgetValues>(initial);
  const [errors, setErrors] = useState<BudgetErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof BudgetValues>(key: K, value: BudgetValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const toggle = (key: 'categoryIds' | 'linkedAccountIds', itemId: string) =>
    setValues((current) => ({ ...current, [key]: current[key].includes(itemId) ? current[key].filter((x) => x !== itemId) : [...current[key], itemId] }));

  const categoryItems: ChipItem[] = categories.map((category) => ({ id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color }));
  const accountItems: ChipItem[] = accounts.map((account) => ({ id: idOf(account), label: `${account.name} · ${account.currency}` }));
  const error = (text?: string) => (text ? <Text className="font-inter text-sm text-red-500">{text}</Text> : null);

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

  return (
    <View className="gap-4">
      <View className="gap-2">
        <TextField label="Nombre" value={values.name} onChangeText={(text) => set('name', text)} placeholder={values.kind === 'project' ? 'Viaje a Oaxaca' : values.kind === 'saving' ? 'Fondo de emergencia' : 'Comida'} maxLength={60} autoCapitalize="sentences" />
        {error(errors.name)}
      </View>

      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Moneda de la meta</Text>
        <ChipPicker items={ACCOUNT_CURRENCIES.map((code) => ({ id: code, label: code }))} value={values.currency} onChange={(code) => set('currency', code)} moreAfter={99} />
        <TextField label={`Meta (${values.currency})`} value={values.goalAmount} onChangeText={(text) => set('goalAmount', text.replace(/[^0-9.,]/g, ''))} placeholder="0.00" keyboardType="decimal-pad" />
        {error(errors.goalAmount)}
      </View>

      {values.kind === 'spending' && (
        <>
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Periodo</Text>
            <ChipPicker items={BUDGET_PERIODS.map((period) => ({ id: period.value, label: period.label }))} value={values.period} onChange={(value) => set('period', value)} moreAfter={99} />
          </View>
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Categorías que cubre</Text>
            <MultiChipPicker items={categoryItems} values={values.categoryIds} onToggle={(itemId) => toggle('categoryIds', itemId)} title="Categorías del presupuesto" />
            {error(errors.categoryIds)}
          </View>
        </>
      )}

      {values.kind === 'saving' && (
        <>
          <View className="gap-2">
            <Text className="font-inter-medium text-sm text-gf-text-muted">Cuentas que lo alimentan (opcional)</Text>
            <MultiChipPicker items={accountItems} values={values.linkedAccountIds} onToggle={(itemId) => toggle('linkedAccountIds', itemId)} title="Cuentas ligadas" emptyText="Todavía no tienes cuentas." />
          </View>
          {values.linkedAccountIds.length === 0 && (
            <View className="gap-2">
              <TextField label={`Ahorrado hasta ahora (${values.currency})`} value={values.savingAmount} onChangeText={(text) => set('savingAmount', text)} placeholder="0.00" keyboardType="numbers-and-punctuation" />
              {error(errors.savingAmount)}
            </View>
          )}
        </>
      )}

      {values.kind === 'project' && (
        <>
          <DateField label="Empieza" value={values.startDate} onChange={(day) => set('startDate', day)} />
          <View className="gap-2">
            <DateField label="Termina" value={values.endDate} onChange={(day) => set('endDate', day)} />
            {error(errors.endDate)}
          </View>
          <View className="gap-2">
            <Text className="font-inter-semibold text-base text-gf-text">Ícono</Text>
            <IconPicker value={values.icon} onChange={(icon) => set('icon', icon)} />
          </View>
        </>
      )}

      <FormError message={formError} />
      <GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} />
      {onDelete && (
        <Pressable accessibilityRole="button" disabled={saving} onPress={onDelete} className="items-center py-2">
          <Text className="font-inter-semibold text-base text-red-500">Borrar {TITLE[values.kind]}</Text>
        </Pressable>
      )}
    </View>
  );
}
