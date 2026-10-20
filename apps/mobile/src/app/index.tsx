import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { CategoryBadge } from '@/components/category-badge';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { TotalsCard } from '@/components/totals-card';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import {
  monthBounds,
  monthTotals,
  movementsInMonth,
  sortNewestFirst,
  topSpendingCategories,
} from '@gastify/core/transactions/monthSummary';

function Muted({ children }: { children: string }) {
  return <Text className="font-inter text-sm text-gf-text-muted">{children}</Text>;
}

function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  const scheme = useColorScheme();
  const accent = Colors[scheme === 'dark' ? 'dark' : 'light'].accent;
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text className="font-inter-semibold text-sm" style={{ color: accent }}>
        {label}
      </Text>
    </Pressable>
  );
}

// The summary of the current month, the same numbers as the web's dashboard: totals, the
// categories where the money goes, the last movements and the accounts.
export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();

  const now = useMemo(() => new Date(), []);
  const bounds = useMemo(() => monthBounds(now.getFullYear(), now.getMonth()), [now]);
  const monthItems = useMemo(() => movementsInMonth(transactions.data, bounds), [transactions.data, bounds]);
  const totals = useMemo(() => monthTotals(monthItems), [monthItems]);
  const topCategories = useMemo(() => topSpendingCategories(monthItems, 3), [monthItems]);
  const latest = useMemo(() => sortNewestFirst(transactions.data).slice(0, 5), [transactions.data]);

  const accounts = accountsState.data;
  const rates = useRatesToPrimary(
    accounts.map((account) => account.currency),
    currency
  );
  const accountTotal = useMemo(() => totalInPrimary(accounts, currency, rates), [accounts, currency, rates]);

  const firstName = session?.user.name?.split(' ')[0];
  const loadingMovements = transactions.status === 'loading' && transactions.data.length === 0;

  return (
    <Screen
      title={firstName ? `Hola, ${firstName}` : 'Inicio'}
      subtitle={monthTitleEs(now)}
      refreshing={refreshing}
      onRefresh={refresh}>
      {transactions.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">
          No pudimos cargar tus movimientos. Desliza hacia abajo para intentarlo de nuevo.
        </Text>
      )}

      <TotalsCard totals={totals} currency={currency} />

      <Card title="Mayores gastos">
        {loadingMovements ? (
          <Muted>Cargando…</Muted>
        ) : topCategories.length === 0 ? (
          <Muted>Sin gastos este mes.</Muted>
        ) : (
          topCategories.map((row) => (
            <View key={row.name} className="flex-row items-center gap-3">
              <CategoryBadge icon={row.icon} color={row.color} size={40} />
              <View className="flex-1">
                <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>
                  {row.name}
                </Text>
                <Text className="font-inter text-sm text-gf-text-muted">
                  {row.count === 1 ? '1 movimiento' : `${row.count} movimientos`}
                </Text>
              </View>
              <Text className="font-inter-semibold text-base text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Últimos movimientos" action={<LinkText label="Ver todos" onPress={() => router.push('/movements')} />}>
        {loadingMovements ? (
          <Muted>Cargando…</Muted>
        ) : latest.length === 0 ? (
          <Muted>Todavía no tienes movimientos.</Muted>
        ) : (
          latest.map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} />)
        )}
      </Card>

      <Card title="Cuentas" action={<LinkText label="Ver todas" onPress={() => router.push('/more/accounts')} />}>
        {accountsState.status === 'failed' && <Text className="font-inter text-sm text-red-500">No pudimos cargar tus cuentas.</Text>}
        {accountsState.status !== 'failed' && accounts.length === 0 && (
          <Muted>{accountsState.status === 'loading' ? 'Cargando…' : 'Todavía no tienes cuentas.'}</Muted>
        )}
        {accounts.length > 0 && (
          <View className="flex-row items-baseline justify-between">
            <Text className="font-inter-semibold text-base text-gf-text">Total</Text>
            <Text className="font-inter-bold text-xl text-gf-text">{formatMoneyMajor(accountTotal.total, currency)}</Text>
          </View>
        )}
        {accountTotal.missingCurrencies.length > 0 && (
          <Muted>{`Sin tipo de cambio para ${accountTotal.missingCurrencies.join(', ')}: esas cuentas no suman aquí.`}</Muted>
        )}
        {accounts.slice(0, 3).map((account) => (
          <View key={String(account._id ?? account.name)} className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>
              {account.name}
            </Text>
            <Text className="font-inter-semibold text-base text-gf-text">
              {formatMoneyMajor(account.amount ?? 0, account.currency ?? currency)}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
