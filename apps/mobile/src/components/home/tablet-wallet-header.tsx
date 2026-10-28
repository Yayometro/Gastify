import { Text, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { NotificationsBell } from '@/components/notifications-bell';

const WORDMARK_WHITE = require('../../../assets/images/brand/gastify-wordmark-white.png');
const WORDMARK_BLACK = require('../../../assets/images/brand/gastify-wordmark-black.png');

import { InfoTip, type InfoText } from '@/components/info-tip';
import { Colors } from '@/constants/theme';

import type { AccountData } from '@gastify/core/features/accountsSlice';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthTotals } from '@gastify/core/transactions/monthSummary';
import { useT, useInfo } from "@/i18n/client";
import { tNow } from '@/i18n/now';

// The web's Wallet hero for wide screens: "<name> Wallet" in a thin large title and, under it, three panels side by
// side: the accounts (biggest first), the period's summary and the comparison with the previous period. Same
// colors, same wording of the web (INCOME #6EE7A8, EXPENSE #FF8A8A, BALANCE #7EC8FF).
const INCOME = '#6EE7A8';
const EXPENSE = '#FF8A8A';
const BALANCE = '#7EC8FF';

function Panel({ label, info, children }: { label: string; info: InfoText; children: React.ReactNode }) {
  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  return (
    <View className="flex-1 gap-2 rounded-2xl p-4" style={{ backgroundColor: dark ? 'rgba(255,255,255,0.10)' : colors.accentSoft }}>
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-xs uppercase tracking-wide text-gf-text-muted">{label}</Text>
        <InfoTip info={info} />
      </View>
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
  const t = useT();
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
        <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.mes.anterior.p1", { p1: money(previous) })}</Text>
        <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.actual.p1", { p1: money(current) })}</Text>
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
  const { HERO_INFO } = useInfo();
  const t = useT();
  const dark = useColorScheme() === 'dark';
  const money = (value: number) => formatMoneyMajor(value, currency);
  const sorted = [...accounts].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  return (
    <View className="gap-6 pb-1 pt-2">
      <View className="flex-row items-center gap-4">
        {/* The wordmark, at the far left of the header: white on the dark theme, black on the light one. */}
        <Image source={dark ? WORDMARK_WHITE : WORDMARK_BLACK} style={{ width: 115, height: 40 }} contentFit="contain" accessibilityLabel="Gastify" />
        <View className="flex-1 items-center">
          <Text className="font-inter-bold text-5xl text-gf-text">{name ? tNow("mobile.hola.p1", { p1: name.split(' ')[0] }) : t("shared.start")}</Text>
        </View>
        {/* The notifications bell, at the far right. Its box is as wide as the logo, so the greeting sits exactly in the middle. */}
        <View style={{ width: 115, alignItems: 'flex-end' }}>
          <NotificationsBell size={44} />
        </View>
      </View>
      <View className="flex-row items-stretch gap-4">
        <Panel label={t("mobile.tus.cuentas")} info={HERO_INFO.accounts}>
          {sorted.length === 0 ? (
            <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.todavia.no.tienes.cuentas")}</Text>
          ) : (
            sorted.map((account) => (
              <View key={String(account._id ?? account.name)} className="flex-row items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: dark ? 'rgba(0,0,0,0.15)' : 'rgba(27,16,61,0.05)' }}>
                <Text className="flex-1 font-inter text-base text-gf-text" numberOfLines={1}>{account.name || t("dashboard.bulk.account")}</Text>
                <Text className="font-inter-medium text-base text-gf-text">
                  {formatMoneyMajor(account.amount ?? 0, account.currency || currency, { showCode: false })}
                  {account.currency && account.currency !== currency ? ` ${account.currency}` : ''}
                </Text>
              </View>
            ))
          )}
        </Panel>
        <Panel label={t("mobile.resumen")} info={HERO_INFO.summary}>
          <View className="flex-1 justify-end gap-2">
            <Row label={t("mobile.ingresos.3")} value={totals.incomes ? money(totals.incomes) : t("dashboard.noAmount")} color={INCOME} />
            <Row label={t("mobile.gastos.3")} value={totals.spending ? money(totals.spending) : t("dashboard.noAmount")} color={EXPENSE} />
            <Row label={t("mobile.balance.2")} value={totals.balance ? money(totals.balance) : t("dashboard.noAmount")} color={BALANCE} />
            <Text className="pt-1 text-center font-inter text-xs text-gf-text-muted">{rangeText}</Text>
          </View>
        </Panel>
        <Panel label={t("mobile.vs.mes.anterior")} info={HERO_INFO.versus}>
          <DeltaRow label={t("mobile.ingresos")} current={totals.incomes} previous={previous.incomes} color={INCOME} currency={currency} />
          <DeltaRow label={t("mobile.gastos")} current={totals.spending} previous={previous.spending} color={EXPENSE} currency={currency} />
          <DeltaRow label={t("mobile.balance")} current={totals.balance} previous={previous.balance} color={BALANCE} currency={currency} />
        </Panel>
      </View>
    </View>
  );
}
