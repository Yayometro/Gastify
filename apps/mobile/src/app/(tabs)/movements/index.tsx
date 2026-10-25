import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, RefreshControl, SectionList, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { authClient } from '@/auth-client';
import { ChipPicker } from '@/components/chip-picker';
import { DateField } from '@/components/date-field';
import { DateRail } from '@/components/date-rail';
import { ExportSheet } from '@/components/export-sheet';
import { MonthSwitcher } from '@/components/month-switcher';
import { MovementFiltersPanel } from '@/components/movements/movement-filters';
import { MovementRow } from '@/components/movements/movement-row';
import { BulkEditSheet, type BulkField } from '@/components/movements/bulk-edit-sheet';
import { onTabReselect } from '@/lib/tab-reselect';
import { useToast } from '@/components/toast';
import { ToolsSheet } from '@/components/tools/tools-fab';
import { TotalsCard } from '@/components/totals-card';
import { Card } from '@/components/ui/card';
import { SkeletonRows } from '@/components/ui/skeleton';
import { glassFill } from '@/components/ui/glass-fill';
import { BottomTabInset, Colors, MaxContentWidth, TabletContentWidth } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-device-class';
import { useCatalog } from '@/hooks/use-catalog';
import { reloadAfterWrite, useRefreshAppData } from '@/hooks/use-load-app-data';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { shareExcelExport, shareTextExport, type ExportFormat } from '@/lib/export-file';
import { goBackTo, returnLabel, returnParam } from '@/lib/return-to';
import { messageOf, sendWrite } from '@/lib/write';
import type { AppDispatch, RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { movementsToCsv, type CsvMovement } from '@gastify/core/exports/movementsCsv';
import { movementsToJson } from '@gastify/core/exports/movementsJson';
import { fetchTransHistory, type TransactionData } from '@gastify/core/features/transacctionsSlice';
import { monthTitle } from "@gastify/core/i18n/dates";
import { isHistoryReadyFor } from '@gastify/core/transactions/historyReady';
import { isBeforeCutoff, movementTime } from '@gastify/core/transactions/historyWindow';
import { groupByDay, monthTotals, movementKind } from '@gastify/core/transactions/monthSummary';
import {
  EMPTY_FILTERS,
  presetsWithYears,
  rangePresetLabel,
  yearsWithMovements,
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
import { DUPLICATE_DEFAULTS, type DuplicateSettings } from '@gastify/core/transactions/duplicateSettings';

import { useT, useInfo, useLocale } from "@/i18n/client";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import { tNow } from '@/i18n/now';

type DaySection = { key: string; title: string; data: TransactionData[] };


// Every movement of the chosen period, newest first and grouped by day, with the web's filters and
// duplicate finder. Tapping one opens it; a long press selects several to delete them or to give them the
// same category. The months before the recent cutoff may still be loading (phased history): the notice says so.
const BULK_ACTIONS = (t: TranslateFn): { field: BulkField; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] => ([
  { field: 'name', label: t("mobile.nombre"), icon: 'create-outline' },
  { field: 'date', label: t("mobile.fecha"), icon: 'calendar-outline' },
  { field: 'type', label: t("mobile.tipo"), icon: 'swap-vertical-outline' },
  { field: 'category', label: t("mobile.categoria"), icon: 'pricetag-outline' },
  { field: 'account', label: t("mobile.cuenta"), icon: 'card-outline' },
  { field: 'currency', label: t("mobile.divisa"), icon: 'cash-outline' },
  { field: 'general', label: t("mobile.edicion.general"), icon: 'settings-outline' },
]);

export default function MovementsScreen() {
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer);
  const accountsData = useSelector((state: RootState) => state.accountsReducer.data);
  const currency = usePrimaryCurrency();
  const { accounts, categories, subCategories } = useCatalog();
  const { refresh, refreshing } = useRefreshAppData();
  const tablet = useIsTablet();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));
  const params = useLocalSearchParams<{ accountId?: string; returnTo?: string }>();
  const returnTo = returnParam(params.returnTo);
  const [filters, setFilters] = useState<MovementFilters>(() => ({ ...EMPTY_FILTERS, accountId: params.accountId ? String(params.accountId) : '' }));
  const [filtersOpen, setFiltersOpen] = useState(Boolean(params.accountId));
  const [preset, setPresetState] = useState<RangePreset>(params.accountId ? 'year' : 'month');
  const [duplicatesOn, setDuplicatesOn] = useState(false);
  // The form of the duplicate finder (what the person picks) and the settings the last search ran with: like the
  // web, the list changes when "Buscar duplicados" is pressed, not on every tap.
  const [dupDraft, setDupDraft] = useState<DuplicateSettings>(DUPLICATE_DEFAULTS);
  const [dupApplied, setDupApplied] = useState<DuplicateSettings>(DUPLICATE_DEFAULTS);
  const [selected, setSelected] = useState<string[]>([]);
  // Selection mode: the person picks movements (tapping, or "Seleccionar" then tapping) and acts on all of them at once.
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkField, setBulkField] = useState<BulkField | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  // The date rail starts where the list of days starts: below the header, and it rises with it as the header scrolls away.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const railTop = scrollY.interpolate({ inputRange: [0, Math.max(1, headerHeight)], outputRange: [insets.top + 16 + headerHeight, insets.top + 16], extrapolate: 'clamp' });
  const listRef = useRef<SectionList<TransactionData, DaySection>>(null);
  // A second tap on Movimientos: back to the top of the list and a refresh.
  const refreshNow = useRefreshAppData().refresh;
  useEffect(() => onTabReselect((path) => {
    if (path !== '/movements') return;
    // The list's own scroll view (the header is part of it), taken to its top.
    (listRef.current?.getScrollResponder() as { scrollTo?: (options: { y: number; animated: boolean }) => void } | null | undefined)?.scrollTo?.({ y: 0, animated: true });
    refreshNow();
  }), [refreshNow]);
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
    () =>
      getDuplicates(
        filtered.filter((movement) => movementKind(movement) !== 'transfer') as never,
        dupApplied.criteria,
        dupApplied.dateTolerance,
        dupApplied.amountTolerance
      ) as unknown as TransactionData[],
    [filtered, dupApplied]
  );
  const items = useMemo(() => sortNewestFirst(duplicatesOn ? duplicates : filtered), [duplicatesOn, duplicates, filtered]);
  const totals = useMemo(() => monthTotals(items), [items]);
  const sections = useMemo<DaySection[]>(
    () => groupByDay(items, now, locale, t).map((group) => ({ key: group.key, title: group.label, data: group.items })),
    [items, now, locale, t]
  );

  const historyReady = isHistoryReadyFor({ historyStatus: transactions.historyStatus, historyCutoff: transactions.historyCutoff }, range.start);
  const cutoff = transactions.historyCutoff ?? null;
  const cutoffTime = cutoff ? new Date(cutoff).getTime() : null;
  const olderFailed = transactions.historyStatus === 'failed' && cutoffTime !== null && range.start.getTime() < cutoffTime;
  const loading = transactions.status === 'loading' && transactions.data.length === 0;
  const active = countActiveFilters(filters) + (duplicatesOn ? 1 : 0);
  const periodLabel = preset === 'month' ? monthTitle(month, locale) : rangePresetLabel(preset, t);

  const selectedMovements = transactions.data.filter((movement) => selected.includes(String(movement._id)));
  const touchesOlder = cutoff !== null && selectedMovements.some((movement) => isBeforeCutoff(movement, cutoff));

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const finishAction = () => {
    setSelected([]);
    setSelectionMode(false);
    reloadAfterWrite(dispatch, touchesOlder);
  };

  const removeSelected = () => {
    const count = selected.length;
    Alert.alert(count === 1 ? t("mobile.borrar.este.movimiento") : tNow("mobile.movimientos.borrar", { count: count, p1: count }), t("mobile.no.se.puede.deshacer"), [
      { text: t("mobile.cancelar"), style: 'cancel' },
      {
        text: t("mobile.borrar"),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setActionError(null);
          try {
            await sendWrite('general-data/transactions/remove-many', { manyTrans: selected });
            toast.show(count === 1 ? t("mobile.movimiento.borrado") : tNow("mobile.movimientos.borrados", { count: count, p1: count }));
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

  // The movements on screen as a file (Excel from the server like the web, or CSV / JSON made here),
  // handed to the system share sheet (Files, Mail, Drive, Sheets...).
  const exportPeriod = async (format: ExportFormat) => {
    setExporting(true);
    setActionError(null);
    try {
      const title = tNow("mobile.movimientos.p1", { p1: periodLabel });
      if (format === 'xlsx') {
        await shareExcelExport(items.map((movement) => String(movement._id)), session?.user.email ?? 'me', title);
      } else {
        const rows: CsvMovement[] = items.map((movement) => {
          const kind = movementKind(movement);
          const account = accounts.find((item) => idOf(item) === idOf(movement.account));
          return {
            date: dateText(new Date(movementTime(movement) ?? 0)),
            name: movement.name || '',
            category: movement.category?.name || t("history.noCategory"),
            subCategory: movement.subCategory?.name || '',
            type: kind === 'income' ? t("analyzer.income") : kind === 'expense' ? t("analyzer.bill") : t("mobile.transferencia"),
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

  const categoryItems = categories.map((category) => ({ id: idOf(category), label: category.name || t("dashboard.bulk.category"), icon: category.icon, color: category.color }));

  const header = (
    <View className="gap-4 pb-4" onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
      {returnTo && (
        <Pressable accessibilityRole="button" onPress={() => goBackTo(returnTo, () => router.back())} hitSlop={8} className="flex-row items-center gap-1">
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
          <Text className="font-inter-semibold text-base" style={{ color: colors.accent }}>{returnLabel(returnTo, t("mobile.atras"))}</Text>
        </Pressable>
      )}
      <View className="flex-row items-end justify-between gap-3">
        <Text className="font-inter-bold text-4xl text-gf-text">{t("mobile.movimientos")}</Text>
        <Pressable accessibilityRole="button" onPress={() => setExportOpen(true)} disabled={items.length === 0} hitSlop={8} className="pb-2">
          <Text className="font-inter-semibold text-sm" style={{ color: items.length ? colors.accent : colors.textSecondary }}>{t("mobile.exportar")}</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <Pressable accessibilityRole="button" onPress={() => router.push('/movements/import')} className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3" style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="document-attach-outline" size={18} color={colors.accent} />
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.importar.de.excel")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setToolsOpen(true)} className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3" style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="sparkles" size={18} color={colors.accent} />
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.categorizar")}</Text>
        </Pressable>
      </View>

      <ChipPicker items={presetsWithYears(yearsWithMovements(transactions.data), t).map((p) => ({ id: p.value, label: p.label }))} value={preset} onChange={(id) => setPresetState(id as RangePreset)} moreAfter={99} />

      {preset === 'month' && <MonthSwitcher value={month} onChange={setMonth} latest={now} />}
      {preset === 'custom' && (
        <View className="gap-3">
          <DateField label={t("mobile.desde")} value={customFrom} onChange={setCustomFrom} />
          <DateField label={t("mobile.hasta")} value={customTo} onChange={setCustomTo} />
        </View>
      )}

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen((open) => !open)}
          className="flex-1 flex-row items-center justify-between rounded-full border border-gf-border px-5 py-3"
          style={glassFill(scheme === 'dark', colors.backgroundElement)}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="options-outline" size={20} color={colors.accent} />
            <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.filtros.p1", { p1: active > 0 ? ` (${active})` : '' })}</Text>
          </View>
          <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectionMode }}
          onPress={() => { setSelectionMode((on) => !on); setSelected([]); }}
          className="flex-row items-center justify-center gap-2 rounded-full px-5 py-3"
          style={selectionMode ? { backgroundColor: colors.accent } : { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="checkmark-done-outline" size={20} color={selectionMode ? '#ffffff' : colors.accent} />
          <Text className="font-inter-semibold text-base" style={{ color: selectionMode ? '#ffffff' : colors.text }}>{selectionMode ? t("common.success") : t("mobile.seleccionar")}</Text>
        </Pressable>
      </View>

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
          onSelectDuplicates={() => setSelected(getDuplicatesToDelete(filtered as never, dupApplied.criteria, dupApplied.dateTolerance, dupApplied.amountTolerance).map(String))}
          dupDraft={dupDraft}
          onDupDraftChange={setDupDraft}
          onRunDuplicates={() => setDupApplied(dupDraft)}
          onResetDuplicates={() => {
            setDupDraft(DUPLICATE_DEFAULTS);
            setDupApplied(DUPLICATE_DEFAULTS);
          }}
        />
      )}

      {selectionMode && (
        <Card
          title={t("mobile.movements.selectedCount", { count: selected.length, p1: selected.length })}
          info={APP_INFO.seleccionar_movimientos}>
          <View className="flex-row items-center justify-between gap-3">
            <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.salir.de.la.seleccion")} onPress={() => { setSelectionMode(false); setSelected([]); }} className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={{ borderWidth: 1, borderColor: colors.accent }}>
              <Ionicons name="close-circle-outline" size={16} color={colors.accent} />
              <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.off")}</Text>
            </Pressable>
            <View className="flex-row items-center gap-4">
              <Pressable accessibilityRole="button" onPress={() => setSelected(items.map((movement) => String(movement._id)))}>
                <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.todos")}</Text>
              </Pressable>
              {selected.length > 0 && (
                <Pressable accessibilityRole="button" onPress={() => setSelected([])}>
                  <Text className="font-inter-semibold text-sm text-gf-text-muted">{t("mobile.ninguno")}</Text>
                </Pressable>
              )}
            </View>
          </View>
          {selected.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {BULK_ACTIONS(t).map(({ field, label, icon }) => (
                <Pressable key={field} accessibilityRole="button" disabled={busy} onPress={() => setBulkField(field)} className="flex-row items-center gap-1.5 rounded-full px-3 py-2" style={{ borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentSoft }}>
                  <Ionicons name={icon} size={14} color={colors.accent} />
                  <Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{label}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" disabled={busy} onPress={removeSelected} className="flex-row items-center gap-1.5 rounded-full px-3 py-2" style={{ borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="trash-outline" size={14} color="#f43f5e" />
                <Text className="font-inter-semibold text-xs text-red-500">{t("mobile.borrar")}</Text>
              </Pressable>
            </View>
          )}
          {busy && <ActivityIndicator color={colors.accent} />}
          {actionError && <Text className="font-inter text-sm text-red-500">{actionError}</Text>}
        </Card>
      )}
      {bulkField && (
        <BulkEditSheet
          field={bulkField}
          ids={selected}
          accounts={accountsData.map((account) => ({ id: idOf(account), label: account.name || t("dashboard.bulk.account"), currency: account.currency }))}
          categories={categoryItems}
          onClose={() => setBulkField(null)}
          onDone={() => { setBulkField(null); finishAction(); }}
        />
      )}

      {!historyReady && (
        <Card>
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color={colors.accent} />
            <Text className="flex-1 font-inter text-sm text-gf-text-muted">{t("mobile.cargando.movimientos.mas.antiguos.las")}</Text>
          </View>
        </Card>
      )}
      {olderFailed && (
        <Card>
          <Text className="font-inter text-sm text-red-500">{t("mobile.no.pudimos.cargar.los.movimientos")}</Text>
          <Pressable accessibilityRole="button" onPress={() => dispatch(fetchTransHistory())} hitSlop={8}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.reintentar")}</Text>
          </Pressable>
        </Card>
      )}
      <TotalsCard totals={totals} currency={currency} title={active > 0 ? t("mobile.totales.con.los.filtros") : preset === 'month' ? t("mobile.totales.del.mes") : t("mobile.totales.del.periodo")} />
    </View>
  );

  return (
    <View className="flex-1 bg-gf-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <SectionList<TransactionData, DaySection>
          ref={listRef}
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
                  if (selectionMode) toggle(id);
                  else router.push({ pathname: '/movements/[id]', params: { id } });
                }}
                onLongPress={() => { setSelectionMode(true); toggle(id); }}
              />
            );
          }}
          renderSectionHeader={({ section }) => <Text className="pb-1 pt-4 font-inter-semibold text-sm text-gf-text-muted">{section.title}</Text>}
          ItemSeparatorComponent={() => <View style={{ height: scheme === 'dark' ? 0 : 1, backgroundColor: colors.border }} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? (
              <SkeletonRows count={6} />
            ) : historyReady ? (
              <Text className="font-inter text-sm text-gf-text-muted">{active > 0 ? t("mobile.ningun.movimiento.coincide.con.los.filtros") : tNow("mobile.no.hay.movimientos.en.p1", { p1: periodLabel })}</Text>
            ) : undefined
          }
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ width: '100%', maxWidth: tablet ? TabletContentWidth : MaxContentWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: BottomTabInset + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        />
      </SafeAreaView>
      <DateRail
        top={railTop}
        labels={sections.map((section) => section.title)}
        onJump={(index) => listRef.current?.scrollToLocation({ sectionIndex: index, itemIndex: 0, animated: false, viewOffset: 0 })}
      />
      <ToolsSheet visible={toolsOpen} onClose={() => setToolsOpen(false)} />
      <ExportSheet visible={exportOpen} count={items.length} busy={exporting} onPick={exportPeriod} onClose={() => setExportOpen(false)} />
    </View>
  );
}
