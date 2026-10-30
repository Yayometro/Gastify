// Budgets keep their own `currency` label next to a bare `goalAmount` (and
// `savingAmount`, and the same two fields inside every `history[]` entry), but
// every report compares them against transactions already expressed in the
// Wallet's primary currency. This file converts a budget's numbers into the
// primary currency so those comparisons are apples-to-apples. Pure math only:
// rates are fetched elsewhere (see useBudgetsInPrimaryCurrency).

import { getMinorUnits } from "@gastify/core/money/currencies";
import { convertMinorAtRate } from "@gastify/core/money/conversion";
import type { GoalDetails } from "@gastify/core/goals/types";

// Currency units of the target per ONE unit of the source (major units), keyed
// by the source currency: { USD: 18.2 } means 1 USD = 18.2 primary units.
export type RatesToPrimary = Record<string, number | undefined>;

interface BudgetHistoryLike {
  goalAmount?: number;
  savingAmount?: number;
  [key: string]: unknown;
}

export interface BudgetWithCurrency {
  currency?: string;
  goalAmount?: number;
  savingAmount?: number;
  history?: BudgetHistoryLike[];
  goalDetails?: GoalDetails;
  [key: string]: unknown;
}

export type ConvertedBudget<T extends BudgetWithCurrency> = T & {
  // The budget exactly as stored, so editors/forms can keep working in the
  // currency the user typed the numbers in.
  originalBudget?: T;
  // True when the budget is in another currency and no rate was available:
  // its numbers are left as stored and must not be trusted as primary-currency.
  conversionUnavailable?: boolean;
};

function roundToCurrency(value: number, currency: string): number {
  const factor = 10 ** getMinorUnits(currency);
  return Math.round(value * factor) / factor;
}

function convertAmount(value: number | undefined, rate: number, primary: string): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  return roundToCurrency(value * rate, primary);
}

function convertGoalMoney(money: { amountMinor: number; currency: string } | undefined, source: string, rate: number, primary: string): { value: { amountMinor: number; currency: string } | undefined; unavailable: boolean } {
  if (!money) return { value: money, unavailable: false };
  // The quoted rate belongs to the Budget's currency. A mismatched embedded
  // currency cannot be safely converted with it, so keep it visible but mark
  // the whole goal unavailable for comparisons until the user reviews it.
  if (money.currency !== source || !Number.isSafeInteger(money.amountMinor)) return { value: money, unavailable: true };
  return {
    value: { amountMinor: convertMinorAtRate({ amountMinor: money.amountMinor, fromCurrency: source, toCurrency: primary, rate }), currency: primary },
    unavailable: false,
  };
}

export function getForeignBudgetCurrencies(budgets: BudgetWithCurrency[] | null | undefined, primaryCurrency: string): string[] {
  const found = new Set<string>();
  for (const b of budgets || []) {
    if (b?.currency && b.currency !== primaryCurrency) found.add(b.currency);
  }
  return [...found];
}

export function convertBudgetToPrimary<T extends BudgetWithCurrency>(
  budget: T,
  primaryCurrency: string,
  rates: RatesToPrimary | null | undefined
): ConvertedBudget<T> {
  const from = budget?.currency;
  if (!from || from === primaryCurrency) {
    const details = budget.goalDetails;
    const mismatch = Boolean(details && (
      (details.assetPriceMoney && details.assetPriceMoney.currency !== (from || primaryCurrency)) ||
      (details.schedule?.fixedContributionMoney && details.schedule.fixedContributionMoney.currency !== (from || primaryCurrency))
    ));
    return mismatch ? { ...budget, conversionUnavailable: true } : budget;
  }

  const rate = rates?.[from];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    return { ...budget, conversionUnavailable: true };
  }

  const assetPrice = convertGoalMoney(budget.goalDetails?.assetPriceMoney, from, rate, primaryCurrency);
  const fixedContribution = convertGoalMoney(budget.goalDetails?.schedule?.fixedContributionMoney, from, rate, primaryCurrency);
  const goalMoneyUnavailable = assetPrice.unavailable || fixedContribution.unavailable;
  return {
    ...budget,
    currency: primaryCurrency,
    goalAmount: convertAmount(budget.goalAmount, rate, primaryCurrency),
    savingAmount: convertAmount(budget.savingAmount, rate, primaryCurrency),
    history: Array.isArray(budget.history)
      ? budget.history.map((entry) => ({
          ...entry,
          goalAmount: convertAmount(entry.goalAmount, rate, primaryCurrency),
          savingAmount: convertAmount(entry.savingAmount, rate, primaryCurrency),
        }))
      : budget.history,
    conversionUnavailable: goalMoneyUnavailable || undefined,
    goalDetails: budget.goalDetails ? {
      ...budget.goalDetails,
      ...(budget.goalDetails.assetPriceMoney ? { assetPriceMoney: assetPrice.value } : {}),
      ...(budget.goalDetails.schedule?.fixedContributionMoney ? {
        schedule: {
          ...budget.goalDetails.schedule,
          fixedContributionMoney: fixedContribution.value,
        },
      } : {}),
    } : budget.goalDetails,
    originalBudget: budget,
  };
}

export function convertBudgetsToPrimary<T extends BudgetWithCurrency>(
  budgets: T[] | null | undefined,
  primaryCurrency: string,
  rates: RatesToPrimary | null | undefined
): ConvertedBudget<T>[] {
  return (budgets || []).map((b) => convertBudgetToPrimary(b, primaryCurrency, rates));
}

// Gives the editor the budget as stored (undoing convertBudgetToPrimary).
export function getStoredBudget<T extends BudgetWithCurrency>(budget: ConvertedBudget<T> | T): T {
  return (budget as ConvertedBudget<T>).originalBudget ?? (budget as T);
}
