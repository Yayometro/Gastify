"use client";

import { useEffect, useState } from "react";
import fetcher from "@/helpers/fetcher";
import { majorToMinor } from "@/lib/money/currencies";

const DEBOUNCE_MS = 500;

// Given a raw account-native major amount, the Account's currency, and the
// Wallet's primary currency, returns a debounced live FX quote to preview as
// a non-editable "≈ X" estimate below the Amount field. Returns null (and
// renders nothing) whenever a quote isn't needed or isn't available - never
// fakes an equivalent.
export default function useTransactionAmountEquivalent({ amount, accountCurrency, walletPrimaryCurrency }) {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    setQuote(null);
    const numericAmount = Number(amount);
    if (!accountCurrency || !walletPrimaryCurrency) return;
    if (accountCurrency === walletPrimaryCurrency) return;
    if (!Number.isFinite(numericAmount) || numericAmount === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const toFetch = fetcher();
        const amountMinor = majorToMinor(numericAmount, accountCurrency);
        const res = await toFetch.post("general-data/fx/quote", {
          amountMinor,
          fromCurrency: accountCurrency,
          toCurrency: walletPrimaryCurrency,
        });
        if (!cancelled && res.ok) setQuote(res.data);
      } catch (e) {
        // Silently unavailable - the form just omits the equivalent line.
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount, accountCurrency, walletPrimaryCurrency]);

  return quote;
}
