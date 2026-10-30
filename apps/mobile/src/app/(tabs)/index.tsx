import { usePeriodLabels } from '@/hooks/use-period-labels';
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
import { TourTarget } from '@/components/tour/tour-target';
import { TutorialTip } from '@/components/tour/tutorial-tip';
import { MovementRow } from '@/components/movements/movement-row';
import { PeriodControls } from '@/components/period-controls';
import { Screen } from '@/components/screen';
import { NotificationsBell } from '@/components/notifications-bell';
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
import { rangeLabel } from "@gastify/core/i18n/dates";
import { computeInsights } from '@gastify/core/history/insights';
import { compareRange, summarizePeriod } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { sortNewestFirst } from '@gastify/core/transactions/monthSummary';
import { isInRange, yearsWithMovements } from '@gastify/core/transactions/movementFilters';

import { useT, useInfo, useLocale } from "@/i18n/client";
import { tNow } from '@/i18n/now';
import { shortDate } from '@gastify/core/i18n/dates';
import { currentLocale } from '@/i18n/now';

import { HelpSep } from '@/components/ui/help-sep';
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
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const t = useT();
  const { data: session } = authClient.useSession();
  const user = useSelector((state: RootState) => state.userReducer.data) as { image?: string | null } | null;
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const accountsState = useSelector((state: RootState) => state.accountsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();
  const period = usePeriod('month');

  const labels = usePeriodLabels();
  const summary = useMemo(() => summarizePeriod(transactions.data, period.range, labels), [transactions.data, period.range, labels]);
  const inPeriod = useMemo(() => transactions.data.filter((movement) => isInRange(movement, period.range)), [transactions.data, period.range]);
  const previous = useMemo(() => summarizePeriod(transactions.data, compareRange('previous', period.range, { from: null, to: null }), labels), [transactions.data, period.range, labels]);
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
      title={firstName ? tNow("mobile.hola.p1", { p1: firstName }) : t("shared.start")}
      subtitle={period.preset === 'month' ? period.label : rangeLabel(period.range.start, period.range.end, locale)}
      pageTutorial={false}
      headerAction={
        <View className="flex-row items-center gap-2">
          <TutorialTip label={t("shared.start")} size={24} />
          <HelpSep />
          <NotificationsBell />
        </View>
      }
      refreshing={refreshing}
      onRefresh={refresh}
      hero={<TabletWalletHeader monthLabel={period.label} image={user?.image ?? undefined} name={session?.user.name ?? undefined} accounts={accounts} totals={summary.totals} previous={previous.totals} currency={currency} rangeText={tNow("mobile.del.p1.al.p2", { p1: shortDate(period.range.start, currentLocale()), p2: shortDate(period.range.end, currentLocale()) })} />}>
      {transactions.status === 'failed' && (
        <Text className="font-inter text-sm text-red-500">{t("mobile.no.pudimos.cargar.tus.movimientos")}</Text>
      )}

      <TourTarget id="m-home-period">
        <PeriodControls period={period} years={yearsWithMovements(transactions.data)} />
      </TourTarget>

      {!tablet && (
        <TourTarget id="m-home-summary">
          <SummaryCarousel
            title={period.preset === 'month' ? t("analyzer.thisMonth") : t("mobile.del.periodo")}
            totals={summary.totals}
            previous={previous.totals}
            currency={currency}
            accounts={accounts}
            accountsTotal={accountTotal}
          />
        </TourTarget>
      )}

      {accounts.length > 0 && (
        <TourTarget id="m-home-accounts" style={{ gap: 12 }}>
          <View className="flex-row items-baseline justify-between">
            <Pressable accessibilityRole="link" onPress={() => router.push('/more/accounts')} hitSlop={8}><Text className="font-inter-semibold text-lg text-gf-text">{t("mobile.cuentas")}</Text></Pressable>
            <View className="flex-row items-center gap-2">
              <TutorialTip tour="m-home-accounts" label={t("mobile.cuentas")} />
              <HelpSep />
              <LinkText label={t("mobile.ver.todas")} onPress={() => router.push('/more/accounts')} />
            </View>
          </View>
          <Text className="font-inter text-sm text-gf-text-muted">
            {t("mobile.en.total.p1.p2", { p1: formatMoneyMajor(accountTotal.total, currency), p2: accountTotal.missingCurrencies.length > 0 ? tNow("mobile.sin.tipo.de.cambio.para.p1", { p1: accountTotal.missingCurrencies.join(', ') }) : '' })}
          </Text>
          <TourTarget id="m-home-accounts-carousel">
            <AccountsCarousel accounts={accounts} primary={currency} activity={activity} rates={rates} />
          </TourTarget>
        </TourTarget>
      )}
      {accounts.length === 0 && accountsState.status !== 'failed' && (
        <Card tour="m-home-accounts" title={t("mobile.cuentas")} onTitlePress={() => router.push('/more/accounts')} info={APP_INFO.cuentas}>
          {accountsState.status === 'loading' ? <SkeletonRows count={2} /> : <Muted>{t("mobile.todavia.no.tienes.cuentas")}</Muted>}
        </Card>
      )}


      <TourTarget id="m-home-insights"><InsightsWidget insights={insights} currency={currency} onOpenAnalyzer={() => router.push({ pathname: '/more/analyzer', params: { month: `${(period.preset === 'month' ? period.month : period.now).getFullYear()}-${String((period.preset === 'month' ? period.month : period.now).getMonth() + 1).padStart(2, '0')}` } })} /></TourTarget>
      {wide ? (
        <>
          <TourTarget id="m-home-breakdown"><SummaryWidget summary={summary} movements={inPeriod} allMovements={transactions.data} currency={currency} /></TourTarget>
          <TourTarget id="m-home-top"><TopRanking movements={transactions.data} currency={currency} defaultPreset="thisMonth" /></TourTarget>
          {/* The latest movements are as tall as the budgets beside them, and scroll inside if there are more. */}
          <View className="flex-row items-start gap-4">
            <View style={{ flex: 1 }} onLayout={(event) => setBudgetsHeight(event.nativeEvent.layout.height)}>
              <TourTarget id="m-home-budgets"><BudgetsWidget /></TourTarget>
            </View>
            <View style={{ flex: 1, height: budgetsHeight || undefined }}>
      <Card tour="m-home-latest" style={{ flex: 1 }} title={t("mobile.ultimos.movimientos")} onTitlePress={() => router.navigate('/movements')} info={APP_INFO.ltimos_movimientos} action={<TourTarget id="m-home-latest-all"><LinkText label={t("mobile.ver.todos")} onPress={() => router.navigate('/movements')} /></TourTarget>}>
        {loadingMovements ? (
          <SkeletonRows count={4} />
        ) : latest.length === 0 ? (
          <Muted>{t("mobile.todavia.no.tienes.movimientos")}</Muted>
        ) : (
          <TourTarget id="m-home-latest-list" style={{ flex: 1 }}><ScrollView nestedScrollEnabled style={{ flex: 1 }} showsVerticalScrollIndicator={false}>{latest.map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: '/' } })} />)}</ScrollView></TourTarget>
        )}
      </Card>
            </View>
          </View>
        </>
      ) : (
        <>
      <TourTarget id="m-home-breakdown"><SummaryWidget summary={summary} movements={inPeriod} allMovements={transactions.data} currency={currency} /></TourTarget>
      <TourTarget id="m-home-top"><TopRanking movements={transactions.data} currency={currency} defaultPreset="thisMonth" /></TourTarget>
      <TourTarget id="m-home-budgets"><BudgetsWidget /></TourTarget>

      <Card tour="m-home-latest" title={t("mobile.ultimos.movimientos")} onTitlePress={() => router.navigate('/movements')} info={APP_INFO.ltimos_movimientos_2} action={<TourTarget id="m-home-latest-all"><LinkText label={t("mobile.ver.todos")} onPress={() => router.navigate('/movements')} /></TourTarget>}>
        {loadingMovements ? (
          <Muted>{t("mobile.cargando")}</Muted>
        ) : latest.length === 0 ? (
          <Muted>{t("mobile.todavia.no.tienes.movimientos")}</Muted>
        ) : (
          <TourTarget id="m-home-latest-list">{latest.map((movement) => <MovementRow key={String(movement._id)} movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), returnTo: '/' } })} />)}</TourTarget>
        )}
      </Card>
        </>
      )}
    </Screen>
  );
}
