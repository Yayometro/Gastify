import { Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
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
export function InsightsWidget({ insights, currency }: { insights: PeriodInsights; currency: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const pct = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
  return (
    <Card title="Perspectivas">
      <View className="flex-row flex-wrap gap-x-6 gap-y-4">
        <View className="w-[45%]"><Fact label="Gasto por día" value={formatMoneyMajor(insights.dailyAverage, currency)} detail={`en ${insights.daysElapsed} ${insights.daysElapsed === 1 ? 'día' : 'días'}`} /></View>
        {insights.projectedSpending !== null && (
          <View className="w-[45%]"><Fact label="Al ritmo actual" value={formatMoneyMajor(insights.projectedSpending, currency)} detail={`gastarías en ${insights.days} días`} /></View>
        )}
        {insights.savingsRate !== null && (
          <View className="w-[45%]"><Fact label="Lo que conservas" value={`${Math.round(insights.savingsRate * 100)}%`} detail="de tus ingresos" tone={insights.savingsRate < 0 ? colors.expense : colors.income} /></View>
        )}
        {insights.spendingChange !== null && (
          <View className="w-[45%]"><Fact label="Gastos vs periodo anterior" value={pct(insights.spendingChange)} tone={insights.spendingChange > 0 ? colors.expense : colors.income} /></View>
        )}
        {insights.incomeChange !== null && (
          <View className="w-[45%]"><Fact label="Ingresos vs periodo anterior" value={pct(insights.incomeChange)} tone={insights.incomeChange >= 0 ? colors.income : colors.expense} /></View>
        )}
        {insights.topCategory && (
          <View className="w-[45%]"><Fact label="Lo que más pesa" value={insights.topCategory.name} detail={`${Math.round(insights.topCategory.share * 100)}% de los gastos`} /></View>
        )}
      </View>
    </Card>
  );
}
