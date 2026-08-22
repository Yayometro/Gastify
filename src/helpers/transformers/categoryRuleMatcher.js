import { minorToMajor } from "@/lib/money/currencies";

function passesAmountThreshold(nativeMoney, rule) {
  if (!nativeMoney) return true;

  const hasNewMin = rule.minAmountMinor != null;
  const hasNewMax = rule.maxAmountMinor != null;

  if (hasNewMin || hasNewMax) {
    const ruleCurrency = rule.amountCurrency || "MXN";
    if (nativeMoney.currency !== ruleCurrency) return true;

    if (hasNewMin && nativeMoney.amountMinor < rule.minAmountMinor) return false;
    if (hasNewMax && nativeMoney.amountMinor > rule.maxAmountMinor) return false;
    return true;
  }

  const hasLegacyMin = rule.minAmount != null;
  const hasLegacyMax = rule.maxAmount != null;

  if (hasLegacyMin || hasLegacyMax) {
    if (nativeMoney.currency !== "MXN") return true;

    const majorAmount = minorToMajor(nativeMoney.amountMinor, "MXN");
    if (hasLegacyMin && majorAmount < rule.minAmount) return false;
    if (hasLegacyMax && majorAmount > rule.maxAmount) return false;
    return true;
  }

  return true;
}

// Suggests a category/subCategory for a transaction by matching its name against
// a wallet's CategoryRule set. Rules are evaluated from most to least specific
// (highest priority first) so a narrow rule (e.g. "UBER EATS") wins over a broader
// one that would otherwise also match (e.g. "UBER"). First match wins - this is a
// deterministic rule engine, not a scored/fuzzy classifier.
export function suggestCategory(transactionName, nativeMoney, rules) {
  if (!transactionName || !Array.isArray(rules) || rules.length === 0) return null;

  const sorted = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sorted) {
    if (!rule.pattern) continue;

    let regex;
    try {
      regex = new RegExp(rule.pattern, "i");
    } catch (e) {
      continue; // malformed pattern (e.g. a bad manual/learned rule) - skip, don't crash
    }

    if (!regex.test(transactionName)) continue;

    if (!passesAmountThreshold(nativeMoney, rule)) continue;

    return {
      ruleId: rule._id,
      category: rule.category || null,
      subCategory: rule.subCategory || null,
      confidence: rule.confidence || "high",
    };
  }

  return null;
}
