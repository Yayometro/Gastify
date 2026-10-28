export function opportunityPrincipal(amountMinor: number, percent: number): number | null {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0 || !Number.isFinite(percent) || percent < 0 || percent > 1) return null;
  return Math.round(amountMinor * percent);
}

export function compareOpportunityWithGoal(input: { expenseMinor: number; percent: number; targetMinor: number; savedMinor: number }): { principalMinor: number; simulatedSavedMinor: number; simulatedRemainingMinor: number; targetCoverage: number } | null {
  const principalMinor = opportunityPrincipal(input.expenseMinor, input.percent);
  if (principalMinor === null || !Number.isSafeInteger(input.targetMinor) || !Number.isSafeInteger(input.savedMinor) || input.targetMinor < 0 || input.savedMinor < 0) return null;
  const simulatedSavedMinor = input.savedMinor + principalMinor;
  return { principalMinor, simulatedSavedMinor, simulatedRemainingMinor: Math.max(0, input.targetMinor - simulatedSavedMinor), targetCoverage: input.targetMinor > 0 ? simulatedSavedMinor / input.targetMinor : 0 };
}
