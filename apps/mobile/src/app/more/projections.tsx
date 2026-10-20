import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { messageOf } from '@/lib/write';
import { getApi } from '@gastify/core/api/client';
import { MONTHS_ES } from '@gastify/core/format/spanishDates';
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { convertBaselineToPrimary, convertSourcesToPrimary, foreignCurrenciesOf } from '@gastify/core/transformers/projectionInputs';
import { buildYearProjectionTable, type YearProjectionRow } from '@gastify/core/transformers/projectionsChange';
import type { RootState } from '@/store';

type AnyRecord = Record<string, unknown>;
type Answer = { ok?: boolean; data?: unknown };

const TYPE_LABEL: Record<YearProjectionRow['type'], string> = { actual: 'Real', current: 'Este mes', estimate: 'Estimado' };
const COLUMNS = { month: 96, type: 96, income: 116, expense: 116, net: 116 };

// The year's projection, month by month, read-only: the same table the web builds from the income
// sources, the year's settings and the baseline. Like the web, anything entered in another currency (income
// sources, the baseline, budgets) is converted to the main currency before the math.
export default function ProjectionsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const currency = usePrimaryCurrency();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [sources, setSources] = useState<AnyRecord[] | null>(null);
  const [settings, setSettings] = useState<AnyRecord | null>(null);
  const [baseline, setBaseline] = useState<AnyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let alive = true;
    setError(null);
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
      } catch (e) {
        if (alive) setError(messageOf(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [year]);

  const rates = useRatesToPrimary(
    [...foreignCurrenciesOf(sources as never, baseline as never, currency), ...budgets.map((budget) => budget.currency)],
    currency
  );

  const inputs = useMemo(() => {
    const convertedSources = convertSourcesToPrimary((sources ?? []) as { amount?: number; currency?: string }[], currency, rates);
    const convertedBaseline = convertBaselineToPrimary(baseline as never, currency, rates);
    return {
      sources: convertedSources.sources,
      baseline: convertedBaseline.baseline,
      budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates),
      missing: [...new Set([...convertedSources.missing, ...convertedBaseline.missing])],
    };
  }, [sources, baseline, budgets, currency, rates]);

  const rows = useMemo<YearProjectionRow[]>(() => {
    if (!sources) return [];
    return buildYearProjectionTable({
      transactions: transactions as never,
      budgets: inputs.budgets as never,
      incomeSources: inputs.sources as never,
      projectionSettings: settings as never,
      projectionBaseline: inputs.baseline as never,
      year,
      today,
    });
  }, [transactions, inputs, sources, settings, year, today]);

  return (
    <Screen title="Proyecciones" subtitle={`Año ${year}`} backLabel="Más" onBack={() => router.back()}>
      <View className="flex-row justify-between">
        <Pressable accessibilityRole="button" onPress={() => setYear((y) => y - 1)} hitSlop={8}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>‹ Año anterior</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setYear((y) => y + 1)} hitSlop={8}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>Año siguiente ›</Text>
        </Pressable>
      </View>

      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
      {!error && sources === null && <ActivityIndicator color={colors.accent} />}

      {sources !== null && (
        <Card title="Mes a mes">
          {inputs.missing.length > 0 && (
            <Text className="font-inter text-sm text-gf-text-muted">
              {`Todavía no hay tipo de cambio para ${inputs.missing.join(', ')}: esas cifras se muestran sin convertir.`}
            </Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View className="flex-row border-b border-gf-border pb-2">
                <Text style={{ width: COLUMNS.month }} className="font-inter-semibold text-xs text-gf-text-muted">Mes</Text>
                <Text style={{ width: COLUMNS.type }} className="font-inter-semibold text-xs text-gf-text-muted">Tipo</Text>
                <Text style={{ width: COLUMNS.income, textAlign: 'right' }} className="font-inter-semibold text-xs text-gf-text-muted">Ingresos</Text>
                <Text style={{ width: COLUMNS.expense, textAlign: 'right' }} className="font-inter-semibold text-xs text-gf-text-muted">Gastos</Text>
                <Text style={{ width: COLUMNS.net, textAlign: 'right' }} className="font-inter-semibold text-xs text-gf-text-muted">Neto</Text>
              </View>
              {rows.map((row, index) => {
                const income = row.type === 'actual' ? row.income : row.projectedIncome ?? row.income;
                const expense = row.type === 'actual' ? row.expense : row.projectedExpense ?? row.expense;
                const net = (income ?? 0) - (expense ?? 0);
                return (
                  <View key={`${row.monthName}-${index}`} className="flex-row items-center border-b border-gf-border py-2.5">
                    <Text style={{ width: COLUMNS.month }} className="font-inter-medium text-sm text-gf-text">{MONTHS_ES[index] ?? row.monthName}</Text>
                    <Text style={{ width: COLUMNS.type }} className="font-inter text-sm text-gf-text-muted">{TYPE_LABEL[row.type]}</Text>
                    <Text style={{ width: COLUMNS.income, textAlign: 'right' }} className="font-inter text-sm text-gf-text">{formatMoneyMajor(income ?? 0, currency)}</Text>
                    <Text style={{ width: COLUMNS.expense, textAlign: 'right' }} className="font-inter text-sm text-gf-text">{formatMoneyMajor(expense ?? 0, currency)}</Text>
                    <Text style={{ width: COLUMNS.net, textAlign: 'right', color: net < 0 ? colors.expense : colors.income }} className="font-inter-semibold text-sm">{formatMoneyMajor(net, currency)}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <Text className="font-inter text-xs text-gf-text-muted">Los meses reales muestran lo que ya ocurrió; los estimados, lo que se proyecta.</Text>
        </Card>
      )}
    </Screen>
  );
}
