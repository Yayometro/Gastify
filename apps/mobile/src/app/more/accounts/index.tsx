import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountCard } from '@/components/account-card';
import { Screen } from '@/components/screen';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useIsTablet } from '@/hooks/use-device-class';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { reloadAfterWrite, useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { messageOf, sendWrite } from '@/lib/write';
import type { RootState } from '@/store';
import { accountActivity } from '@gastify/core/accounts/accountActivity';
import { balancesByCurrency, totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { monthBounds } from '@gastify/core/transactions/monthSummary';
import { moveInList } from '@gastify/core/accounts/accountForm';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { APP_INFO } from '@gastify/core/info/appInfo';

// Every account with its balance in its own currency and the total in the primary one. Tap one to
// edit it; the arrows change the order the accounts are listed in (the web's order, saved on the server).
export default function AccountsScreen() {
  const tablet = useIsTablet();
  const dispatch = useDispatch<AppDispatch>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();
  const [error, setError] = useState<string | null>(null);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const bounds = useMemo(() => {
    const now = new Date();
    return monthBounds(now.getFullYear(), now.getMonth());
  }, []);
  const cardActivity = useMemo(() => accountActivity(transactions, bounds), [transactions, bounds]);

  const accounts = useMemo(
    () =>
      [...accountsState.data].sort(
        (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.name).localeCompare(String(b.name))
      ),
    [accountsState.data]
  );
  const rates = useRatesToPrimary(
    accounts.map((account) => account.currency),
    currency
  );
  const total = useMemo(() => totalInPrimary(accounts, currency, rates), [accounts, currency, rates]);
  const byCurrency = useMemo(() => balancesByCurrency(accounts), [accounts]);
  const loading = accountsState.status === 'loading' && accounts.length === 0;

  const move = async (index: number, delta: -1 | 1) => {
    const ids = moveInList(accounts.map(idOf), index, delta);
    if (ids.join() === accounts.map(idOf).join()) return;
    setError(null);
    try {
      await sendWrite('general-data/accounts/reorder', { orderedIds: ids });
      reloadAfterWrite(dispatch);
    } catch (e) {
      setError(messageOf(e));
    }
  };

  return (
    <Screen title="Cuentas" backLabel="Más" onBack={() => router.back()} refreshing={refreshing} onRefresh={refresh}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/more/accounts/new')} className="items-center rounded-3xl bg-gf-surface p-4">
        <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>
          Nueva cuenta
        </Text>
      </Pressable>

      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
      {accountsState.status === 'failed' && <Text className="font-inter text-sm text-red-500">No pudimos cargar tus cuentas.</Text>}
      {loading && <SkeletonRows count={3} />}
      {!loading && accounts.length === 0 && accountsState.status !== 'failed' && (
        <Text className="font-inter text-sm text-gf-text-muted">Todavía no tienes cuentas. Crea la primera con «Nueva cuenta».</Text>
      )}

      {accounts.length > 0 && (
        <Card title="Total" info={APP_INFO.total}>
          <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(total.total, currency)}</Text>
          {Object.entries(byCurrency)
            .filter(([code]) => code !== currency)
            .map(([code, amount]) => (
              <View key={code} className={tablet ? 'flex-row items-center gap-4' : 'flex-row justify-between'}>
                <Text className="font-inter text-sm text-gf-text-muted">Saldo en {code}</Text>
                <Text className="font-inter-medium text-sm text-gf-text">{formatMoneyMajor(amount, code)}</Text>
              </View>
            ))}
          {total.missingCurrencies.length > 0 && (
            <Text className="font-inter text-sm text-gf-text-muted">
              {`Sin tipo de cambio para ${total.missingCurrencies.join(', ')}: esas cuentas no suman en el total.`}
            </Text>
          )}
        </Card>
      )}

      <View className="flex-row flex-wrap gap-4">
      {accounts.map((account, index) => (
        <View key={idOf(account) || String(index)} className="flex-row items-center gap-3" style={tablet ? { flexBasis: '47%', flexGrow: 1 } : { width: '100%' }}>
          <View className="flex-1">
            <AccountCard
              account={account}
              primary={currency}
              activity={cardActivity[idOf(account)]}
              rate={rates[account.currency ?? '']}
              width={undefined}
              onPress={() => router.push({ pathname: '/more/accounts/[id]', params: { id: idOf(account) } })}
            />
          </View>
          <View className="gap-1">
            <Pressable accessibilityRole="button" accessibilityLabel="Subir cuenta" disabled={index === 0} onPress={() => move(index, -1)} hitSlop={6}>
              <Text className="font-inter-bold text-base" style={{ color: index === 0 ? colors.border : colors.accent }}>▲</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Bajar cuenta" disabled={index === accounts.length - 1} onPress={() => move(index, 1)} hitSlop={6}>
              <Text className="font-inter-bold text-base" style={{ color: index === accounts.length - 1 ? colors.border : colors.accent }}>▼</Text>
            </Pressable>
          </View>
        </View>
      ))}
      </View>
    </Screen>
  );
}
