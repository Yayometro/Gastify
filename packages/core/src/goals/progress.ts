import type { GoalDetails } from "./types";

export type GoalFundingStatus = "complete" | "partial_fx" | "manual" | "shared_legacy" | "unavailable";

/** Only balances that can represent cash/assets count toward a savings goal. */
export function isEligibleGoalFundingAccountType(accountType: string | null | undefined): boolean {
  return accountType == null || ["debit", "cash", "savings"].includes(accountType);
}

export interface GoalProgressInput {
  targetMinor: number;
  currency: string;
  manualSavedMinor?: number;
  manualSavedAsOf?: string | null;
  linkedAccountIds?: string[];
  accountBalances?: Array<{ id: string; amountMinor: number; currency: string; primaryAmountMinor?: number | null }>;
  details: GoalDetails;
  legacyOverlaps?: string[];
}

export interface GoalProgress {
  targetMinor: number;
  savedMinor: number;
  remainingMinor: number;
  ratio: number;
  currency: string;
  status: GoalFundingStatus;
  source: "manual" | "accounts";
  asOf: string | null;
  missingCurrencies: string[];
  conflictingBudgets: string[];
}

export function findOverlappingSavingAccounts(budgets: Array<{ id: string; name?: string; linkedAccountIds: string[] }>): Map<string, { accountIds: string[]; otherNames: string[] }> {
  const owners = new Map<string, Set<string>>();
  const names = new Map(budgets.map((budget) => [budget.id, budget.name?.trim() || budget.id]));
  for (const budget of budgets) {
    for (const accountId of new Set(budget.linkedAccountIds.filter(Boolean))) {
      const accountOwners = owners.get(accountId) || new Set<string>();
      accountOwners.add(budget.id);
      owners.set(accountId, accountOwners);
    }
  }

  const conflicts = new Map<string, { accountIds: string[]; otherNames: string[] }>();
  for (const budget of budgets) {
    const otherIds = new Set<string>();
    const accountIds: string[] = [];
    for (const accountId of new Set(budget.linkedAccountIds.filter(Boolean))) {
      const accountOwners = owners.get(accountId);
      if (!accountOwners || accountOwners.size < 2) continue;
      accountIds.push(accountId);
      for (const ownerId of accountOwners) if (ownerId !== budget.id) otherIds.add(ownerId);
    }
    if (accountIds.length) conflicts.set(budget.id, { accountIds, otherNames: [...otherIds].map((id) => names.get(id) || id) });
  }
  return conflicts;
}

export function getGoalProgress(input: GoalProgressInput): GoalProgress {
  const linked = input.linkedAccountIds || [];
  const conflicts = input.legacyOverlaps || [];
  if (conflicts.length) return { targetMinor: input.targetMinor, savedMinor: 0, remainingMinor: input.targetMinor, ratio: 0, currency: input.currency, status: "shared_legacy", source: linked.length ? "accounts" : "manual", asOf: null, missingCurrencies: [], conflictingBudgets: conflicts };
  if (!linked.length) {
    const saved = Math.max(0, Math.trunc(input.manualSavedMinor || 0));
    return { targetMinor: input.targetMinor, savedMinor: saved, remainingMinor: Math.max(0, input.targetMinor - saved), ratio: input.targetMinor > 0 ? saved / input.targetMinor : 0, currency: input.currency, status: "manual", source: "manual", asOf: input.manualSavedAsOf || null, missingCurrencies: [], conflictingBudgets: [] };
  }
  const byId = new Map((input.accountBalances || []).map((account) => [account.id, account]));
  let total = 0;
  const missing = new Set<string>();
  for (const id of linked) {
    const account = byId.get(id);
    if (!account) { missing.add("account"); continue; }
    if (account.primaryAmountMinor === null || account.primaryAmountMinor === undefined) { missing.add(account.currency); continue; }
    total += Math.trunc(account.primaryAmountMinor);
  }
  const saved = Math.max(0, total);
  return { targetMinor: input.targetMinor, savedMinor: saved, remainingMinor: Math.max(0, input.targetMinor - saved), ratio: input.targetMinor > 0 ? saved / input.targetMinor : 0, currency: input.currency, status: missing.size ? "partial_fx" : "complete", source: "accounts", asOf: null, missingCurrencies: [...missing], conflictingBudgets: [] };
}

export function goalScenarioProgress(targetMinor: number, savedMinor: number, scenarioMinor: number): { simulatedSavedMinor: number; simulatedRemainingMinor: number; percentageOfTarget: number } {
  const simulatedSavedMinor = Math.max(0, savedMinor) + Math.max(0, scenarioMinor);
  return { simulatedSavedMinor, simulatedRemainingMinor: Math.max(0, targetMinor - simulatedSavedMinor), percentageOfTarget: targetMinor > 0 ? simulatedSavedMinor / targetMinor : 0 };
}
