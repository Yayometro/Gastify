import type { ReactElement } from 'react';
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
  const tile = (key: string, fact: Omit<Parameters<typeof Fact>[0], 'tile' | 'compact'>) => <Fact key={key} tile compact={!tablet} {...fact} />;
  const facts: ReactElement[] = [tile('daily', { label: 'Gasto por día', value: formatMoneyMajor(insights.dailyAverage, currency), detail: `en ${insights.daysElapsed} ${insights.daysElapsed === 1 ? 'día' : 'días'}` })];
  if (insights.projectedSpending !== null) facts.push(tile('projected', { label: 'Al ritmo actual', value: formatMoneyMajor(insights.projectedSpending, currency), detail: `gastarías en ${insights.days} días` }));
  if (insights.savingsRate !== null) facts.push(tile('savings', { label: 'Lo que conservas', value: `${Math.round(insights.savingsRate * 100)}%`, detail: 'de tus ingresos', tone: insights.savingsRate < 0 ? colors.expense : colors.income }));
  if (insights.spendingChange !== null) facts.push(tile('spending-change', { label: 'Gastos vs periodo anterior', value: pct(insights.spendingChange), tone: insights.spendingChange > 0 ? colors.expense : colors.income }));
  if (insights.incomeChange !== null) facts.push(tile('income-change', { label: 'Ingresos vs periodo anterior', value: pct(insights.incomeChange), tone: insights.incomeChange >= 0 ? colors.income : colors.expense }));
  if (insights.topCategory) facts.push(tile('top-category', { label: 'Lo que más pesa', value: insights.topCategory.name, detail: `${Math.round(insights.topCategory.share * 100)}% de los gastos` }));
  if (insights.biggestExpense) facts.push(tile('biggest', { label: 'Gasto más grande', value: formatMoneyMajor(insights.biggestExpense.amount, currency), detail: `${insights.biggestExpense.name} · ${Math.round(insights.biggestExpense.share * 100)}% del gasto` }));
  if (insights.averageExpense !== null) facts.push(tile('average', { label: 'Gasto promedio', value: formatMoneyMajor(insights.averageExpense, currency), detail: 'por cada gasto' }));
  facts.push(tile('balance', { label: 'Balance del periodo', value: formatMoneyMajor(insights.balance, currency), detail: `${insights.movementCount} ${insights.movementCount === 1 ? 'movimiento' : 'movimientos'}`, tone: insights.balance < 0 ? colors.expense : colors.income }));
  const perRow = tablet ? columns : 2;
  const rows: ReactElement[][] = [];
  for (let index = 0; index < facts.length; index += perRow) rows.push(facts.slice(index, index + perRow));

  return (
    <Card
      title="Análisis del periodo"
      onTitlePress={onOpenAnalyzer}
      action={<Pressable accessibilityRole="link" onPress={onOpenAnalyzer} hitSlop={8}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>Ver análisis completo</Text></Pressable>}
      info={{
        title: 'Análisis del periodo',
        text: 'Gasto por día = gasto del periodo ÷ días transcurridos. Al ritmo actual = ese promedio × los días del periodo (solo mientras sigue en curso). Lo que conservas = (ingresos − gastos) ÷ ingresos. Los cambios comparan contra el periodo inmediato anterior de la misma duración. El gasto promedio es el gasto total ÷ el número de gastos. Toca cualquier parte de la tarjeta para abrir el Analizador de cartera completo.', sections: INSIGHTS_SECTIONS }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir el Analizador de cartera" onPress={onOpenAnalyzer} className={tablet ? 'gap-3' : 'gap-2'}>
        {rows.map((row, rowIndex) => (
          // Each row shares the width equally, so tiles in a row match in size and an unpaired last tile fills the row.
          <View key={rowIndex} className={`flex-row ${tablet ? 'gap-3' : 'gap-2'}`}>
            {row.map((fact, index) => <View key={index} className="flex-1 flex-row">{fact}</View>)}
          </View>
        ))}
      </Pressable>
    </Card>
  );
}
