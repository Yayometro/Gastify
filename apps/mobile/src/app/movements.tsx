import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { MonthSwitcher } from '@/components/month-switcher';
import { MovementRow } from '@/components/movements/movement-row';
import { TotalsCard } from '@/components/totals-card';
import { Card } from '@/components/ui/card';
import { BottomTabInset, Colors, MaxContentWidth } from '@/constants/theme';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import type { AppDispatch, RootState } from '@/store';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { fetchTransHistory, type TransactionData } from '@gastify/core/features/transacctionsSlice';
import { isHistoryReadyFor } from '@gastify/core/transactions/historyReady';
import { groupByDay, monthBounds, monthTotals, movementsInMonth } from '@gastify/core/transactions/monthSummary';

type DaySection = { key: string; title: string; data: TransactionData[] };

// Every movement of one month, newest first and grouped by day. The months before the recent cutoff
// may still be loading (phased history, as on the web): the notice says so instead of showing
// figures that would look complete.
export default function MovementsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const currency = usePrimaryCurrency();
  const { refresh, refreshing } = useRefreshAppData();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const bounds = useMemo(() => monthBounds(month.getFullYear(), month.getMonth()), [month]);
  const items = useMemo(() => movementsInMonth(transactions.data, bounds), [transactions.data, bounds]);
  const totals = useMemo(() => monthTotals(items), [items]);
  const sections = useMemo<DaySection[]>(
    () => groupByDay(items, now).map((group) => ({ key: group.key, title: group.label, data: group.items })),
    [items, now]
  );

  const historyReady = isHistoryReadyFor(
    { historyStatus: transactions.historyStatus, historyCutoff: transactions.historyCutoff },
    bounds.start
  );
  const cutoff = transactions.historyCutoff ? new Date(transactions.historyCutoff).getTime() : null;
  const olderFailed =
    transactions.historyStatus === 'failed' && cutoff !== null && bounds.start.getTime() < cutoff;
  const loading = transactions.status === 'loading' && transactions.data.length === 0;

  const header = (
    <View className="gap-4 pb-4">
      <Text className="font-inter-bold text-4xl text-gf-text">Movimientos</Text>
      <MonthSwitcher value={month} onChange={setMonth} latest={now} />
      {!historyReady && (
        <Card>
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color={colors.accent} />
            <Text className="flex-1 font-inter text-sm text-gf-text-muted">
              Cargando movimientos más antiguos… Las cifras de este mes pueden crecer.
            </Text>
          </View>
        </Card>
      )}
      {olderFailed && (
        <Card>
          <Text className="font-inter text-sm text-red-500">No pudimos cargar los movimientos más antiguos.</Text>
          <Pressable accessibilityRole="button" onPress={() => dispatch(fetchTransHistory())} hitSlop={8}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>
              Reintentar
            </Text>
          </Pressable>
        </Card>
      )}
      <TotalsCard totals={totals} currency={currency} title="Totales del mes" />
    </View>
  );

  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <SectionList<TransactionData, DaySection>
          sections={sections}
          keyExtractor={(item, index) => String(item._id ?? index)}
          renderItem={({ item }) => <MovementRow movement={item} currency={currency} />}
          renderSectionHeader={({ section }) => (
            <Text className="bg-gf-bg pb-1 pt-4 font-inter-semibold text-sm text-gf-text-muted">{section.title}</Text>
          )}
          ItemSeparatorComponent={() => <View className="h-px bg-gf-border" />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? (
              <Text className="font-inter text-sm text-gf-text-muted">Cargando…</Text>
            ) : historyReady ? (
              <Text className="font-inter text-sm text-gf-text-muted">No hay movimientos en {monthTitleEs(month)}.</Text>
            ) : null
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: MaxContentWidth,
            alignSelf: 'center',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: BottomTabInset + 24,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}
