import { minorToMajor } from "@/lib/money/currencies";

export interface NativeMoneyInput {
  amountMinor?: number | null;
  currency?: string | null;
  [key: string]: unknown;
}

export interface CategoryRuleCategoryRef {
  _id?: string | unknown;
  name?: string | null;
  icon?: string | null;
  color?: string | null;
  [key: string]: unknown;
}

export interface CategoryRuleLike {
  _id?: string | unknown;
  pattern?: string | null;
  priority?: number | null;
  category?: CategoryRuleCategoryRef | unknown;
  subCategory?: CategoryRuleCategoryRef | unknown;
  confidence?: string | null;
  minAmountMinor?: number | null;
  maxAmountMinor?: number | null;
  amountCurrency?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  [key: string]: unknown;
}

export interface CategorySuggestionResult<C = CategoryRuleCategoryRef> {
  ruleId?: string | unknown;
  category: C | null;
  subCategory: C | null;
  confidence: string;
}

function passesAmountThreshold(nativeMoney?: NativeMoneyInput | null, rule?: CategoryRuleLike): boolean {
  if (!nativeMoney) return true;

  const hasNewMin = rule.minAmountMinor != null;
  const hasNewMax = rule.maxAmountMinor != null;

  if (hasNewMin || hasNewMax) {
    const ruleCurrency = rule.amountCurrency || "MXN";
    if (nativeMoney.currency !== ruleCurrency) return true;

    if (hasNewMin && (nativeMoney.amountMinor as number) < (rule.minAmountMinor as number)) return false;
    if (hasNewMax && (nativeMoney.amountMinor as number) > (rule.maxAmountMinor as number)) return false;
    return true;
  }

  const hasLegacyMin = rule.minAmount != null;
  const hasLegacyMax = rule.maxAmount != null;

  if (hasLegacyMin || hasLegacyMax) {
    if (nativeMoney.currency !== "MXN") return true;

    const majorAmount = minorToMajor(nativeMoney.amountMinor as number, "MXN");
    if (hasLegacyMin && majorAmount < (rule.minAmount as number)) return false;
    if (hasLegacyMax && majorAmount > (rule.maxAmount as number)) return false;
    return true;
  }

  return true;
}

// Suggests a category/subCategory for a transaction by matching its name against
// a wallet's CategoryRule set. Rules are evaluated from most to least specific
// (highest priority first) so a narrow rule (e.g. "UBER EATS") wins over a broader
// one that would otherwise also match (e.g. "UBER"). First match wins - this is a
// deterministic rule engine, not a scored/fuzzy classifier.
export function suggestCategory<R extends CategoryRuleLike = CategoryRuleLike, C = CategoryRuleCategoryRef>(
  transactionName?: string | null,
  nativeMoney?: NativeMoneyInput | null,
  rules?: R[] | null
): CategorySuggestionResult<C> | null {
  if (!transactionName || !Array.isArray(rules) || rules.length === 0) return null;

  const sorted = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sorted) {
    if (!rule.pattern) continue;

    let regex: RegExp;
    try {
      regex = new RegExp(rule.pattern, "i");
    } catch {
      continue; // malformed pattern (e.g. a bad manual/learned rule) - skip, don't crash
    }

    if (!regex.test(transactionName)) continue;

    if (!passesAmountThreshold(nativeMoney, rule)) continue;

    return {
      ruleId: rule._id,
      category: (rule.category as unknown as C) || null,
      subCategory: (rule.subCategory as unknown as C) || null,
      confidence: rule.confidence || "high",
    };
  }

  return null;
}
