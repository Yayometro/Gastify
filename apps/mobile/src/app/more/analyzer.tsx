import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { esMonthLabel } from '@/lib/month-label';
import { CategoryDetailSheet } from '@/components/category-detail-sheet';
import { Explain, Indicator } from '@/components/analyzer/sheets';
import { AnalyzerBiggest, AnalyzerBudgets, AnalyzerFxExposure, AnalyzerHighlights, AnalyzerProjection, AnalyzerWeekday } from '@/components/analyzer/supplement';
import { CategoryBadge } from '@/components/category-badge';
import { RankedRow } from '@/components/ui/ranked-row';
import { ChipPicker } from '@/components/chip-picker';
import { MonthSwitcher } from '@/components/month-switcher';
import { Screen } from '@/components/screen';
import { Card, PairedColumn } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH, WIDE_MIN_WIDTH } from '@/hooks/use-device-class';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useAccountsFxExposure } from '@/hooks/use-accounts-fx-exposure';
import { useAnalyzerProjection } from '@/hooks/use-analyzer-projection';
import type { RootState } from '@/store';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { isInRange } from '@gastify/core/transactions/movementFilters';
import { buildWalletAnalyzerSnapshot, type WalletAnalyzerSnapshotData } from '@gastify/core/transformers/walletAnalyzer';

import { useT, useInfo } from "@/i18n/client";

type Detail =
  | { kind: 'month'; label: string; income: number; expense: number; count: number; previous: { label: string; income: number; expense: number; count: number } | null }
  | { kind: 'category'; name: string; icon?: string; color?: string; current: number; previous: number; changePct: number | null; period?: 'current' | 'previous' }
  | { kind: 'averages' }
  | { kind: 'pace' }
  | { kind: 'subscriptions' };

const TOP_SIZES = ['3', '6', '12', '24'] as const;

const pct = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${value >= 0 ? '+' : ''}${Math.round(value)}%`);

// The Wallet Analyzer on the phone: the same snapshot the web builds (totals against the previous month, a six-month
// trend, averages, the biggest categories and movements, the spending pace), each card opening its detail.
export default function AnalyzerScreen() {
  const { APP_INFO } = useInfo();
  const t = useT();
  const { month: monthParam } = useLocalSearchParams<{ month?: string }>();
  // A tablet turned sideways has room for two columns, as the web's wide layout does.
  const wide = useWindowDimensions().width >= WIDE_MIN_WIDTH;
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthParam ?? '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [topN, setTopN] = useState<(typeof TOP_SIZES)[number]>('6');
  const [detail, setDetail] = useState<Detail | null>(null);
  const fxExposure = useAccountsFxExposure(accounts, currency, month);
  const projection = useAnalyzerProjection(month, transactions, budgets, currency);

  const snapshot = useMemo<WalletAnalyzerSnapshotData>(
    () => buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate: month, topN: Number(topN) }),
    [transactions, budgets, month, topN]
  );
  const { currentTotals: now_, previousTotals: before, trend, topCategoriesBills, topCategoriesBillsPrevious, topTransactionsBills, monthlyAverages, pace, subscriptions } = snapshot;
  const money = (value: number) => formatMoneyMajor(value, currency);
  const tablet = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const barArea = tablet ? 240 : 120;
  const barWidth = tablet ? 44 : 9;
  const short = (value: number) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(Math.round(value)));
  const maxTrend = Math.max(1, ...trend.flatMap((item) => [item.income, item.expense]));
  const change = (current: number, previous: number) => (previous > 0 ? ((current - previous) / previous) * 100 : null);

  const rows: { label: string; current: string; previous: string; delta: number | null; invert?: boolean; points?: boolean }[] = [
    { label: t("mobile.ingresos"), current: money(now_.income), previous: money(before.income), delta: change(now_.income, before.income) },
    { label: t("mobile.gastos"), current: money(now_.expense), previous: money(before.expense), delta: change(now_.expense, before.expense), invert: true },
    { label: t("mobile.balance"), current: money(now_.balance), previous: money(before.balance), delta: change(now_.balance, before.balance) },
    { label: t("mobile.ahorro"), current: `${Math.round(now_.savingsRate * 100)}%`, previous: `${Math.round(before.savingsRate * 100)}%`, delta: (now_.savingsRate - before.savingsRate) * 100, points: true },
    { label: t("mobile.movimientos"), current: String(now_.transactionCount), previous: String(before.transactionCount), delta: change(now_.transactionCount, before.transactionCount) },
  ];

  const categoryMovements = useMemo(() => {
    if (detail?.kind !== 'category') return [];
    return transactions
      .filter((tx) => tx.isBill && !tx.isIncome && isInRange(tx, detail.period === 'previous' ? snapshot.previousRange : snapshot.currentRange) && (tx.category?.name || 'Sin categoría') === detail.name);
  }, [transactions, detail, snapshot.currentRange, snapshot.previousRange]);

  return (
    <Screen title={t("mobile.analizador.de.cartera")} subtitle={t("mobile.tus.numeros.del.mes.a")} backLabel={monthParam ? 'Inicio' : 'Más'} onBack={() => router.back()}>
      <MonthSwitcher value={month} onChange={setMonth} latest={now} />
      <AnalyzerHighlights snapshot={snapshot} currency={currency} />
      <AnalyzerProjection comparison={projection.comparison} loading={projection.loading} error={projection.error} missing={projection.missing} currency={currency} />

      {wide ? (
        <>
          <View className="flex-row items-stretch gap-4">
            <PairedColumn>
      <Card title={t("mobile.vs.el.mes.anterior")} info={APP_INFO.vs_el_mes_anterior}>
        <View className="flex-row items-center gap-2 pb-1">
          <Text className="flex-1 font-inter-semibold text-xs uppercase text-gf-text-muted"> </Text>
          <Text className="w-24 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.antes")}</Text>
          <Text className="w-24 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.ahora")}</Text>
          <Text className="w-20 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.cambio")}</Text>
        </View>
        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center gap-2 border-t border-gf-border py-2.5">
            <Text className="flex-1 font-inter-medium text-sm text-gf-text">{row.label}</Text>
            <Text className="w-24 text-right font-inter text-xs text-gf-text-muted" numberOfLines={1} adjustsFontSizeToFit>{row.previous}</Text>
            <Text className="w-24 text-right font-inter-semibold text-sm text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{row.current}</Text>
            <View className="w-20 flex-row items-center justify-end gap-1">
              <Indicator delta={row.delta} invert={row.invert} />
              <Text className="font-inter-semibold text-xs text-gf-text">{row.points && row.delta !== null ? `${row.delta >= 0 ? '+' : ''}${Math.round(row.delta)} pts` : pct(row.delta)}</Text>
            </View>
          </View>
        ))}
        <Explain>{t("mobile.compara.el.mes.elegido.con")}</Explain>
      </Card>
            </PairedColumn>
            <PairedColumn>
      <Pressable style={{ flexGrow: 1 }} accessibilityRole="button" onPress={() => setDetail({ kind: 'averages' })}>
        <Card title={t("mobile.promedio.mensual")} info={APP_INFO.promedio_mensual(monthlyAverages.monthsCount)}>
          <View className="flex-row justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.ingresos")}</Text>
              <Text className="font-inter-bold text-base" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.income }}>{money(monthlyAverages.avgIncome)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.gastos")}</Text>
              <Text className="font-inter-bold text-base" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.expense }}>{money(monthlyAverages.avgExpense)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.movimientos")}</Text>
              <Text className="font-inter-bold text-base text-gf-text">{Math.round(monthlyAverages.avgTransactionCount)}</Text>
            </View>
          </View>
          {wide && (
            <View>
              <Text className="pb-1 font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.mes.por.mes")}</Text>
              {trend.map((item) => (
                <View key={item.label} className="flex-row items-center gap-2 border-t border-gf-border py-2.5">
                  <Text className="w-28 font-inter-medium text-sm text-gf-text">{esMonthLabel(item.label)}</Text>
                  <Text className="flex-1 text-right font-inter-semibold text-sm" style={{ color: colors.income }} numberOfLines={1}>{money(item.income)}</Text>
                  <Text className="flex-1 text-right font-inter-semibold text-sm" style={{ color: colors.expense }} numberOfLines={1}>{money(item.expense)}</Text>
                  <Text className="w-14 text-right font-inter text-sm text-gf-text-muted">{item.transactionCount}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </Pressable>
            </PairedColumn>
          </View>
      <Card title={t("mobile.tendencia.de.6.meses")} info={APP_INFO.tendencia}>
        <View className="flex-row items-end justify-between gap-2" style={{ height: barArea + 70 }}>
          {trend.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ingresos ${money(item.income)}, gastos ${money(item.expense)}`}
              onPress={() => { const before_ = trend[trend.indexOf(item) - 1]; setDetail({ kind: 'month', label: item.label, income: item.income, expense: item.expense, count: item.transactionCount, previous: before_ ? { label: before_.label, income: before_.income, expense: before_.expense, count: before_.transactionCount } : null }); }}
              className="flex-1 items-center justify-end gap-1"
              style={{ height: barArea + 70 }}>
              <View className="flex-row items-end" style={{ height: barArea, gap: tablet ? 6 : 2 }}>
                <View className="items-center justify-end gap-1">
                  {tablet && <Text className="font-inter-semibold text-[11px]" style={{ color: colors.income }}>{short(item.income)}</Text>}
                  <View style={{ width: barWidth, height: Math.max(3, (item.income / maxTrend) * (barArea - (tablet ? 22 : 2))), borderRadius: tablet ? 10 : 4, backgroundColor: colors.income }} />
                </View>
                <View className="items-center justify-end gap-1">
                  {tablet && <Text className="font-inter-semibold text-[11px]" style={{ color: colors.expense }}>{short(item.expense)}</Text>}
                  <View style={{ width: barWidth, height: Math.max(3, (item.expense / maxTrend) * (barArea - (tablet ? 22 : 2))), borderRadius: tablet ? 10 : 4, backgroundColor: colors.expense }} />
                </View>
              </View>
              {tablet && <Text className="font-inter-medium text-xs" style={{ color: item.income - item.expense >= 0 ? colors.income : colors.expense }}>{item.income - item.expense >= 0 ? '+' : '−'}{short(Math.abs(item.income - item.expense))}</Text>}
              <Text className="font-inter text-[11px] text-gf-text-muted">{esMonthLabel(item.shortLabel ?? item.label.slice(0, 3)).replace(/^Mayo$/, 'May')}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
        </>
      ) : (
        <>
      <Card title={t("mobile.vs.el.mes.anterior")} info={APP_INFO.vs_el_mes_anterior_2}>
        <View className="flex-row items-center gap-2 pb-1">
          <Text className="flex-1 font-inter-semibold text-xs uppercase text-gf-text-muted"> </Text>
          <Text className="w-24 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.antes")}</Text>
          <Text className="w-24 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.ahora")}</Text>
          <Text className="w-20 text-right font-inter-semibold text-xs uppercase text-gf-text-muted">{t("mobile.cambio")}</Text>
        </View>
        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center gap-2 border-t border-gf-border py-2.5">
            <Text className="flex-1 font-inter-medium text-sm text-gf-text">{row.label}</Text>
            <Text className="w-24 text-right font-inter text-xs text-gf-text-muted" numberOfLines={1} adjustsFontSizeToFit>{row.previous}</Text>
            <Text className="w-24 text-right font-inter-semibold text-sm text-gf-text" numberOfLines={1} adjustsFontSizeToFit>{row.current}</Text>
            <View className="w-20 flex-row items-center justify-end gap-1">
              <Indicator delta={row.delta} invert={row.invert} />
              <Text className="font-inter-semibold text-xs text-gf-text">{row.points && row.delta !== null ? `${row.delta >= 0 ? '+' : ''}${Math.round(row.delta)} pts` : pct(row.delta)}</Text>
            </View>
          </View>
        ))}
        <Explain>{t("mobile.compara.el.mes.elegido.con")}</Explain>
      </Card>
      <Card title={t("mobile.tendencia.de.6.meses")} info={APP_INFO.tendencia_2}>
        <View className="flex-row items-end justify-between gap-2" style={{ height: barArea + 70 }}>
          {trend.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ingresos ${money(item.income)}, gastos ${money(item.expense)}`}
              onPress={() => { const before_ = trend[trend.indexOf(item) - 1]; setDetail({ kind: 'month', label: item.label, income: item.income, expense: item.expense, count: item.transactionCount, previous: before_ ? { label: before_.label, income: before_.income, expense: before_.expense, count: before_.transactionCount } : null }); }}
              className="flex-1 items-center justify-end gap-1"
              style={{ height: barArea + 70 }}>
              <View className="flex-row items-end" style={{ height: barArea, gap: tablet ? 6 : 2 }}>
                <View className="items-center justify-end gap-1">
                  {tablet && <Text className="font-inter-semibold text-[11px]" style={{ color: colors.income }}>{short(item.income)}</Text>}
                  <View style={{ width: barWidth, height: Math.max(3, (item.income / maxTrend) * (barArea - (tablet ? 22 : 2))), borderRadius: tablet ? 10 : 4, backgroundColor: colors.income }} />
                </View>
                <View className="items-center justify-end gap-1">
                  {tablet && <Text className="font-inter-semibold text-[11px]" style={{ color: colors.expense }}>{short(item.expense)}</Text>}
                  <View style={{ width: barWidth, height: Math.max(3, (item.expense / maxTrend) * (barArea - (tablet ? 22 : 2))), borderRadius: tablet ? 10 : 4, backgroundColor: colors.expense }} />
                </View>
              </View>
              {tablet && <Text className="font-inter-medium text-xs" style={{ color: item.income - item.expense >= 0 ? colors.income : colors.expense }}>{item.income - item.expense >= 0 ? '+' : '−'}{short(Math.abs(item.income - item.expense))}</Text>}
              <Text className="font-inter text-[11px] text-gf-text-muted">{esMonthLabel(item.shortLabel ?? item.label.slice(0, 3)).replace(/^Mayo$/, 'May')}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Pressable style={{ flexGrow: 1 }} accessibilityRole="button" onPress={() => setDetail({ kind: 'averages' })}>
        <Card title={t("mobile.promedio.mensual")} info={APP_INFO.promedio_mensual_2(monthlyAverages.monthsCount)}>
          <View className="flex-row justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.ingresos")}</Text>
              <Text className="font-inter-bold text-base" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.income }}>{money(monthlyAverages.avgIncome)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.gastos")}</Text>
              <Text className="font-inter-bold text-base" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.expense }}>{money(monthlyAverages.avgExpense)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.movimientos")}</Text>
              <Text className="font-inter-bold text-base text-gf-text">{Math.round(monthlyAverages.avgTransactionCount)}</Text>
            </View>
          </View>
        </Card>
      </Pressable>
        </>
      )}



      <Card title={`Top ${topN}`} info={APP_INFO.analyzer(topN)}>
        <ChipPicker items={TOP_SIZES.map((n) => ({ id: n, label: `Top ${n}` }))} value={topN} onChange={(id) => setTopN(id as (typeof TOP_SIZES)[number])} moreAfter={99} />
        {wide ? (
          <>
            <View className="flex-row items-start gap-6">
              <View className="flex-1 gap-3">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">{t("mobile.categorias.mes.anterior")}</Text>
        {topCategoriesBillsPrevious.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.el.mes.anterior")}</Text>}
        {topCategoriesBillsPrevious.map((category, index, list) => (
          <RankedRow key={`${index}-${String(category.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable key={`previous-${category.name}`} accessibilityRole="button" onPress={() => setDetail({ kind: 'category', name: category.name, icon: category.icon, color: category.color, current: category.amount, previous: 0, changePct: null, period: 'previous' })} className="flex-row items-center gap-3">
            <CategoryBadge icon={category.icon} color={category.color} size={34} />
            <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{category.name}</Text>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(category.amount)}</Text>
          </Pressable>
          </RankedRow>
        ))}
              </View>
              <View className="flex-1 gap-3">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">{t("mobile.categorias.mes.elegido")}</Text>
        {topCategoriesBills.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.en.este.mes")}</Text>}
        {topCategoriesBills.map((category, index, list) => (
          <RankedRow key={`${index}-${String(category.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable
            key={category.name}
            accessibilityRole="button"
            onPress={() => setDetail({ kind: 'category', name: category.name, icon: category.icon, color: category.color, current: category.current, previous: category.previous, changePct: category.changePct })}
            className="flex-row items-center gap-3">
            <CategoryBadge icon={category.icon} color={category.color} size={34} />
            <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{category.name}</Text>
            <View className="items-end">
              <Text className="font-inter-semibold text-sm text-gf-text">{money(category.current)}</Text>
              <Text className="font-inter text-xs" style={{ color: category.isNew ? colors.accent : (category.changePct ?? 0) > 0 ? colors.expense : colors.income }}>
                {category.isNew ? 'nueva' : pct(category.changePct)}
              </Text>
            </View>
          </Pressable>
          </RankedRow>
        ))}
              </View>
            </View>
            <View className="flex-row items-start gap-6">
              <View className="flex-1 gap-3">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">{t("mobile.movimientos.mes.anterior")}</Text>
        {topTransactionsBills.previous.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.el.mes.anterior")}</Text>}
        {topTransactionsBills.previous.map((tx, index, list) => (
          <RankedRow key={`${index}-${String(tx.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable key={`previous-${String(tx._id ?? tx.name)}`} accessibilityRole="button" onPress={() => tx._id && router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/analyzer' } })} className="flex-row items-center gap-3">
            <CategoryBadge icon={tx.icon} color={tx.color} size={34} />
            <View className="flex-1"><Text className="font-inter-medium text-sm text-gf-text" numberOfLines={1}>{tx.name}</Text><Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tx.categoryName}</Text></View>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(tx.amount)}</Text>
          </Pressable>
          </RankedRow>
        ))}
              </View>
              <View className="flex-1 gap-3">
        <Text className="font-inter-semibold text-sm text-gf-text-muted">{t("mobile.movimientos.mes.elegido")}</Text>
        {topTransactionsBills.current.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.en.este.mes")}</Text>}
        {topTransactionsBills.current.map((tx, index, list) => (
          <RankedRow key={`${index}-${String(tx.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable key={String(tx._id ?? tx.name)} accessibilityRole="button" onPress={() => tx._id && router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/analyzer' } })} className="flex-row items-center gap-3">
            <CategoryBadge icon={tx.icon} color={tx.color} size={34} />
            <View className="flex-1">
              <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{tx.name}</Text>
              <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tx.categoryName}{tx.subcategoryName ? ` · ${tx.subcategoryName}` : ''}</Text>
            </View>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(tx.amount)}</Text>
          </Pressable>
          </RankedRow>
        ))}
              </View>
            </View>
          </>
        ) : (
          <>
        <Text className="font-inter-semibold text-sm text-gf-text-muted">{t("mobile.categorias.mes.anterior")}</Text>
        {topCategoriesBillsPrevious.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.el.mes.anterior")}</Text>}
        {topCategoriesBillsPrevious.map((category, index, list) => (
          <RankedRow key={`${index}-${String(category.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable key={`previous-${category.name}`} accessibilityRole="button" onPress={() => setDetail({ kind: 'category', name: category.name, icon: category.icon, color: category.color, current: category.amount, previous: 0, changePct: null, period: 'previous' })} className="flex-row items-center gap-3">
            <CategoryBadge icon={category.icon} color={category.color} size={34} />
            <Text className="flex-1 font-inter-medium text-sm text-gf-text" numberOfLines={1}>{category.name}</Text>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(category.amount)}</Text>
          </Pressable>
          </RankedRow>
        ))}
        <Text className="pt-2 font-inter-semibold text-sm text-gf-text-muted">{t("mobile.categorias.mes.elegido")}</Text>
        {topCategoriesBills.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.en.este.mes")}</Text>}
        {topCategoriesBills.map((category, index, list) => (
          <RankedRow key={`${index}-${String(category.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable
            key={category.name}
            accessibilityRole="button"
            onPress={() => setDetail({ kind: 'category', name: category.name, icon: category.icon, color: category.color, current: category.current, previous: category.previous, changePct: category.changePct })}
            className="flex-row items-center gap-3">
            <CategoryBadge icon={category.icon} color={category.color} size={34} />
            <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{category.name}</Text>
            <View className="items-end">
              <Text className="font-inter-semibold text-sm text-gf-text">{money(category.current)}</Text>
              <Text className="font-inter text-xs" style={{ color: category.isNew ? colors.accent : (category.changePct ?? 0) > 0 ? colors.expense : colors.income }}>
                {category.isNew ? 'nueva' : pct(category.changePct)}
              </Text>
            </View>
          </Pressable>
          </RankedRow>
        ))}
        <Text className="pt-2 font-inter-semibold text-sm text-gf-text-muted">{t("mobile.movimientos.mes.anterior")}</Text>
        {topTransactionsBills.previous.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.el.mes.anterior")}</Text>}
        {topTransactionsBills.previous.map((tx, index, list) => (
          <RankedRow key={`${index}-${String(tx.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable key={`previous-${String(tx._id ?? tx.name)}`} accessibilityRole="button" onPress={() => tx._id && router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/analyzer' } })} className="flex-row items-center gap-3">
            <CategoryBadge icon={tx.icon} color={tx.color} size={34} />
            <View className="flex-1"><Text className="font-inter-medium text-sm text-gf-text" numberOfLines={1}>{tx.name}</Text><Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tx.categoryName}</Text></View>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(tx.amount)}</Text>
          </Pressable>
          </RankedRow>
        ))}
        <Text className="pt-2 font-inter-semibold text-sm text-gf-text-muted">{t("mobile.movimientos.mes.elegido")}</Text>
        {topTransactionsBills.current.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.sin.gastos.en.este.mes")}</Text>}
        {topTransactionsBills.current.map((tx, index, list) => (
          <RankedRow key={`${index}-${String(tx.name ?? '')}`} rank={index + 1} last={index === list.length - 1}>
          <Pressable key={String(tx._id ?? tx.name)} accessibilityRole="button" onPress={() => tx._id && router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/analyzer' } })} className="flex-row items-center gap-3">
            <CategoryBadge icon={tx.icon} color={tx.color} size={34} />
            <View className="flex-1">
              <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{tx.name}</Text>
              <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tx.categoryName}{tx.subcategoryName ? ` · ${tx.subcategoryName}` : ''}</Text>
            </View>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(tx.amount)}</Text>
          </Pressable>
          </RankedRow>
        ))}
          </>
        )}
      </Card>

      <AnalyzerBudgets snapshot={snapshot} currency={currency} />
      <AnalyzerBiggest snapshot={snapshot} currency={currency} />

      {subscriptions.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => setDetail({ kind: 'subscriptions' })}>
          <Card title={t("mobile.pagos.recurrentes")} info={APP_INFO.pagos_recurrentes}>
            {subscriptions.slice(0, 4).map((sub) => (
              <View key={sub.name} className="flex-row items-center gap-3">
                <CategoryBadge icon={sub.icon} color={sub.color} size={30} />
                <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{sub.name}</Text>
                <Text className="font-inter-semibold text-sm text-gf-text">{money(sub.amount)}</Text>
              </View>
            ))}
            <View className="items-center rounded-full py-2.5" style={{ backgroundColor: colors.accentSoft }}><Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{subscriptions.length > 4 ? `Ver los ${subscriptions.length} pagos recurrentes` : 'Ver detalle de los pagos'}</Text></View>
          </Card>
        </Pressable>
      )}

      {wide ? (
        <View className="flex-row items-stretch gap-4">
          <PairedColumn>
      <AnalyzerFxExposure rows={fxExposure.rows} loading={fxExposure.loading} missing={fxExposure.missing} currency={currency} />
          </PairedColumn>
          <PairedColumn>
      <Pressable style={{ flexGrow: 1 }} accessibilityRole="button" onPress={() => setDetail({ kind: 'pace' })}>
        <Card title={t("mobile.ritmo.de.gasto")} action={<Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ver.mas")}</Text>} info={APP_INFO.ritmo_de_gasto}>
          <Text className="font-inter-bold text-2xl text-gf-text">{money(pace.spentSoFar)}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">
            {t("mobile.al.dia.p1.lo.normal", { p1: pace.dayOfMonth, p2: money(pace.avgPaceForSameDay), p3: pace.deltaPct !== null ? ` (${pct(pace.deltaPct)})` : '' })}
          </Text>
        </Card>
      </Pressable>
          </PairedColumn>
        </View>
      ) : (
        <>
      <AnalyzerFxExposure rows={fxExposure.rows} loading={fxExposure.loading} missing={fxExposure.missing} currency={currency} />
      <Pressable style={{ flexGrow: 1 }} accessibilityRole="button" onPress={() => setDetail({ kind: 'pace' })}>
        <Card title={t("mobile.ritmo.de.gasto")} action={<Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ver.mas")}</Text>} info={APP_INFO.ritmo_de_gasto_2}>
          <Text className="font-inter-bold text-2xl text-gf-text">{money(pace.spentSoFar)}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">
            {t("mobile.al.dia.p1.lo.normal", { p1: pace.dayOfMonth, p2: money(pace.avgPaceForSameDay), p3: pace.deltaPct !== null ? ` (${pct(pace.deltaPct)})` : '' })}
          </Text>
        </Card>
      </Pressable>
        </>
      )}
      <AnalyzerWeekday snapshot={snapshot} currency={currency} />

      <CategoryDetailSheet
        visible={detail?.kind === 'category'}
        name={detail?.kind === 'category' ? detail.name : ''}
        prefix={detail?.kind === 'category' ? (detail.period === 'previous' ? 'Mes anterior' : `Mes elegido${detail.changePct !== null && detail.changePct !== undefined ? ` · ${pct(detail.changePct)} contra el mes anterior` : ''}`) : undefined}
        movements={categoryMovements}
        currency={currency}
        onOpenMovement={(tx) => { setDetail(null); router.push({ pathname: '/movements/[id]', params: { id: String(tx._id), returnTo: '/more/analyzer' } }); }}
        onClose={() => setDetail(null)}
      />

      <DetailSheet
        visible={detail !== null && detail.kind !== 'category'}
        onClose={() => setDetail(null)}
        info={detail?.kind === 'month' ? { title: t("mobile.detalle.del.mes"), text: t("mobile.ingresos.y.gastos.son.la") } : detail?.kind === 'averages' ? { title: t("mobile.promedio.mensual"), text: `Promedio de ${monthlyAverages.monthsCount} meses: la suma de ingresos, de gastos y de movimientos de los meses de la tabla ÷ ${monthlyAverages.monthsCount}. Es el mismo cálculo de la web.` } : undefined}
        title={
          detail?.kind === 'month' ? esMonthLabel(detail.label)
          : detail?.kind === 'category' ? detail.name
          : detail?.kind === 'averages' ? 'Promedio mensual'
          : detail?.kind === 'pace' ? 'Ritmo de gasto'
          : 'Pagos recurrentes'
        }>
        {detail?.kind === 'month' && (() => {
          const prev = detail.previous;
          const balance = detail.income - detail.expense;
          const prevBalance = prev ? prev.income - prev.expense : null;
          const change_ = (current: number, before_: number | null) => (before_ === null || before_ === 0 ? null : ((current - before_) / Math.abs(before_)) * 100);
          const lines = [
            { label: t("mobile.ingresos"), value: detail.income, before: prev?.income ?? null, invert: false, tone: colors.income },
            { label: t("mobile.gastos"), value: detail.expense, before: prev?.expense ?? null, invert: true, tone: colors.expense },
            { label: t("mobile.balance"), value: balance, before: prevBalance, invert: false, tone: balance >= 0 ? colors.income : colors.expense },
          ];
          return (
            <>
              <Text className="font-inter-medium text-sm text-gf-text-muted">{t("mobile.p1.movimientos.en.el.mes", { p1: detail.count, p2: prev ? ` · contra ${esMonthLabel(prev.label)}` : '' })}</Text>
              <View>
                {lines.map((line) => {
                  const delta = change_(line.value, line.before);
                  return (
                    <View key={line.label} className="flex-row items-center gap-3 border-t border-gf-border py-4">
                      <View className="flex-1">
                        <Text className="font-inter-medium text-base text-gf-text">{line.label}</Text>
                        {line.before !== null && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.antes.p1", { p1: money(line.before) })}</Text>}
                      </View>
                      <Text className="font-inter-bold text-xl" style={{ color: line.tone }}>{money(line.value)}</Text>
                      <View className="w-16 flex-row items-center justify-end gap-1">
                        <Indicator delta={delta} invert={line.invert} size={20} />
                        <Text className="font-inter-semibold text-sm text-gf-text">{pct(delta)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <Explain>{t("mobile.balance.ingresos.gastos.del.mes")}</Explain>
            </>
          );
        })()}
        {detail?.kind === 'averages' && (
          <>
            <View className="gap-1">
              <Text className="font-inter text-base" style={{ color: colors.income }}>{t("mobile.ingresos.p1.al.mes", { p1: money(monthlyAverages.avgIncome) })}</Text>
              <Text className="font-inter text-base" style={{ color: colors.expense }}>{t("mobile.gastos.p1.al.mes", { p1: money(monthlyAverages.avgExpense) })}</Text>
              <Text className="font-inter text-base text-gf-text">{t("mobile.movimientos.p1.al.mes", { p1: Math.round(monthlyAverages.avgTransactionCount) })}</Text>
            </View>
            <Explain>{t("mobile.promedio.de.p1.meses.los", { p1: monthlyAverages.monthsCount, p2: monthlyAverages.monthsCount })}</Explain>
            <View>
              {trend.map((item) => (
                <View key={item.label} className="flex-row items-center gap-2 border-t border-gf-border py-2.5">
                  <Text className="w-24 font-inter-medium text-sm text-gf-text">{esMonthLabel(item.label)}</Text>
                  <Text className="flex-1 text-right font-inter-semibold text-xs" style={{ color: colors.income }} numberOfLines={1} adjustsFontSizeToFit>{money(item.income)}</Text>
                  <Text className="flex-1 text-right font-inter-semibold text-xs" style={{ color: colors.expense }} numberOfLines={1} adjustsFontSizeToFit>{money(item.expense)}</Text>
                  <Text className="w-10 text-right font-inter text-xs text-gf-text-muted">{item.transactionCount}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {detail?.kind === 'pace' && (
          <>
            <Text className="font-inter-bold text-2xl text-gf-text">{money(pace.spentSoFar)}</Text>
            <Text className="font-inter text-base text-gf-text-muted">{t("mobile.al.dia.p1.sueles.llevar", { p1: pace.dayOfMonth, p2: money(pace.avgPaceForSameDay), p3: pct(pace.deltaPct) })}</Text>
            {pace.monthlyDetail.map((item) => (
              <View key={item.label} className="flex-row justify-between">
                <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.p1.hasta.el.dia.p2", { p1: esMonthLabel(item.label), p2: item.throughDay })}</Text>
                <Text className="font-inter-semibold text-sm text-gf-text">{money(item.amount)}</Text>
              </View>
            ))}
          </>
        )}
        {detail?.kind === 'subscriptions' &&
          subscriptions.map((sub) => (
            <View key={sub.name} className="gap-0.5 border-t border-gf-border pt-3">
              <View className="flex-row items-center gap-3">
                <CategoryBadge icon={sub.icon} color={sub.color} size={34} />
                <View className="flex-1">
                  <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{sub.name}</Text>
                  <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{[sub.categoryName, sub.accountName].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text className="font-inter-semibold text-sm text-gf-text">{money(sub.amount)}</Text>
              </View>
              {sub.isNew && <Text className="pl-12 font-inter text-xs" style={{ color: colors.accent }}>{t("mobile.nuevo.este.mes")}</Text>}
              {sub.possibleDuplicateInMonth && <Text className="pl-12 font-inter text-xs" style={{ color: colors.expense }}>{t("mobile.posible.duplicado.en.el.mes")}</Text>}
              {[...sub.occurrences].reverse().map((occurrence, index) => (
                <Pressable key={index} accessibilityRole="button" disabled={!occurrence._id} onPress={() => { setDetail(null); router.push({ pathname: '/movements/[id]', params: { id: String(occurrence._id), returnTo: '/more/analyzer' } }); }} className="flex-row justify-between py-1.5 pl-12">
                  <Text className="font-inter text-sm text-gf-text-muted">{new Date(occurrence.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                  <Text className="font-inter-semibold text-sm text-gf-text">{money(occurrence.amount)} ›</Text>
                </Pressable>
              ))}
            </View>
          ))}
      </DetailSheet>
    </Screen>
  );
}
