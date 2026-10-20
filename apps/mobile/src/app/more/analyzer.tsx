import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { CategoryBadge } from '@/components/category-badge';
import { ChipPicker } from '@/components/chip-picker';
import { MonthSwitcher } from '@/components/month-switcher';
import { MovementRow } from '@/components/movements/movement-row';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import type { RootState } from '@/store';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { buildWalletAnalyzerSnapshot, type WalletAnalyzerSnapshotData } from '@gastify/core/transformers/walletAnalyzer';

type Detail =
  | { kind: 'month'; label: string; income: number; expense: number; count: number }
  | { kind: 'category'; name: string; icon?: string; color?: string; current: number; previous: number; changePct: number | null }
  | { kind: 'transaction'; id: string }
  | { kind: 'averages' }
  | { kind: 'pace' }
  | { kind: 'subscriptions' };

const TOP_SIZES = ['3', '6', '12', '24'] as const;

const pct = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${value >= 0 ? '+' : ''}${Math.round(value)}%`);

// The Wallet Analyzer on the phone: the same snapshot the web builds (totals against the previous month, a six-month
// trend, averages, the biggest categories and movements, the spending pace), each card opening its detail.
export default function AnalyzerScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [topN, setTopN] = useState<(typeof TOP_SIZES)[number]>('6');
  const [detail, setDetail] = useState<Detail | null>(null);

  const snapshot = useMemo<WalletAnalyzerSnapshotData>(
    () => buildWalletAnalyzerSnapshot({ transactions, budgets, referenceDate: month, topN: Number(topN) }),
    [transactions, budgets, month, topN]
  );
  const { currentTotals: now_, previousTotals: before, trend, topCategoriesBills, topTransactionsBills, monthlyAverages, pace, subscriptions } = snapshot;
  const money = (value: number) => formatMoneyMajor(value, currency);
  const maxTrend = Math.max(1, ...trend.flatMap((item) => [item.income, item.expense]));
  const change = (current: number, previous: number) => (previous > 0 ? ((current - previous) / previous) * 100 : null);

  const rows: { label: string; current: string; previous: string; delta: number | null; invert?: boolean }[] = [
    { label: 'Ingresos', current: money(now_.income), previous: money(before.income), delta: change(now_.income, before.income) },
    { label: 'Gastos', current: money(now_.expense), previous: money(before.expense), delta: change(now_.expense, before.expense), invert: true },
    { label: 'Balance', current: money(now_.balance), previous: money(before.balance), delta: change(now_.balance, before.balance) },
    { label: 'Ahorro', current: `${Math.round(now_.savingsRate * 100)}%`, previous: `${Math.round(before.savingsRate * 100)}%`, delta: null },
    { label: 'Movimientos', current: String(now_.transactionCount), previous: String(before.transactionCount), delta: change(now_.transactionCount, before.transactionCount) },
  ];

  const transactionDetail = detail?.kind === 'transaction' ? transactions.find((tx) => String(tx._id) === detail.id) : undefined;

  return (
    <Screen title="Analizador" subtitle="Tus números del mes, a fondo" backLabel="Más" onBack={() => router.back()}>
      <MonthSwitcher value={month} onChange={setMonth} latest={now} />

      <Card title="Contra el mes anterior" info={{ title: 'Contra el mes anterior', text: 'Cómo va el mes elegido frente al mes de antes: ingresos, gastos, balance, qué parte de tus ingresos conservas y cuántos movimientos hubo.' }}>
        {rows.map((row) => {
          const good = row.delta === null ? null : row.invert ? row.delta <= 0 : row.delta >= 0;
          return (
            <View key={row.label} className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-inter text-base text-gf-text-muted">{row.label}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">antes {row.previous}</Text>
              </View>
              <View className="items-end">
                <Text className="font-inter-semibold text-base text-gf-text">{row.current}</Text>
                <Text className="font-inter-semibold text-xs" style={{ color: good === null ? colors.textSecondary : good ? colors.income : colors.expense }}>{pct(row.delta)}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Card title="Tendencia de 6 meses" info={{ title: 'Tendencia', text: 'Ingresos (verde) y gastos (rojo) de los últimos seis meses hasta el mes elegido. Toca un mes para ver su detalle.' }}>
        <View className="flex-row items-end justify-between gap-2" style={{ height: 150 }}>
          {trend.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ingresos ${money(item.income)}, gastos ${money(item.expense)}`}
              onPress={() => setDetail({ kind: 'month', label: item.label, income: item.income, expense: item.expense, count: item.transactionCount })}
              className="flex-1 items-center justify-end gap-1"
              style={{ height: 150 }}>
              <View className="flex-row items-end gap-0.5" style={{ height: 120 }}>
                <View style={{ width: 9, height: Math.max(3, (item.income / maxTrend) * 118), borderRadius: 4, backgroundColor: colors.income }} />
                <View style={{ width: 9, height: Math.max(3, (item.expense / maxTrend) * 118), borderRadius: 4, backgroundColor: colors.expense }} />
              </View>
              <Text className="font-inter text-[11px] text-gf-text-muted">{item.shortLabel ?? item.label.slice(0, 3)}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Pressable accessibilityRole="button" onPress={() => setDetail({ kind: 'averages' })}>
        <Card title="Promedio mensual" info={{ title: 'Promedio mensual', text: 'Cuánto entra, cuánto sale y cuántos movimientos hay en promedio cada mes, con base en el historial reciente.' }}>
          <View className="flex-row justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">Ingresos</Text>
              <Text className="font-inter-bold text-base" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.income }}>{money(monthlyAverages.avgIncome)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">Gastos</Text>
              <Text className="font-inter-bold text-base" numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.expense }}>{money(monthlyAverages.avgExpense)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-inter text-xs text-gf-text-muted">Movimientos</Text>
              <Text className="font-inter-bold text-base text-gf-text">{Math.round(monthlyAverages.avgTransactionCount)}</Text>
            </View>
          </View>
        </Card>
      </Pressable>

      <Card title="Los más grandes" info={{ title: 'Los más grandes', text: 'Las categorías y los movimientos con más gasto del mes elegido, con el cambio contra el mes anterior.' }}>
        <ChipPicker items={TOP_SIZES.map((n) => ({ id: n, label: `Top ${n}` }))} value={topN} onChange={(id) => setTopN(id as (typeof TOP_SIZES)[number])} moreAfter={99} />
        <Text className="font-inter-semibold text-sm text-gf-text-muted">Categorías</Text>
        {topCategoriesBills.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin gastos en este mes.</Text>}
        {topCategoriesBills.map((category) => (
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
        ))}
        <Text className="pt-2 font-inter-semibold text-sm text-gf-text-muted">Movimientos</Text>
        {topTransactionsBills.current.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Sin gastos en este mes.</Text>}
        {topTransactionsBills.current.map((tx) => (
          <Pressable key={String(tx._id ?? tx.name)} accessibilityRole="button" onPress={() => tx._id && setDetail({ kind: 'transaction', id: String(tx._id) })} className="flex-row items-center gap-3">
            <CategoryBadge icon={tx.icon} color={tx.color} size={34} />
            <View className="flex-1">
              <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{tx.name}</Text>
              <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{tx.categoryName}{tx.subcategoryName ? ` · ${tx.subcategoryName}` : ''}</Text>
            </View>
            <Text className="font-inter-semibold text-sm text-gf-text">{money(tx.amount)}</Text>
          </Pressable>
        ))}
      </Card>

      <Pressable accessibilityRole="button" onPress={() => setDetail({ kind: 'pace' })}>
        <Card title="Ritmo de gasto" info={{ title: 'Ritmo de gasto', text: 'Compara lo que llevas gastado este mes, hasta el mismo día, con lo que solías llevar en meses anteriores.' }}>
          <Text className="font-inter-bold text-2xl text-gf-text">{money(pace.spentSoFar)}</Text>
          <Text className="font-inter text-sm text-gf-text-muted">
            Al día {pace.dayOfMonth}; lo normal a esta altura es {money(pace.avgPaceForSameDay)}
            {pace.deltaPct !== null ? ` (${pct(pace.deltaPct)})` : ''}.
          </Text>
        </Card>
      </Pressable>

      {subscriptions.length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => setDetail({ kind: 'subscriptions' })}>
          <Card title="Pagos recurrentes" info={{ title: 'Pagos recurrentes', text: 'Gastos que se repiten cada mes (suscripciones, servicios). Avisamos si uno es nuevo o si parece duplicado en el mes.' }}>
            {subscriptions.slice(0, 4).map((sub) => (
              <View key={sub.name} className="flex-row items-center gap-3">
                <CategoryBadge icon={sub.icon} color={sub.color} size={30} />
                <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{sub.name}</Text>
                <Text className="font-inter-semibold text-sm text-gf-text">{money(sub.amount)}</Text>
              </View>
            ))}
            {subscriptions.length > 4 && <Text className="font-inter text-xs text-gf-text-muted">y {subscriptions.length - 4} más · toca para ver todos</Text>}
          </Card>
        </Pressable>
      )}

      <DetailSheet
        visible={detail !== null}
        onClose={() => setDetail(null)}
        title={
          detail?.kind === 'month' ? detail.label
          : detail?.kind === 'category' ? detail.name
          : detail?.kind === 'transaction' ? transactionDetail?.name || 'Movimiento'
          : detail?.kind === 'averages' ? 'Promedio mensual'
          : detail?.kind === 'pace' ? 'Ritmo de gasto'
          : 'Pagos recurrentes'
        }>
        {detail?.kind === 'month' && (
          <>
            <Text className="font-inter text-base" style={{ color: colors.income }}>Ingresos: {money(detail.income)}</Text>
            <Text className="font-inter text-base" style={{ color: colors.expense }}>Gastos: {money(detail.expense)}</Text>
            <Text className="font-inter-semibold text-base text-gf-text">Balance: {money(detail.income - detail.expense)}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">{detail.count} movimientos</Text>
          </>
        )}
        {detail?.kind === 'category' && (
          <>
            <Text className="font-inter-bold text-2xl text-gf-text">{money(detail.current)}</Text>
            <Text className="font-inter text-base text-gf-text-muted">Mes anterior: {money(detail.previous)}</Text>
            <Text className="font-inter-semibold text-base text-gf-text">{pct(detail.changePct)} contra el mes anterior</Text>
          </>
        )}
        {detail?.kind === 'transaction' && transactionDetail && (
          <MovementRow
            movement={transactionDetail}
            currency={currency}
            onPress={() => {
              setDetail(null);
              router.push({ pathname: '/movements/[id]', params: { id: String(transactionDetail._id), returnTo: '/more/analyzer' } });
            }}
          />
        )}
        {detail?.kind === 'averages' && (
          <>
            <Text className="font-inter text-base" style={{ color: colors.income }}>Ingresos: {money(monthlyAverages.avgIncome)} al mes</Text>
            <Text className="font-inter text-base" style={{ color: colors.expense }}>Gastos: {money(monthlyAverages.avgExpense)} al mes</Text>
            <Text className="font-inter text-base text-gf-text">Movimientos: {Math.round(monthlyAverages.avgTransactionCount)} al mes</Text>
            <Text className="font-inter text-sm text-gf-text-muted">Calculado con {monthlyAverages.monthsCount} meses de historial.</Text>
          </>
        )}
        {detail?.kind === 'pace' && (
          <>
            <Text className="font-inter-bold text-2xl text-gf-text">{money(pace.spentSoFar)}</Text>
            <Text className="font-inter text-base text-gf-text-muted">Al día {pace.dayOfMonth} sueles llevar {money(pace.avgPaceForSameDay)} ({pct(pace.deltaPct)}).</Text>
            {pace.monthlyDetail.map((item) => (
              <View key={item.label} className="flex-row justify-between">
                <Text className="font-inter text-sm text-gf-text-muted">{item.label} · hasta el día {item.throughDay}</Text>
                <Text className="font-inter-semibold text-sm text-gf-text">{money(item.amount)}</Text>
              </View>
            ))}
          </>
        )}
        {detail?.kind === 'subscriptions' &&
          subscriptions.map((sub) => (
            <View key={sub.name} className="gap-0.5">
              <View className="flex-row items-center gap-3">
                <CategoryBadge icon={sub.icon} color={sub.color} size={34} />
                <View className="flex-1">
                  <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{sub.name}</Text>
                  <Text className="font-inter text-xs text-gf-text-muted" numberOfLines={1}>{[sub.categoryName, sub.accountName].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text className="font-inter-semibold text-sm text-gf-text">{money(sub.amount)}</Text>
              </View>
              {sub.isNew && <Text className="pl-12 font-inter text-xs" style={{ color: colors.accent }}>Nuevo este mes</Text>}
              {sub.possibleDuplicateInMonth && <Text className="pl-12 font-inter text-xs" style={{ color: colors.expense }}>Posible duplicado en el mes</Text>}
            </View>
          ))}
      </DetailSheet>
    </Screen>
  );
}
