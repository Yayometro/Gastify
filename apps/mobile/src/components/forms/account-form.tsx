import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { FormError } from '@/components/auth/auth-layout';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { messageOf } from '@/lib/write';
import { ACCOUNT_CURRENCIES, ACCOUNT_TYPES, validateAccount, type AccountErrors } from '@gastify/core/accounts/accountForm';
import { parseSignedMoneyText } from '@gastify/core/transactions/movementForm';

export type AccountSubmit = { name: string; amount: number; accountType: string; currency: string };

// An account: name, kind, currency (fixed once created) and balance. Used by "Nueva cuenta", the edit
// screen and the "+" menu.
export function AccountForm({
  initial,
  submitLabel,
  currencyLocked = false,
  onSubmit,
}: {
  initial?: { name: string; accountType: string; currency: string; amount: string };
  submitLabel: string;
  currencyLocked?: boolean;
  onSubmit: (values: AccountSubmit) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [accountType, setAccountType] = useState(initial?.accountType ?? 'debit');
  const [currency, setCurrency] = useState(initial?.currency ?? 'MXN');
  const [amount, setAmount] = useState(initial?.amount ?? '0');
  const [errors, setErrors] = useState<AccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const found = validateAccount({ name, amount, accountType, currency });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), amount: parseSignedMoneyText(amount) ?? 0, accountType, currency });
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="gap-2">
        <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Cuenta nómina" maxLength={40} autoCapitalize="sentences" />
        {errors.name && <Text className="font-inter text-sm text-red-500">{errors.name}</Text>}
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Tipo</Text>
        <ChipPicker items={ACCOUNT_TYPES.map((type) => ({ id: type.value, label: type.label }))} value={accountType} onChange={setAccountType} />
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">{currencyLocked ? `Moneda: ${currency} (no se cambia)` : 'Moneda (no se cambia después)'}</Text>
        {!currencyLocked && <ChipPicker items={ACCOUNT_CURRENCIES.map((code) => ({ id: code, label: code }))} value={currency} onChange={setCurrency} moreAfter={99} />}
      </View>
      <View className="gap-2">
        <TextField label={`Saldo (${currency})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numbers-and-punctuation" />
        {errors.amount && <Text className="font-inter text-sm text-red-500">{errors.amount}</Text>}
      </View>
      <FormError message={formError} />
      <GradientButton label={submitLabel} onPress={save} loading={saving} disabled={saving} />
    </View>
  );
}
