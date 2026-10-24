import { useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { idOf } from '@gastify/core/categories/categoryForm';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { buildBudgetHistoricalComparative } from '@gastify/core/transformers/budgetHistoricalComparative';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';

import { useT, useInfo, useWalletText } from "@/i18n/client";

// Budgets against the period, month by month: how many months each one stayed within its limit (the web's
// "compliance"), with a small strip of months (green kept, red exceeded) and a tap for each month's figures.
export function BudgetsComparative({ start, end, compareStart, compareEnd }: { start: Date; end: Date; compareStart?: Date; compareEnd?: Date }) {
  const text = useWalletText();
  const { APP_INFO } = useInfo();
  const t = useT();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const rates = useRatesToPrimary(budgets.map((budget) => budget.currency), currency);
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      buildBudgetHistoricalComparative({ locale: text.locale, 
        budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates),
        transactions,
        startDate: start,
        endDate: end,
      }),
    [budgets, transactions, currency, rates, start, end]
  );
  const comparedRows = useMemo(() => {
    if (!compareStart || !compareEnd) return [];
    return buildBudgetHistoricalComparative({ locale: text.locale, 
      budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates),
      transactions,
      startDate: compareStart,
      endDate: compareEnd,
    });
  }, [budgets, transactions, currency, rates, compareStart, compareEnd]);
  const comparedById = new Map(comparedRows.map((row) => [idOf(row.budget as never), row]));
  const money = (value: number) => formatMoneyMajor(value, currency);
  const chosen = rows.find((row) => idOf(row.budget as never) === open);
  const chosenPrevious = open ? comparedById.get(open) : undefined;

  return (
    <Card title={t("mobile.presupuestos.del.periodo")} info={APP_INFO.presupuestos_del_periodo}>
      {rows.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.no.hay.presupuestos.de.gasto")}</Text>}
      {rows.map((row) => {
        const id = idOf(row.budget as never);
        const prior = comparedById.get(id);
        const spent = row.monthlySeries.reduce((sum, item) => sum + item.actual, 0);
        const priorSpent = prior?.monthlySeries.reduce((sum, item) => sum + item.actual, 0);
        return (
          <Pressable key={id} accessibilityRole="button" onPress={() => setOpen(id)} className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter-medium text-base text-gf-text" numberOfLines={1}>{String(row.budget.name ?? 'Presupuesto')}</Text>
              <Text className="font-inter-semibold text-sm text-gf-text">
                {row.monthsMet}/{row.monthsTracked}
                {row.complianceRate !== null ? ` · ${Math.round(row.complianceRate * 100)}%` : ''}
              </Text>
            </View>
            <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.gasto.del.periodo.p1.p2", { p1: money(spent), p2: priorSpent !== undefined ? ` · comparado: ${money(priorSpent)}` : '' })}</Text>
            {prior && <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.periodo.comparado.p1.p2.meses", { p1: prior.monthsMet, p2: prior.monthsTracked, p3: prior.complianceRate !== null ? ` · ${Math.round(prior.complianceRate * 100)}%` : '' })}</Text>}
            <View className="flex-row gap-1">
              {row.monthlySeries.map((month, index) => (
                <View key={`${month.label}-${index}`} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: month.met ? colors.income : colors.expense, opacity: month.estimated ? 0.5 : 1 }} />
              ))}
            </View>
          </Pressable>
        );
      })}

      <DetailSheet visible={Boolean(chosen)} onClose={() => setOpen(null)} title={String(chosen?.budget.name ?? '')} subtitle={chosen ? `${chosen.monthsMet} de ${chosen.monthsTracked} meses dentro del límite` : undefined}>
        <Text className="font-inter-semibold text-sm text-gf-text">{t("mobile.periodo.elegido")}</Text>
        {chosen?.monthlySeries.map((month, index) => (
          <View key={`${month.label}-${index}`} className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter text-base text-gf-text">{month.label}{month.estimated ? ' ≈' : ''}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.p1.de.p2", { p1: money(month.actual), p2: money(month.goal) })}</Text>
            <Text className="font-inter-semibold text-sm" style={{ color: month.met ? colors.income : colors.expense }}>{month.met ? 'Cumplido' : 'Excedido'}</Text>
          </View>
        ))}
        {chosenPrevious && <Text className="pt-3 font-inter-semibold text-sm text-gf-text">{t("mobile.periodo.comparado")}</Text>}
        {chosenPrevious?.monthlySeries.map((month, index) => (
          <View key={`previous-${month.label}-${index}`} className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-inter text-base text-gf-text">{month.label}{month.estimated ? ' ≈' : ''}</Text>
            <Text className="font-inter text-sm text-gf-text-muted">{t("mobile.p1.de.p2", { p1: money(month.actual), p2: money(month.goal) })}</Text>
            <Text className="font-inter-semibold text-sm" style={{ color: month.met ? colors.income : colors.expense }}>{month.met ? 'Cumplido' : 'Excedido'}</Text>
          </View>
        ))}
      </DetailSheet>
    </Card>
  );
}
