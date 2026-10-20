import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SectionList, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { ExportSheet } from '@/components/export-sheet';
import { MonthSwitcher } from '@/components/month-switcher';
import { MovementFiltersPanel } from '@/components/movements/movement-filters';
import { MovementRow } from '@/components/movements/movement-row';
import { useToast } from '@/components/toast';
import { TotalsCard } from '@/components/totals-card';
import { Card } from '@/components/ui/card';
import { BottomTabInset, Colors, MaxContentWidth } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';
import { reloadAfterWrite, useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { shareExcelExport, shareTextExport, type ExportFormat } from '@/lib/export-file';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { movementsToCsv, type CsvMovement } from '@gastify/core/exports/movementsCsv';
import { movementsToJson } from '@gastify/core/exports/movementsJson';
import { fetchTransHistory, type TransactionData } from '@gastify/core/features/transacctionsSlice';
import { monthTitleEs } from '@gastify/core/format/spanishDates';
import { isHistoryReadyFor } from '@gastify/core/transactions/historyReady';
import { isBeforeCutoff, movementTime } from '@gastify/core/transactions/historyWindow';
import { groupByDay, monthTotals, movementKind } from '@gastify/core/transactions/monthSummary';
import {
  EMPTY_FILTERS,
  RANGE_PRESETS,
  applyMovementFilters,
  countActiveFilters,
  isInRange,
  rangeFor,
  type FilterableMovement,
  type MovementFilters,
  type RangePreset,
} from '@gastify/core/transactions/movementFilters';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { sortNewestFirst } from '@gastify/core/transactions/monthSummary';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { getDuplicates, getDuplicatesToDelete } from '@gastify/core/transformers/transactionDuplicates';

type DaySection = { key: string; title: string; data: TransactionData[] };

// What counts as "the same movement" for the duplicate finder (the web's defaults).
const DUPLICATE_CRITERIA = { name: true, date: true, amount: true };

// Every movement of the chosen period, newest first and grouped by day, with the web's filters and
// duplicate finder. Tapping one opens it; a long press selects several to delete them or to give them the
// same category. The months before the recent cutoff may still be loading (phased history): the notice says so.
export default function MovementsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const currency = usePrimaryCurrency();
  const { accounts, categories, subCategories } = useCatalog();
  const { refresh, refreshing } = useRefreshAppData();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));
  const params = useLocalSearchParams<{ accountId?: string }>();
  const [filters, setFilters] = useState<MovementFilters>(() => ({ ...EMPTY_FILTERS, accountId: params.accountId ? String(params.accountId) : '' }));
  const [filtersOpen, setFiltersOpen] = useState(Boolean(params.accountId));
  const [preset, setPresetState] = useState<RangePreset>(params.accountId ? 'year' : 'month');
  const [duplicatesOn, setDuplicatesOn] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { data: session } = authClient.useSession();

  const range = useMemo(
    () => rangeFor(preset, now, month, { from: parseDateText(customFrom), to: parseDateText(customTo) }),
    [preset, now, month, customFrom, customTo]
  );
  const inRange = useMemo(() => transactions.data.filter((movement) => isInRange(movement, range)), [transactions.data, range]);
  const filtered = useMemo(() => applyMovementFilters(inRange as unknown as FilterableMovement[], filters, currency) as unknown as TransactionData[], [inRange, filters, currency]);
  // The two legs of a transfer share name, day and amount by design, so they are not offered as repeats
  // (deleting one would leave the transfer half done).
  const duplicates = useMemo(
    () => getDuplicates(filtered.filter((movement) => movementKind(movement) !== 'transfer') as never, DUPLICATE_CRITERIA) as unknown as TransactionData[],
    [filtered]
  );
  const items = useMemo(() => sortNewestFirst(duplicatesOn ? duplicates : filtered), [duplicatesOn, duplicates, filtered]);
  const totals = useMemo(() => monthTotals(items), [items]);
  const sections = useMemo<DaySection[]>(
    () => groupByDay(items, now).map((group) => ({ key: group.key, title: group.label, data: group.items })),
    [items, now]
  );

  const historyReady = isHistoryReadyFor({ historyStatus: transactions.historyStatus, historyCutoff: transactions.historyCutoff }, range.start);
  const cutoff = transactions.historyCutoff ?? null;
  const cutoffTime = cutoff ? new Date(cutoff).getTime() : null;
  const olderFailed = transactions.historyStatus === 'failed' && cutoffTime !== null && range.start.getTime() < cutoffTime;
  const loading = transactions.status === 'loading' && transactions.data.length === 0;
  const active = countActiveFilters(filters) + (duplicatesOn ? 1 : 0);
  const periodLabel = preset === 'month' ? monthTitleEs(month) : RANGE_PRESETS.find((p) => p.value === preset)?.label ?? 'el periodo';

  const selectedMovements = transactions.data.filter((movement) => selected.includes(String(movement._id)));
  const touchesOlder = cutoff !== null && selectedMovements.some((movement) => isBeforeCutoff(movement, cutoff));

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const finishAction = () => {
    setSelected([]);
    setChoosing(false);
    setCategoryId('');
    reloadAfterWrite(dispatch, touchesOlder);
  };

  const removeSelected = () => {
    const count = selected.length;
    Alert.alert(count === 1 ? 'Borrar este movimiento' : `Borrar ${count} movimientos`, 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setActionError(null);
          try {
            await sendWrite('general-data/transactions/remove-many', { manyTrans: selected });
            toast.show(count === 1 ? 'Movimiento borrado' : `${count} movimientos borrados`);
            finishAction();
          } catch (error) {
            setActionError(messageOf(error));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const applyCategory = async () => {
    if (!categoryId) return;
    setBusy(true);
    setActionError(null);
    try {
      await sendWrite('general-data/transactions/edit-many', { transactions: selected, fields: ['category', 'subCategory'], category: categoryId, subCategory: null });
      toast.show('Categoría cambiada');
      finishAction();
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  // The movements on screen as a file (Excel from the server like the web, or CSV / JSON made here),
  // handed to the system share sheet (Files, Mail, Drive, Sheets...).
  const exportPeriod = async (format: ExportFormat) => {
    setExporting(true);
    setActionError(null);
    try {
      const title = `Movimientos ${periodLabel}`;
      if (format === 'xlsx') {
        await shareExcelExport(items.map((movement) => String(movement._id)), session?.user.email ?? 'me', title);
      } else {
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
        await shareTextExport(format, format === 'csv' ? movementsToCsv(rows) : movementsToJson(rows, new Date()), title);
      }
      setExportOpen(false);
    } catch (e) {
      setExportOpen(false);
      setActionError(messageOf(e));
    } finally {
      setExporting(false);
    }
  };

  const categoryItems = categories.map((category) => ({ id: idOf(category), label: category.name || 'Categoría', icon: category.icon, color: category.color }));

  const header = (
    <View className="gap-4 pb-4">
      <View className="flex-row items-end justify-between gap-3">
        <Text className="font-inter-bold text-4xl text-gf-text">Movimientos</Text>
        <Pressable accessibilityRole="button" onPress={() => setExportOpen(true)} disabled={items.length === 0} hitSlop={8} className="pb-2">
          <Text className="font-inter-semibold text-sm" style={{ color: items.length ? colors.accent : colors.textSecondary }}>Exportar</Text>
        </Pressable>
      </View>

      <ChipPicker items={RANGE_PRESETS.map((p) => ({ id: p.value, label: p.label }))} value={preset} onChange={(id) => setPresetState(id as RangePreset)} moreAfter={99} />

      {preset === 'month' && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
      {preset === 'custom' && (
        <View className="gap-3">
          <DateField label="Desde" value={customFrom} onChange={setCustomFrom} />
          <DateField label="Hasta" value={customTo} onChange={setCustomTo} />
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: filtersOpen }}
        onPress={() => setFiltersOpen((open) => !open)}
        className="flex-row items-center justify-between rounded-full border border-gf-border bg-gf-surface px-5 py-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="options-outline" size={20} color={colors.accent} />
          <Text className="font-inter-semibold text-base text-gf-text">Filtros{active > 0 ? ` (${active})` : ''}</Text>
        </View>
        <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Pressable>

      {filtersOpen && (
        <MovementFiltersPanel
          filters={filters}
          onChange={setFilters}
          categories={categories}
          subCategories={subCategories}
          accounts={accounts}
          duplicatesOn={duplicatesOn}
          onDuplicatesChange={setDuplicatesOn}
          duplicateCount={duplicates.length}
          onSelectDuplicates={() => setSelected(getDuplicatesToDelete(filtered as never, DUPLICATE_CRITERIA).map(String))}
        />
      )}

      {selected.length > 0 && (
        <Card title={`${selected.length} ${selected.length === 1 ? 'seleccionado' : 'seleccionados'}`}>
          <View className="flex-row flex-wrap gap-4">
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setChoosing((open) => !open)}>
              <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Cambiar categoría</Text>
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
              <ChipPicker items={categoryItems} value={categoryId} onChange={setCategoryId} title="Categorías" />
              <Pressable accessibilityRole="button" disabled={!categoryId || busy} onPress={applyCategory}>
                <Text className="font-inter-semibold text-sm" style={{ color: categoryId ? colors.accent : colors.textSecondary }}>Aplicar a los seleccionados</Text>
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
            <Text className="flex-1 font-inter text-sm text-gf-text-muted">Cargando movimientos más antiguos… Las cifras de este periodo pueden crecer.</Text>
          </View>
        </Card>
      )}
      {olderFailed && (
        <Card>
          <Text className="font-inter text-sm text-red-500">No pudimos cargar los movimientos más antiguos.</Text>
          <Pressable accessibilityRole="button" onPress={() => dispatch(fetchTransHistory())} hitSlop={8}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Reintentar</Text>
          </Pressable>
        </Card>
      )}
      <TotalsCard totals={totals} currency={currency} title={active > 0 ? 'Totales con los filtros' : preset === 'month' ? 'Totales del mes' : 'Totales del periodo'} />
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
          renderSectionHeader={({ section }) => <Text className="pb-1 pt-4 font-inter-semibold text-sm text-gf-text-muted">{section.title}</Text>}
          ItemSeparatorComponent={() => <View className="h-px bg-gf-border" />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? (
              <Text className="font-inter text-sm text-gf-text-muted">Cargando…</Text>
            ) : historyReady ? (
              <Text className="font-inter text-sm text-gf-text-muted">{active > 0 ? 'Ningún movimiento coincide con los filtros.' : `No hay movimientos en ${periodLabel}.`}</Text>
            ) : null
          }
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: BottomTabInset + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      <ExportSheet visible={exportOpen} count={items.length} busy={exporting} onPick={exportPeriod} onClose={() => setExportOpen(false)} />
    </View>
  );
}
