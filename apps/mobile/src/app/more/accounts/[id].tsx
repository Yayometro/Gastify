import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { FormError } from '@/components/auth/auth-layout';
import { Screen } from '@/components/screen';
import { GradientButton } from '@/components/ui/gradient-button';
import { TextField } from '@/components/ui/text-field';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { ACCOUNT_TYPES, validateAccount, type AccountErrors } from '@gastify/core/accounts/accountForm';
import { idOf } from '@gastify/core/categories/categoryForm';
import { parseSignedMoneyText } from '@gastify/core/transactions/movementForm';

// Edits one account: name, kind and balance. The currency stays as it was created.
export default function EditAccountScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const account = useSelector((state: RootState) => state.accountsReducer.data.find((item) => idOf(item) === id));
  const [name, setName] = useState(account?.name ?? '');
  const [accountType, setAccountType] = useState<string>(account?.accountType ?? 'debit');
  const [amount, setAmount] = useState(account?.amount !== undefined && account?.amount !== null ? String(account.amount) : '0');
  const [errors, setErrors] = useState<AccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/more/accounts'));

  if (!account) {
    return (
      <Screen title="Cuenta" backLabel="Cuentas" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">No encontramos esta cuenta.</Text>
      </Screen>
    );
  }

  const currency = account.currency || 'MXN';

  const save = async () => {
    const found = validateAccount({ name, amount, accountType, currency });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await sendWrite('general-data/accounts/update-account', {
        accountId: id,
        name: name.trim(),
        amount: parseSignedMoneyText(amount) ?? 0,
        accountType,
        currency,
      });
      reloadAfterWrite(dispatch);
      back();
    } catch (e) {
      setFormError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    Alert.alert('Borrar esta cuenta', 'Se borra la cuenta. Sus movimientos siguen en tu historial. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setFormError(null);
          try {
            await sendWrite('general-data/accounts/remove-account', id);
            reloadAfterWrite(dispatch);
            back();
          } catch (e) {
            setFormError(messageOf(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen title={account.name || 'Cuenta'} subtitle={`Moneda: ${currency}`} backLabel="Cuentas" onBack={back}>
      <View className="gap-2">
        <TextField label="Nombre" value={name} onChangeText={setName} maxLength={40} />
        {errors.name && <Text className="font-inter text-sm text-red-500">{errors.name}</Text>}
      </View>
      <View className="gap-2">
        <Text className="font-inter-medium text-sm text-gf-text-muted">Tipo</Text>
        <ChipPicker items={ACCOUNT_TYPES.map((type) => ({ id: type.value, label: type.label }))} value={accountType} onChange={setAccountType} />
      </View>
      <View className="gap-2">
        <TextField label={`Saldo (${currency})`} value={amount} onChangeText={setAmount} keyboardType="numbers-and-punctuation" />
        {errors.amount && <Text className="font-inter text-sm text-red-500">{errors.amount}</Text>}
      </View>
      <FormError message={formError} />
      <GradientButton label="Guardar cambios" onPress={save} loading={busy} disabled={busy} />
      <Pressable accessibilityRole="button" disabled={busy} onPress={remove} className="items-center py-2">
        <Text className="font-inter-semibold text-base text-red-500">Borrar cuenta</Text>
      </Pressable>
    </Screen>
  );
}
