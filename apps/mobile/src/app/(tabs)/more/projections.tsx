import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { IncomeSourcesCard } from '@/components/projections/income-sources-card';
import { HistoricalReferencesCard } from '@/components/projections/historical-references-card';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-device-class';
import { usePrimaryCurrency } from '@/hooks/use-primary-currency';
import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { useRefreshAppData } from '@/hooks/use-load-app-data';
import { messageOf } from '@/lib/write';
import { getApi } from '@gastify/core/api/client';
import { monthName } from "@gastify/core/i18n/dates";
import { formatMoneyMajor } from '@gastify/core/money/currencies';
import { totalInPrimary } from '@gastify/core/accounts/accountTotals';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { convertBaselineToPrimary, convertSourcesToPrimary, foreignCurrenciesOf } from '@gastify/core/transformers/projectionInputs';
import {
  buildProjectionAccuracyReport,
  buildYearProjectionTable,
  computeYearRowsWithBalance,
  estimateHistoricalBalances,
  type YearProjectionRow,
} from '@gastify/core/transformers/projectionsChange';
import { getYearMonthDateRange } from '@gastify/core/time/timeFunctions';
import { zebra } from '@/components/ui/zebra';
import { AccuracyCard } from '@/components/projections/accuracy-card';
import { ProjectionMonthSheet } from '@/components/projections/month-sheet';
import type { RootState } from '@/store';

import { useT, useInfo, useLocale } from "@/i18n/client";

type AnyRecord = Record<string, unknown>;
type Answer = { ok?: boolean; data?: unknown };


// The year's projection, month by month, read-only: the same table the web builds from the income
// sources, the year's settings and the baseline. Like the web, anything entered in another currency (income
// sources, the baseline, budgets) is converted to the main currency before the math.
export default function ProjectionsScreen() {
  const locale = useLocale();
  const { APP_INFO } = useInfo();
  const t = useT();
  const TYPE_LABEL: Record<YearProjectionRow['type'], string> = { actual: t("analyzer.table.actual"), current: t("analyzer.thisMonth"), estimate: t("mobile.estimado") };
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const tablet = useIsTablet();
  const T = (phone: string, big: string) => (tablet ? big : phone);
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data);
  const budgets = useSelector((state: RootState) => state.budgetReducer.data);
  const currency = usePrimaryCurrency();
  const [year, setYear] = useState(() => new Date().getFullYear());
  // Bumped after a source or reference is saved or removed: the data is read again.
  const [reloadKey, setReloadKey] = useState(0);
  const accounts = useSelector((state: RootState) => state.accountsReducer.data);
  const [sources, setSources] = useState<AnyRecord[] | null>(null);
  const [settings, setSettings] = useState<AnyRecord | null>(null);
  const [baseline, setBaseline] = useState<AnyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMonth, setOpenMonth] = useState<number | null>(null);
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
  }, [year, reloadKey]);

  const rates = useRatesToPrimary(
    [...foreignCurrenciesOf(sources as never, baseline as never, currency), ...budgets.map((budget) => budget.currency), ...accounts.map((account) => account.currency)],
    currency
  );
  // Money today: every account in the main currency. The balance column starts from it.
  // (credit cards are left out, like the web's "Total money today").
  const startingBalance = useMemo(() => totalInPrimary(accounts.filter((account) => account.accountType !== 'credit'), currency, rates).total, [accounts, currency, rates]);

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

  // The balance after each month, the web's way: from today's money forward for this month and the next ones; for
  // closed months, the balance the person saved or, failing that, an estimate worked out backwards.
  const balanceRows = useMemo(() => {
    if (rows.length === 0) return [];
    const monthlyBalances = ((settings?.monthlyBalances as { month: number; balance: number | null }[] | undefined) ?? []);
    const withBalance = computeYearRowsWithBalance(rows, monthlyBalances as never, startingBalance, year, today);
    const monthStarts = [...getYearMonthDateRange(new Date(year, 0, 1)).values()].map((range) => range.start);
    return estimateHistoricalBalances(withBalance, monthStarts, inputs.baseline as never) as { balance?: number | null; estimatedBalance?: number | null }[];
  }, [rows, settings, startingBalance, year, today, inputs.baseline]);

  const accuracyRows = useMemo(() => {
    if (!sources) return [];
    return buildProjectionAccuracyReport({
      transactions: transactions as never,
      budgets: inputs.budgets as never,
      incomeSources: inputs.sources as never,
      projectionSettings: { monthlyBuffers: (settings?.monthlyBuffers as never) ?? [] } as never,
      projectionBaseline: inputs.baseline as never,
      year,
      today,
    }) as never[];
  }, [transactions, inputs, settings, sources, year, today]);

  const reload = () => setReloadKey((key) => key + 1);
  const appRefresh = useRefreshAppData();

  return (
    <Screen title={t("mobile.proyecciones")} subtitle={t("mobile.projections.subtitle", { p1: currency, p2: year })} backLabel={t("mobile.mas")} onBack={() => router.back()} refreshing={appRefresh.refreshing} onRefresh={() => { appRefresh.refresh(); reload(); }}>
      <View className="flex-row justify-between">
        <Pressable accessibilityRole="button" onPress={() => setYear((y) => y - 1)} hitSlop={8}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ano.anterior")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setYear((y) => y + 1)} hitSlop={8}>
          <Text className="font-inter-semibold text-sm" style={{ color: colors.accent }}>{t("mobile.ano.siguiente")}</Text>
        </Pressable>
      </View>

      {error && <Text className="font-inter text-sm text-red-500">{error}</Text>}
      {!error && sources === null && <ActivityIndicator color={colors.accent} />}

      {sources !== null && (
        <Card style={{ backgroundColor: dark ? 'rgba(192,38,211,0.14)' : 'rgba(192,38,211,0.07)', borderWidth: 1, borderColor: 'rgba(232,121,249,0.28)' }} title={t("mobile.mes.a.mes")} info={APP_INFO.mes_a_mes}>
          {inputs.missing.length > 0 && (
            <Text className="font-inter text-sm text-gf-text-muted">
              {t("mobile.projections.noRate", { p1: inputs.missing.join(', ') })}
            </Text>
          )}
          <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.montos.en.p1", { p1: currency })}</Text>
          {rows.map((row, index) => {
            const income = row.type === 'actual' ? row.income : row.projectedIncome ?? row.income;
            const expense = row.type === 'actual' ? row.expense : row.projectedExpense ?? row.expense;
            const net = (income ?? 0) - (expense ?? 0);
            const money = (amount: number) => formatMoneyMajor(amount, currency, { showCode: false });
            const balanceText = (entry: { balance?: number | null; estimatedBalance?: number | null } | undefined) =>
              typeof entry?.balance === 'number' ? money(entry.balance) : typeof entry?.estimatedBalance === 'number' ? `≈ ${money(entry.estimatedBalance)}` : '—';
            return (
              <Pressable key={`${row.monthName}-${index}`} accessibilityRole="button" accessibilityLabel={t("mobile.openLabel", { p1: row.monthName })} onPress={() => setOpenMonth(index)} className="gap-1 rounded-xl px-3 py-3" style={zebra(index, dark)}>
                <View className="flex-row items-center justify-between">
                  <Text className={`font-inter-semibold ${T('text-base', 'text-3xl')} capitalize text-gf-text`}>{monthName(index, locale) ?? row.monthName}</Text>
                  <Text className={`font-inter-medium ${T('text-xs', 'text-lg')}`} style={{ color: row.type === 'estimate' ? colors.accent : colors.textSecondary }}>{TYPE_LABEL[row.type]}</Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className={`font-inter ${T('text-xs', 'text-lg')} text-gf-text-muted`} style={{ minHeight: 22 }}>{t("mobile.ingresos")}</Text>
                    <Text className={`font-inter-medium ${T('text-sm', 'text-3xl')}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.income }}>{money(income ?? 0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-inter ${T('text-xs', 'text-lg')} text-gf-text-muted`} style={{ minHeight: 22 }}>{t("mobile.gastos")}</Text>
                    <Text className={`font-inter-medium ${T('text-sm', 'text-3xl')}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.expense }}>{money(expense ?? 0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-inter ${T('text-xs', 'text-lg')} text-gf-text-muted`} style={{ minHeight: 22 }}>{t("mobile.neto")}</Text>
                    <Text className={`font-inter-semibold ${T('text-sm', 'text-3xl')}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: net < 0 ? colors.expense : colors.income }}>{money(net)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-inter ${T('text-xs', 'text-lg')} text-gf-text-muted`} style={{ minHeight: 22 }}>{t("mobile.balance")}</Text>
                    <Text className={`font-inter-semibold ${T('text-sm', 'text-3xl')}`} numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text }}>
                      {balanceText(balanceRows[index])}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          <Text className="font-inter text-xs text-gf-text-muted">{t("mobile.los.meses.reales.muestran.lo")}</Text>
        </Card>
      )}

      {sources !== null && <AccuracyCard rows={accuracyRows as never} currency={currency} onMonthPress={(name) => { const found = rows.findIndex((r) => r.monthName === name); if (found >= 0) setOpenMonth(found); }} />}

      {sources !== null && (
        <IncomeSourcesCard sources={sources} currency={currency} onChanged={reload} />
      )}
      {sources !== null && (
        <HistoricalReferencesCard baseline={baseline} currency={currency} onChanged={reload} />
      )}
      <ProjectionMonthSheet
        row={openMonth !== null ? rows[openMonth] ?? null : null}
        monthIndex={openMonth ?? 0}
        year={year}
        currency={currency}
        transactions={transactions}
        budgets={inputs.budgets as never[]}
        incomeSources={inputs.sources as never[]}
        settings={settings}
        onSaved={(next) => setSettings(next)}
        onClose={() => setOpenMonth(null)}
      />
    </Screen>
  );
}
