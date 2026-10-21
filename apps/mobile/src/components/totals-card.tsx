import { Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import type { MonthTotals } from '@gastify/core/transactions/monthSummary';

// Income, spending and what is left of a month. Same numbers as the web's dashboard.
export function TotalsCard({ totals, currency, title = 'Este mes' }: { totals: MonthTotals; currency: string; title?: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const balanceColor = totals.balance < 0 ? colors.expense : colors.text;

  return (
    <Card title={title} info={{ title: 'Totales', text: 'Ingresos = suma de todo lo que entró en el periodo. Gastos = suma de todo lo que salió. Balance = ingresos − gastos (verde si sobra, rojo si falta). Se calcula con los movimientos que ves bajo los filtros activos, en tu moneda principal; las transferencias entre tus cuentas no cuentan porque ni entran ni salen de tu dinero.' }}>
      <View className="flex-row justify-between">
        <Text className="font-inter text-base text-gf-text-muted">Ingresos</Text>
        <Text className="font-inter-semibold text-base" style={{ color: colors.income }}>
          +{formatMoneyMajor(totals.incomes, currency)}
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="font-inter text-base text-gf-text-muted">Gastos</Text>
        <Text className="font-inter-semibold text-base" style={{ color: colors.expense }}>
          -{formatMoneyMajor(totals.spending, currency)}
        </Text>
      </View>
      <View className="h-px bg-gf-border" />
      <View className="flex-row items-end justify-between">
        <Text className="font-inter-semibold text-base text-gf-text">Balance</Text>
        <Text className="font-inter-bold text-2xl" style={{ color: balanceColor }}>
          {formatMoneyMajor(totals.balance, currency)}
        </Text>
      </View>
    </Card>
  );
}
