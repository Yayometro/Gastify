// Changing the currency of movements. A movement's currency is the currency of its account, so a change needs a
// destination account in that currency — unless the movement has no account at all, which only converts the amount.
// Pure: the server applies the plan and the app shows it (what changes, and what is blocked and why).

export interface CurrencyChangeRow {
  id: string;
  name: string;
  // The account the movement has now (null when it has none) and that account's currency.
  accountCurrency: string | null;
}

export interface CurrencyChangeDestination {
  id: string;
  currency: string;
}

export interface CurrencyChangeBlocked {
  id: string;
  name: string;
  accountCurrency: string;
  reason: string;
}

export interface CurrencyChangePlan {
  ready: string[];
  blocked: CurrencyChangeBlocked[];
}

// A movement can change to `target` when the account it ends in has that currency: the destination chosen in the
// change, or else the account it has now. A movement with no account at all can always convert.
export function planCurrencyChange(rows: CurrencyChangeRow[], target: string, destination: CurrencyChangeDestination | null = null): CurrencyChangePlan {
  const plan: CurrencyChangePlan = { ready: [], blocked: [] };
  for (const row of rows) {
    const endCurrency = destination ? destination.currency : row.accountCurrency;
    if (!endCurrency || endCurrency === target) {
      plan.ready.push(row.id);
      continue;
    }
    plan.blocked.push({ id: row.id, name: row.name, accountCurrency: endCurrency, reason: `Su cuenta está en ${endCurrency}, no en ${target}. Cambia la cuenta o no se modifica.` });
  }
  return plan;
}
