import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { FormError } from '@/components/auth/auth-layout';
import { Screen } from '@/components/screen';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch } from '@/store';
import { ACCOUNT_CURRENCIES, ACCOUNT_TYPES, validateAccount, type AccountErrors } from '@gastify/core/accounts/accountForm';
import { parseSignedMoneyText } from '@gastify/core/transactions/movementForm';

// A new account: name, kind, currency and the balance it starts with.
export default function NewAccountScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<string>('debit');
  const [currency, setCurrency] = useState('MXN');
  const [amount, setAmount] = useState('0');
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
      await sendWrite('general-data/accounts/new-account', {
        name: name.trim(),
        amount: parseSignedMoneyText(amount) ?? 0,
        accountType,
        currency,
      });
      reloadAfterWrite(dispatch);
      router.back();
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Nueva cuenta" backLabel="Cuentas" onBack={() => router.back()}>
      <View className="gap-2">
        <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Cuenta nómina" maxLength={40} />
        {errors.name && <Text className="font-inter text-sm text-red-500">{errors.name}</Text>}
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Tipo</Text>
        <ChipPicker items={ACCOUNT_TYPES.map((type) => ({ id: type.value, label: type.label }))} value={accountType} onChange={setAccountType} />
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Moneda (no se cambia después)</Text>
        <ChipPicker items={ACCOUNT_CURRENCIES.map((code) => ({ id: code, label: code }))} value={currency} onChange={setCurrency} />
      </View>
      <View className="gap-2">
        <TextField label={`Saldo inicial (${currency})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numbers-and-punctuation" />
        {errors.amount && <Text className="font-inter text-sm text-red-500">{errors.amount}</Text>}
      </View>
      <FormError message={formError} />
      <GradientButton label="Crear cuenta" onPress={save} loading={saving} disabled={saving} />
    </Screen>
  );
}
