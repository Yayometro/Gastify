import { majorToMinor } from "../money/currencies";
import { getExplicitBudgetId, isSpendingBudget } from "../transformers/budgetTypes";
import { getValueActiveInMonth } from "../transformers/budgetHistory";
import { resolveOpportunityMoney, type OpportunityTransaction } from "./transactions";
import type { OpportunityDateRange } from "./types";

type Ref = { _id?: unknown } | string | null | undefined;
type Entry = { category?: unknown; subCategory?: unknown };
export interface OverageBudget {
  _id?: unknown;
  name?: string;
  budgetType?: string;
  isSaving?: boolean;
  archived?: boolean;
  conversionUnavailable?: boolean;
  period?: string;
  goalAmount?: number;
  category?: unknown;
  subCategory?: unknown;
  categories?: Entry[];
  history?: { goalAmount?: number; effectiveFrom?: Date | string | null; effectiveTo?: Date | string | null }[];
}
export interface BudgetOverageCycle {
  key: string;
  budgetId: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  spentMinor: number;
  limitMinor: number;
  overageMinor: number;
  transactionIds: string[];
}
export interface BudgetOverageResult {
  amountMinor: number;
  cycles: BudgetOverageCycle[];
  conflictCount: number;
  missingFxCount: number;
}

const id = (ref: Ref | unknown): string => String((ref as { _id?: unknown } | null)?._id ?? ref ?? "");
const iso = (date: Date): string => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
const parseDay = (value: unknown): string | null => {
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : iso(date);
};
const periodBounds = (day: string, period: string): [string, string] => {
  const [year, month] = day.split("-").map(Number);
  const startMonth = period === "yearly" ? 0 : period === "biannual" ? Math.floor((month - 1) / 6) * 6 : period === "quarterly" ? Math.floor((month - 1) / 3) * 3 : month - 1;
  const duration = period === "yearly" ? 12 : period === "biannual" ? 6 : period === "quarterly" ? 3 : 1;
  return [iso(new Date(Date.UTC(year, startMonth, 1))), iso(new Date(Date.UTC(year, startMonth + duration, 0)))];
};
const specificity = (tx: OpportunityTransaction, budget: OverageBudget): number => {
  const entries = budget.categories?.length ? budget.categories : [{ category: budget.category, subCategory: budget.subCategory }];
  return Math.max(0, ...entries.map((entry) => {
    if (entry.subCategory && id(entry.subCategory) === id(tx.subCategory)) return 2;
    if (!entry.subCategory && entry.category && id(entry.category) === id(tx.category)) return 1;
    return 0;
  }));
};

/** Conservative opportunity estimate: only whole budget cycles within the selected range. */
export function calculateBudgetOverage(input: { transactions: OpportunityTransaction[]; budgets: OverageBudget[]; range: OpportunityDateRange; currency: string }): BudgetOverageResult {
  const budgets = input.budgets.filter((budget) => !budget.archived && !budget.conversionUnavailable && isSpendingBudget(budget));
  const cycles = new Map<string, BudgetOverageCycle>();
  const seenTransactions = new Set<string>();
  let conflictCount = 0;
  let missingFxCount = 0;

  for (const tx of input.transactions) {
    const transactionId = id(tx._id);
    if (!transactionId || seenTransactions.has(transactionId)) continue;
    const day = parseDay(tx.date);
    if (!day || day < input.range.startDate || day > input.range.endDate || (tx.state && tx.state !== "completed")) continue;
    const kind = tx.kind || (tx.isBill ? "expense" : "income");
    if (kind !== "expense") continue;
    seenTransactions.add(transactionId);

    const explicit = getExplicitBudgetId(tx);
    // An explicit project/saving link claims this expense even though it is
    // not an eligible spending budget. Never reassign it by category.
    if (explicit && !budgets.some((budget) => id(budget._id) === explicit)) continue;
    const candidates = budgets.map((budget, index) => ({ budget, index, score: explicit ? (id(budget._id) === explicit ? 3 : 0) : specificity(tx, budget) }))
      .filter((candidate) => candidate.score > 0)
      .filter((candidate) => { const [start] = periodBounds(day, candidate.budget.period || "monthly"); return start >= input.range.startDate; });
    if (!candidates.length) continue;
    if (candidates.length > 1) conflictCount += 1;
    candidates.sort((a, b) => b.score - a.score || a.index - b.index);
    const budget = candidates[0].budget;
    const money = resolveOpportunityMoney(tx, input.currency);
    if (!money || money.currency !== input.currency) { missingFxCount += 1; continue; }
    const [start, end] = periodBounds(day, budget.period || "monthly");
    const key = `${id(budget._id)}:${start}`;
    let cycle = cycles.get(key);
    if (!cycle) {
      const history = getValueActiveInMonth(budget.history, new Date(`${start}T00:00:00.000Z`));
      const limit = history?.goalAmount ?? budget.goalAmount ?? 0;
      cycle = { key, budgetId: id(budget._id), name: budget.name || "", periodStart: start, periodEnd: end, spentMinor: 0, limitMinor: majorToMinor(Math.max(0, limit), input.currency), overageMinor: 0, transactionIds: [] };
      cycles.set(key, cycle);
    }
    cycle.spentMinor += Math.abs(money.amountMinor);
    cycle.transactionIds.push(transactionId);
  }
  const overages = [...cycles.values()].map((cycle) => ({ ...cycle, overageMinor: Math.max(0, cycle.spentMinor - cycle.limitMinor) })).filter((cycle) => cycle.overageMinor > 0).sort((a, b) => b.overageMinor - a.overageMinor);
  return { amountMinor: overages.reduce((sum, cycle) => sum + cycle.overageMinor, 0), cycles: overages, conflictCount, missingFxCount };
}
