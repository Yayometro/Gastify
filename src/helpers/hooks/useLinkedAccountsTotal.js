"use client";
import { useEffect, useState } from "react";
import fetcher from "@/helpers/fetcher";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";

function sameCurrencyState(accounts, walletPrimaryCurrency) {
  const sameCurrencyAccounts = accounts.filter(
    (a) => (a?.currency || walletPrimaryCurrency) === walletPrimaryCurrency
  );
  const nativeAmountMinor = sameCurrencyAccounts.reduce(
    (sum, a) => sum + majorToMinor(a?.amount || 0, walletPrimaryCurrency),
    0
  );
  const total = sameCurrencyAccounts.reduce((sum, a) => sum + (Number(a?.amount) || 0), 0);
  const groups =
    sameCurrencyAccounts.length > 0
      ? [{ currency: walletPrimaryCurrency, nativeAmountMinor, primaryAmountMinor: nativeAmountMinor, rate: 1, effectiveDate: null }]
      : [];
  return { total, groups };
}

// Sums a Saving Budget's linkedAccounts balances into the wallet's primary
// currency, and also exposes a per-currency breakdown shaped for
// CurrencyBreakdownChips. Each linked Account carries its own native
// currency - summing raw `.amount` directly (as if every account were
// already in the wallet's primary currency) silently produces a wrong
// total whenever any linked account is in a foreign currency (e.g. a USD
// account's 3000 gets added as if it were 3000 MXN). Same-currency accounts
// sum instantly; foreign ones are converted via a live FX quote and folded
// in (individually and per-currency-group) once resolved, matching the
// pattern used for Projections' starting balance and CreditCard's
// account-equivalent valuation. Never fakes a rate - a quote that fails is
// simply left out of the total rather than assumed to be 1:1.
export function useLinkedAccountsTotal(linkedAccounts, walletPrimaryCurrency) {
  const accounts = linkedAccounts || [];
  const { total: sameCurrencyTotal, groups: sameCurrencyGroups } = sameCurrencyState(accounts, walletPrimaryCurrency);
  const foreignAccounts = accounts.filter(
    (a) => (a?.currency || walletPrimaryCurrency) !== walletPrimaryCurrency
  );
  const foreignKey = foreignAccounts.map((a) => `${a?._id}:${a?.amount}:${a?.currency}`).join(",");

  const [result, setResult] = useState({
    total: sameCurrencyTotal,
    breakdown: { isMultiCurrency: false, breakdown: sameCurrencyGroups },
  });

  useEffect(() => {
    if (foreignAccounts.length === 0) {
      setResult({ total: sameCurrencyTotal, breakdown: { isMultiCurrency: false, breakdown: sameCurrencyGroups } });
      return;
    }
    let cancelled = false;
    const toFetch = fetcher();
    (async () => {
      const foreignGroupsByCurrency = {};
      let foreignConvertedTotal = 0;
      for (const acc of foreignAccounts) {
        try {
          const amountMinor = majorToMinor(acc.amount || 0, acc.currency);
          const res = await toFetch.post("general-data/fx/quote", {
            amountMinor,
            fromCurrency: acc.currency,
            toCurrency: walletPrimaryCurrency,
          });
          if (res.ok) {
            foreignConvertedTotal += minorToMajor(res.data.amountMinor, walletPrimaryCurrency);
            const g = foreignGroupsByCurrency[acc.currency] || {
              currency: acc.currency,
              nativeAmountMinor: 0,
              primaryAmountMinor: 0,
              rate: res.data.rate,
              effectiveDate: res.data.effectiveDate,
            };
            g.nativeAmountMinor += amountMinor;
            g.primaryAmountMinor += res.data.amountMinor;
            g.rate = res.data.rate;
            g.effectiveDate = res.data.effectiveDate;
            foreignGroupsByCurrency[acc.currency] = g;
          }
        } catch (e) {
          // Silently unavailable - that account is left out of the total.
        }
      }
      if (cancelled) return;
      const breakdownGroups = [...sameCurrencyGroups, ...Object.values(foreignGroupsByCurrency)];
      const isMultiCurrency =
        breakdownGroups.length > 1 || (breakdownGroups.length === 1 && breakdownGroups[0].currency !== walletPrimaryCurrency);
      setResult({
        total: sameCurrencyTotal + foreignConvertedTotal,
        breakdown: { isMultiCurrency, breakdown: breakdownGroups },
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foreignKey, sameCurrencyTotal, walletPrimaryCurrency]);

  return result;
}
