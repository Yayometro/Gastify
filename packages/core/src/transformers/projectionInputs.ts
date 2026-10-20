import { majorToMinor, minorToMajor } from "../money/currencies";
import type { RatesToPrimary } from "./budgetCurrency";

// The projection math only works with numbers in the wallet's main currency. Income sources and the
// baseline entries are entered in their own currency, so they are converted with the exchange rates
// (1 unit of each currency in the main one) before the table is built, like the web does with live quotes.
// A currency with no rate yet is left unconverted and reported, never invented.

interface MoneyLike {
  amountMinor: number;
  currency: string;
}

export interface BaselineEntryLike {
  incomeMoney?: MoneyLike | null;
  expenseMoney?: MoneyLike | null;
  [key: string]: unknown;
}

export interface BaselineLike {
  incomeHistory?: BaselineEntryLike[];
  expenseHistory?: BaselineEntryLike[];
  [key: string]: unknown;
}

export function foreignCurrenciesOf(
  sources: { currency?: string }[] | null | undefined,
  baseline: BaselineLike | null | undefined,
  primary: string
): string[] {
  const found = new Set<string>();
  for (const source of sources ?? []) if (source.currency && source.currency !== primary) found.add(source.currency);
  for (const entry of [...(baseline?.incomeHistory ?? []), ...(baseline?.expenseHistory ?? [])]) {
    for (const money of [entry.incomeMoney, entry.expenseMoney]) if (money?.currency && money.currency !== primary) found.add(money.currency);
  }
  return [...found];
}

export function convertSourcesToPrimary<S extends { amount?: number; currency?: string }>(
  sources: S[] | null | undefined,
  primary: string,
  rates: RatesToPrimary
): { sources: S[]; missing: string[] } {
  const missing = new Set<string>();
  const converted = (sources ?? []).map((source) => {
    const currency = source.currency || primary;
    if (currency === primary) return source;
    const rate = rates[currency];
    if (!rate || rate <= 0) {
      missing.add(currency);
      return source;
    }
    return { ...source, amount: Math.round((Number(source.amount) || 0) * rate * 100) / 100 };
  });
  return { sources: converted, missing: [...missing] };
}

function convertMoney(money: MoneyLike | null | undefined, primary: string, rates: RatesToPrimary, missing: Set<string>): MoneyLike | null | undefined {
  if (!money || money.currency === primary) return money;
  const rate = rates[money.currency];
  if (!rate || rate <= 0) {
    missing.add(money.currency);
    return money;
  }
  return { amountMinor: majorToMinor(minorToMajor(money.amountMinor, money.currency) * rate, primary), currency: primary };
}

export function convertBaselineToPrimary<B extends BaselineLike>(
  baseline: B | null | undefined,
  primary: string,
  rates: RatesToPrimary
): { baseline: B | null | undefined; missing: string[] } {
  if (!baseline) return { baseline, missing: [] };
  const missing = new Set<string>();
  const convert = (entries: BaselineEntryLike[] | undefined) =>
    (entries ?? []).map((entry) => ({
      ...entry,
      incomeMoney: convertMoney(entry.incomeMoney, primary, rates, missing),
      expenseMoney: convertMoney(entry.expenseMoney, primary, rates, missing),
    }));
  return {
    baseline: { ...baseline, incomeHistory: convert(baseline.incomeHistory), expenseHistory: convert(baseline.expenseHistory) },
    missing: [...missing],
  };
}
