import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { fetchAccounts, type AccountData } from '@gastify/core/features/accountsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { authClient } from '@/auth-client';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import type { AppDispatch, RootState } from '@/store';

// First real data: the signed-in user's accounts, loaded with the same Redux slice and API route
// as the web app. The monthly summary and the rest arrive in phase 4.
export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session } = authClient.useSession();
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const accounts: AccountData[] = Array.isArray(accountsState.data) ? accountsState.data : [];

  useEffect(() => {
    // The route reads the user from the session; the argument (the web passes the mail) is ignored.
    dispatch(fetchAccounts(undefined));
  }, [dispatch]);

  const firstName = session?.user.name?.split(' ')[0];

  return (
    <PlaceholderScreen
      title={firstName ? `Hola, ${firstName}` : 'Inicio'}
      text="Tu resumen del mes llega en la siguiente fase.">
      <View className="gap-3 rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-sm text-gf-text">Tus cuentas</Text>
        {accountsState.status === 'failed' && (
          <Text className="font-inter text-sm text-red-500">No pudimos cargar tus cuentas.</Text>
        )}
        {accountsState.status !== 'failed' && accounts.length === 0 && (
          <Text className="font-inter text-sm text-gf-text-muted">
            {accountsState.status === 'loading' ? 'Cargando…' : 'Todavía no tienes cuentas.'}
          </Text>
        )}
        {accounts.map((account) => (
          <View key={String(account._id ?? account.name)} className="flex-row items-center justify-between">
            <Text className="flex-1 font-inter-medium text-base text-gf-text">{account.name}</Text>
            <Text className="font-inter-semibold text-base text-gf-text">
              {formatMoneyMajor(account.amount ?? 0, account.currency ?? 'MXN')}
            </Text>
          </View>
        ))}
      </View>
    </PlaceholderScreen>
  );
}
