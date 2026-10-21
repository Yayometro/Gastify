import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { CategoryBadge } from '@/components/category-badge';
import { MovementRow } from '@/components/movements/movement-row';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { topSpendingCategories } from '@gastify/core/transactions/monthSummary';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import { computeMonthlyChampions, detectSubscriptions, findBiggestSpendPatterns } from '@gastify/core/transformers/walletAnalyzer';

export function HistoryExtraInsights({ movements, currency, end }: { movements: TransactionData[]; currency: string; end: Date }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const anchor = useMemo(() => end < new Date() ? end : new Date(), [end]);
  const patterns = useMemo(() => findBiggestSpendPatterns(movements, anchor, 12), [movements, anchor]);
  const champions = useMemo(() => computeMonthlyChampions(movements, anchor, 12), [movements, anchor]);
  const subscriptions = useMemo(() => detectSubscriptions(movements, anchor, 3, 6), [movements, anchor]);
  const [showMonths, setShowMonths] = useState(false);
  const [openBiggest, setOpenBiggest] = useState(false);
  const [openSubscription, setOpenSubscription] = useState<string | null>(null);
  const money = (value: number) => formatMoneyMajor(value, currency);
  const selected = subscriptions.find((item) => item.name === openSubscription);
  const windowMovements = useMemo(() => patterns ? movements.filter((tx) => tx.isBill && !tx.isIncome && isInRange(tx, patterns.lookbackRange)) : [], [patterns, movements]);
  const topMovements = useMemo(() => [...windowMovements].sort((a, b) => getPrimaryAmount(b) - getPrimaryAmount(a)).slice(0, 12), [windowMovements]);
  const topCategories = useMemo(() => topSpendingCategories(windowMovements, 12), [windowMovements]);

  return (
    <>
      <Card title="Grandes gastos · últimos 12 meses" info={{ title: 'Grandes gastos', text: 'La mayor transacción, categoría y subcategoría del año móvil que termina en el periodo elegido. Despliega los meses para ver sus líderes.' }}>
        {!patterns && <Text className="font-inter text-sm text-gf-text-muted">No hay gastos registrados en estos doce meses.</Text>}
        {patterns && <>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver mayores gastos y categorías del periodo" onPress={() => setOpenBiggest(true)} className="gap-1 rounded-2xl border border-gf-border p-3">
            <Text className="font-inter text-xs text-gf-text-muted">Mayor transacción</Text>
            <Text className="font-inter-semibold text-base text-gf-text">{patterns.biggestTransaction.name}</Text>
            <Text className="font-inter-bold text-xl text-gf-text">{money(patterns.biggestTransaction.amount)}</Text>
          </Pressable>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-2xl border border-gf-border p-3"><Text className="font-inter text-xs text-gf-text-muted">Categoría líder</Text><Text className="font-inter-semibold text-sm text-gf-text">{patterns.biggestCategory.name}</Text><Text className="font-inter-bold text-sm text-gf-text">{money(patterns.biggestCategory.total)}</Text></View>
            {patterns.biggestSubcategory && <View className="flex-1 rounded-2xl border border-gf-border p-3"><Text className="font-inter text-xs text-gf-text-muted">Subcategoría líder</Text><Text className="font-inter-semibold text-sm text-gf-text">{patterns.biggestSubcategory.name}</Text><Text className="font-inter-bold text-sm text-gf-text">{money(patterns.biggestSubcategory.total)}</Text></View>}
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMonths }} onPress={() => setShowMonths((value) => !value)} className="items-center rounded-full border border-gf-border py-2"><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{showMonths ? 'Ocultar meses' : 'Ver líderes mes por mes'}</Text></Pressable>
          {showMonths && champions.months.map((item) => <View key={item.label} className="gap-1 border-t border-gf-border py-2">
            <Text className="font-inter-semibold text-sm text-gf-text">{item.label} · {money(item.total)}</Text>
            {item.biggestTransaction && <Text className="font-inter text-xs text-gf-text-muted">Mayor: {item.biggestTransaction.name} · {money(item.biggestTransaction.amount)}</Text>}
            {item.biggestCategory && <Text className="font-inter text-xs text-gf-text-muted">Categoría: {item.biggestCategory.name} · {money(item.biggestCategory.total)}</Text>}
          </View>)}
        </>}
      </Card>

      <DetailSheet visible={openBiggest} title="Mayores gastos · 12 meses" subtitle={`${windowMovements.length} movimientos en el periodo`} onClose={() => setOpenBiggest(false)}>
        <Text className="font-inter-semibold text-base text-gf-text">Movimientos más grandes</Text>
        {topMovements.map((tx) => <MovementRow key={String(tx._id)} movement={tx} currency={currency} onPress={() => { setOpenBiggest(false); router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/history' } }); }} />)}
        <Text className="pt-3 font-inter-semibold text-base text-gf-text">Categorías con más gasto</Text>
        {topCategories.map((category) => <View key={category.name} className="flex-row items-center gap-3 border-t border-gf-border py-2"><CategoryBadge icon={category.icon} color={category.color} size={30} /><Text className="flex-1 font-inter-medium text-sm text-gf-text">{category.name}</Text><Text className="font-inter-semibold text-sm text-gf-text">{money(category.value)}</Text></View>)}
      </DetailSheet>

      <Card title="Suscripciones recurrentes" info={{ title: 'Suscripciones recurrentes', text: 'Cargos que se repiten con frecuencia mensual. Toca uno para revisar sus fechas, importes y posibles duplicados.' }}>
        {subscriptions.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No se detectaron pagos recurrentes en este periodo.</Text>}
        {subscriptions.map((item) => <Pressable key={item.name} accessibilityRole="button" onPress={() => setOpenSubscription(item.name)} className="flex-row items-center gap-3 border-t border-gf-border py-2">
          <CategoryBadge icon={item.icon} color={item.color} size={32} />
          <View className="flex-1"><Text className="font-inter-semibold text-sm text-gf-text">{item.name}</Text><Text className="font-inter text-xs text-gf-text-muted">{item.categoryName}{item.accountName ? ` · ${item.accountName}` : ''}</Text></View>
          <Text className="font-inter-semibold text-sm text-gf-text">{money(item.amount)}</Text>
        </Pressable>)}
      </Card>
      <DetailSheet visible={Boolean(selected)} title={selected?.name ?? ''} subtitle={selected ? `${selected.occurrences.length} cargos encontrados` : undefined} onClose={() => setOpenSubscription(null)}>
        {selected?.isNew && <Text className="font-inter text-sm" style={{ color: colors.accent }}>Nuevo en este periodo</Text>}
        {selected?.possibleDuplicateInMonth && <Text className="font-inter text-sm" style={{ color: colors.expense }}>Hay un posible cargo duplicado en el mes.</Text>}
        {selected?.occurrences.map((occurrence, index) => <View key={`${String(occurrence.date)}-${index}`} className="flex-row justify-between border-t border-gf-border py-2"><Text className="font-inter text-sm text-gf-text-muted">{new Date(occurrence.date).toLocaleDateString('es-MX')}</Text><Text className="font-inter-semibold text-sm text-gf-text">{money(occurrence.amount)}</Text></View>)}
      </DetailSheet>
    </>
  );
}
