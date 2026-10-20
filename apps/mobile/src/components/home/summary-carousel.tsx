import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmbientBackground, DARK_BASE } from '@/components/ambient-background';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import { percentChange } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthTotals } from '@gastify/core/transactions/monthSummary';

type Props = {
  title: string;
  totals: MonthTotals;
  previous: MonthTotals;
  currency: string;
  accounts: AccountData[];
  accountsTotal: { total: number; missingCurrencies: string[] };
};

function Row({ label, value, color, bold = false }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className={`${bold ? 'font-inter-semibold text-gf-text' : 'font-inter text-gf-text-muted'} text-base`}>{label}</Text>
      <Text className={`${bold ? 'font-inter-bold text-2xl' : 'font-inter-semibold text-base'} text-gf-text`} style={color ? { color } : undefined} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function SummaryPage({ totals, currency }: Pick<Props, 'totals' | 'currency'>) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View className="gap-2">
      <Row label="Ingresos" value={`+${formatMoneyMajor(totals.incomes, currency)}`} color={colors.income} />
      <Row label="Gastos" value={`-${formatMoneyMajor(totals.spending, currency)}`} color={colors.expense} />
      <View className="h-px bg-gf-border" />
      <Row label="Balance" value={formatMoneyMajor(totals.balance, currency)} color={totals.balance < 0 ? colors.expense : colors.text} bold />
    </View>
  );
}

function AccountsPage({ accounts, accountsTotal, currency }: Pick<Props, 'accounts' | 'accountsTotal' | 'currency'>) {
  return (
    <View className="gap-2">
      <Row label="En total" value={formatMoneyMajor(accountsTotal.total, currency)} bold />
      {accounts.slice(0, 4).map((account) => (
        <View key={String(account._id ?? account.name)} className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter text-sm text-gf-text-muted" numberOfLines={1}>{account.name}</Text>
          <Text className="font-inter-medium text-sm text-gf-text">{formatMoneyMajor(account.amount ?? 0, account.currency || currency)}</Text>
        </View>
      ))}
      {accounts.length > 4 && <Text className="font-inter text-xs text-gf-text-muted">y {accounts.length - 4} cuentas más</Text>}
    </View>
  );
}

function VersusPage({ totals, previous, currency }: Pick<Props, 'totals' | 'previous' | 'currency'>) {
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const line = (label: string, current: number, before: number, badWhenUp: boolean) => {
    const change = percentChange(current, before);
    const good = change === null ? null : badWhenUp ? change <= 0 : change >= 0;
    return (
      <View key={label} className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-inter text-base text-gf-text-muted">{label}</Text>
          <Text className="font-inter text-xs text-gf-text-muted">antes {formatMoneyMajor(before, currency)}</Text>
        </View>
        <View className="items-end">
          <Text className="font-inter-semibold text-base text-gf-text" numberOfLines={1}>{formatMoneyMajor(current, currency)}</Text>
          <Text className="font-inter-semibold text-xs" style={{ color: good === null ? colors.textSecondary : good ? colors.income : colors.expense }}>
            {change === null ? '—' : `${change >= 0 ? '+' : ''}${Math.round(change * 100)}%`}
          </Text>
        </View>
      </View>
    );
  };
  return (
    <View className="gap-2">
      {line('Ingresos', totals.incomes, previous.incomes, false)}
      {line('Gastos', totals.spending, previous.spending, true)}
      {line('Balance', totals.balance, previous.balance, false)}
    </View>
  );
}

// The dashboard's first card, as a carousel like the web's: the summary of the period in the middle, the accounts
// one swipe to the left and the comparison with the previous period one swipe to the right. "Ver más" opens
// the three of them together.
export function SummaryCarousel(props: Props) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const scroller = useRef<ScrollView>(null);

  // The summary is the page you land on: the carousel starts on the middle page.
  useEffect(() => {
    if (width > 0) scroller.current?.scrollTo({ x: width, animated: false });
  }, [width]);

  const names = ['Contra el periodo anterior', props.title, 'Cuentas'];

  return (
    <Card
      title={names[page]}
      action={
        <Pressable accessibilityRole="button" onPress={() => setMore(true)} hitSlop={8}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Ver más</Text>
        </Pressable>
      }>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ minHeight: 120 }}>
        {width > 0 && (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: width, y: 0 }}
            onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}>
            <View style={{ width }}><VersusPage totals={props.totals} previous={props.previous} currency={props.currency} /></View>
            <View style={{ width }}><SummaryPage totals={props.totals} currency={props.currency} /></View>
            <View style={{ width }}><AccountsPage accounts={props.accounts} accountsTotal={props.accountsTotal} currency={props.currency} /></View>
          </ScrollView>
        )}
      </View>
      <View className="flex-row items-center justify-center gap-2">
        {[0, 1, 2].map((index) => (
          <View key={index} style={{ width: page === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: page === index ? colors.accent : colors.border }} />
        ))}
      </View>

      <Modal visible={more} transparent animationType="slide" onRequestClose={() => setMore(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setMore(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
          <View style={{ maxHeight: '86%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', backgroundColor: dark ? DARK_BASE : colors.background }}>
            <AmbientBackground />
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
                <Text className="font-inter-bold text-xl text-gf-text">{props.title}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setMore(false)} hitSlop={10}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 22 }}>
                <View className="gap-2">
                  <Text className="font-inter-semibold text-base text-gf-text">Resumen</Text>
                  <SummaryPage totals={props.totals} currency={props.currency} />
                </View>
                <View className="gap-2">
                  <Text className="font-inter-semibold text-base text-gf-text">Contra el periodo anterior</Text>
                  <VersusPage totals={props.totals} previous={props.previous} currency={props.currency} />
                </View>
                <View className="gap-2">
                  <Text className="font-inter-semibold text-base text-gf-text">Cuentas</Text>
                  <AccountsPage accounts={props.accounts} accountsTotal={props.accountsTotal} currency={props.currency} />
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </Card>
  );
}
