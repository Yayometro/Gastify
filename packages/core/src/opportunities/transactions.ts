import type { OpportunityDateRange, OpportunityFilters, OpportunitySelection } from "./types";

export interface OpportunityTransaction {
  _id?: string;
  name?: string;
  date?: string | Date;
  isBill?: boolean;
  isIncome?: boolean;
  kind?: string;
  state?: string;
  category?: unknown;
  subCategory?: unknown;
  tags?: unknown[];
  budget?: unknown;
  displayMoney?: { primary?: { amountMinor?: number; currency?: string; stale?: boolean } | null };
  money?: unknown;
  amount?: number;
}

const refId = (value: unknown): string => String((value as { _id?: unknown } | null)?.['_id'] ?? value ?? "");
const day = (value: unknown): string | null => {
  const parsed = value instanceof Date ? value : new Date(String(value || ""));
  return Number.isNaN(parsed.getTime()) ? null : `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-${String(parsed.getUTCDate()).padStart(2, "0")}`;
};
const fold = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export interface OpportunityScanResult {
  amountMinor: number;
  refundMinor: number;
  feeMinor: number;
  missingFxCount: number;
  excludedCount: number;
  unmatchedRefundCount: number;
  staleFxCount: number;
  count: number;
  transactionIds: string[];
}

export interface OpportunityMoney {
  amountMinor: number;
  currency: string;
  stale: boolean;
}

/** Prefer a fresh primary/reporting value; expose stale conversions instead of hiding their age. */
export function resolveOpportunityMoney(tx: OpportunityTransaction, primaryCurrency?: string): OpportunityMoney | null {
  const primary = tx.displayMoney?.primary;
  const rawReporting = (tx.money as { reporting?: unknown } | null | undefined)?.reporting;
  const reporting = rawReporting && typeof rawReporting === "object"
    ? rawReporting as { amountMinor?: unknown; currency?: unknown }
    : null;
  if (!primaryCurrency) {
    const value = primary || reporting;
    if (!value || typeof value.amountMinor !== "number" || !Number.isSafeInteger(value.amountMinor) || typeof value.currency !== "string" || !value.currency) return null;
    return { amountMinor: value.amountMinor, currency: value.currency, stale: Boolean("stale" in value && value.stale) };
  }

  if (primary?.currency === primaryCurrency && !primary.stale && typeof primary.amountMinor === "number" && Number.isSafeInteger(primary.amountMinor)) {
    return { amountMinor: primary.amountMinor, currency: primaryCurrency, stale: false };
  }
  if (reporting?.currency === primaryCurrency && typeof reporting.amountMinor === "number" && Number.isSafeInteger(reporting.amountMinor)) {
    return { amountMinor: reporting.amountMinor, currency: primaryCurrency, stale: false };
  }
  if (primary?.currency === primaryCurrency && typeof primary.amountMinor === "number" && Number.isSafeInteger(primary.amountMinor)) {
    return { amountMinor: primary.amountMinor, currency: primaryCurrency, stale: Boolean(primary.stale) };
  }
  return null;
}

export function scanOpportunityTransactions(transactions: OpportunityTransaction[], filters: OpportunityFilters, range: OpportunityDateRange): OpportunityScanResult {
  const selected = new Set<string>();
  let amountMinor = 0;
  let refundMinor = 0;
  let feeMinor = 0;
  let missingFxCount = 0;
  let staleFxCount = 0;
  let excludedCount = 0;
  let unmatchedRefundCount = 0;
  const lower = range.startDate;
  const upper = range.endDate;
  const query = fold(filters.conceptQuery || "").trim();
  const hasExplicitFilters = Boolean(filters.includeAllExpenses || filters.categoryIds?.length || filters.subCategoryIds?.length || filters.tagIds?.length || query);

  for (const tx of transactions) {
    const id = refId(tx._id);
    const date = day(tx.date);
    // A missing/out-of-range date is normal for this filter, not an excluded
    // movement. Only count records inside the requested range that fail a rule.
    if (!id || !date || date < lower || date > upper) continue;
    if (tx.state && !["completed"].includes(tx.state)) { excludedCount += 1; continue; }
    const kind = tx.kind || (tx.isIncome ? "income" : tx.isBill ? "expense" : "income");
    if (!["expense", "refund", "fee"].includes(kind)) { excludedCount += 1; continue; }
    const cats = (filters.categoryIds || []).map(String);
    const subs = (filters.subCategoryIds || []).map(String);
    const tags = (filters.tagIds || []).map(String);
    if (cats.length && !cats.includes(refId(tx.category))) continue;
    if (subs.length && !subs.includes(refId(tx.subCategory))) continue;
    if (tags.length && !tags.some(tag => (tx.tags || []).some(item => refId(item) === tag))) continue;
    if (query && !fold(tx.name || "").includes(query)) continue;
    if (!hasExplicitFilters) { excludedCount += 1; continue; }

    selected.add(id);
    const reporting = resolveOpportunityMoney(tx, filters.primaryCurrency);
    if (!reporting) { missingFxCount += 1; continue; }
    if (reporting.stale) staleFxCount += 1;
    const amount = Math.abs(Math.trunc(reporting.amountMinor));
    if (kind === "refund") { refundMinor += amount; unmatchedRefundCount += 1; }
    else if (kind === "fee") feeMinor += amount;
    else amountMinor += amount;
  }
  return { amountMinor, refundMinor, feeMinor, missingFxCount, staleFxCount, excludedCount, unmatchedRefundCount, count: selected.size, transactionIds: [...selected] };
}

export function summarizeOpportunitySelection(input: {
  id: string; name: string; dimension: OpportunitySelection["dimension"]; transactions: OpportunityTransaction[];
  range: OpportunityDateRange; primaryCurrency: string; filters: OpportunityFilters;
}): OpportunitySelection & OpportunityScanResult {
  const result = scanOpportunityTransactions(input.transactions, input.filters, input.range);
  const byId = new Map(input.transactions.map(tx => [refId(tx._id), tx]));
  const ids = result.transactionIds.filter(id => byId.has(id));
  return { ...result, id: input.id, name: input.name, dimension: input.dimension, amountMinor: result.amountMinor, currency: input.primaryCurrency, transactionIds: ids, count: ids.length, partial: result.missingFxCount > 0 || !input.range.complete, range: input.range };
}
