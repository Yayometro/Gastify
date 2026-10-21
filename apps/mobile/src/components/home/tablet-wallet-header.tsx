import { Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthTotals } from '@gastify/core/transactions/monthSummary';

// The web's Wallet hero for wide screens: "<name> Wallet" in a thin large title and, under it, three panels side by
// side: the accounts (biggest first), the period's summary and the comparison with the previous period. Same
// colors, same wording of the web (INCOME #6EE7A8, EXPENSE #FF8A8A, BALANCE #7EC8FF).
const INCOME = '#6EE7A8';
const EXPENSE = '#FF8A8A';
const BALANCE = '#7EC8FF';

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  return (
    <View className="flex-1 gap-2 rounded-2xl p-4" style={{ backgroundColor: dark ? 'rgba(255,255,255,0.10)' : colors.accentSoft }}>
      <Text className="font-inter text-xs uppercase tracking-wide text-gf-text-muted">{label}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-inter text-lg text-gf-text">{label}</Text>
      <Text className="font-inter-semibold text-lg" style={{ color }}>{value}</Text>
    </View>
  );
}

function DeltaRow({ label, current, previous, color, currency }: { label: string; current: number; previous: number; color: string; currency: string }) {
  const dark = useColorScheme() === 'dark';
  const delta = current - previous;
  const pct = previous ? (delta / Math.abs(previous)) * 100 : null;
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '';
  const money = (value: number) => formatMoneyMajor(value, currency, { showCode: false });
  return (
    <View className="gap-1.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: dark ? 'rgba(0,0,0,0.15)' : 'rgba(27,16,61,0.05)' }}>
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-sm text-gf-text-muted">{label}</Text>
        <Text className="font-inter-semibold text-base" style={{ color }}>
          {sign}{money(Math.abs(delta))}{pct !== null ? ` (${arrow} ${Math.abs(Math.round(pct))}%)` : ''}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-sm text-gf-text-muted">Mes anterior: {money(previous)}</Text>
        <Text className="font-inter text-sm text-gf-text-muted">Actual: {money(current)}</Text>
      </View>
    </View>
  );
}

export function TabletWalletHeader({
  name,
  accounts,
  totals,
  previous,
  currency,
  rangeText,
}: {
  name?: string;
  accounts: AccountData[];
  totals: MonthTotals;
  previous: MonthTotals;
  currency: string;
  rangeText: string;
}) {
  const dark = useColorScheme() === 'dark';
  const money = (value: number) => formatMoneyMajor(value, currency);
  const sorted = [...accounts].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  return (
    <View className="gap-6 pb-1 pt-2">
      <Text className="text-center font-inter-thin text-7xl text-gf-text">
        {name ? `${name} ` : ''}Wallet
      </Text>
      <View className="flex-row items-stretch gap-4">
        <Panel label="Tus cuentas">
          {sorted.length === 0 ? (
            <Text className="font-inter text-xs text-gf-text-muted">Todavía no tienes cuentas.</Text>
          ) : (
            sorted.map((account) => (
              <View key={String(account._id ?? account.name)} className="flex-row items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: dark ? 'rgba(0,0,0,0.15)' : 'rgba(27,16,61,0.05)' }}>
                <Text className="flex-1 font-inter text-base text-gf-text" numberOfLines={1}>{account.name || 'Cuenta'}</Text>
                <Text className="font-inter-medium text-base text-gf-text">
                  {formatMoneyMajor(account.amount ?? 0, account.currency || currency, { showCode: false })}
                  {account.currency && account.currency !== currency ? ` ${account.currency}` : ''}
                </Text>
              </View>
            ))
          )}
        </Panel>
        <Panel label="Resumen">
          <View className="flex-1 justify-end gap-2">
            <Row label="Ingresos:" value={totals.incomes ? money(totals.incomes) : 'Sin monto…'} color={INCOME} />
            <Row label="Gastos:" value={totals.spending ? money(totals.spending) : 'Sin monto…'} color={EXPENSE} />
            <Row label="Balance:" value={totals.balance ? money(totals.balance) : 'Sin monto…'} color={BALANCE} />
            <Text className="pt-1 text-center font-inter text-xs text-gf-text-muted">{rangeText}</Text>
          </View>
        </Panel>
        <Panel label="Vs. mes anterior">
          <DeltaRow label="Ingresos" current={totals.incomes} previous={previous.incomes} color={INCOME} currency={currency} />
          <DeltaRow label="Gastos" current={totals.spending} previous={previous.spending} color={EXPENSE} currency={currency} />
          <DeltaRow label="Balance" current={totals.balance} previous={previous.balance} color={BALANCE} currency={currency} />
        </Panel>
      </View>
    </View>
  );
}
