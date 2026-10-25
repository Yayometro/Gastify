import { useEffect, useMemo, useState } from 'react';

import { getApi } from '@gastify/core/api/client';
import type { AccountData } from '@gastify/core/features/accountsSlice';
import { majorToMinor, minorToMajor } from '@gastify/core/money/currencies';

export type FxExposureRow = { currency: string; nativeAmount: number; valueInPrimary: number; changePct: number | null; effectiveDate?: string };

type Quote = { ok?: boolean; data?: { amountMinor?: number; effectiveDate?: string } };

// Mirrors the web analyzer: current foreign balances converted to the wallet currency, plus
// the pure FX movement since the prior month-end (the native balance is held constant).
export function useAccountsFxExposure(accounts: AccountData[], primary: string, referenceMonth: Date) {
  const balances = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const account of accounts) {
      const currency = account.currency || primary;
      if (currency !== primary) byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + (Number(account.amount) || 0));
    }
    return [...byCurrency.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [accounts, primary]);
  const key = JSON.stringify(balances);
  const previousEnd = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), 0, 23, 59, 59, 999).toISOString();
  const [state, setState] = useState<{ rows: FxExposureRow[]; loading: boolean; missing: string[] }>({ rows: [], loading: balances.length > 0, missing: [] });

  useEffect(() => {
    if (balances.length === 0) {
      setState({ rows: [], loading: false, missing: [] });
      return;
    }
    let cancelled = false;
    setState((current) => ({ ...current, loading: true }));
    (async () => {
      const results = await Promise.all(balances.map(async ([currency, nativeAmount]) => {
        const body = { amountMinor: majorToMinor(nativeAmount, currency), fromCurrency: currency, toCurrency: primary };
        try {
          const current = await getApi().post<Quote>('general-data/fx/quote', body);
          if (!current.ok || typeof current.data?.amountMinor !== 'number') return { currency, row: null };
          const valueInPrimary = minorToMajor(current.data.amountMinor, primary);
          let changePct: number | null = null;
          try {
            const previous = await getApi().post<Quote>('general-data/fx/quote', { ...body, date: previousEnd });
            if (previous.ok && typeof previous.data?.amountMinor === 'number') {
              const before = minorToMajor(previous.data.amountMinor, primary);
              if (before > 0) changePct = ((valueInPrimary - before) / before) * 100;
            }
          } catch { /* Historical quote is optional. */ }
          return { currency, row: { currency, nativeAmount, valueInPrimary, changePct, effectiveDate: current.data.effectiveDate } satisfies FxExposureRow };
        } catch {
          return { currency, row: null };
        }
      }));
      if (!cancelled) setState({ rows: results.flatMap((item) => item.row ? [item.row] : []), loading: false, missing: results.filter((item) => !item.row).map((item) => item.currency) });
    })();
    return () => { cancelled = true; };
    // key captures account currencies and balances without retriggering on equivalent arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, primary, previousEnd]);

  return state;
}
