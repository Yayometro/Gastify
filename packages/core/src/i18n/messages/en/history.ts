import type history from "../es/history";

// English for the "history" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof history, string> = {
  "history.noCategory": "No category",
  "history.preset.last3": "Last 3 months",
  "history.preset.month": "One month",
  "history.preset.thisMonth": "This month",
  "history.preset.lastMonth": "Last month",
  "history.preset.thisQuarter": "This quarter",
  "history.preset.lastQuarter": "Last quarter",
  "history.preset.q1": "Quarter 1",
  "history.preset.q2": "Quarter 2",
  "history.preset.q3": "Quarter 3",
  "history.preset.q4": "Quarter 4",
  "history.preset.h1": "First half",
  "history.preset.h2": "Second half",
  "history.preset.thisYear": "This year",
  "history.preset.lastYear": "Last year",
  "history.preset.custom": "Custom",
  "history.compare.yearAgo": "Same period last year",
  "history.compare.previous": "Previous period",
  "history.compare": "Compare",
  "history.from": "From:",
  "history.to": "to:",
  "history.dateTip": "Filter the date by a generic filter or by selecting a specific range 🤓",
  "history.vs": "VS",
  "history.nothingMonth": "Nothing this month",
  "history.noCompare": "No items to compare for this period.",
  "history.title": "Transactions history",
  "history.loadingOld": "Loading your oldest transactions… the numbers for this period will fill in on their own."
};

export default en;
