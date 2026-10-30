import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The wallet analyzer page. Its own tour goes from the top down, one card per section; the tutorials below explain each section in depth.
// Some sections only exist when there is something to show (the projection of a closed month, the biggest spends, the currencies).
export const analyzerTours = {
  page: [
    welcome("analyzer"),
    tutorialTipStep("analyzer"),
    infoTipStep("analyzer"),
    { id: "analyzer.month", anchor: "ana-month", side: "bottom" },
    { id: "analyzer.insights", anchor: "ana-insights", side: "bottom" },
    { id: "analyzer.projection", anchor: "ana-projection", optional: true, side: "bottom" },
    { id: "analyzer.compare", anchor: "ana-compare", side: "bottom" },
    { id: "analyzer.trend", anchor: "ana-trend", side: "bottom" },
    { id: "analyzer.top", anchor: "ana-topn", side: "bottom" },
    { id: "analyzer.topCategories", anchor: "ana-topcat", side: "top" },
    { id: "analyzer.topTransactions", anchor: "ana-toptx", side: "top" },
    { id: "analyzer.budgets", anchor: "ana-budgets", side: "top" },
    { id: "analyzer.big", anchor: "ana-big", optional: true, side: "top" },
    { id: "analyzer.subs", anchor: "ana-subs", side: "top" },
    { id: "analyzer.fx", anchor: "ana-fx", side: "top" },
    { id: "analyzer.pace", anchor: "ana-pace", side: "top" },
    { id: "analyzer.weekday", anchor: "ana-weekday", side: "top" },
    { id: "analyzer.accounts", anchor: "ana-accounts", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    anaMonth: [
      { id: "anaMonth.arrows", anchor: "ana-month-pill", side: "bottom" },
      { id: "anaMonth.picker", anchor: "ana-month-pill", side: "bottom" },
      { id: "anaMonth.scope", anchor: "ana-month", side: "bottom" },
    ],
    anaInsights: [
      { id: "anaInsights.what", anchor: "ana-insights", side: "bottom" },
      { id: "anaInsights.cards", anchor: "ana-insight-cards", optional: true, side: "bottom" },
      { id: "anaInsights.tap", anchor: "ana-insight-first", optional: true, side: "bottom" },
    ],
    anaProjection: [
      { id: "anaProjection.what", anchor: "ana-projection", side: "bottom" },
      { id: "anaProjection.cards", anchor: "ana-projection-cards", side: "bottom" },
      { id: "anaProjection.gap", anchor: "ana-projection-gap", side: "top" },
      { id: "anaProjection.accuracy", anchor: "ana-projection-accuracy", side: "top" },
    ],
    anaCompare: [
      { id: "anaCompare.what", anchor: "ana-compare", side: "bottom" },
      { id: "anaCompare.table", anchor: "ana-compare-table", side: "bottom" },
      { id: "anaCompare.change", anchor: "ana-compare-change", side: "left" },
    ],
    anaTrend: [
      { id: "anaTrend.what", anchor: "ana-trend", side: "bottom" },
      { id: "anaTrend.avg", anchor: "ana-trend-avg", side: "bottom" },
      { id: "anaTrend.chart", anchor: "ana-trend-chart", side: "top" },
    ],
    anaTop: [
      { id: "anaTop.control", anchor: "ana-topn", side: "bottom" },
      { id: "anaTop.buttons", anchor: "ana-topn-buttons", side: "bottom" },
      { id: "anaTop.categories", anchor: "ana-topcat", side: "top" },
      { id: "anaTop.transactions", anchor: "ana-toptx", side: "top" },
    ],
    anaBudgets: [
      { id: "anaBudgets.what", anchor: "ana-budgets", side: "top" },
      { id: "anaBudgets.row", anchor: "ana-budgets-row", optional: true, side: "top" },
    ],
    anaBig: [
      { id: "anaBig.what", anchor: "ana-big", side: "top" },
      { id: "anaBig.cards", anchor: "ana-big-cards", side: "top" },
      { id: "anaBig.analysis", anchor: "ana-big-analysis", side: "top" },
    ],
    anaSubs: [
      { id: "anaSubs.what", anchor: "ana-subs", side: "top" },
      { id: "anaSubs.list", anchor: "ana-subs-list", optional: true, side: "top" },
    ],
    anaFx: [
      { id: "anaFx.what", anchor: "ana-fx", side: "top" },
      { id: "anaFx.table", anchor: "ana-fx-table", optional: true, side: "top" },
    ],
    anaPace: [
      { id: "anaPace.what", anchor: "ana-pace", side: "top" },
      { id: "anaPace.bar", anchor: "ana-pace-bar", side: "top" },
    ],
    anaWeekday: [
      { id: "anaWeekday.what", anchor: "ana-weekday", side: "top" },
      { id: "anaWeekday.chart", anchor: "ana-weekday-chart", side: "top" },
    ],
    anaAccounts: [
      { id: "anaAccounts.what", anchor: "ana-accounts", side: "top" },
      { id: "anaAccounts.tiles", anchor: "ana-accounts-tiles", optional: true, side: "top" },
      { id: "anaAccounts.flow", anchor: "ana-accounts-flow", optional: true, side: "top" },
      { id: "anaAccounts.history", anchor: "ana-accounts-history", optional: true, side: "top" },
    ],
    anaWeekly: [{ id: "anaWeekly.bars", anchor: "ana-weekday-weekly", side: "top" }],
    anaCalendar: [{ id: "anaCalendar.grid", anchor: "ana-weekday-calendar", side: "top" }],
    anaInsightDetail: [
      { id: "anaInsightDetail.what", anchor: "ins-explanation", side: "top" },
      { id: "anaInsightDetail.rows", anchor: "ins-rows", side: "top" },
    ],
    anaWeekdayDetail: [
      { id: "anaWeekdayDetail.method", anchor: "wd-method", side: "bottom" },
      { id: "anaWeekdayDetail.weekly", anchor: "wd-weekly", side: "bottom" },
      { id: "anaWeekdayDetail.calendar", anchor: "wd-calendar", side: "bottom" },
      { id: "anaWeekdayDetail.days", anchor: "wd-days", side: "top" },
    ],
    anaWeeklyDetail: [{ id: "anaWeeklyDetail.bars", anchor: "wd-weekly", side: "bottom" }],
    anaCalendarDetail: [{ id: "anaCalendarDetail.grid", anchor: "wd-calendar", side: "bottom" }],
    anaChampions: [{ id: "anaChampions.list", anchor: "champ-list", side: "top" }],
  } satisfies Record<string, readonly TourStep[]>,
};
