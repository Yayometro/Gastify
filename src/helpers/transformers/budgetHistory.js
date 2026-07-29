// Resolves which history[] entry (of a Budget or IncomeSource) was active at a given date.
// Both models version changes the same way: an append-only list of
// {..., effectiveFrom, effectiveTo} entries, with effectiveTo: null meaning "still active".
export function getValueActiveInMonth(historyArray, monthStart) {
  if (!Array.isArray(historyArray) || historyArray.length === 0) return null;
  const candidates = historyArray.filter((entry) => {
    const from = new Date(entry.effectiveFrom);
    const to = entry.effectiveTo ? new Date(entry.effectiveTo) : null;
    return from <= monthStart && (!to || to > monthStart);
  });
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, entry) =>
    new Date(entry.effectiveFrom) > new Date(latest.effectiveFrom) ? entry : latest
  );
}

// Color for a Budget's progress bar. `ratio` = actual/goal.
// Spending budgets: high ratio is bad (near/over the ceiling) -> green to red.
// Saving budgets: high ratio is good (goal met/exceeded) -> mirrored, red to green.
export function getBudgetBarColor(ratio, isSaving) {
  const safeRatio = Number.isFinite(ratio) ? ratio : 0;
  if (isSaving) {
    if (safeRatio >= 0.85) return "#4CAF50"; // green
    if (safeRatio >= 0.6) return "#FFD633"; // yellow
    if (safeRatio >= 0.3) return "#FF9800"; // orange
    return "#F4664A"; // red
  }
  if (safeRatio > 1) return "#F4664A"; // red
  if (safeRatio >= 0.85) return "#FF9800"; // orange
  if (safeRatio >= 0.6) return "#FFD633"; // yellow
  return "#4CAF50"; // green
}
