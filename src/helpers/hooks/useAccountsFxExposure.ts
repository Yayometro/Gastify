"use client";
import { useEffect, useState } from "react";
import fetcher from "@/helpers/fetcher";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";
import type { AccountData } from "@/lib/features/accountsSlice";

export interface FxExposureRow {
  currency: string;
  nativeAmount: number;
  valueInPrimary: number;
  changePct: number | null;
  effectiveDate?: string;
  [key: string]: unknown;
}

export interface FxExposureState {
  rows: FxExposureRow[];
  loading: boolean;
  [key: string]: unknown;
}

function previousMonthEnd(referenceDate?: Date | string | number | null): Date {
  const d = new Date(referenceDate as string | number | Date);
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
}

// Wallet Analyzer's "multi-currency exposure" table: for every foreign
// (non-wallet-primary) currency held across accounts, how much is it worth
// in the wallet's primary currency today, and how has that changed since
// last month-end purely from FX movement (native balances are summed as
// of "now" for both quotes, so the delta isolates rate movement, not
// balance changes). Mirrors useLinkedAccountsTotal's conversion pattern -
// same-currency accounts need no conversion, a failed quote drops that
// currency rather than assuming a rate.
export function useAccountsFxExposure(
  accounts?: AccountData[] | null,
  walletPrimaryCurrency?: string,
  referenceDate?: Date | string | number | null
): FxExposureState {
  const foreignAccounts = (accounts || []).filter(
    (a) => (a?.currency || walletPrimaryCurrency) !== walletPrimaryCurrency
  );
  const nativeByCurrency: Record<string, number> = {};
  foreignAccounts.forEach((a) => {
    nativeByCurrency[a.currency as string] = (nativeByCurrency[a.currency as string] || 0) + (Number(a.amount) || 0);
  });
  const currencies = Object.keys(nativeByCurrency);
  const key = currencies.map((c) => `${c}:${nativeByCurrency[c]}`).join(",") + `|${referenceDate}`;

  const [state, setState] = useState<FxExposureState>({ rows: [], loading: currencies.length > 0 });

  useEffect(() => {
    if (currencies.length === 0) {
      setState({ rows: [], loading: false });
      return;
    }
    let cancelled = false;
    const toFetch = fetcher();
    const prevDate = previousMonthEnd(referenceDate).toISOString();

    (async () => {
      setState((s) => ({ ...s, loading: true }));
      const rows: FxExposureRow[] = [];
      for (const currency of currencies) {
        const nativeAmount = nativeByCurrency[currency];
        const amountMinor = majorToMinor(nativeAmount, currency);
        try {
          const current = await toFetch.post("general-data/fx/quote", {
            amountMinor,
            fromCurrency: currency,
            toCurrency: walletPrimaryCurrency,
          });
          if (!current.ok) continue;
          const valueInPrimary = minorToMajor(current.data.amountMinor, walletPrimaryCurrency as string);

          let changePct: number | null = null;
          try {
            const previous = await toFetch.post("general-data/fx/quote", {
              amountMinor,
              fromCurrency: currency,
              toCurrency: walletPrimaryCurrency,
              date: prevDate,
            });
            if (previous.ok) {
              const previousValueInPrimary = minorToMajor(previous.data.amountMinor, walletPrimaryCurrency as string);
              changePct = previousValueInPrimary > 0
                ? ((valueInPrimary - previousValueInPrimary) / previousValueInPrimary) * 100
                : null;
            }
          } catch {
            // Historical rate unavailable - show current exposure without a MoM delta.
          }

          rows.push({ currency, nativeAmount, valueInPrimary, changePct, effectiveDate: current.data.effectiveDate });
        } catch {
          // Current rate unavailable - drop this currency entirely rather than guess.
        }
      }
      if (!cancelled) setState({ rows, loading: false });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, walletPrimaryCurrency]);

  return state;
}
