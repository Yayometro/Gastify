import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { AccountForm } from '@/components/forms/account-form';
import { Screen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { reloadAfterWrite } from '@/hooks/use-load-app-data';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';

// Edits one account: name, kind and balance. The currency stays as it was created.
export default function EditAccountScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const account = useSelector((state: RootState) => state.accountsReducer.data.find((item) => idOf(item) === id));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/more/accounts'));

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
