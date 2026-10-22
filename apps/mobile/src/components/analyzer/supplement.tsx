import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { BudgetSeriesSheet, ChampionsSheet, InsightSheet, SpendAnalysisSheet, WeekdaySheet, type ChampionKind } from '@/components/analyzer/sheets';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH, WIDE_MIN_WIDTH } from '@/hooks/use-device-class';
import type { FxExposureRow } from '@/hooks/use-accounts-fx-exposure';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { getBudgetBarColor } from '@gastify/core/transformers/budgetHistory';
import type { ProjectionMonthComparison } from '@gastify/core/transformers/projectionsChange';
import type { WalletAnalyzerBudgetRow, WalletAnalyzerInsightItem, WalletAnalyzerSnapshotData } from '@gastify/core/transformers/walletAnalyzer';
import { APP_INFO } from '@gastify/core/info/appInfo';

// The second line of a highlight tile on a tablet: a bit of context so the tile says more than the phone's single line.
function highlightSubtext(item: WalletAnalyzerInsightItem, currency: string): string {
  const d = (item.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const money = (value: unknown) => formatMoneyMajor(Number(value) || 0, currency);
  switch (item.type) {
    case 'budget': return `Límite ${money(d.limit)} · racha de ${d.streakMonths ?? 0} ${d.streakMonths === 1 ? 'mes' : 'meses'}`;
    case 'category_anomaly': return `Tu promedio es ${money(d.average)} · este mes ${money(d.current)}`;
    case 'subscription': return `${d.categoryName ?? 'Pago recurrente'} · toca para ver los cargos`;
    case 'savings_rate': return 'Parte de tus ingresos que conservas';
    default: return 'Toca para ver el detalle y cómo se calcula';
  }
}

export function AnalyzerHighlights({ snapshot, currency }: { snapshot: WalletAnalyzerSnapshotData; currency: string }) {
  const width = useWindowDimensions().width;
  const tablet = width >= TABLET_MIN_WIDTH;
  const wide = width >= WIDE_MIN_WIDTH;
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = useState<WalletAnalyzerInsightItem | null>(null);
  return (
    <Card title="Lo más destacado del mes" info={APP_INFO.lo_m_s_destacado}>
      {snapshot.insights.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin alertas destacadas este mes.</Text>}
      {tablet ? (
        <View className="flex-row flex-wrap gap-3">
          {snapshot.insights.map((item, index) => (
            <Pressable
              key={`${item.type}-${index}`}
              accessibilityRole="button"
              onPress={() => setOpen(item)}
              className="gap-2 rounded-2xl p-4"
              style={{ flexBasis: wide ? '23.5%' : '48%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl">{item.icon}</Text>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: item.tone === 'warning' ? colors.expense : item.tone === 'positive' ? colors.income : colors.accent }} />
              </View>
              <Text className="font-inter-semibold text-lg text-gf-text">{item.title}</Text>
              <Text className="font-inter text-sm text-gf-text-muted">{highlightSubtext(item, currency)}</Text>
            </Pressable>
          ))}
        </View>
      ) : snapshot.insights.map((item, index) => (
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
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Card title="Proyección del mes" info={APP_INFO.proyecci_n_del_mes} action={<Pressable accessibilityRole="link" onPress={() => router.push('/more/projections')}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver proyecciones</Text></Pressable>}>
      {loading && <Text className="font-inter text-sm text-gf-text-muted">Calculando proyección…</Text>}
      {error && <Text className="font-inter text-sm text-red-500">No se pudo cargar la proyección.</Text>}
      {!loading && !error && !comparison && <Text className="font-inter text-sm text-gf-text-muted">No hay una referencia guardada para comparar este mes cerrado, o el mes todavía no ha comenzado.</Text>}
      {comparison && <>
        <Text className="font-inter text-xs text-gf-text-muted">{comparison.type === 'closed' ? 'Mes cerrado · previsto contra real' : 'Mes en curso · avance contra previsto'}</Text>
        <View className="flex-row gap-3">
          {[
            { label: 'Ingresos', projected: comparison.projectedIncome, actual: comparison.actualIncome, tone: colors.income },
            { label: 'Gastos', projected: comparison.projectedExpense, actual: comparison.actualExpense, tone: colors.expense },
          ].map((side) => (
            <View key={side.label} className={tablet ? 'flex-1 gap-1.5 rounded-2xl p-4' : 'flex-1 gap-1'} style={tablet ? { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' } : undefined}>
              <Text className={`font-inter-semibold text-gf-text ${tablet ? 'text-lg' : 'text-sm'}`}>{side.label}</Text>
              <Text className={`font-inter text-gf-text-muted ${tablet ? 'text-base' : 'text-xs'}`}>Previsto {formatMoneyMajor(side.projected, currency)}</Text>
              <Text className={`font-inter-semibold ${tablet ? 'text-2xl' : 'text-sm'}`} style={{ color: side.tone }}>Real {formatMoneyMajor(side.actual, currency)}</Text>
            </View>
          ))}
        </View>
      </>}
      {missing.length > 0 && <Text className="font-inter text-xs text-gf-text-muted">Sin tipo de cambio para {missing.join(', ')}; revisa los importes en Proyecciones.</Text>}
    </Card>
  );
}

export function AnalyzerBudgets({ snapshot, currency }: { snapshot: WalletAnalyzerSnapshotData; currency: string }) {
  const [open, setOpen] = useState<WalletAnalyzerBudgetRow | null>(null);
  return (
    <Card title="Presupuestos · cumplimiento y rachas" info={APP_INFO.presupuestos_del_analizador}>
      {snapshot.budgetRows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">No tienes presupuestos de gasto configurados.</Text>}
      {[...snapshot.budgetRows].sort((a, b) => (b.limit > 0 ? b.spent / b.limit : 0) - (a.limit > 0 ? a.spent / a.limit : 0)).map((row) => {
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
    <Card title={`Grandes gastos · últimos ${patterns.monthsBack ?? 12} meses`} info={APP_INFO.grandes_gastos}>
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
    <Card title="Exposición multimoneda" info={APP_INFO.exposici_n_multimoneda}>
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
    <Card title="Patrón por día de la semana" info={APP_INFO.patr_n_semanal} action={<Pressable accessibilityRole="button" onPress={() => setExpanded(true)}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver detalle</Text></Pressable>}>
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
