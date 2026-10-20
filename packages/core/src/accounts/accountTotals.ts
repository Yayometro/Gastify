import type { RatesToPrimary } from "../transformers/budgetCurrency";

// Balances of the accounts. An account's amount is in its own currency; to add accounts up they
// are converted with the same exchange rates the budgets use (1 unit of the currency in the primary).

export interface AccountBalanceLike {
  _id?: string;
  amount?: number | string | null;
  currency?: string | null;
}

// The sum per currency, for an account list that mixes currencies.
export function balancesByCurrency(accounts: AccountBalanceLike[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const account of accounts) {
    const currency = account.currency || "MXN";
    totals[currency] = Math.round(((totals[currency] ?? 0) + (Number(account.amount) || 0)) * 100) / 100;
  }
  return totals;
}

export interface PrimaryTotal {
  total: number;
  // Currencies that had no rate yet: their accounts are left out of the total.
  missingCurrencies: string[];
}

export function totalInPrimary(accounts: AccountBalanceLike[], primary: string, rates: RatesToPrimary): PrimaryTotal {
  let total = 0;
  const missing = new Set<string>();
  for (const account of accounts) {
    const currency = account.currency || primary;
    const amount = Number(account.amount) || 0;
    if (currency === primary) {
      total += amount;
      continue;
    }
    const rate = rates[currency];
    if (rate && rate > 0) total += amount * rate;
    else missing.add(currency);
  }
  return { total: Math.round(total * 100) / 100, missingCurrencies: [...missing] };
}
