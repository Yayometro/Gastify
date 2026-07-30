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
// Saving budgets: high ratio is good -> red (far from goal) to green (getting
// close) to a rich blue (at/very close to the goal).
export function getBudgetBarColor(ratio, isSaving) {
  const safeRatio = Number.isFinite(ratio) ? ratio : 0;
  if (isSaving) {
    if (safeRatio >= 0.85) return "#2962FF"; // blue - at/very close to goal
    if (safeRatio >= 0.35) return "#4CAF50"; // green - getting close
    return "#F4664A"; // red - far from goal
  }
  if (safeRatio > 1) return "#F4664A"; // red
  if (safeRatio >= 0.85) return "#FF9800"; // orange
  if (safeRatio >= 0.6) return "#FFD633"; // yellow
  return "#4CAF50"; // green
}

function lightenHex(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// A light-to-solid gradient of whichever zone color the ratio currently falls
// in, so the bar reads as a smooth degrade rather than one flat color.
export function getBudgetBarGradient(ratio, isSaving) {
  const color = getBudgetBarColor(ratio, isSaving);
  return `linear-gradient(90deg, ${lightenHex(color, 0.55)}, ${color})`;
}
