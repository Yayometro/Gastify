import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { WIDE_MIN_WIDTH } from '@/hooks/use-device-class';
import type { PeriodInsights } from '@gastify/core/history/insights';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

function Fact({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: string }) {
  return (
    <View className="gap-0.5">
      <Text className="font-inter text-sm text-gf-text-muted">{label}</Text>
      <Text className="font-inter-bold text-xl text-gf-text" style={tone ? { color: tone } : undefined}>{value}</Text>
      {detail ? <Text className="font-inter text-xs text-gf-text-muted">{detail}</Text> : null}
    </View>
  );
}

// Perspectivas: the pace of spending, where it is heading, how much is kept and how it moved, as the
// web's analyzer strip does.
export function InsightsWidget({ insights, currency, onOpenAnalyzer }: { insights: PeriodInsights; currency: string; onOpenAnalyzer: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const columns = useWindowDimensions().width >= WIDE_MIN_WIDTH ? 3 : 2;
  const pct = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
  return (
    <Card
      title="Análisis del periodo"
      onTitlePress={onOpenAnalyzer}
      action={<Pressable accessibilityRole="link" onPress={onOpenAnalyzer} hitSlop={8}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver análisis completo</Text></Pressable>}
      info={{
        title: 'Análisis del periodo',
        text: 'Gasto por día = gasto del periodo ÷ días transcurridos. Al ritmo actual = ese promedio × los días del periodo (solo mientras sigue en curso). Lo que conservas = (ingresos − gastos) ÷ ingresos. Los cambios comparan contra el periodo inmediato anterior de la misma duración. El gasto promedio es el gasto total ÷ el número de gastos. Toca cualquier parte de la tarjeta para abrir el Analizador de cartera completo.',
      }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir el Analizador de cartera" onPress={onOpenAnalyzer} className="flex-row flex-wrap gap-x-6 gap-y-4">
        <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Gasto por día" value={formatMoneyMajor(insights.dailyAverage, currency)} detail={`en ${insights.daysElapsed} ${insights.daysElapsed === 1 ? 'día' : 'días'}`} /></View>
        {insights.projectedSpending !== null && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Al ritmo actual" value={formatMoneyMajor(insights.projectedSpending, currency)} detail={`gastarías en ${insights.days} días`} /></View>
        )}
        {insights.savingsRate !== null && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Lo que conservas" value={`${Math.round(insights.savingsRate * 100)}%`} detail="de tus ingresos" tone={insights.savingsRate < 0 ? colors.expense : colors.income} /></View>
        )}
        {insights.spendingChange !== null && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Gastos vs periodo anterior" value={pct(insights.spendingChange)} tone={insights.spendingChange > 0 ? colors.expense : colors.income} /></View>
        )}
        {insights.incomeChange !== null && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Ingresos vs periodo anterior" value={pct(insights.incomeChange)} tone={insights.incomeChange >= 0 ? colors.income : colors.expense} /></View>
        )}
        {insights.topCategory && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Lo que más pesa" value={insights.topCategory.name} detail={`${Math.round(insights.topCategory.share * 100)}% de los gastos`} /></View>
        )}
        {insights.biggestExpense && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Gasto más grande" value={formatMoneyMajor(insights.biggestExpense.amount, currency)} detail={`${insights.biggestExpense.name} · ${Math.round(insights.biggestExpense.share * 100)}% del gasto`} /></View>
        )}
        {insights.averageExpense !== null && (
          <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Gasto promedio" value={formatMoneyMajor(insights.averageExpense, currency)} detail="por cada gasto" /></View>
        )}
        <View style={{ width: columns === 3 ? '30%' : '45%' }}><Fact label="Balance del periodo" value={formatMoneyMajor(insights.balance, currency)} detail={`${insights.movementCount} ${insights.movementCount === 1 ? 'movimiento' : 'movimientos'}`} tone={insights.balance < 0 ? colors.expense : colors.income} /></View>
      </Pressable>
    </Card>
  );
}
