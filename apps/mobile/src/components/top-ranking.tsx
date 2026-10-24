import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { CompactTimeFilter } from '@/components/compact-time-filter';
import { CategoryBadge } from '@/components/category-badge';
import { CategoryDetailSheet } from '@/components/category-detail-sheet';
import { MovementRow } from '@/components/movements/movement-row';
import { RankedRow } from '@/components/ui/ranked-row';
import { Segmented } from '@/components/segmented';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import type { InfoText } from '@/components/info-tip';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { DateField } from '@/components/date-field';
import { ChipPicker } from '@/components/chip-picker';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';
import { GfSwitch } from '@/components/ui/switch';
import { monthTitle, rangeLabel } from "@gastify/core/i18n/dates";
import { COMPARE_PRESETS, compareRange, historyRange, type ComparePreset, type HistoryPreset } from '@gastify/core/history/periodComparison';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { dateText, parseDateText } from '@gastify/core/transactions/movementForm';
import { filterBillsOrIncomes, getPrimaryAmount, orderByHighestValue, reduceTransCategoriesSliced } from '@gastify/core/transformers/transactionsChange';
import { useT, useLocale } from "@/i18n/client";

// The web's "Top" sizes (the switch 3 / 6 / 12 / 24).
export const TOP_SIZES = [3, 6, 12, 24] as const;
export type TopSize = (typeof TOP_SIZES)[number];

// The biggest elements of a period, with its own time filter and size, like the web's Top modules:
// gastos or ingresos, by category or movement by movement. Each tap opens the movement.
export function TopRanking({
  movements,
  currency,
  info,
  defaultPreset,
  returnTo,
  showComparison = false,
}: {
  movements: TransactionData[];
  currency: string;
  info?: InfoText;
  defaultPreset: HistoryPreset;
  returnTo?: string;
  showComparison?: boolean;
}) {
  const locale = useLocale();
  const t = useT();
  const [preset, setPreset] = useState<HistoryPreset>(defaultPreset);
  const [size, setSize] = useState<TopSize>(6);
  const [kind, setKind] = useState<'bills' | 'incomes'>('bills');
  const [by, setBy] = useState<'categories' | 'movements'>('categories');
  const [compareOn, setCompareOn] = useState(false);
  const [comparePreset, setComparePreset] = useState<ComparePreset>('previous');
  // The category whose movements are open in the sheet (tap a category row).
  const [openCategory, setOpenCategory] = useState<{ name: string; previous: boolean } | null>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [customFrom, setCustomFrom] = useState(() => dateText(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => dateText(now));

  const range = useMemo(() => historyRange(preset, now, { from: parseDateText(customFrom), to: parseDateText(customTo) }, month), [preset, now, month, customFrom, customTo]);
  const { bills, incomes } = useMemo(() => filterBillsOrIncomes(movements.filter((movement) => isInRange(movement, range))), [movements, range]);
  const list = kind === 'bills' ? bills : incomes;
  const [compareFrom, setCompareFrom] = useState(() => dateText(new Date(now.getFullYear() - 1, now.getMonth(), 1)));
  const [compareTo, setCompareTo] = useState(() => dateText(new Date(now.getFullYear() - 1, now.getMonth(), 28)));
  const previousRange = useMemo(() => compareRange(comparePreset, range, { from: parseDateText(compareFrom), to: parseDateText(compareTo) }), [comparePreset, range, compareFrom, compareTo]);
  const previousSets = useMemo(() => filterBillsOrIncomes(movements.filter((movement) => isInRange(movement, previousRange))), [movements, previousRange]);
  const previousList = kind === 'bills' ? previousSets.bills : previousSets.incomes;
  const categories = useMemo(() => orderByHighestValue(reduceTransCategoriesSliced(list)).slice(0, size), [list, size]);
  const biggest = useMemo(() => [...list].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)).slice(0, size), [list, size]);
  const previousCategories = useMemo(() => orderByHighestValue(reduceTransCategoriesSliced(previousList)).slice(0, size), [previousList, size]);
  const previousBiggest = useMemo(() => [...previousList].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)).slice(0, size), [previousList, size]);
  const categoryMovements = useMemo(
    () => (openCategory === null ? [] : (openCategory.previous ? previousList : list).filter((movement) => (movement.category?.name || 'No category') === openCategory.name).sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a))),
    [openCategory, list, previousList]
  );
  // Wide screens, History: a period of a few months is also shown month by month, in columns side by side so the months compare at a glance.
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const byMonth = useMemo(() => {
    if (!showComparison || !tablet || preset === 'month' || preset === 'thisMonth' || preset === 'lastMonth') return null;
    const first = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    const count = (range.end.getFullYear() - first.getFullYear()) * 12 + range.end.getMonth() - first.getMonth() + 1;
    if (count < 2 || count > 4) return null;
    return Array.from({ length: count }, (_, index) => {
      const start = new Date(first.getFullYear(), first.getMonth() + index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      const sets = filterBillsOrIncomes(movements.filter((movement) => isInRange(movement, { start, end })));
      const monthList = kind === 'bills' ? sets.bills : sets.incomes;
      return {
        key: `${start.getFullYear()}-${start.getMonth()}`,
        title: monthTitle(start, locale),
        categories: orderByHighestValue(reduceTransCategoriesSliced(monthList)).slice(0, size),
        biggest: [...monthList].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)).slice(0, size),
      };
    });
  }, [showComparison, tablet, preset, range, movements, kind, size]);

  const sizeOptions = TOP_SIZES.map((n) => ({ value: String(n) as `${TopSize}`, label: String(n) }));

  return (
    <Card title={t("mobile.topLabel", { p1: size })} info={info ?? { title: t("mobile.topLabel", { p1: size }), text: t("mobile.las.categorias.o.transacciones.con") }}>
      <CompactTimeFilter preset={preset} onPreset={(value) => { if (value !== 'dashboard') setPreset(value); }} month={month} onMonth={setMonth} latest={now} customFrom={customFrom} onCustomFrom={setCustomFrom} customTo={customTo} onCustomTo={setCustomTo} periodSelect={showComparison} extra={showComparison ? (
        <>
        <View className="flex-row items-center justify-between gap-3 border-t border-gf-border pt-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-base text-gf-text">{t("mobile.comparar.con.otro.periodo")}</Text>
            <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.elige.abajo.contra.que.tramo")}</Text>
          </View>
          <GfSwitch value={compareOn} onValueChange={setCompareOn} accessibilityLabel={t("mobile.comparar.con.otro.periodo")} />
        </View>
        {compareOn && (
          <View className="gap-3">
            <ChipPicker items={COMPARE_PRESETS.map((p) => ({ id: p.value, label: t(p.label) }))} value={comparePreset} onChange={(id) => setComparePreset(id as ComparePreset)} moreAfter={99} />
            {comparePreset === 'custom' && (
              <View className="gap-3">
                <DateField label={t("mobile.comparar.desde")} value={compareFrom} onChange={setCompareFrom} />
                <DateField label={t("mobile.comparar.hasta")} value={compareTo} onChange={setCompareTo} />
              </View>
            )}
            <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.se.compara.con.p1", { p1: rangeLabel(previousRange.start, previousRange.end, locale) })}</Text>
          </View>
        )}
        </>
      ) : undefined} />
      <Segmented options={sizeOptions} value={String(size) as `${TopSize}`} onChange={(next) => setSize(Number(next) as TopSize)} />
      <Segmented options={[{ value: 'bills', label: t("mobile.gastos") }, { value: 'incomes', label: t("mobile.ingresos") }]} value={kind} onChange={setKind} />
      {(!tablet || byMonth) && <Segmented options={[{ value: 'categories', label: t("mobile.por.categoria") }, { value: 'movements', label: t("mobile.movimientos") }]} value={by} onChange={setBy} />}
      {!byMonth && (
        <>
      {list.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.movimientos.en.este.periodo")}</Text>}
      {tablet ? (
        <View className="flex-row items-start gap-6">
          <View className="flex-1 gap-1">
            <Text className="pb-1 font-inter-semibold text-sm uppercase text-gf-text-muted">{t("mobile.categorias")}</Text>
      {categories.map((row, index) => (
            <RankedRow key={row.type} rank={index + 1} last={index === categories.length - 1}>
            <Pressable accessibilityRole="button" onPress={() => setOpenCategory({ name: row.type, previous: false })} className="flex-row items-center gap-3">
              <CategoryBadge icon={row.icon} color={row.color} size={44} />
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.type === 'No category' ? 'Sin categoría' : row.type}</Text>
              <Text className="font-inter-semibold text-base text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
            </RankedRow>
          ))}
          </View>
          <View className="flex-1 gap-1">
            <Text className="pb-1 font-inter-semibold text-sm uppercase text-gf-text-muted">{t("mobile.movimientos")}</Text>
      {biggest.map((movement, index) => (
            <RankedRow key={String(movement._id)} rank={index + 1} last={index === biggest.length - 1}>
            <MovementRow
              bare
              movement={movement}
              currency={currency}
              onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } })}
            />
            </RankedRow>
          ))}
          </View>
        </View>
      ) : (
        <>
      {by === 'categories'
        ? categories.map((row, index) => (
            <RankedRow key={row.type} rank={index + 1} last={index === categories.length - 1}>
            <Pressable accessibilityRole="button" onPress={() => setOpenCategory({ name: row.type, previous: false })} className="flex-row items-center gap-3">
              <CategoryBadge icon={row.icon} color={row.color} size={44} />
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{row.type === 'No category' ? 'Sin categoría' : row.type}</Text>
              <Text className="font-inter-semibold text-base text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
            </RankedRow>
          ))
        : biggest.map((movement, index) => (
            <RankedRow key={String(movement._id)} rank={index + 1} last={index === biggest.length - 1}>
            <MovementRow
              bare
              movement={movement}
              currency={currency}
              onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } })}
            />
            </RankedRow>
          ))}
        </>
      )}
        </>
      )}
      {byMonth && (
        <View className="flex-row items-start gap-4 border-t border-gf-border pt-3">
          {byMonth.map((column) => (
            <View key={column.key} className="flex-1 gap-1">
              <Text className="pb-1 font-inter-semibold text-base text-gf-text">{column.title}</Text>
              {column.categories.length === 0 && column.biggest.length === 0 && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.sin.movimientos")}</Text>}
              {by === 'categories'
                ? column.categories.map((row, index) => (
                    <RankedRow key={row.type} rank={index + 1} last={index === column.categories.length - 1}>
                      <Pressable accessibilityRole="button" onPress={() => setOpenCategory({ name: row.type, previous: false })} className="flex-row items-center gap-2 py-1">
                        <CategoryBadge icon={row.icon} color={row.color} size={30} />
                        <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{row.type === 'No category' ? 'Sin categoría' : row.type}</Text>
                        <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
                      </Pressable>
                    </RankedRow>
                  ))
                : column.biggest.map((movement, index) => (
                    <RankedRow key={String(movement._id)} rank={index + 1} last={index === column.biggest.length - 1}>
                      <MovementRow bare movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } })} />
                    </RankedRow>
                  ))}
            </View>
          ))}
        </View>
      )}
      {showComparison && compareOn && (
        <View className="gap-2 border-t border-gf-border pt-3">
          <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.periodo.anterior.p1", { p1: rangeLabel(previousRange.start, previousRange.end, locale) })}</Text>
          {previousList.length === 0 && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.sin.movimientos.para.comparar")}</Text>}
          {by === 'categories' ? previousCategories.map((row, index) => (
            <RankedRow key={row.type} rank={index + 1} last={index === previousCategories.length - 1}>
            <Pressable accessibilityRole="button" onPress={() => setOpenCategory({ name: row.type, previous: true })} className="flex-row items-center gap-3 py-1">
              <CategoryBadge icon={row.icon} color={row.color} size={32} />
              <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{row.type === 'No category' ? 'Sin categoría' : row.type}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.value, currency)}</Text>
            </Pressable>
            </RankedRow>
          )) : previousBiggest.map((movement, index) => (
            <RankedRow key={String(movement._id)} rank={index + 1} last={index === previousBiggest.length - 1}>
            <MovementRow bare movement={movement} currency={currency} onPress={() => router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } })} />
            </RankedRow>
          ))}
        </View>
      )}

      <CategoryDetailSheet
        visible={openCategory !== null}
        name={openCategory?.name === 'No category' ? 'Sin categoría' : openCategory?.name ?? ''}
        prefix={openCategory?.previous ? 'Periodo anterior' : undefined}
        movements={categoryMovements}
        currency={currency}
        onOpenMovement={(movement) => {
          setOpenCategory(null);
          router.push({ pathname: '/movements/[id]', params: { id: String(movement._id), ...(returnTo ? { returnTo } : {}) } });
        }}
        onClose={() => setOpenCategory(null)}
      />
    </Card>
  );
}
