import type navbar from "../es/navbar";

// English for the "navbar" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof navbar, string> = {
  "navbar.profileAlt": "{p1} profile account",
  "navbar.profile": "Profile",
  "navbar.movements": "Transactions",
  "navbar.wallet": "Wallet",
  "navbar.budgets": "Budgets",
  "navbar.projections": "Projections",
  "navbar.analyzer": "Wallet Analyzer",
  "navbar.addTransaction": "Add a transaction",
  "navbar.accounts": "Accounts",
  "navbar.history": "History",
  "navbar.categories": "Categories",
  "navbar.toggleTheme": "Toggle light/dark mode",
  "navbar.notifications": "Notifications",
  "navbar.clearAll": "Clear all",
  "navbar.close": "Close",
  "navbar.notifications.none": "No notices for now. We will let you know when a budget reaches 70, 80, 90 or 100%.",
  "navbar.icons.searchPlaceholder": "Search icon: food, house, plane…",
  "navbar.icons.search": "Search icon",
  "navbar.icons.loadError": "We could not load the icons. Check your connection.",
  "navbar.icons.none": "No icon matches the search.",
  "navbar.icons.more": "Show more ({p1} left)",
  "navbar.seeBudget": "See my budget",
  "navbar.tools.open": "Open tools",
  "navbar.tools.drag": "Tools (drag it to another edge)"
};

export default en;
