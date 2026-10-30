import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The history page. Its own tour goes from the top down, one card per section; the tutorials below explain each section in depth.
// Every section has its own period filter (with its own "Compare" switch); the sections that say "same as above" follow the first one.
export const historyTours = {
  page: [
    welcome("history"),
    tutorialTipStep("history"),
    infoTipStep("history"),
    { id: "history.periods", anchor: "his-periods", side: "bottom" },
    { id: "history.analyzer", anchor: "his-analyzer", side: "bottom" },
    { id: "history.projections", anchor: "his-projections", side: "bottom" },
    { id: "history.categories", anchor: "his-categories", side: "bottom" },
    { id: "history.budgets", anchor: "his-budgets", side: "bottom" },
    { id: "history.movements", anchor: "his-movements", side: "bottom" },
  ] satisfies readonly TourStep[],
  components: {
    hisPeriods: [
      { id: "hisPeriods.filters", anchor: "his-periods-filters", side: "bottom" },
      { id: "hisPeriods.compare", anchor: "his-periods-compare", optional: true, side: "bottom" },
      { id: "hisPeriods.second", anchor: "his-periods-second", optional: true, side: "bottom" },
      { id: "hisPeriods.tabs", anchor: "his-periods-tabs", optional: true, side: "bottom" },
      { id: "hisPeriods.content", anchor: "his-periods-content", optional: true, side: "top" },
    ],
    hisAnalyzer: [
      { id: "hisAnalyzer.filters", anchor: "his-an-filters", side: "bottom" },
      { id: "hisAnalyzer.compare", anchor: "his-an-compare", optional: true, side: "bottom" },
      { id: "hisAnalyzer.highlights", anchor: "his-an-highlights", optional: true, side: "bottom" },
      { id: "hisAnalyzer.vs", anchor: "his-an-vs", optional: true, side: "bottom" },
      { id: "hisAnalyzer.trend", anchor: "his-an-trend", optional: true, side: "bottom" },
      { id: "hisAnalyzer.topn", anchor: "his-an-topn", optional: true, side: "bottom" },
      { id: "hisAnalyzer.topCategories", anchor: "his-an-topcat", optional: true, side: "top" },
      { id: "hisAnalyzer.topTransactions", anchor: "his-an-toptx", optional: true, side: "top" },
      { id: "hisAnalyzer.budgets", anchor: "his-an-budgets", optional: true, side: "top" },
      { id: "hisAnalyzer.big", anchor: "his-an-big", optional: true, side: "top" },
      { id: "hisAnalyzer.leader", anchor: "his-an-leader", optional: true, side: "top" },
      { id: "hisAnalyzer.subs", anchor: "his-an-subs", optional: true, side: "top" },
      { id: "hisAnalyzer.fx", anchor: "his-an-fx", optional: true, side: "top" },
      { id: "hisAnalyzer.pace", anchor: "his-an-pace", optional: true, side: "top" },
      { id: "hisAnalyzer.weekday", anchor: "his-an-weekday", optional: true, side: "top" },
      { id: "hisAnalyzer.comparePeriods", anchor: "his-an-compare-periods", optional: true, side: "top" },
      { id: "hisAnalyzer.budgetsChange", anchor: "his-an-budgets-change", optional: true, side: "top" },
    ],
    hisProjections: [
      { id: "hisProjections.what", anchor: "his-projections", side: "bottom" },
      { id: "hisProjections.filters", anchor: "his-proj-filters", side: "bottom" },
      { id: "hisProjections.accuracy", anchor: "his-proj-accuracy", optional: true, side: "top" },
      { id: "hisProjections.table", anchor: "his-proj-table", optional: true, side: "top" },
      { id: "hisProjections.balance", anchor: "proj-col-balance", optional: true, side: "bottom" },
    ],
    hisCategories: [
      { id: "hisCategories.what", anchor: "his-categories", side: "bottom" },
      { id: "hisCategories.filters", anchor: "his-cat-filters", side: "bottom" },
      { id: "hisCategories.compare", anchor: "his-cat-compare", optional: true, side: "bottom" },
      { id: "hisCategories.tabs", anchor: "his-cat-tabs", optional: true, side: "bottom" },
      { id: "hisCategories.content", anchor: "his-cat-content", optional: true, side: "top" },
    ],
    hisBudgets: [
      { id: "hisBudgets.what", anchor: "his-budgets", side: "bottom" },
      { id: "hisBudgets.filters", anchor: "his-bud-filters", side: "bottom" },
      { id: "hisBudgets.list", anchor: "his-bud-list", optional: true, side: "top" },
    ],
    hisMovements: [
      { id: "hisMovements.what", anchor: "his-movements", side: "bottom" },
      { id: "hisMovements.filters", anchor: "his-mov-filters", side: "bottom" },
      { id: "hisMovements.items", anchor: "his-mov-items", side: "bottom" },
      { id: "hisMovements.compare", anchor: "his-mov-compare", optional: true, side: "bottom" },
      { id: "hisMovements.tabs", anchor: "his-mov-tabs", optional: true, side: "bottom" },
      { id: "hisMovements.content", anchor: "his-mov-content", optional: true, side: "top" },
    ],
    hisBudgetPeriod: [
      { id: "hisBudgetPeriod.summary", anchor: "bp-summary", side: "bottom" },
      { id: "hisBudgetPeriod.tables", anchor: "bp-tables", side: "top" },
    ],
    hisBudgetDetail: [
      { id: "hisBudgetDetail.summary", anchor: "bh-summary", side: "bottom" },
      { id: "hisBudgetDetail.table", anchor: "bh-table", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
