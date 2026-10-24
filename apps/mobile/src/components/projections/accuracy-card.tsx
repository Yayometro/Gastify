import { Pressable, Text, View, useColorScheme, useWindowDimensions } from 'react-native';

import { Card } from '@/components/ui/card';
import { zebra } from '@/components/ui/zebra';
import { Colors } from '@/constants/theme';
import { TABLET_MIN_WIDTH } from '@/hooks/use-device-class';
import { esMonthLabel } from '@/lib/month-label';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { APP_INFO } from '@gastify/core/info/appInfo';
import { useT } from "@/i18n/client";

export type AccuracyRow = {
  monthName: string;
  projectedIncome?: number;
  projectedExpense?: number;
  actualIncome?: number;
  actualExpense?: number;
  varianceIncome?: number;
  varianceExpense?: number;
};

export const ACCURACY_HELP = [
  'PROYECTADO VS. REAL',
  '«Proyectado» es lo que esperabas para ese mes según lo que tenías configurado en ese momento (tope, o tu referencia histórica); no se recalcula después, así que editar hoy un mes ya cerrado no cambia lo que ese mes «proyectaba». «Real» es lo que tus movimientos dicen que pasó de verdad.',
  'DESAJUSTE: DOS NÚMEROS, UNO POR RENGLÓN',
  'El de ingreso es Ingreso real menos Ingreso proyectado. El de gasto es Gasto real menos Gasto proyectado. No están relacionados entre sí: cada uno compara su propia columna.',
  'POR QUÉ EL COLOR NO SIGUE EL SIGNO IGUAL EN LOS DOS',
  'El color siempre significa lo mismo (verde: te fue mejor de lo esperado; rojo: te fue peor), pero «mejor» se ve distinto en cada uno. En ingreso, más dinero del proyectado es bueno: un número positivo es verde y uno negativo es rojo. En gasto, gastar menos de lo proyectado es bueno: un número negativo es verde y uno positivo es rojo. Por eso un mismo mes puede mostrar un renglón en rojo y el otro en verde: son dos comparaciones independientes, no un total combinado.',
  'EJEMPLO',
  'Proyectabas $50,000 de gasto y gastaste $47,000: desajuste de gasto de -$3,000, verde (gastaste menos). Proyectabas $80,000 de ingreso y ganaste $60,000: desajuste de ingreso de -$20,000, rojo (ganaste menos).',
  'Solo se muestran meses cerrados con un historial de proyección registrado. Toca un mes para ver su detalle.',
].join('\n\n');

// "Precisión de tus proyecciones": for each closed month, what was projected against what really happened and the
// difference, laid out as a small table (rows: income and spending; columns: projected, real, difference). A positive
// income difference is good news and a positive expense difference is bad news, so the colors are mirrored.
export function AccuracyBody({ rows, currency, onMonthPress }: { rows: AccuracyRow[]; currency: string; onMonthPress?: (monthName: string) => void }) {
  const t = useT();
  const big = useWindowDimensions().width >= TABLET_MIN_WIDTH;
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const money = (value: number | undefined) => formatMoneyMajor(value ?? 0, currency, { showCode: false });

  const line = (label: string, projected: number | undefined, real: number | undefined, diff: number | undefined, betterWhenPositive: boolean, tone: string) => {
    const amount = diff ?? 0;
    const neutral = amount === 0;
    const better = betterWhenPositive ? amount > 0 : amount < 0;
    const color = neutral ? colors.text : better ? colors.income : colors.expense;
    return (
      <View className="flex-row items-center gap-2 py-1.5">
        <Text className={`font-inter-medium ${big ? 'w-24 text-base' : 'w-14 text-xs'} text-gf-text-muted`}>{label}</Text>
        <Text className="flex-1 text-right font-inter ${big ? 'text-xl' : 'text-xs'} text-gf-text-muted" numberOfLines={1} adjustsFontSizeToFit>{money(projected)}</Text>
        <Text className={`flex-1 text-right font-inter-semibold ${big ? 'text-xl' : 'text-xs'}`} style={{ color: tone }} numberOfLines={1} adjustsFontSizeToFit>{money(real)}</Text>
        <View className="flex-[1.2] flex-row items-center justify-end gap-1">
          <Text style={{ color: neutral ? '#f59e0b' : color, fontWeight: '700', fontSize: 12 }}>{neutral ? '▬' : amount > 0 ? '▲' : '▼'}</Text>
          <Text className={`font-inter-semibold ${big ? 'text-xl' : 'text-xs'}`} style={{ color }} numberOfLines={1} adjustsFontSizeToFit>{amount > 0 ? '+' : ''}{money(amount)}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.todavia.no.hay.referencias.guardadas")}</Text>}
      {rows.map((row, rowIndex) => (
        <Pressable key={row.monthName} accessibilityRole="button" onPress={() => onMonthPress?.(row.monthName)} className="rounded-xl px-3 py-3" style={zebra(rowIndex, scheme === 'dark')}>
          <Text className="font-inter-semibold text-base text-gf-text">{esMonthLabel(row.monthName)}</Text>
          <View className="flex-row items-center gap-2 pt-1">
            <Text className="w-14" />
            <Text className={`flex-1 text-right font-inter-medium ${big ? 'text-sm' : 'text-[10px]'} uppercase text-gf-text-muted`}>{t("mobile.proyectado")}</Text>
            <Text className={`flex-1 text-right font-inter-medium ${big ? 'text-sm' : 'text-[10px]'} uppercase text-gf-text-muted`}>{t("mobile.real.2")}</Text>
            <Text className={`flex-[1.2] text-right font-inter-medium ${big ? 'text-sm' : 'text-[10px]'} uppercase text-gf-text-muted`}>{t("mobile.desajuste")}</Text>
          </View>
          {line('Ingreso', row.projectedIncome, row.actualIncome, row.varianceIncome, true, colors.income)}
          {line('Gasto', row.projectedExpense, row.actualExpense, row.varianceExpense, false, colors.expense)}
        </Pressable>
      ))}
      <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.solo.se.muestran.meses.cerrados")}</Text>
    </>
  );
}

export function AccuracyCard({ rows, currency, onMonthPress }: { rows: AccuracyRow[]; currency: string; onMonthPress?: (monthName: string) => void }) {
  const t = useT();
  const scheme = useColorScheme();
  if (rows.length === 0) return null;
  return (
    <Card style={{ backgroundColor: scheme === 'dark' ? 'rgba(192,38,211,0.14)' : 'rgba(192,38,211,0.07)', borderWidth: 1, borderColor: 'rgba(232,121,249,0.28)' }} title={t("mobile.precision.de.tus.proyecciones")} info={APP_INFO.c_mo_leer_esta_tabla_2}>
      <AccuracyBody rows={rows} currency={currency} onMonthPress={onMonthPress} />
    </Card>
  );
}
