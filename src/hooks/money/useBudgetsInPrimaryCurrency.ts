"use client";

import { useEffect, useMemo, useState } from "react";
import fetcher from "@/helpers/fetcher";
import { majorToMinor } from "@/lib/money/currencies";
import {
  convertBudgetsToPrimary,
  getForeignBudgetCurrencies,
  type BudgetWithCurrency,
  type ConvertedBudget,
  type RatesToPrimary,
} from "@/helpers/transformers/budgetCurrency";

interface FxQuoteResponse {
  ok?: boolean;
  data?: { rate?: string | number };
}

// Returns `budgets` with every number expressed in the Wallet's primary
// currency (see budgetCurrency.ts). One live quote per foreign currency, not
// per budget. Until the rates arrive - or if no rate exists - the affected
// budgets come back as stored, flagged `conversionUnavailable`; nothing is
// ever guessed.
export default function useBudgetsInPrimaryCurrency<T extends BudgetWithCurrency>(
  budgets: T[] | null | undefined,
  primaryCurrency: string
): ConvertedBudget<T>[] {
  const [rates, setRates] = useState<{ primary: string; byCurrency: RatesToPrimary }>({ primary: primaryCurrency, byCurrency: {} });

  const foreignKey = getForeignBudgetCurrencies(budgets, primaryCurrency).sort().join(",");

  useEffect(() => {
    const foreign = foreignKey ? foreignKey.split(",") : [];
    if (foreign.length === 0) return;
    let cancelled = false;
    (async () => {
      const toFetch = fetcher();
      const entries = await Promise.all(
        foreign.map(async (from): Promise<[string, number | undefined]> => {
          try {
            const res = (await toFetch.post("general-data/fx/quote", {
              amountMinor: majorToMinor(1, from),
              fromCurrency: from,
              toCurrency: primaryCurrency,
            })) as FxQuoteResponse;
            const rate = Number(res?.ok ? res.data?.rate : NaN);
            return [from, Number.isFinite(rate) && rate > 0 ? rate : undefined];
          } catch {
            return [from, undefined];
          }
        })
      );
      if (!cancelled) setRates({ primary: primaryCurrency, byCurrency: Object.fromEntries(entries) });
    })();
    return () => {
      cancelled = true;
    };
  }, [foreignKey, primaryCurrency]);

  return useMemo(
    () => convertBudgetsToPrimary(budgets, primaryCurrency, rates.primary === primaryCurrency ? rates.byCurrency : null),
    [budgets, primaryCurrency, rates]
  );
}
