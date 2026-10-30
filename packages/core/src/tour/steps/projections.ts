import { infoTipStep, openPanelStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The projections page. Its own tour goes from the top down, one card per section; the tutorials below explain each section in depth.
// The income sources and the historical reference are collapsed until their title is pressed: their tutorials open them. The window
// with a month's detail opens from a row of the table.
export const projectionsTours = {
  page: [
    welcome("projections"),
    tutorialTipStep("projections"),
    infoTipStep("projections"),
    { id: "projections.currency", anchor: "proj-currency", optional: true, side: "bottom" },
    { id: "projections.year", anchor: "proj-year", side: "bottom" },
    { id: "projections.today", anchor: "proj-today", side: "bottom" },
    { id: "projections.sources", anchor: "proj-sources", optional: true, side: "bottom" },
    { id: "projections.baseline", anchor: "proj-baseline", optional: true, side: "bottom" },
    { id: "projections.table", anchor: "proj-table", side: "bottom" },
    { id: "projections.accuracy", anchor: "proj-accuracy", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    projYear: [
      { id: "projYear.arrows", anchor: "proj-year", side: "bottom" },
      { id: "projYear.today", anchor: "proj-today", side: "bottom" },
    ],
    projSources: [
      { id: "projSources.what", anchor: "proj-sources-header", side: "bottom" },
      openPanelStep("projSources", "proj-sources-header", "proj-sources-body"),
      { id: "projSources.list", anchor: "proj-sources-list", later: true, side: "bottom" },
      { id: "projSources.actions", anchor: "proj-sources-actions", later: true, side: "left" },
      { id: "projSources.form", anchor: "proj-sources-form", later: true, side: "top" },
      { id: "projSources.name", anchor: "proj-sources-name", later: true, side: "top" },
      { id: "projSources.amount", anchor: "proj-sources-amount", later: true, side: "top" },
      { id: "projSources.currency", anchor: "proj-sources-currency", later: true, side: "top" },
      { id: "projSources.recurrence", anchor: "proj-sources-recurrence", later: true, side: "top" },
      { id: "projSources.date", anchor: "proj-sources-date", later: true, side: "top" },
      { id: "projSources.submit", anchor: "proj-sources-submit", later: true, side: "top" },
    ],
    projBaseline: [
      { id: "projBaseline.what", anchor: "proj-baseline-header", side: "bottom" },
      openPanelStep("projBaseline", "proj-baseline-header", "proj-baseline-body"),
      { id: "projBaseline.help", anchor: "proj-baseline-help", later: true, side: "bottom" },
      { id: "projBaseline.income", anchor: "proj-baseline-income", later: true, side: "top" },
      { id: "projBaseline.from", anchor: "proj-baseline-income-from", later: true, side: "top" },
      { id: "projBaseline.to", anchor: "proj-baseline-income-to", later: true, side: "top" },
      { id: "projBaseline.amount", anchor: "proj-baseline-income-amount", later: true, side: "top" },
      { id: "projBaseline.currency", anchor: "proj-baseline-income-currency", later: true, side: "top" },
      { id: "projBaseline.submit", anchor: "proj-baseline-income-submit", later: true, side: "top" },
      { id: "projBaseline.expense", anchor: "proj-baseline-expense", later: true, side: "top" },
    ],
    projTable: [
      { id: "projTable.rows", anchor: "proj-table", side: "bottom" },
      { id: "projTable.columns", anchor: "proj-table-head", side: "bottom" },
      { id: "projTable.balance", anchor: "proj-col-balance", side: "bottom" },
      { id: "projTable.note", anchor: "proj-table-note", side: "top" },
      { id: "projTable.open", anchor: "proj-row-current", fallback: "proj-row", side: "top" },
    ],
    projMonth: [
      { id: "projMonth.open", anchor: "proj-row-current", fallback: "proj-row", clickToContinue: true, skipIf: "proj-month-title", side: "top" },
      { id: "projMonth.title", anchor: "proj-month-title", later: true, side: "bottom" },
      { id: "projMonth.kind", anchor: "proj-month-kind", later: true, side: "bottom" },
      { id: "projMonth.see", anchor: "proj-month-see", later: true, side: "bottom" },
      { id: "projMonth.cards", anchor: "proj-month-cards", later: true, side: "bottom" },
      { id: "projMonth.precision", anchor: "proj-month-precision", later: true, side: "top" },
      { id: "projMonth.chart", anchor: "proj-month-chart", later: true, side: "top" },
      { id: "projMonth.income", anchor: "proj-month-income", later: true, side: "top" },
      { id: "projMonth.balance", anchor: "proj-month-balance", later: true, side: "top" },
      { id: "projMonth.buffers", anchor: "proj-month-buffers", later: true, side: "top" },
      { id: "projMonth.buffersSave", anchor: "proj-month-buffers-save", later: true, side: "top" },
      { id: "projMonth.history", anchor: "proj-month-history", later: true, side: "top" },
    ],
    projAccuracy: [
      { id: "projAccuracy.what", anchor: "proj-accuracy", side: "bottom" },
      { id: "projAccuracy.table", anchor: "proj-accuracy-table", side: "top" },
      { id: "projAccuracy.pct", anchor: "proj-accuracy-pct", side: "top" },
      { id: "projAccuracy.gap", anchor: "proj-accuracy-gap", side: "left" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
