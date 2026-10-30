import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useSelector } from 'react-redux';

import { BankBadge } from '@/components/bank-badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { TourTarget } from '@/components/tour/tour-target';
import { Colors } from '@/constants/theme';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { useInfo, useLocale, useT } from '@/i18n/client';
import type { RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { shortDate } from '@gastify/core/i18n/dates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { movementKind } from '@gastify/core/transactions/monthSummary';
import { movementTime } from '@gastify/core/transactions/historyWindow';
import { buildAccountAnalysis, type AccountPeriodRow, type AnalysisAccount, type AnalysisMovement } from '@gastify/core/transformers/accountAnalysis';
import { getPrimaryAmount } from '@gastify/core/transformers/transactionsChange';
import type { WalletAnalyzerSnapshotData } from '@gastify/core/transformers/walletAnalyzer';

const LINE_COLORS = ['#a855f7', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#ef4444', '#84cc16'];
const percent = (share: number): string => `${Math.round(share * 100)}%`;

// "Tus cuentas" in the phone's analyzer: the account that holds the most, spends the most and receives the most, what each
// one did in the month (tap one to see its movements) and how every balance moved month by month. Same numbers as the
// web's section: they come from core's buildAccountAnalysis.
export function AnalyzerAccounts({ snapshot, currency, returnTo = '/more/analyzer' }: { snapshot: WalletAnalyzerSnapshotData; currency: string; returnTo?: string }) {
  const t = useT();
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const width = useWindowDimensions().width;
  const accounts = useSelector((state: RootState) => state.accountsReducer.data) as unknown as AnalysisAccount[];
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data) as unknown as AnalysisMovement[];
  const rates = useRatesToPrimary(accounts.map((account) => account.currency), currency);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<AccountPeriodRow | null>(null);
  const range = snapshot.currentRange;

  const analysis = useMemo(
    () => buildAccountAnalysis({ accounts, movements: transactions, range, primary: currency, rates, months: 6 }),
    [accounts, transactions, range, currency, rates]
  );
  if (accounts.length === 0) return null;
  const money = (value: number) => formatMoneyMajor(value, currency);
  const { richest, topSpender, topEarner } = analysis;

  const tile = (title: string, row: AccountPeriodRow | null, line: string | null, amount: string, tone: string, extra?: string | null) => (
    <View className="gap-1.5 rounded-2xl border border-gf-border p-3.5">
      <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{title}</Text>
      {row && line ? (
        <>
          <View className="flex-row items-center gap-2">
            {row.bankId ? <BankBadge bankId={row.bankId} size={26} /> : null}
            <Text className="flex-1 font-inter-semibold text-base text-gf-text" numberOfLines={1}>{row.name}</Text>
            <Text className="font-inter-bold text-base" style={{ color: tone }}>{amount}</Text>
          </View>
          <Text className="font-inter text-xs text-gf-text-muted">{line}</Text>
          {extra ? <Text className="font-inter text-xs" style={{ color: '#fbbf24' }}>{extra}</Text> : null}
        </>
      ) : (
        <Text className="font-inter text-xs text-gf-text-muted">{t('analyzer.accounts.none')}</Text>
      )}
    </View>
  );

  const flowRows = [...analysis.accounts].sort((a, b) => b.expense - a.expense || b.income - a.income);
  const maxFlow = Math.max(1, ...flowRows.flatMap((row) => [row.income, row.expense]));

  const series = analysis.balanceSeries;
  const visible = analysis.accounts.filter((row) => !hidden[row.id] && row.balance !== null);
  const showTotal = !hidden.__total;
  const values = series.flatMap((point) => [...visible.map((row) => point.byAccount[row.id] ?? 0), ...(showTotal ? [point.total] : [])]);
  const lo = Math.min(0, ...values);
  const hi = Math.max(1, ...values);
  const W = Math.max(240, Math.min(width, 640) - 72);
  const H = 150;
  const x = (index: number) => (series.length <= 1 ? W / 2 : 8 + (index / (series.length - 1)) * (W - 16));
  const y = (value: number) => 8 + (1 - (value - lo) / (hi - lo || 1)) * (H - 16);
  const path = (pick: (point: (typeof series)[number]) => number) => series.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(pick(point)).toFixed(1)}`).join(' ');
  const monthLabel = (month: string) => new Date(`${month}T12:00:00`).toLocaleDateString(locale, { month: 'short' });

  const detailMovements = detail
    ? transactions
        .filter((movement) => {
          if (idOf(movement.account) !== detail.id) return false;
          const time = movementTime(movement);
          return time !== null && time >= range.start.getTime() && time <= range.end.getTime();
        })
        .sort((a, b) => Math.abs(getPrimaryAmount(b)) - Math.abs(getPrimaryAmount(a)))
    : [];

  return (
    <Card tour="m-ana-accounts" tutorial="m-ana-accounts" title={t('analyzer.accounts.title')} info={APP_INFO.analizador_cuentas}>
      {accounts.length === 1 ? (
        <Text className="font-inter text-sm text-gf-text-muted">{t('analyzer.accounts.single')}</Text>
      ) : (
        <>
          <TourTarget id="m-ana-accounts-tiles" className="gap-3">
            {tile(t('analyzer.accounts.richest'), richest, richest ? t('analyzer.accounts.richestLine', { p1: percent(richest.balanceShare), p2: richest.name }) : null, richest ? money(richest.balance ?? 0) : '', colors.text, analysis.concentrated ? t('analyzer.accounts.concentrated') : null)}
            {tile(t('analyzer.accounts.topSpender'), topSpender, topSpender ? t('analyzer.accounts.topSpenderLine', { p1: topSpender.name, p2: percent(topSpender.expenseShare) }) : null, topSpender ? money(topSpender.expense) : '', colors.expense, topSpender?.topCategory ? t('analyzer.accounts.topSpenderCategory', { p1: topSpender.topCategory.name, p2: money(topSpender.topCategory.amount) }) : null)}
            {tile(t('analyzer.accounts.topEarner'), topEarner, topEarner ? t('analyzer.accounts.topEarnerLine', { p1: topEarner.name, p2: percent(topEarner.incomeShare) }) : null, topEarner ? money(topEarner.income) : '', colors.income)}
          </TourTarget>

          <TourTarget id="m-ana-accounts-flow" className="gap-2">
            <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('analyzer.accounts.flow')}</Text>
            {flowRows.map((row) => (
              <Pressable key={row.id} accessibilityRole="button" onPress={() => setDetail(row)} className="gap-1.5 border-t border-gf-border pt-2.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-inter-semibold text-sm text-gf-text" numberOfLines={1}>{row.name}</Text>
                  <Text className="font-inter-bold text-xs" style={{ color: row.net >= 0 ? colors.income : colors.expense }}>{t('analyzer.accounts.net')} {money(row.net)}</Text>
                </View>
                {[
                  { label: t('analyzer.accounts.income'), value: row.income, tone: colors.income },
                  { label: t('analyzer.accounts.expense'), value: row.expense, tone: colors.expense },
                ].map((bar) => (
                  <View key={bar.label} className="flex-row items-center gap-2">
                    <View className="h-2 flex-1 overflow-hidden rounded-full bg-gf-surface"><View style={{ width: `${(bar.value / maxFlow) * 100}%`, height: '100%', backgroundColor: bar.tone, borderRadius: 999 }} /></View>
                    <Text className="w-36 text-right font-inter text-[11px] text-gf-text-muted" numberOfLines={1} adjustsFontSizeToFit>{bar.label} {money(bar.value)}</Text>
                  </View>
                ))}
              </Pressable>
            ))}
          </TourTarget>

          <TourTarget id="m-ana-accounts-history" className="gap-2">
            <Text className="font-inter-bold text-[11px] uppercase text-gf-text-muted">{t('analyzer.accounts.history')}</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {analysis.accounts.map((row, index) => (
                <Pressable key={row.id} accessibilityRole="button" accessibilityState={{ selected: !hidden[row.id] }} onPress={() => setHidden((current) => ({ ...current, [row.id]: !current[row.id] }))} className="flex-row items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: colors.border, opacity: hidden[row.id] ? 0.5 : 1 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LINE_COLORS[index % LINE_COLORS.length] }} />
                  <Text className="font-inter-medium text-xs text-gf-text">{row.name}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" accessibilityState={{ selected: showTotal }} onPress={() => setHidden((current) => ({ ...current, __total: !current.__total }))} className="flex-row items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: colors.border, opacity: showTotal ? 1 : 0.5 }}>
                <View style={{ width: 12, height: 2, backgroundColor: colors.text }} />
                <Text className="font-inter-medium text-xs text-gf-text">{t('analyzer.accounts.total')}</Text>
              </Pressable>
            </View>
            <Svg width={W} height={H}>
              {lo < 0 && <Line x1={8} x2={W - 8} y1={y(0)} y2={y(0)} stroke={colors.textSecondary} strokeOpacity={0.4} strokeDasharray="4 4" />}
              {analysis.accounts.map((row, index) =>
                hidden[row.id] || row.balance === null ? null : <Path key={row.id} d={path((point) => point.byAccount[row.id] ?? 0)} fill="none" stroke={LINE_COLORS[index % LINE_COLORS.length]} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
              )}
              {showTotal && <Path d={path((point) => point.total)} fill="none" stroke={colors.text} strokeOpacity={0.8} strokeWidth={2} strokeDasharray="6 4" />}
            </Svg>
            <View className="flex-row justify-between" style={{ width: W }}>
              {series.map((point) => <Text key={point.month} className="font-inter text-[11px] text-gf-text-muted">{monthLabel(point.month)}</Text>)}
            </View>
            <Text className="font-inter text-[11px] text-gf-text-muted">{t('analyzer.accounts.historyNote')}</Text>
          </TourTarget>

          {analysis.debtTotal > 0 && <Text className="font-inter text-xs text-gf-text-muted">{t('analyzer.accounts.debt', { p1: money(analysis.debtTotal) })}</Text>}
          {analysis.dormant.length > 0 && <Text className="font-inter text-xs text-gf-text-muted">{t('analyzer.accounts.dormant', { p1: analysis.dormant.map((item) => item.name).join(', ') })}</Text>}
          {analysis.missingCurrencies.length > 0 && <Text className="font-inter text-xs" style={{ color: '#fbbf24' }}>{t('analyzer.accounts.missingRate', { p1: analysis.missingCurrencies.join(', ') })}</Text>}
        </>
      )}

      <BottomSheet visible={detail !== null} onClose={() => setDetail(null)} maxHeight="80%">
        <View className="gap-1 px-6 pb-2 pt-5">
          <Text className="font-inter-bold text-xl text-gf-text">{t('analyzer.accounts.detailTitle', { p1: detail?.name ?? '' })}</Text>
          {detail && detailMovements.length > 0 && (
            <Text className="font-inter text-sm text-gf-text-muted">
              {t('analyzer.accounts.detailCount', { p1: detailMovements.length })} {t('analyzer.accounts.income')} {money(detail.income)} · {t('analyzer.accounts.expense')} {money(detail.expense)}
            </Text>
          )}
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {detailMovements.length === 0 ? (
            <Text className="font-inter text-sm text-gf-text-muted">{t('analyzer.accounts.detailEmpty')}</Text>
          ) : (
            detailMovements.map((movement, index) => {
              const kind = movementKind(movement as never);
              const time = movementTime(movement);
              const id = (movement as { _id?: unknown })._id;
              return (
                <Pressable
                  key={String(id ?? index)}
                  accessibilityRole="button"
                  disabled={!id}
                  onPress={() => { setDetail(null); router.push({ pathname: '/movements/[id]', params: { id: String(id), returnTo } }); }}
                  className="flex-row items-center justify-between gap-3 border-t border-gf-border py-3">
                  <View className="flex-1">
                    <Text className="font-inter-medium text-base text-gf-text" numberOfLines={1}>{String((movement as { name?: unknown }).name ?? '')}</Text>
                    <Text className="font-inter text-xs text-gf-text-muted">{time !== null ? shortDate(new Date(time), locale) : ''}</Text>
                  </View>
                  <Text className="font-inter-semibold text-base" style={{ color: kind === 'expense' ? colors.expense : kind === 'income' ? colors.income : colors.textSecondary }}>{money(Math.abs(getPrimaryAmount(movement)))}</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </BottomSheet>
    </Card>
  );
}
