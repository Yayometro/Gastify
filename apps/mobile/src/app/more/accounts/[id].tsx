import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { Card } from '@/components/ui/card';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { monthBounds, monthTotals, sortNewestFirst } from '@gastify/core/transactions/monthSummary';

// Edits one account: name, kind and balance. The currency stays as it was created.
export default function EditAccountScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const account = useSelector((state: RootState) => state.accountsReducer.data.find((item) => idOf(item) === id));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/more/accounts'));
  const primary = usePrimaryCurrency();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const mine = useMemo(() => sortNewestFirst(transactions.filter((movement) => idOf(movement.account) === id)), [transactions, id]);
  const month = useMemo(() => {
    const now = new Date();
    const bounds = monthBounds(now.getFullYear(), now.getMonth());
    return monthTotals(mine.filter((movement) => isInRange(movement, bounds)));
  }, [mine]);

  if (!account) {
    return (
      <Screen title="Cuenta" backLabel="Cuentas" onBack={back}>
        <Text className="font-inter text-base text-gf-text-muted">No encontramos esta cuenta.</Text>
      </Screen>
    );
  }

  const remove = () => {
    Alert.alert('Borrar esta cuenta', 'Se borra la cuenta. Sus movimientos siguen en tu historial. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await sendWrite('general-data/accounts/remove-account', id);
            toast.show('Cuenta borrada');
            reloadAfterWrite(dispatch);
            back();
          } catch (e) {
            toast.show(messageOf(e), 'error');
          }
        },
      },
    ]);
  };

  return (
    <Screen title={account.name || 'Cuenta'} subtitle={`Moneda: ${account.currency || 'MXN'}`} backLabel="Cuentas" onBack={back}>
      <Card title="Actividad de este mes" info={{ title: 'Actividad de este mes', text: 'Lo que entró y salió de esta cuenta en el mes, y cuántos movimientos hubo. Las transferencias entre tus cuentas no cuentan como ingreso ni gasto.' }}>
        <View className="flex-row justify-between">
          <Text className="font-inter text-base text-gf-text-muted">Entró</Text>
          <Text className="font-inter-semibold text-base text-gf-text">+{formatMoneyMajor(month.incomes, primary)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-inter text-base text-gf-text-muted">Salió</Text>
          <Text className="font-inter-semibold text-base text-gf-text">-{formatMoneyMajor(month.spending, primary)}</Text>
        </View>
        {mine.slice(0, 5).map((movement) => (
          <MovementRow key={String(movement._id)} movement={movement} currency={primary} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: `/more/accounts/${id}` } })} />
        ))}
        {mine.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Esta cuenta todavía no tiene movimientos.</Text>}
        {mine.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/movements', params: { accountId: id, returnTo: `/more/accounts/${id}` } })}>
            <Text className="font-inter-semibold text-sm text-gf-text">Ver todos los movimientos de esta cuenta ›</Text>
          </Pressable>
        )}
      </Card>
      <AccountForm
        key={id}
        currencyLocked
        initial={{ name: account.name ?? '', accountType: account.accountType ?? 'debit', currency: account.currency || 'MXN', amount: account.amount !== undefined && account.amount !== null ? String(account.amount) : '0' }}
        submitLabel="Guardar cambios"
        onSubmit={async (values) => {
          await sendWrite('general-data/accounts/update-account', { accountId: id, ...values });
          toast.show('Cuenta guardada');
          reloadAfterWrite(dispatch);
          back();
        }}
      />
      <Pressable accessibilityRole="button" onPress={remove} className="items-center py-2">
        <Text className="font-inter-semibold text-base text-red-500">Borrar cuenta</Text>
      </Pressable>
    </Screen>
  );
}
