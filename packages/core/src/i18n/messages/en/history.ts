import type history from "../es/history";

// English for the "history" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof history, string> = {
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
