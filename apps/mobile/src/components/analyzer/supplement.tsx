import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { BudgetSeriesSheet, ChampionsSheet, InsightSheet, SpendAnalysisSheet, WeekdaySheet, type ChampionKind } from '@/components/analyzer/sheets';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import type { FxExposureRow } from '@/hooks/use-accounts-fx-exposure';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import type { ProjectionMonthComparison } from '@gastify/core/transformers/projectionsChange';
import type { WalletAnalyzerBudgetRow, WalletAnalyzerInsightItem, WalletAnalyzerSnapshotData } from '@gastify/core/transformers/walletAnalyzer';

export function AnalyzerHighlights({ snapshot, currency }: { snapshot: WalletAnalyzerSnapshotData; currency: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = useState<WalletAnalyzerInsightItem | null>(null);
  return (
    <Card title="Lo más destacado del mes" info={{ title: 'Lo más destacado', text: 'Señales calculadas con tus movimientos del mes: límites superados, categorías fuera de lo habitual (contra el promedio de los 6 meses anteriores, sin contar el actual, y con al menos 3 meses de historial), suscripciones detectadas, rachas y ritmo de gasto. Toca una para ver los meses y el cálculo detrás. No son movimientos adicionales.' }}>
      {snapshot.insights.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin alertas destacadas este mes.</Text>}
      {snapshot.insights.map((item, index) => (
        <Pressable key={`${item.type}-${index}`} accessibilityRole="button" onPress={() => setOpen(item)} className="flex-row items-center gap-3 border-t border-gf-border py-2.5">
          <Text className="text-xl">{item.icon}</Text>
          <Text className="flex-1 font-inter-medium text-sm text-gf-text">{item.title}</Text>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.tone === 'warning' ? colors.expense : item.tone === 'positive' ? colors.income : colors.accent }} />
          <Text className="font-inter text-lg text-gf-text-muted">›</Text>
        </Pressable>
      ))}
      <InsightSheet insight={open} currency={currency} onClose={() => setOpen(null)} />
    </Card>
  );
}

export function AnalyzerProjection({ comparison, loading, error, missing, currency }: { comparison: ProjectionMonthComparison | null; loading: boolean; error: boolean; missing: string[]; currency: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Card title="Proyección del mes" info={{ title: 'Proyección del mes', text: 'Contrasta los ingresos y gastos previstos con los movimientos reales del mes elegido. Para un mes cerrado solo aparece la comparación si había referencias o ajustes registrados; en el mes actual muestra el avance.' }} action={<Pressable accessibilityRole="link" onPress={() => router.push('/more/projections')}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver proyecciones</Text></Pressable>}>
      {loading && <Text className="font-inter text-sm text-gf-text-muted">Calculando proyección…</Text>}
      {error && <Text className="font-inter text-sm text-red-500">No se pudo cargar la proyección.</Text>}
      {!loading && !error && !comparison && <Text className="font-inter text-sm text-gf-text-muted">No hay una referencia guardada para comparar este mes cerrado, o el mes todavía no ha comenzado.</Text>}
      {comparison && <>
        <Text className="font-inter text-xs text-gf-text-muted">{comparison.type === 'closed' ? 'Mes cerrado · previsto contra real' : 'Mes en curso · avance contra previsto'}</Text>
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1"><Text className="font-inter-semibold text-sm text-gf-text">Ingresos</Text><Text className="font-inter text-xs text-gf-text-muted">Previsto {formatMoneyMajor(comparison.projectedIncome, currency)}</Text><Text className="font-inter-semibold text-sm" style={{ color: colors.income }}>Real {formatMoneyMajor(comparison.actualIncome, currency)}</Text></View>
          <View className="flex-1 gap-1"><Text className="font-inter-semibold text-sm text-gf-text">Gastos</Text><Text className="font-inter text-xs text-gf-text-muted">Previsto {formatMoneyMajor(comparison.projectedExpense, currency)}</Text><Text className="font-inter-semibold text-sm" style={{ color: colors.expense }}>Real {formatMoneyMajor(comparison.actualExpense, currency)}</Text></View>
        </View>
      </>}
      {missing.length > 0 && <Text className="font-inter text-xs text-gf-text-muted">Sin tipo de cambio para {missing.join(', ')}; revisa los importes en Proyecciones.</Text>}
    </Card>
  );
}

export function AnalyzerBudgets({ snapshot, currency }: { snapshot: WalletAnalyzerSnapshotData; currency: string }) {
  const [open, setOpen] = useState<WalletAnalyzerBudgetRow | null>(null);
  return (
    <Card title="Presupuestos · cumplimiento y rachas" info={{ title: 'Presupuestos del analizador', text: 'Compara el gasto de cada presupuesto con su límite en el periodo y muestra cuántos meses seguidos se cumplió (la racha). Toca uno para ver sus últimos 12 meses: lo gastado, el límite de cada mes y si se cumplió.' }}>
      {snapshot.budgetRows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No tienes presupuestos de gasto configurados.</Text>}
      {snapshot.budgetRows.map((row) => {
        const ratio = row.limit > 0 ? row.spent / row.limit : 0;
        return (
          <Pressable key={row.budgetId} accessibilityRole="button" onPress={() => setOpen(row)} className="gap-1.5 border-t border-gf-border py-2">
            <View className="flex-row justify-between gap-3">
              <Text className="flex-1 font-inter-semibold text-sm text-gf-text" numberOfLines={1}>{row.category}</Text>
              <Text className="font-inter text-xs text-gf-text-muted">{row.streakMonths >= 2 ? `${row.streakMonths} meses ✓` : `${Math.round(row.pct)}%`}</Text>
            </View>
            <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.spent, currency)} de {formatMoneyMajor(row.limit, currency)}</Text>
            <ProgressBar ratio={ratio} color={getBudgetBarColor(ratio, false)} />
          </Pressable>
        );
      })}
      <BudgetSeriesSheet row={open} currency={currency} onClose={() => setOpen(null)} />
    </Card>
  );
}

export function AnalyzerBiggest({ snapshot, currency }: { snapshot: WalletAnalyzerSnapshotData; currency: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [kind, setKind] = useState<ChampionKind | null>(null);
  const [analysis, setAnalysis] = useState(false);
  const patterns = snapshot.biggestSpendPatterns;
  const money = (value: number) => formatMoneyMajor(value, currency);
  if (!patterns) return null;
  const tile = { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border } as const;
  return (
    <Card title={`Grandes gastos · últimos ${patterns.monthsBack ?? 12} meses`} info={{ title: 'Grandes gastos', text: 'Muestra la transacción, la categoría y la subcategoría con más gasto en los últimos doce meses. Toca cada una para ver quién lideró cada mes, o abre «Ver mes por mes» para el resumen completo y «Ver análisis» para una lectura en palabras.' }}>
      <Pressable accessibilityRole="button" onPress={() => setKind('transaction')} className="gap-1 rounded-2xl p-3" style={tile}>
        <Text className="font-inter text-xs text-gf-text-muted">Transacción más grande · toca para ver cada mes</Text>
        <Text className="font-inter-semibold text-base text-gf-text">{patterns.biggestTransaction.name}</Text>
        <Text className="font-inter-bold text-xl text-gf-text">{money(patterns.biggestTransaction.amount)}</Text>
        <Text className="font-inter text-xs text-gf-text-muted">{patterns.biggestTransaction.categoryName}</Text>
      </Pressable>
      <View className="flex-row gap-2">
        <Pressable accessibilityRole="button" onPress={() => setKind('category')} className="flex-1 gap-1 rounded-2xl p-3" style={tile}>
          <Text className="font-inter text-xs text-gf-text-muted">Categoría líder ›</Text>
          <Text className="font-inter-semibold text-sm text-gf-text" numberOfLines={2}>{patterns.biggestCategory.name}</Text>
          <Text className="font-inter-bold text-sm text-gf-text">{money(patterns.biggestCategory.total)}</Text>
        </Pressable>
        {patterns.biggestSubcategory && <Pressable accessibilityRole="button" onPress={() => setKind('subCategory')} className="flex-1 gap-1 rounded-2xl p-3" style={tile}>
          <Text className="font-inter text-xs text-gf-text-muted">Subcategoría líder ›</Text>
          <Text className="font-inter-semibold text-sm text-gf-text" numberOfLines={2}>{patterns.biggestSubcategory.name}</Text>
          <Text className="font-inter-bold text-sm text-gf-text">{money(patterns.biggestSubcategory.total)}</Text>
        </Pressable>}
      </View>
      <Text className="font-inter text-xs text-gf-text-muted">La categoría líder representa {Math.round(patterns.analysis.categoryShareOfTotal)}% del gasto de este periodo.</Text>
      <View className="flex-row gap-2">
        <Pressable accessibilityRole="button" onPress={() => setKind('category')} className="flex-1 items-center rounded-full border border-gf-border py-2.5">
          <Text className="font-inter-semibold text-sm text-gf-text">Ver mes por mes</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setAnalysis(true)} className="flex-1 items-center rounded-full py-2.5" style={{ backgroundColor: colors.accentSoft }}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Ver análisis</Text>
        </Pressable>
      </View>
      <ChampionsSheet kind={kind} months={snapshot.monthlyChampions?.months ?? []} currency={currency} onClose={() => setKind(null)} />
      <SpendAnalysisSheet patterns={patterns} visible={analysis} onClose={() => setAnalysis(false)} />
    </Card>
  );
}

export function AnalyzerFxExposure({ rows, loading, missing, currency }: { rows: FxExposureRow[]; loading: boolean; missing: string[]; currency: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Card title="Exposición multimoneda" info={{ title: 'Exposición multimoneda', text: 'Tus saldos actuales en otras monedas convertidos a la moneda principal. El cambio compara el tipo de cambio actual con el cierre del mes anterior usando el mismo saldo nativo; no es rendimiento de la cuenta.' }}>
      {loading && <Text className="font-inter text-sm text-gf-text-muted">Consultando tipos de cambio…</Text>}
      {!loading && rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No hay saldos en otra moneda con una cotización disponible.</Text>}
      {rows.map((row) => <View key={row.currency} className="flex-row items-center justify-between gap-2 border-t border-gf-border py-2">
        <View className="flex-1">
          <Text className="font-inter-semibold text-sm text-gf-text">{row.currency}</Text>
          <Text className="font-inter text-xs text-gf-text-muted">{formatMoneyMajor(row.nativeAmount, row.currency)}</Text>
        </View>
        <View className="items-end">
          <Text className="font-inter-semibold text-sm text-gf-text">{formatMoneyMajor(row.valueInPrimary, currency)}</Text>
          <Text className="font-inter text-xs" style={{ color: row.changePct === null ? colors.textSecondary : row.changePct >= 0 ? colors.income : colors.expense }}>{row.changePct === null ? 'Sin comparación' : `${row.changePct >= 0 ? '+' : ''}${Math.round(row.changePct)}% vs mes anterior`}</Text>
        </View>
      </View>)}
      {missing.length > 0 && <Text className="font-inter text-xs text-gf-text-muted">Sin cotización para {missing.join(', ')}; esos saldos no se convierten.</Text>}
    </Card>
  );
}

export function AnalyzerWeekday({ snapshot, currency }: { snapshot: WalletAnalyzerSnapshotData; currency: string }) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [expanded, setExpanded] = useState(false);
  const data = snapshot.weekdaySpending;
  const max = Math.max(1, ...data.days.map((day) => day.avgPerOccurrence));
  return (
    <Card title="Patrón por día de la semana" info={{ title: 'Patrón semanal', text: 'Se suma el gasto de cada día de la semana en el mes elegido y se divide entre cuántas veces cayó ese día (un mes tiene 4 o 5 de cada uno), para que la comparación sea justa. «Ver detalle» muestra la semana con más gasto y cada día.' }} action={<Pressable accessibilityRole="button" onPress={() => setExpanded(true)}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver detalle</Text></Pressable>}>
      {data.days.map((day) => <View key={day.dayIndex} className="flex-row items-center gap-2">
        <Text className="w-20 font-inter-medium text-xs text-gf-text">{day.dayName}</Text>
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${Math.max(0, Math.min(100, (day.avgPerOccurrence / max) * 100))}%`, height: '100%', backgroundColor: colors.accent }} /></View>
        <Text className="w-24 text-right font-inter-semibold text-xs text-gf-text">{formatMoneyMajor(day.avgPerOccurrence, currency)}</Text>
      </View>)}
      <Text className="font-inter text-xs text-gf-text-muted">{data.insight}</Text>
      <WeekdaySheet data={data} visible={expanded} currency={currency} onClose={() => setExpanded(false)} />
    </Card>
  );
}
