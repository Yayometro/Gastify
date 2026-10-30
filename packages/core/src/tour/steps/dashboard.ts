import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The wallet (dashboard). Its own tour goes from the top of the page down, card by card; the tutorials below explain each card in
// depth. The list of transactions at the bottom is the same component as the transactions page, so its tutorial (movList) is
// started from the compass in its own title.
export const dashboardTours = {
  page: [
    welcome("dashboard"),
    tutorialTipStep("dashboard"),
    infoTipStep("dashboard"),
    { id: "dashboard.header", anchor: "dash-header", side: "bottom" },
    { id: "dashboard.filters", anchor: "dash-filters", side: "bottom" },
    { id: "dashboard.analyzer", anchor: "dash-analyzer", optional: true, side: "bottom" },
    { id: "dashboard.accounts", anchor: "dash-accounts", side: "bottom" },
    { id: "dashboard.breakdown", anchor: "dash-breakdown", side: "bottom" },
    { id: "dashboard.top", anchor: "dash-top", side: "bottom" },
    { id: "dashboard.budgets", anchor: "dash-budgets", side: "bottom" },
    { id: "dashboard.movements", anchor: "dash-movements", side: "bottom" },
  ] satisfies readonly TourStep[],
  components: {
    // The three panels at the top.
    dashHeader: [
      { id: "dashHeader.accounts", anchor: "dash-accounts-panel", side: "bottom" },
      { id: "dashHeader.summary", anchor: "dash-summary-panel", side: "bottom" },
      { id: "dashHeader.compare", anchor: "dash-compare-panel", side: "bottom" },
    ],
    // The period of the whole page.
    dashFilters: [
      { id: "dashFilters.preset", anchor: "dash-filters-preset", side: "bottom" },
      { id: "dashFilters.range", anchor: "dash-filters-range", side: "bottom" },
    ],
    // The month's highlights.
    dashAnalyzer: [
      { id: "dashAnalyzer.card", anchor: "dash-analyzer", side: "bottom" },
      { id: "dashAnalyzer.cards", anchor: "ana-insight-cards", optional: true, side: "bottom" },
      { id: "dashAnalyzer.link", anchor: "dash-analyzer-link", side: "top" },
    ],
    // The account cards.
    // The top-item window (the Top 6, the Wallet Analyzer's drill-downs): what it shows and how to act on its transactions.
    topModal: [
      { id: "topModal.header", anchor: "top-modal-header", side: "bottom" },
      { id: "topModal.total", anchor: "top-modal-total", side: "bottom" },
      { id: "topModal.select", anchor: "top-modal-select", optional: true, side: "bottom" },
      { id: "topModal.sort", anchor: "top-modal-sort", optional: true, side: "bottom" },
      { id: "topModal.list", anchor: "top-modal-list", side: "top" },
    ],
    dashAccounts: [
      { id: "dashAccounts.title", anchor: "dash-accounts-title", side: "bottom" },
      { id: "dashAccounts.cards", anchor: "dash-accounts-cards", side: "top" },
    ],
    // The transactions summary: categories as a map, bubbles or ring.
    dashBreakdown: [
      { id: "dashBreakdown.title", anchor: "dash-brk-title", side: "bottom" },
      { id: "dashBreakdown.kind", anchor: "dash-brk-kind", side: "bottom" },
      { id: "dashBreakdown.chartType", anchor: "dash-brk-chart-type", side: "bottom" },
      { id: "dashBreakdown.nav", anchor: "dash-brk-nav", side: "bottom" },
      { id: "dashBreakdown.chart", anchor: "dash-brk-chart", side: "right" },
      { id: "dashBreakdown.list", anchor: "dash-brk-list", side: "left" },
    ],
    // The biggest transactions and categories of the period.
    dashTop: [
      { id: "dashTop.title", anchor: "dash-top-title", side: "bottom" },
      { id: "dashTop.period", anchor: "dash-top-period", side: "bottom" },
      { id: "dashTop.count", anchor: "dash-top-count", side: "bottom" },
      { id: "dashTop.tabs", anchor: "dash-top-tabs", side: "top" },
    ],
    // The budgets and savings of the wallet.
    dashBudgets: [
      { id: "dashBudgets.title", anchor: "dash-bud-title", side: "bottom" },
      { id: "dashBudgets.period", anchor: "dash-bud-period", side: "bottom" },
      { id: "dashBudgets.tabs", anchor: "dash-bud-tabs", side: "bottom" },
      { id: "dashBudgets.list", anchor: "dash-bud-list", optional: true, side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
