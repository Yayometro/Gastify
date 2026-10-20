import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { balancesByCurrency, totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

// What each kind of account is called in the web's forms.
const ACCOUNT_TYPES: Record<string, string> = {
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Efectivo',
  savings: 'Ahorro',
};

// Every account with its balance in its own currency, and the total in the primary currency when
// every currency has a rate yet. Opened from Más, so it has a link back to that list.
export default function AccountsScreen() {
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();

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

  return (
    <Screen
      title="Cuentas"
      backLabel="Más"
      onBack={() => router.back()}
      refreshing={refreshing}
      onRefresh={refresh}>
      {accountsState.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">No pudimos cargar tus cuentas.</Text>
      )}
      {loading && <Text className="font-inter text-sm text-gf-text-muted">Cargando…</Text>}
      {!loading && accounts.length === 0 && accountsState.status !== 'failed' && (
        <Text className="font-inter text-sm text-gf-text-muted">Todavía no tienes cuentas.</Text>
      )}

      {accounts.length > 0 && (
        <Card title="Total">
          <Text className="font-inter-bold text-3xl text-gf-text">{formatMoneyMajor(total.total, currency)}</Text>
          {Object.entries(byCurrency)
            .filter(([code]) => code !== currency)
            .map(([code, amount]) => (
              <View key={code} className="flex-row justify-between">
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

      {accounts.map((account) => (
        <Card key={String(account._id ?? account.name)}>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>
                {account.name || 'Cuenta'}
              </Text>
              <Text className="font-inter text-sm text-gf-text-muted" numberOfLines={1}>
                {[ACCOUNT_TYPES[account.accountType ?? ''] ?? account.accountType, account.institution]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Text className="font-inter-bold text-lg text-gf-text">
              {formatMoneyMajor(account.amount ?? 0, account.currency || currency)}
            </Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
