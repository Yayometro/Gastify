"use client";
import { useEffect, useState } from "react";
import fetcher from "@/helpers/fetcher";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";

// Sums a Saving Budget's linkedAccounts balances into the wallet's primary
// currency. Each linked Account carries its own native currency - summing
// raw `.amount` directly (as if every account were already in the wallet's
// primary currency) silently produces a wrong total whenever any linked
// account is in a foreign currency (e.g. a USD account's 3000 gets added as
// if it were 3000 MXN). Same-currency accounts sum instantly; foreign ones
// are converted via a live FX quote and folded in once resolved, matching
// the pattern used for Projections' starting balance and CreditCard's
// account-equivalent valuation. Never fakes a rate - a quote that fails is
// simply left out of the total rather than assumed to be 1:1.
export function useLinkedAccountsTotal(linkedAccounts, walletPrimaryCurrency) {
  const accounts = linkedAccounts || [];
  const sameCurrencyTotal = accounts.reduce((sum, a) => {
    const currency = a?.currency || walletPrimaryCurrency;
    return currency === walletPrimaryCurrency ? sum + (Number(a?.amount) || 0) : sum;
  }, 0);
  const foreignKey = accounts
    .filter((a) => (a?.currency || walletPrimaryCurrency) !== walletPrimaryCurrency)
    .map((a) => `${a?._id}:${a?.amount}:${a?.currency}`)
    .join(",");

  const [total, setTotal] = useState(sameCurrencyTotal);

  useEffect(() => {
    const foreignAccounts = accounts.filter(
      (a) => (a?.currency || walletPrimaryCurrency) !== walletPrimaryCurrency
    );
    if (foreignAccounts.length === 0) {
      setTotal(sameCurrencyTotal);
      return;
    }
    let cancelled = false;
    const toFetch = fetcher();
    (async () => {
      let foreignConverted = 0;
      for (const acc of foreignAccounts) {
        try {
          const res = await toFetch.post("general-data/fx/quote", {
            amountMinor: majorToMinor(acc.amount || 0, acc.currency),
            fromCurrency: acc.currency,
            toCurrency: walletPrimaryCurrency,
          });
          if (res.ok) foreignConverted += minorToMajor(res.data.amountMinor, walletPrimaryCurrency);
        } catch (e) {
          // Silently unavailable - that account is left out of the total.
        }
      }
      if (!cancelled) setTotal(sameCurrencyTotal + foreignConverted);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foreignKey, sameCurrencyTotal, walletPrimaryCurrency]);

  return total;
}
