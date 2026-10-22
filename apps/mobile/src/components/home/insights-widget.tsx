import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { INSIGHTS_SECTIONS } from '@/lib/info-sections';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH, WIDE_MIN_WIDTH } from '@/hooks/use-device-class';
import type { PeriodInsights } from '@gastify/core/history/insights';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

// On a tablet each reading is its own glass tile (as the web's highlights are), with room for a longer subtext; on the phone
// it is plain text in two columns.
function Fact({ label, value, detail, tone, tile, compact }: { label: string; value: string; detail?: string; tone?: string; tile?: boolean; compact?: boolean }) {
  return (
    <View
      className={tile ? (compact ? 'flex-1 gap-0.5 rounded-2xl p-3' : 'flex-1 gap-1 rounded-2xl p-4') : 'gap-0.5'}
      style={tile ? { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' } : undefined}>
      <Text className={`font-inter text-gf-text-muted ${compact ? 'text-xs' : tile ? 'text-base' : 'text-sm'}`} numberOfLines={compact ? 2 : undefined}>{label}</Text>
      <Text className={`font-inter-bold text-gf-text ${compact ? 'text-base' : tile ? 'text-2xl' : 'text-xl'}`} numberOfLines={1} adjustsFontSizeToFit style={tone ? { color: tone } : undefined}>{value}</Text>
      {detail ? <Text className={`font-inter text-gf-text-muted ${compact ? 'text-[11px]' : tile ? 'text-sm' : 'text-xs'}`} numberOfLines={compact ? 2 : undefined}>{detail}</Text> : null}
    </View>
  );
}

// Perspectivas: the pace of spending, where it is heading, how much is kept and how it moved, as the
// web's analyzer strip does.
export function InsightsWidget({ insights, currency, onOpenAnalyzer }: { insights: PeriodInsights; currency: string; onOpenAnalyzer: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const width = useWindowDimensions().width;
  const tablet = width >= TABLET_MIN_WIDTH;
  const columns = width >= WIDE_MIN_WIDTH ? 3 : 2;
  const pct = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
  return (
    <Card
      title="Análisis del periodo"
      onTitlePress={onOpenAnalyzer}
      action={<Pressable accessibilityRole="link" onPress={onOpenAnalyzer} hitSlop={8}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver análisis completo</Text></Pressable>}
      info={{
        title: 'Análisis del periodo',
        text: 'Gasto por día = gasto del periodo ÷ días transcurridos. Al ritmo actual = ese promedio × los días del periodo (solo mientras sigue en curso). Lo que conservas = (ingresos − gastos) ÷ ingresos. Los cambios comparan contra el periodo inmediato anterior de la misma duración. El gasto promedio es el gasto total ÷ el número de gastos. Toca cualquier parte de la tarjeta para abrir el Analizador de cartera completo.', sections: INSIGHTS_SECTIONS }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir el Analizador de cartera" onPress={onOpenAnalyzer} className={tablet ? 'flex-row flex-wrap gap-3' : 'flex-row flex-wrap gap-2'}>
        <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { flexBasis: '47%', flexGrow: 1, flexDirection: 'row' }}><Fact tile compact={!tablet} label="Gasto por día" value={formatMoneyMajor(insights.dailyAverage, currency)} detail={`en ${insights.daysElapsed} ${insights.daysElapsed === 1 ? 'día' : 'días'}`} /></View>
        {insights.projectedSpending !== null && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Al ritmo actual" value={formatMoneyMajor(insights.projectedSpending, currency)} detail={`gastarías en ${insights.days} días`} /></View>
        )}
        {insights.savingsRate !== null && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Lo que conservas" value={`${Math.round(insights.savingsRate * 100)}%`} detail="de tus ingresos" tone={insights.savingsRate < 0 ? colors.expense : colors.income} /></View>
        )}
        {insights.spendingChange !== null && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Gastos vs periodo anterior" value={pct(insights.spendingChange)} tone={insights.spendingChange > 0 ? colors.expense : colors.income} /></View>
        )}
        {insights.incomeChange !== null && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Ingresos vs periodo anterior" value={pct(insights.incomeChange)} tone={insights.incomeChange >= 0 ? colors.income : colors.expense} /></View>
        )}
        {insights.topCategory && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Lo que más pesa" value={insights.topCategory.name} detail={`${Math.round(insights.topCategory.share * 100)}% de los gastos`} /></View>
        )}
        {insights.biggestExpense && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Gasto más grande" value={formatMoneyMajor(insights.biggestExpense.amount, currency)} detail={`${insights.biggestExpense.name} · ${Math.round(insights.biggestExpense.share * 100)}% del gasto`} /></View>
        )}
        {insights.averageExpense !== null && (
          <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Gasto promedio" value={formatMoneyMajor(insights.averageExpense, currency)} detail="por cada gasto" /></View>
        )}
        <View style={tablet ? { flexBasis: columns === 3 ? '31%' : '47%', flexGrow: 1, flexDirection: 'row' } : { width: '45%' }}><Fact tile compact={!tablet} label="Balance del periodo" value={formatMoneyMajor(insights.balance, currency)} detail={`${insights.movementCount} ${insights.movementCount === 1 ? 'movimiento' : 'movimientos'}`} tone={insights.balance < 0 ? colors.expense : colors.income} /></View>
      </Pressable>
    </Card>
  );
}
