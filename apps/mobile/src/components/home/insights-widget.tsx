import type { ReactElement } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH, WIDE_MIN_WIDTH } from '@/hooks/use-device-class';
import type { PeriodInsights } from '@gastify/core/history/insights';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

import { useT, useInfo } from "@/i18n/client";
import { tNow } from '@/i18n/now';

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
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const width = useWindowDimensions().width;
  const tablet = width >= TABLET_MIN_WIDTH;
  const columns = width >= WIDE_MIN_WIDTH ? 3 : 2;
  const pct = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
  const tile = (key: string, fact: Omit<Parameters<typeof Fact>[0], 'tile' | 'compact'>) => <Fact key={key} tile compact={!tablet} {...fact} />;
  const facts: ReactElement[] = [tile('daily', { label: t("mobile.gasto.por.dia"), value: formatMoneyMajor(insights.dailyAverage, currency), detail: tNow("mobile.dias.conteo", { count: insights.daysElapsed, p1: insights.daysElapsed }) })];
  if (insights.projectedSpending !== null) facts.push(tile('projected', { label: t("mobile.al.ritmo.actual"), value: formatMoneyMajor(insights.projectedSpending, currency), detail: tNow("mobile.gastarias.en.p1.dias", { p1: insights.days }) }));
  if (insights.savingsRate !== null) facts.push(tile('savings', { label: t("mobile.lo.que.conservas"), value: `${Math.round(insights.savingsRate * 100)}%`, detail: t("mobile.de.tus.ingresos"), tone: insights.savingsRate < 0 ? colors.expense : colors.income }));
  if (insights.spendingChange !== null) facts.push(tile('spending-change', { label: t("mobile.gastos.vs.periodo.anterior"), value: pct(insights.spendingChange), tone: insights.spendingChange > 0 ? colors.expense : colors.income }));
  if (insights.incomeChange !== null) facts.push(tile('income-change', { label: t("mobile.ingresos.vs.periodo.anterior"), value: pct(insights.incomeChange), tone: insights.incomeChange >= 0 ? colors.income : colors.expense }));
  if (insights.topCategory) facts.push(tile('top-category', { label: t("mobile.lo.que.mas.pesa"), value: insights.topCategory.name, detail: tNow("mobile.p1.de.los.gastos", { p1: Math.round(insights.topCategory.share * 100) }) }));
  if (insights.biggestExpense) facts.push(tile('biggest', { label: t("mobile.gasto.mas.grande"), value: formatMoneyMajor(insights.biggestExpense.amount, currency), detail: tNow("mobile.p1.p2.del.gasto", { p1: insights.biggestExpense.name, p2: Math.round(insights.biggestExpense.share * 100) }) }));
  if (insights.averageExpense !== null) facts.push(tile('average', { label: t("mobile.gasto.promedio"), value: formatMoneyMajor(insights.averageExpense, currency), detail: t("mobile.por.cada.gasto") }));
  facts.push(tile('balance', { label: t("mobile.balance.del.periodo"), value: formatMoneyMajor(insights.balance, currency), detail: tNow("mobile.movimientos.conteo", { count: insights.movementCount, p1: insights.movementCount }), tone: insights.balance < 0 ? colors.expense : colors.income }));
  const perRow = tablet ? columns : 2;
  const rows: ReactElement[][] = [];
  for (let index = 0; index < facts.length; index += perRow) rows.push(facts.slice(index, index + perRow));

  return (
    <Card
      title={t("mobile.analisis.del.periodo")}
      onTitlePress={onOpenAnalyzer}
      action={<Pressable accessibilityRole="link" onPress={onOpenAnalyzer} hitSlop={8}><Text className="font-inter-semibold text-xs" style={{ color: colors.accent }}>{t("mobile.ver.analisis.completo")}</Text></Pressable>}
      info={APP_INFO.an_lisis_del_periodo}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.abrir.el.analizador.de.cartera")} onPress={onOpenAnalyzer} className={tablet ? 'gap-3' : 'gap-2'}>
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
