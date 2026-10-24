import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';

import type { AccountData } from '@gastify/core/features/accountsSlice';
import { percentChange } from '@gastify/core/history/periodComparison';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthTotals } from '@gastify/core/transactions/monthSummary';
import { useT, useInfo } from "@/i18n/client";

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
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View className="gap-2">
      <Row label={t("mobile.ingresos")} value={`+${formatMoneyMajor(totals.incomes, currency)}`} color={colors.income} />
      <Row label={t("mobile.gastos")} value={`-${formatMoneyMajor(totals.spending, currency)}`} color={colors.expense} />
      <View className="h-px bg-gf-border" />
      <Row label={t("mobile.balance")} value={formatMoneyMajor(totals.balance, currency)} color={totals.balance < 0 ? colors.expense : colors.text} bold />
    </View>
  );
}

function AccountsPage({ accounts, accountsTotal, currency }: Pick<Props, 'accounts' | 'accountsTotal' | 'currency'>) {
  const t = useT();
  return (
    <View className="gap-2">
      <Row label={t("mobile.en.total")} value={formatMoneyMajor(accountsTotal.total, currency)} bold />
      {accounts.slice(0, 4).map((account) => (
        <View key={String(account._id ?? account.name)} className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter text-sm text-gf-text-muted" numberOfLines={1}>{account.name}</Text>
          <Text className="font-inter-medium text-sm text-gf-text">{formatMoneyMajor(account.amount ?? 0, account.currency || currency)}</Text>
        </View>
      ))}
      {accounts.length > 4 && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.y.p1.cuentas.mas", { p1: accounts.length - 4 })}</Text>}
    </View>
  );
}

function VersusPage({ totals, previous, currency }: Pick<Props, 'totals' | 'previous' | 'currency'>) {
  const t = useT();
  const colors = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const line = (label: string, current: number, before: number, badWhenUp: boolean) => {
    const change = percentChange(current, before);
    const good = change === null ? null : badWhenUp ? change <= 0 : change >= 0;
    return (
      <View key={label} className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-inter text-base text-gf-text-muted">{label}</Text>
          <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.antes.p1", { p1: formatMoneyMajor(before, currency) })}</Text>
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
  const { HERO_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const scroller = useRef<ScrollView>(null);

  // The summary is the page you land on: the carousel starts on the middle page.
  useEffect(() => {
    if (width > 0) scroller.current?.scrollTo({ x: width, animated: false });
  }, [width]);

  const names = ['Contra el periodo anterior', props.title, 'Cuentas'];
  const goToPage = (next: number) => {
    const target = Math.max(0, Math.min(2, next));
    setPage(target);
    scroller.current?.scrollTo({ x: target * width, animated: true });
  };

  return (
    <Card
      title={names[page]}
      info={[HERO_INFO.versus, HERO_INFO.summary, HERO_INFO.accounts][page]}
      action={
        <Pressable accessibilityRole="button" onPress={() => setMore(true)} hitSlop={8}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ver.mas")}</Text>
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
      <View className="flex-row items-center justify-center gap-5">
        <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.tarjeta.anterior")} accessibilityState={{ disabled: page === 0 }} disabled={page === 0} onPress={() => goToPage(page - 1)} hitSlop={10} style={{ opacity: page === 0 ? 0.35 : 1 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View className="flex-row items-center gap-2">
          {[0, 1, 2].map((index) => (
            <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Ver ${names[index]}`} accessibilityState={{ selected: page === index }} onPress={() => goToPage(index)} hitSlop={8} style={{ width: page === index ? 18 : 8, height: 8, borderRadius: 4, backgroundColor: page === index ? colors.accent : colors.border }} />
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.tarjeta.siguiente")} accessibilityState={{ disabled: page === 2 }} disabled={page === 2} onPress={() => goToPage(page + 1)} hitSlop={10} style={{ opacity: page === 2 ? 0.35 : 1 }}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </View>

      <BottomSheet visible={more} onClose={() => setMore(false)} maxHeight="86%">
            <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
              <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
                <Text className="font-inter-bold text-xl text-gf-text">{props.title}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.cerrar")} onPress={() => setMore(false)} hitSlop={10}>
                  <Ionicons name="close" size={26} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, gap: 22 }}>
                <View className="gap-2">
                  <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.resumen")}</Text>
                  <SummaryPage totals={props.totals} currency={props.currency} />
                </View>
                <View className="gap-2">
                  <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.contra.el.periodo.anterior")}</Text>
                  <VersusPage totals={props.totals} previous={props.previous} currency={props.currency} />
                </View>
                <View className="gap-2">
                  <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.cuentas")}</Text>
                  <AccountsPage accounts={props.accounts} accountsTotal={props.accountsTotal} currency={props.currency} />
                </View>
              </ScrollView>
            </SafeAreaView>
      </BottomSheet>
    </Card>
  );
}
