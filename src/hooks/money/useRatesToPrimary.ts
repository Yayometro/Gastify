"use client";

import { useEffect, useMemo, useState } from "react";
import fetcher from "@/helpers/fetcher";
import { majorToMinor } from "@gastify/core/money/currencies";
import type { RatesToPrimary } from "@gastify/core/transformers/budgetCurrency";

interface FxQuoteResponse {
  ok?: boolean;
  data?: { rate?: number | string };
}

/** Fetch one current FX quote per currency; unavailable currencies remain undefined, never 1:1. */
export function useRatesToPrimary(currencies: (string | null | undefined)[], primary: string): RatesToPrimary {
  const key = [...new Set(currencies.filter((currency): currency is string => Boolean(currency) && currency !== primary))].sort().join(",");
  const [loaded, setLoaded] = useState<{ primary: string; rates: RatesToPrimary }>({ primary, rates: {} });

  useEffect(() => {
    const foreign = key ? key.split(",") : [];
    if (foreign.length === 0) return;
    let cancelled = false;
    void (async () => {
      const api = fetcher();
      const entries = await Promise.all(foreign.map(async (from): Promise<[string, number | undefined]> => {
        try {
          const response = await api.post("general-data/fx/quote", {
            amountMinor: majorToMinor(1, from),
            fromCurrency: from,
            toCurrency: primary,
          }) as FxQuoteResponse;
          const rate = Number(response?.ok ? response.data?.rate : NaN);
          return [from, Number.isFinite(rate) && rate > 0 ? rate : undefined];
        } catch {
          return [from, undefined];
        }
      }));
      if (!cancelled) setLoaded({ primary, rates: Object.fromEntries(entries) });
    })();
    return () => { cancelled = true; };
  }, [key, primary]);

  return useMemo(() => loaded.primary === primary ? loaded.rates : {}, [loaded, primary]);
}
