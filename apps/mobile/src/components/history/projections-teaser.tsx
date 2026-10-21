import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { DetailSheet } from '@/components/analyzer/detail-sheet';
import { ChipPicker } from '@/components/chip-picker';
import { ACCURACY_HELP, AccuracyBody } from '@/components/projections/accuracy-card';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { ACCURACY_SECTIONS } from '@/lib/info-sections';
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
    <Card title="Proyecciones" info={{ title: 'Proyecciones', text: 'Cada barra es el neto del mes (ingresos − gastos). Los meses cerrados usan tus movimientos reales; los futuros se estiman con tus fuentes de ingreso, tus presupuestos y tus referencias históricas; el mes en curso mezcla ambos. Verde: sobra. Rojo: falta. Toca «Ver el detalle» para la tabla completa y el detalle de cada mes.' }}>
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
          <Pressable accessibilityRole="button" onPress={() => setShowDetail(true)} className="items-center rounded-full border border-gf-border py-2.5">
            <Text className="font-inter-semibold text-sm text-gf-text">Ver proyectado contra real</Text>
          </Pressable>
          <DetailSheet visible={showDetail} onClose={() => setShowDetail(false)} title="Proyectado contra real" subtitle={`Meses cerrados de ${year}`} info={{ title: 'Cómo leer esta tabla', text: ACCURACY_HELP, sections: ACCURACY_SECTIONS }}>
            <AccuracyBody rows={accuracy as never[]} currency={currency} />
          </DetailSheet>
        </>
      )}
    </Card>
  );
}
