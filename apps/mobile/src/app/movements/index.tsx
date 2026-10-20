import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SectionList, Share, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { MonthSwitcher } from '@/components/month-switcher';
import { MovementRow } from '@/components/movements/movement-row';
import { TotalsCard } from '@/components/totals-card';
import { Card } from '@/components/ui/card';
import { BottomTabInset, Colors, MaxContentWidth } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { reloadAfterWrite, useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { fetchTransHistory, type TransactionData } from '@gastify/core/features/transacctionsSlice';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { isHistoryReadyFor } from '@gastify/core/transactions/historyReady';
import { isBeforeCutoff, movementTime } from '@gastify/core/transactions/historyWindow';
import { movementsToCsv, type CsvMovement } from '@gastify/core/exports/movementsCsv';
import { dateText } from '@gastify/core/transactions/movementForm';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { groupByDay, monthBounds, monthTotals, movementKind, movementsInMonth } from '@gastify/core/transactions/monthSummary';

type DaySection = { key: string; title: string; data: TransactionData[] };

// Every movement of one month, newest first and grouped by day. Tapping one opens it; a long press
// selects several to delete them or to give them the same category. The months before the recent cutoff
// may still be loading (phased history, as on the web): the notice says so.
export default function MovementsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const currency = usePrimaryCurrency();
  const { accounts, categories } = useCatalog();
  const { refresh, refreshing } = useRefreshAppData();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState<string[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
  const cutoff = transactions.historyCutoff ?? null;
  const cutoffTime = cutoff ? new Date(cutoff).getTime() : null;
  const olderFailed = transactions.historyStatus === 'failed' && cutoffTime !== null && bounds.start.getTime() < cutoffTime;
  const loading = transactions.status === 'loading' && transactions.data.length === 0;

  const selectedMovements = transactions.data.filter((movement) => selected.includes(String(movement._id)));
  const touchesOlder = cutoff !== null && selectedMovements.some((movement) => isBeforeCutoff(movement, cutoff));

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const finishAction = () => {
    setSelected([]);
    setChoosing(false);
    setCategoryId('');
    reloadAfterWrite(dispatch, touchesOlder);
  };

  const removeSelected = () => {
    const count = selected.length;
    Alert.alert(
      count === 1 ? 'Borrar este movimiento' : `Borrar ${count} movimientos`,
      'No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            setActionError(null);
            try {
              await sendWrite('general-data/transactions/remove-many', { manyTrans: selected });
              finishAction();
            } catch (error) {
              setActionError(messageOf(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const applyCategory = async () => {
    if (!categoryId) return;
    setBusy(true);
    setActionError(null);
    try {
      await sendWrite('general-data/transactions/edit-many', {
        transactions: selected,
        fields: ['category', 'subCategory'],
        category: categoryId,
        subCategory: null,
      });
      finishAction();
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // The month as a CSV text, shared with the system sheet (Mail, Files, Sheets...).
  const exportMonth = async () => {
    const rows: CsvMovement[] = items.map((movement) => {
      const kind = movementKind(movement);
      const account = accounts.find((item) => idOf(item) === idOf(movement.account));
      return {
        date: dateText(new Date(movementTime(movement) ?? 0)),
        name: movement.name || '',
        category: movement.category?.name || 'Sin categoría',
        subCategory: movement.subCategory?.name || '',
        type: kind === 'income' ? 'Ingreso' : kind === 'expense' ? 'Gasto' : 'Transferencia',
        amount: Math.abs(getPrimaryAmount(movement)),
        currency,
        account: account?.name || '',
      };
    });
    try {
      await Share.share({ title: `Movimientos ${monthTitleEs(month)}`, message: movementsToCsv(rows) });
    } catch (e) {
      setActionError(messageOf(e));
    }
  };

  const categoryItems = categories.map((category) => ({ id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color }));

  const header = (
    <View className="gap-4 pb-4">
      <Text className="font-inter-bold text-4xl text-gf-text">Movimientos</Text>
      <MonthSwitcher value={month} onChange={setMonth} latest={now} />
      <Pressable accessibilityRole="button" onPress={exportMonth} disabled={items.length === 0} hitSlop={8} className="self-end">
        <Text className="font-inter-semibold text-sm" style={{ color: items.length ? colors.accent : colors.textSecondary }}>
          Exportar el mes en CSV
        </Text>
      </Pressable>

      {selected.length > 0 && (
        <Card title={`${selected.length} ${selected.length === 1 ? 'seleccionado' : 'seleccionados'}`}>
          <View className="flex-row flex-wrap gap-4">
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setChoosing((open) => !open)}>
              <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>
                Cambiar categoría
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={removeSelected}>
              <Text className="font-inter-semibold text-sm text-red-500">Borrar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setSelected([]); setChoosing(false); }}>
              <Text className="font-inter-semibold text-sm text-gf-text-muted">Cancelar</Text>
            </Pressable>
          </View>
          {choosing && (
            <View className="gap-3">
              <ChipPicker items={categoryItems} value={categoryId} onChange={setCategoryId} />
              <Pressable accessibilityRole="button" disabled={!categoryId || busy} onPress={applyCategory}>
                <Text className="font-inter-semibold text-sm" style={{ color: categoryId ? colors.accent : colors.textSecondary }}>
                  Aplicar a los seleccionados
                </Text>
              </Pressable>
            </View>
          )}
          {busy && <ActivityIndicator color={colors.accent} />}
          {actionError && <Text className="font-inter text-sm text-red-500">{actionError}</Text>}
        </Card>
      )}

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
          renderItem={({ item }) => {
            const id = String(item._id);
            return (
              <MovementRow
                movement={item}
                currency={currency}
                selected={selected.includes(id)}
                onPress={() => {
                  if (selected.length > 0) toggle(id);
                  else router.push({ pathname: '/movements/[id]', params: { id } });
                }}
                onLongPress={() => toggle(id)}
              />
            );
          }}
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
