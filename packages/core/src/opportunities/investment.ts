const YEAR_DAYS = 365;

export interface InvestmentProjection {
  principalMinor: number;
  valueMinor: number;
  returnMinor: number;
  currency: string;
  annualEffectiveRate: number;
  days: number;
  asOf: string;
  method: "single_deposit" | "dated_expenses";
}

export function projectSingleDeposit(input: { principalMinor: number; currency: string; annualEffectiveRate: number; years: number; asOf: string }): InvestmentProjection | null {
  const { principalMinor, currency, annualEffectiveRate, years, asOf } = input;
  if (!Number.isSafeInteger(principalMinor) || principalMinor < 0 || !currency || !Number.isFinite(annualEffectiveRate) || annualEffectiveRate <= -1 || !Number.isFinite(years) || years < 0) return null;
  const value = Math.round(principalMinor * Math.pow(1 + annualEffectiveRate, years));
  if (!Number.isSafeInteger(value)) return null;
  return { principalMinor, valueMinor: value, returnMinor: value - principalMinor, currency, annualEffectiveRate, days: Math.round(years * YEAR_DAYS), asOf, method: "single_deposit" };
}

export function projectDatedExpenses(input: { expenses: { amountMinor: number; date: string }[]; currency: string; annualEffectiveRate: number; asOf: string }): InvestmentProjection | null {
  const asOf = new Date(`${input.asOf}T00:00:00.000Z`);
  if (Number.isNaN(asOf.getTime()) || !input.currency || !Number.isFinite(input.annualEffectiveRate) || input.annualEffectiveRate <= -1) return null;
  let principalMinor = 0;
  let value = 0;
  for (const expense of input.expenses) {
    const amount = Math.abs(Math.trunc(expense.amountMinor));
    const date = new Date(`${expense.date}T00:00:00.000Z`);
    if (!Number.isSafeInteger(amount) || Number.isNaN(date.getTime()) || date > asOf) return null;
    principalMinor += amount;
    value += amount * Math.pow(1 + input.annualEffectiveRate, (asOf.getTime() - date.getTime()) / 86_400_000 / YEAR_DAYS);
  }
  const valueMinor = Math.round(value);
  if (!Number.isSafeInteger(principalMinor) || !Number.isSafeInteger(valueMinor)) return null;
  return { principalMinor, valueMinor, returnMinor: valueMinor - principalMinor, currency: input.currency, annualEffectiveRate: input.annualEffectiveRate, days: 0, asOf: input.asOf, method: "dated_expenses" };
}
