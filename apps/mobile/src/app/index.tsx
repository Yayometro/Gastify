import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { AccountsCarousel } from '@/components/home/accounts-carousel';
import { BudgetsWidget } from '@/components/home/budgets-widget';
import { InsightsWidget } from '@/components/home/insights-widget';
import { SummaryWidget } from '@/components/home/summary-widget';
import { TabletWalletHeader } from '@/components/home/tablet-wallet-header';
import { WIDE_MIN_WIDTH, useIsTablet } from '@/hooks/use-device-class';
import { TopRanking } from '@/components/top-ranking';
import { MovementRow } from '@/components/movements/movement-row';
import { PeriodControls } from '@/components/period-controls';
import { Screen } from '@/components/screen';
import { SummaryCarousel } from '@/components/home/summary-carousel';
import { Card } from '@/components/ui/card';
import { SkeletonRows } from '@/components/ui/skeleton';
import { Colors } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePeriod } from '@/hooks/use-period';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { accountActivity } from '@gastify/core/accounts/accountActivity';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { rangeLabelEs } from '@gastify/core/format/spanishDates';
import { computeInsights } from '@gastify/core/history/insights';
import { compareRange, summarizePeriod } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { sortNewestFirst } from '@gastify/core/transactions/monthSummary';
import { isInRange, yearsWithMovements } from '@gastify/core/transactions/movementFilters';

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
  // Side by side on a wide screen, the latest movements are as tall as the budgets beside them: about three rows per budget card.
  const wideFlag = useWindowDimensions().width >= WIDE_MIN_WIDTH;
  const [budgetsHeight, setBudgetsHeight] = useState(0);
  const latestCount = wideFlag ? 30 : 5;
  const latest = useMemo(() => sortNewestFirst(transactions.data).slice(0, latestCount), [transactions.data, latestCount]);

  const accounts = accountsState.data;
  const activity = useMemo(() => accountActivity(transactions.data, period.range), [transactions.data, period.range]);
  const rates = useRatesToPrimary(accounts.map((account) => account.currency), currency);
  const accountTotal = useMemo(() => totalInPrimary(accounts, currency, rates), [accounts, currency, rates]);

  const tablet = useIsTablet();
  // Landscape tablets: two cards side by side, as the web's wide layout does.
  const wide = useWindowDimensions().width >= WIDE_MIN_WIDTH;
  const firstName = session?.user.name?.split(' ')[0];
  const loadingMovements = transactions.status === 'loading' && transactions.data.length === 0;

  return (
    <Screen
      title={firstName ? `Hola, ${firstName}` : 'Inicio'}
      subtitle={period.preset === 'month' ? period.label : rangeLabelEs(period.range.start, period.range.end)}
      refreshing={refreshing}
      onRefresh={refresh}
      hero={<TabletWalletHeader name={session?.user.name ?? undefined} accounts={accounts} totals={summary.totals} previous={previous.totals} currency={currency} rangeText={`Del ${period.range.start.toLocaleDateString('es-MX')} al ${period.range.end.toLocaleDateString('es-MX')}.`} />}>
      {transactions.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">No pudimos cargar tus movimientos. Desliza hacia abajo para intentarlo de nuevo.</Text>
      )}

      <PeriodControls period={period} years={yearsWithMovements(transactions.data)} />

      {!tablet && (
        <SummaryCarousel
          title={period.preset === 'month' ? 'Este mes' : 'Del periodo'}
          totals={summary.totals}
          previous={previous.totals}
          currency={currency}
          accounts={accounts}
          accountsTotal={accountTotal}
        />
      )}

      {accounts.length > 0 && (
        <View className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Pressable accessibilityRole="link" onPress={() => router.push('/more/accounts')} hitSlop={8}><Text className="font-inter-semibold text-lg text-gf-text">Cuentas</Text></Pressable>
            <LinkText label="Ver todas" onPress={() => router.push('/more/accounts')} />
          </View>
          <Text className="font-inter text-sm text-gf-text-muted">
            En total {formatMoneyMajor(accountTotal.total, currency)}
            {accountTotal.missingCurrencies.length > 0 ? ` (sin tipo de cambio para ${accountTotal.missingCurrencies.join(', ')})` : ''}
          </Text>
          <AccountsCarousel accounts={accounts} primary={currency} activity={activity} rates={rates} />
        </View>
      )}
      {accounts.length === 0 && accountsState.status !== 'failed' && (
        <Card title="Cuentas" onTitlePress={() => router.push('/more/accounts')} info={{ title: 'Cuentas', text: 'Cada tarjeta es una cuenta con su saldo actual. «Entró» y «salió» son la suma de los ingresos y gastos de esa cuenta en el periodo elegido arriba. El total convierte cada saldo a tu moneda principal con el tipo de cambio más reciente (las tarjetas de crédito no se suman a tu dinero disponible).' }}>
          {accountsState.status === 'loading' ? <SkeletonRows count={2} /> : <Muted>Todavía no tienes cuentas.</Muted>}
        </Card>
      )}


      <InsightsWidget insights={insights} currency={currency} onOpenAnalyzer={() => router.push({ pathname: '/more/analyzer', params: { month: `${(period.preset === 'month' ? period.month : period.now).getFullYear()}-${String((period.preset === 'month' ? period.month : period.now).getMonth() + 1).padStart(2, '0')}` } })} />
      {wide ? (
        <>
          <SummaryWidget summary={summary} movements={inPeriod} allMovements={transactions.data} currency={currency} />
          <TopRanking movements={transactions.data} currency={currency} defaultPreset="thisMonth" />
          {/* The latest movements are as tall as the budgets beside them, and scroll inside if there are more. */}
          <View className="flex-row items-start gap-4">
            <View style={{ flex: 1 }} onLayout={(event) => setBudgetsHeight(event.nativeEvent.layout.height)}>
              <BudgetsWidget />
            </View>
            <View style={{ flex: 1, height: budgetsHeight || undefined }}>
      <Card style={{ flex: 1 }} title="Últimos movimientos" onTitlePress={() => router.navigate('/movements')} info={{ title: 'Últimos movimientos', text: 'Los movimientos con la fecha más reciente de toda tu cuenta (cinco en el teléfono; en la tablet los que quepan junto a tus presupuestos), sin aplicar el periodo de arriba (es la única tarjeta que lo ignora). Sirve para revisar rápido lo último que registraste. Toca uno para verlo o editarlo, o abre la lista completa con sus filtros.' }} action={<LinkText label="Ver todos" onPress={() => router.navigate('/movements')} />}>
        {loadingMovements ? (
          <SkeletonRows count={4} />
        ) : latest.length === 0 ? (
          <Muted>Todavía no tienes movimientos.</Muted>
        ) : (
          <ScrollView nestedScrollEnabled style={{ flex: 1 }} showsVerticalScrollIndicator={false}>{latest.map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: '/' } })} />)}</ScrollView>
        )}
      </Card>
            </View>
          </View>
        </>
      ) : (
        <>
      <SummaryWidget summary={summary} movements={inPeriod} allMovements={transactions.data} currency={currency} />
      <TopRanking movements={transactions.data} currency={currency} defaultPreset="thisMonth" />
      <BudgetsWidget />

      <Card title="Últimos movimientos" onTitlePress={() => router.navigate('/movements')} info={{ title: 'Últimos movimientos', text: 'Los cinco movimientos con la fecha más reciente de toda tu cuenta, sin aplicar el periodo de arriba (es la única tarjeta que lo ignora). Sirve para revisar rápido lo último que registraste. Toca uno para verlo o editarlo, o abre la lista completa con sus filtros.' }} action={<LinkText label="Ver todos" onPress={() => router.navigate('/movements')} />}>
        {loadingMovements ? (
          <Muted>Cargando…</Muted>
        ) : latest.length === 0 ? (
          <Muted>Todavía no tienes movimientos.</Muted>
        ) : (
          latest.map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: '/' } })} />)
        )}
      </Card>
        </>
      )}
    </Screen>
  );
}
