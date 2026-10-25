import { useEffect, useMemo, useState } from 'react';

import { getApi } from '@gastify/core/api/client';
import { majorToMinor } from '@gastify/core/money/currencies';
import type { RatesToPrimary } from '@gastify/core/transformers/budgetCurrency';

type FxQuote = { ok?: boolean; data?: { rate?: number | string } };

// Exchange rates to the primary currency (1 unit of each foreign currency), from the same quote
// endpoint the web uses. Until they arrive, the foreign amounts have no rate and are left out of
// totals instead of being added at a wrong value.
export function useRatesToPrimary(currencies: (string | null | undefined)[], primary: string): RatesToPrimary {
  const key = [...new Set(currencies.filter((c): c is string => Boolean(c) && c !== primary))].sort().join(',');
  const [loaded, setLoaded] = useState<{ primary: string; byCurrency: RatesToPrimary }>({ primary, byCurrency: {} });

  useEffect(() => {
    const foreign = key ? key.split(',') : [];
    if (foreign.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        foreign.map(async (from): Promise<[string, number | undefined]> => {
          try {
            const res = await getApi().post<FxQuote>('general-data/fx/quote', {
              amountMinor: majorToMinor(1, from),
              fromCurrency: from,
              toCurrency: primary,
            });
            const rate = Number(res?.ok ? res.data?.rate : NaN);
            return [from, Number.isFinite(rate) && rate > 0 ? rate : undefined];
          } catch {
            return [from, undefined];
          }
        })
      );
      if (!cancelled) setLoaded({ primary, byCurrency: Object.fromEntries(entries) });
    })();
    return () => {
      cancelled = true;
    };
  }, [key, primary]);

  return useMemo(() => (loaded.primary === primary ? loaded.byCurrency : {}), [loaded, primary]);
}
