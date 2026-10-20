import { Text, View, useColorScheme } from 'react-native';

import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { formatMoneyMajor } from '@gastify/core/money/currencies';

export type AccuracyRow = {
  monthName: string;
  projectedIncome?: number;
  projectedExpense?: number;
  actualIncome?: number;
  actualExpense?: number;
  varianceIncome?: number;
  varianceExpense?: number;
};

// "Precisión de tus proyecciones": for each closed month, what was projected against what really happened, and the
// difference. A positive income difference is good news and a positive expense difference is bad news, so the
// colors are mirrored between the two lines, as on the web.
export function AccuracyCard({ rows, currency }: { rows: AccuracyRow[]; currency: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  if (rows.length === 0) return null;
  const money = (value: number | undefined) => formatMoneyMajor(value ?? 0, currency, { showCode: false });

  const variance = (label: string, value: number | undefined, betterWhenPositive: boolean) => {
    const amount = value ?? 0;
    const neutral = amount === 0;
    const better = betterWhenPositive ? amount > 0 : amount < 0;
    const color = neutral ? colors.text : better ? colors.income : colors.expense;
    return (
      <Text className="font-inter text-sm text-gf-text-muted">
        {label}: <Text className="font-inter-semibold" style={{ color }}>{amount > 0 ? '+' : ''}{money(amount)}</Text>
      </Text>
    );
  };

  return (
    <Card
      title="Precisión de tus proyecciones"
      info={{
        title: 'Precisión de tus proyecciones',
        text: 'Compara, mes cerrado por mes cerrado, lo que proyectaste con lo que pasó de verdad. En ingresos, más de lo proyectado es mejor (verde); en gastos, menos de lo proyectado es mejor (verde).',
      }}>
      {rows.map((row) => (
        <View key={row.monthName} className="gap-1 border-t border-gf-border pt-3">
          <Text className="font-inter-semibold text-base capitalize text-gf-text">{row.monthName}</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 gap-0.5">
              <Text className="font-inter text-xs text-gf-text-muted">Ingreso proyectado</Text>
              <Text className="font-inter-medium text-sm text-gf-text-muted">{money(row.projectedIncome)}</Text>
              <Text className="font-inter text-xs text-gf-text-muted">Ingreso real</Text>
              <Text className="font-inter-semibold text-sm" style={{ color: colors.income }}>{money(row.actualIncome)}</Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-inter text-xs text-gf-text-muted">Gasto proyectado</Text>
              <Text className="font-inter-medium text-sm text-gf-text-muted">{money(row.projectedExpense)}</Text>
              <Text className="font-inter text-xs text-gf-text-muted">Gasto real</Text>
              <Text className="font-inter-semibold text-sm" style={{ color: colors.expense }}>{money(row.actualExpense)}</Text>
            </View>
          </View>
          <View className="gap-0.5 pt-1">
            <Text className="font-inter-medium text-xs text-gf-text-muted">Desajuste</Text>
            {variance('Ingreso', row.varianceIncome, true)}
            {variance('Gasto', row.varianceExpense, false)}
          </View>
        </View>
      ))}
      <Text className="font-inter text-xs text-gf-text-muted">Solo se muestran meses cerrados con un historial de proyección registrado.</Text>
    </Card>
  );
}
