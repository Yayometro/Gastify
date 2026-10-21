import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { ChampionsSheet, SpendAnalysisSheet, type ChampionKind } from '@/components/analyzer/sheets';
import { CategoryBadge } from '@/components/category-badge';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { computeMonthlyChampions, detectSubscriptions, findBiggestSpendPatterns } from '@gastify/core/transformers/walletAnalyzer';

export function HistoryExtraInsights({ movements, currency, end, compareEnd }: { movements: TransactionData[]; currency: string; end: Date; compareEnd?: Date }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const anchor = useMemo(() => end < new Date() ? end : new Date(), [end]);
  const patterns = useMemo(() => findBiggestSpendPatterns(movements, anchor, 12), [movements, anchor]);
  // With a comparison, the same 12-month reading is made ending at the compared period, to put beside the first.
  const compareAnchor = useMemo(() => (compareEnd ? (compareEnd < new Date() ? compareEnd : new Date()) : null), [compareEnd]);
  const comparePatterns = useMemo(() => (compareAnchor ? findBiggestSpendPatterns(movements, compareAnchor, 12) : null), [movements, compareAnchor]);
  const champions = useMemo(() => computeMonthlyChampions(movements, anchor, 12), [movements, anchor]);
  const subscriptions = useMemo(() => detectSubscriptions(movements, anchor, 3, 6), [movements, anchor]);
  const [kind, setKind] = useState<ChampionKind | null>(null);
  const [analysis, setAnalysis] = useState(false);
  const [openSubscription, setOpenSubscription] = useState<string | null>(null);
  const money = (value: number) => formatMoneyMajor(value, currency);
  const selected = subscriptions.find((item) => item.name === openSubscription);
  const tile = { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border } as const;

  return (
    <>
      <Card title="Grandes gastos · últimos 12 meses" info={{ title: 'Grandes gastos', text: 'La mayor transacción, categoría y subcategoría del año móvil que termina en el periodo elegido. Toca cada una para ver quién lideró cada mes (con su mes), «Ver líderes mes por mes» para el resumen y «Ver análisis» para una lectura en palabras.' }}>
        {!patterns && <Text className="font-inter text-sm text-gf-text-muted">No hay gastos registrados en estos doce meses.</Text>}
        {patterns && <>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver la transacción más grande de cada mes" onPress={() => setKind('transaction')} className="gap-1 rounded-2xl p-3" style={tile}>
            <Text className="font-inter text-xs text-gf-text-muted">Mayor transacción · toca para ver cada mes</Text>
            <Text className="font-inter-semibold text-base text-gf-text">{patterns.biggestTransaction.name}</Text>
            <Text className="font-inter-bold text-xl text-gf-text">{money(patterns.biggestTransaction.amount)}</Text>
            {compareEnd ? <Text className="font-inter-semibold text-sm text-gf-text-muted">vs {comparePatterns ? `${comparePatterns.biggestTransaction.name} · ${money(comparePatterns.biggestTransaction.amount)}` : '—'} (comparado)</Text> : null}
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable accessibilityRole="button" onPress={() => setKind('category')} className="flex-1 rounded-2xl p-3" style={tile}><Text className="font-inter text-xs text-gf-text-muted">Categoría líder ›</Text><Text className="font-inter-semibold text-sm text-gf-text">{patterns.biggestCategory.name}</Text><Text className="font-inter-bold text-sm text-gf-text">{money(patterns.biggestCategory.total)}</Text>{compareEnd ? <Text className="font-inter-semibold text-xs text-gf-text-muted">vs {comparePatterns ? `${comparePatterns.biggestCategory.name} · ${money(comparePatterns.biggestCategory.total)}` : '—'}</Text> : null}</Pressable>
            {patterns.biggestSubcategory && <Pressable accessibilityRole="button" onPress={() => setKind('subCategory')} className="flex-1 rounded-2xl p-3" style={tile}><Text className="font-inter text-xs text-gf-text-muted">Subcategoría líder ›</Text><Text className="font-inter-semibold text-sm text-gf-text">{patterns.biggestSubcategory.name}</Text><Text className="font-inter-bold text-sm text-gf-text">{money(patterns.biggestSubcategory.total)}</Text>{compareEnd ? <Text className="font-inter-semibold text-xs text-gf-text-muted">vs {comparePatterns?.biggestSubcategory ? `${comparePatterns.biggestSubcategory.name} · ${money(comparePatterns.biggestSubcategory.total)}` : '—'}</Text> : null}</Pressable>}
          </View>
          <View className="flex-row gap-2">
            <Pressable accessibilityRole="button" onPress={() => setKind('category')} className="flex-1 items-center rounded-full border border-gf-border py-2.5"><Text className="font-inter-semibold text-sm text-gf-text">Ver líderes mes por mes</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setAnalysis(true)} className="flex-1 items-center rounded-full py-2.5" style={{ backgroundColor: colors.accentSoft }}><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Ver análisis</Text></Pressable>
          </View>
        </>}
      </Card>
      <ChampionsSheet kind={kind} months={champions.months} currency={currency} onClose={() => setKind(null)} />
      <SpendAnalysisSheet patterns={patterns} visible={analysis} onClose={() => setAnalysis(false)} />

      <Card title="Suscripciones recurrentes" info={{ title: 'Suscripciones recurrentes', text: 'Se detectan gastos con el mismo nombre que aparecen en al menos 2 de los últimos 3 meses con un monto que varía menos de 15%. El monto mostrado es el cargo más reciente. Toca uno para revisar sus fechas e importes (y abrir cada movimiento); se marca «nuevo» si antes no existía y «posible duplicado» si hay dos cargos con menos de 48 horas de diferencia en el mes.' }}>
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
        {selected?.occurrences.map((occurrence, index) => <Pressable key={`${String(occurrence.date)}-${index}`} accessibilityRole="button" disabled={!occurrence._id} onPress={() => { setOpenSubscription(null); router.push({ pathname: '/movements/[id]', params: { id: String(occurrence._id), returnTo: '/more/history' } }); }} className="flex-row justify-between border-t border-gf-border py-2.5"><Text className="font-inter text-sm text-gf-text-muted">{new Date(occurrence.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</Text><Text className="font-inter-semibold text-sm text-gf-text">{money(occurrence.amount)} ›</Text></Pressable>)}
      </DetailSheet>
    </>
  );
}
