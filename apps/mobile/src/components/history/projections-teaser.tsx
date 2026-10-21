import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { ChipPicker } from '@/components/chip-picker';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import type { RootState } from '@/store';
import { getApi } from '@gastify/core/api/client';
import { MONTHS_ES_SHORT } from '@gastify/core/format/spanishDates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { convertBaselineToPrimary, convertSourcesToPrimary, foreignCurrenciesOf } from '@gastify/core/transformers/projectionInputs';
import { buildProjectionAccuracyReport, buildYearProjectionTable, type YearProjectionRow } from '@gastify/core/transformers/projectionsChange';

type AnyRecord = Record<string, unknown>;
type Answer = { ok?: boolean; data?: unknown };

// The projections of a year inside History, with their own year filter: the net of each month (green when money is
// left, red when it is not) and the year's total, with a link to the full table.
export function ProjectionsTeaser() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const currency = usePrimaryCurrency();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [showDetail, setShowDetail] = useState(false);
  const [sources, setSources] = useState<AnyRecord[] | null>(null);
  const [settings, setSettings] = useState<AnyRecord | null>(null);
  const [baseline, setBaseline] = useState<AnyRecord | null>(null);

  useEffect(() => {
    let alive = true;
    setSources(null);
    (async () => {
      try {
        const api = getApi();
        const [incomeRes, projRes, baseRes] = await Promise.all([
          api.post<Answer>('general-data/income-sources/get', {}),
          api.post<Answer>('general-data/projections/get', { year }),
          api.post<Answer>('general-data/projection-baseline/get', {}),
        ]);
        if (!alive) return;
        setSources(incomeRes.ok && Array.isArray(incomeRes.data) ? (incomeRes.data as AnyRecord[]) : []);
        setSettings(projRes.ok && projRes.data ? (projRes.data as AnyRecord) : null);
        setBaseline(baseRes.ok && baseRes.data ? (baseRes.data as AnyRecord) : null);
      } catch {
        if (alive) setSources([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [year]);

  const rates = useRatesToPrimary([...foreignCurrenciesOf(sources as never, baseline as never, currency), ...budgets.map((budget) => budget.currency)], currency);
  const rows = useMemo<YearProjectionRow[]>(() => {
    if (!sources) return [];
    const convertedSources = convertSourcesToPrimary((sources ?? []) as { amount?: number; currency?: string }[], currency, rates);
    const convertedBaseline = convertBaselineToPrimary(baseline as never, currency, rates);
    return buildYearProjectionTable({
      transactions: transactions as never,
      budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates) as never,
      incomeSources: convertedSources.sources as never,
      projectionSettings: settings as never,
      projectionBaseline: convertedBaseline.baseline as never,
      year,
      today,
    });
  }, [sources, baseline, settings, transactions, budgets, currency, rates, year, today]);
  const accuracy = useMemo(() => {
    if (!sources) return [];
    const convertedSources = convertSourcesToPrimary(sources as { amount?: number; currency?: string }[], currency, rates);
    const convertedBaseline = convertBaselineToPrimary(baseline as never, currency, rates);
    return buildProjectionAccuracyReport({
      transactions: transactions as never,
      budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates) as never,
      incomeSources: convertedSources.sources as never,
      projectionSettings: settings as never,
      projectionBaseline: convertedBaseline.baseline as never,
      year,
      today,
    });
  }, [sources, baseline, settings, transactions, budgets, currency, rates, year, today]);

  const nets = rows.map((row) => {
    const income = row.type === 'actual' ? row.income : row.projectedIncome ?? row.income;
    const expense = row.type === 'actual' ? row.expense : row.projectedExpense ?? row.expense;
    return (income ?? 0) - (expense ?? 0);
  });
  const total = nets.reduce((sum, value) => sum + value, 0);
  const max = Math.max(1, ...nets.map((value) => Math.abs(value)));
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  return (
    <Card title="Proyecciones" info={{ title: 'Proyecciones', text: 'Cuánto te sobraría o te faltaría cada mes del año (ingresos menos gastos), mezclando lo que ya pasó con lo proyectado. Verde: sobra. Rojo: falta. Toca "Ver el detalle" para la tabla completa.' }}>
      <ChipPicker items={years.map((y) => ({ id: String(y), label: String(y) }))} value={String(year)} onChange={(id) => setYear(Number(id))} moreAfter={99} />
      {sources === null ? (
        <Text className="font-inter text-sm text-gf-text-muted">Calculando…</Text>
      ) : (
        <>
          <Text className="font-inter-bold text-2xl" style={{ color: total < 0 ? colors.expense : colors.income }}>{formatMoneyMajor(total, currency)}</Text>
          <Text className="font-inter text-xs text-gf-text-muted">Neto del año {year}</Text>
          <View className="flex-row items-end gap-1" style={{ height: 70 }}>
            {nets.map((value, index) => (
              <View key={index} className="flex-1 items-center justify-end gap-1">
                <View style={{ width: '70%', height: Math.max(3, (Math.abs(value) / max) * 56), borderRadius: 4, backgroundColor: value < 0 ? colors.expense : colors.income, opacity: rows[index]?.type === 'estimate' ? 0.55 : 1 }} />
                <Text className="font-inter text-[9px] text-gf-text-muted">{MONTHS_ES_SHORT[index]?.[0]?.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/more/projections')} hitSlop={8}>
            <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Ver el detalle ›</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDetail }} onPress={() => setShowDetail((value) => !value)} className="items-center rounded-full border border-gf-border py-2">
            <Text className="font-inter-semibold text-sm text-gf-text">{showDetail ? 'Ocultar proyectado contra real' : 'Ver proyectado contra real'}</Text>
          </Pressable>
          {showDetail && (
            <View className="gap-3">
              {accuracy.length === 0 && <Text className="font-inter text-sm text-gf-text-muted">Todavía no hay referencias guardadas para comparar meses cerrados de este año.</Text>}
              {accuracy.map((row) => <View key={row.monthName} className="gap-1 border-t border-gf-border pt-2">
                <Text className="font-inter-semibold text-sm text-gf-text">{row.monthName}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">Ingresos: previsto {formatMoneyMajor(row.projectedIncome, currency)} · real {formatMoneyMajor(row.actualIncome, currency)}</Text>
                <Text className="font-inter text-xs text-gf-text-muted">Gastos: previsto {formatMoneyMajor(row.projectedExpense, currency)} · real {formatMoneyMajor(row.actualExpense, currency)}</Text>
                <Text className="font-inter-semibold text-xs" style={{ color: row.varianceExpense > 0 ? colors.expense : colors.income }}>Diferencia de gastos: {formatMoneyMajor(row.varianceExpense, currency)}</Text>
              </View>)}
            </View>
          )}
        </>
      )}
    </Card>
  );
}
