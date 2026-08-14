// Suggests a category/subCategory for a transaction by matching its name against
// a wallet's CategoryRule set. Rules are evaluated from most to least specific
// (highest priority first) so a narrow rule (e.g. "UBER EATS") wins over a broader
// one that would otherwise also match (e.g. "UBER"). First match wins - this is a
// deterministic rule engine, not a scored/fuzzy classifier.
export function suggestCategory(transactionName, amount, rules) {
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

    if (rule.minAmount !== undefined && rule.minAmount !== null && amount < rule.minAmount) continue;
    if (rule.maxAmount !== undefined && rule.maxAmount !== null && amount > rule.maxAmount) continue;

    return {
      ruleId: rule._id,
      category: rule.category || null,
      subCategory: rule.subCategory || null,
      confidence: rule.confidence || "high",
    };
  }

  return null;
}
