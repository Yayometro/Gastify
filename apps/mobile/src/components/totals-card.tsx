import { Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthTotals } from '@gastify/core/transactions/monthSummary';

import { useT, useInfo } from "@/i18n/client";

// Income, spending and what is left of a month. Same numbers as the web's dashboard.
export function TotalsCard({ totals, currency, title = 'Este mes' }: { totals: MonthTotals; currency: string; title?: string }) {
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const balanceColor = totals.balance < 0 ? colors.expense : colors.text;

  return (
    <Card title={title} info={APP_INFO.totales}>
      <View className="flex-row justify-between">
        <Text className="font-inter text-base text-gf-text-muted">{t("mobile.ingresos")}</Text>
        <Text className="font-inter-semibold text-base" style={{ color: colors.income }}>
          +{formatMoneyMajor(totals.incomes, currency)}
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="font-inter text-base text-gf-text-muted">{t("mobile.gastos")}</Text>
        <Text className="font-inter-semibold text-base" style={{ color: colors.expense }}>
          -{formatMoneyMajor(totals.spending, currency)}
        </Text>
      </View>
      <View className="h-px bg-gf-border" />
      <View className="flex-row items-end justify-between">
        <Text className="font-inter-semibold text-base text-gf-text">{t("mobile.balance")}</Text>
        <Text className="font-inter-bold text-2xl" style={{ color: balanceColor }}>
          {formatMoneyMajor(totals.balance, currency)}
        </Text>
      </View>
    </Card>
  );
}
