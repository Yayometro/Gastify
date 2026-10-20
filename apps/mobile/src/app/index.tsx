import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { AccountsCarousel } from '@/components/home/accounts-carousel';
import { BudgetsWidget } from '@/components/home/budgets-widget';
import { InsightsWidget } from '@/components/home/insights-widget';
import { SummaryWidget } from '@/components/home/summary-widget';
import { TopRanking } from '@/components/top-ranking';
import { MovementRow } from '@/components/movements/movement-row';
import { PeriodControls } from '@/components/period-controls';
import { Screen } from '@/components/screen';
import { TotalsCard } from '@/components/totals-card';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePeriod } from '@/hooks/use-period';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { rangeLabelEs } from '@gastify/core/format/spanishDates';
import { computeInsights } from '@gastify/core/history/insights';
import { compareRange, summarizePeriod } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { sortNewestFirst } from '@gastify/core/transactions/monthSummary';
import { isInRange } from '@gastify/core/transactions/movementFilters';

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

// The phone's dashboard ("Wallet" on the web): the period, the accounts as cards, the totals, the summary
// with its tabs, the biggest elements, the insights, the budgets and the latest movements.
export default function HomeScreen() {
  const { data: session } = authClient.useSession();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();
  const period = usePeriod('month');

  const summary = useMemo(() => summarizePeriod(transactions.data, period.range), [transactions.data, period.range]);
  const inPeriod = useMemo(() => transactions.data.filter((movement) => isInRange(movement, period.range)), [transactions.data, period.range]);
  const previous = useMemo(() => summarizePeriod(transactions.data, compareRange('previous', period.range, { from: null, to: null })), [transactions.data, period.range]);
  const insights = useMemo(() => computeInsights(summary, previous, period.now), [summary, previous, period.now]);
  const latest = useMemo(() => sortNewestFirst(transactions.data).slice(0, 5), [transactions.data]);

  const accounts = accountsState.data;
  const rates = useRatesToPrimary(accounts.map((account) => account.currency), currency);
  const accountTotal = useMemo(() => totalInPrimary(accounts, currency, rates), [accounts, currency, rates]);

  const firstName = session?.user.name?.split(' ')[0];
  const loadingMovements = transactions.status === 'loading' && transactions.data.length === 0;

  return (
    <Screen
      title={firstName ? `Hola, ${firstName}` : 'Inicio'}
      subtitle={period.preset === 'month' ? period.label : rangeLabelEs(period.range.start, period.range.end)}
      refreshing={refreshing}
      onRefresh={refresh}>
      {transactions.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">No pudimos cargar tus movimientos. Desliza hacia abajo para intentarlo de nuevo.</Text>
      )}

      <PeriodControls period={period} />

      <TotalsCard totals={summary.totals} currency={currency} title={period.preset === 'month' ? 'Este mes' : 'Del periodo'} />

      {accounts.length > 0 && (
        <View className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-inter-semibold text-lg text-gf-text">Cuentas</Text>
            <LinkText label="Ver todas" onPress={() => router.push('/more/accounts')} />
          </View>
          <Text className="font-inter text-sm text-gf-text-muted">
            En total {formatMoneyMajor(accountTotal.total, currency)}
            {accountTotal.missingCurrencies.length > 0 ? ` (sin tipo de cambio para ${accountTotal.missingCurrencies.join(', ')})` : ''}
          </Text>
          <AccountsCarousel accounts={accounts} primary={currency} />
        </View>
      )}
      {accounts.length === 0 && accountsState.status !== 'failed' && (
        <Card title="Cuentas">
          <Muted>{accountsState.status === 'loading' ? 'Cargando…' : 'Todavía no tienes cuentas.'}</Muted>
        </Card>
      )}

      <SummaryWidget summary={summary} movements={inPeriod} currency={currency} />
      <TopRanking movements={transactions.data} currency={currency} title="Los más grandes" defaultPreset="thisMonth" />
      <InsightsWidget insights={insights} currency={currency} />
      <BudgetsWidget />

      <Card title="Últimos movimientos" action={<LinkText label="Ver todos" onPress={() => router.navigate('/movements')} />}>
        {loadingMovements ? (
          <Muted>Cargando…</Muted>
        ) : latest.length === 0 ? (
          <Muted>Todavía no tienes movimientos.</Muted>
        ) : (
          latest.map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id) } })} />)
        )}
      </Card>
    </Screen>
  );
}
