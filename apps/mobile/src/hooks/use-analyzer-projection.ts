import { useEffect, useMemo, useState } from 'react';

import { useRatesToPrimary } from '@/hooks/use-rates-to-primary';
import { getApi } from '@gastify/core/api/client';
import type { BudgetData } from '@gastify/core/features/budgetSlice';
import type { TransactionData } from '@gastify/core/features/transacctionsSlice';
import { convertBudgetsToPrimary } from '@gastify/core/transformers/budgetCurrency';
import { convertBaselineToPrimary, convertSourcesToPrimary, foreignCurrenciesOf } from '@gastify/core/transformers/projectionInputs';
import { buildProjectionComparisonForMonth } from '@gastify/core/transformers/projectionsChange';

type AnyRecord = Record<string, unknown>;
type Answer = { ok?: boolean; data?: unknown };

// Same three read endpoints and currency conversion as the full Projections screen, scoped to
// the Analyzer's chosen month. The shared core supplies the projected-vs-actual comparison.
export function useAnalyzerProjection(month: Date, transactions: TransactionData[], budgets: BudgetData[], currency: string) {
  const year = month.getFullYear();
  const [source, setSource] = useState<{ year: number; incomes: AnyRecord[]; settings: AnyRecord | null; baseline: AnyRecord | null } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setSource(null);
    setError(false);
    (async () => {
      try {
        const api = getApi();
        const [income, projections, baseline] = await Promise.all([
          api.post<Answer>('general-data/income-sources/get', {}),
          api.post<Answer>('general-data/projections/get', { year }),
          api.post<Answer>('general-data/projection-baseline/get', {}),
        ]);
        if (alive) setSource({ year, incomes: income.ok && Array.isArray(income.data) ? income.data as AnyRecord[] : [], settings: projections.ok && projections.data ? projections.data as AnyRecord : null, baseline: baseline.ok && baseline.data ? baseline.data as AnyRecord : null });
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, [year]);

  const rates = useRatesToPrimary([...foreignCurrenciesOf(source?.incomes as never, source?.baseline as never, currency), ...budgets.map((budget) => budget.currency)], currency);
  const result = useMemo(() => {
    if (!source || source.year !== year) return { comparison: null, missing: [] as string[] };
    const convertedSources = convertSourcesToPrimary(source.incomes as { amount?: number; currency?: string }[], currency, rates);
    const convertedBaseline = convertBaselineToPrimary(source.baseline as never, currency, rates);
    const comparison = buildProjectionComparisonForMonth({
      transactions: transactions as never,
      budgets: convertBudgetsToPrimary(budgets.filter((budget) => !budget.archived), currency, rates) as never,
      incomeSources: convertedSources.sources as never,
      projectionSettings: source.settings as never,
      projectionBaseline: convertedBaseline.baseline as never,
      referenceDate: month,
      today: new Date(),
    });
    return { comparison, missing: [...new Set([...convertedSources.missing, ...convertedBaseline.missing])] };
  }, [source, year, currency, rates, budgets, transactions, month]);
  return { ...result, loading: !source && !error, error };
}
