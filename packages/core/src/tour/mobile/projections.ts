import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The projections: the year, the month-by-month table, how accurate it was, the income sources and the historical reference.
// The page tour goes from the top down and opens a month's window from the table and from the accuracy table, closing it each time.
// Its in-depth tutorials, one per component, are listed in `components`.
export const projectionsTours = {
  page: [
    mWelcome("mProjections"),
    mTutorialTipStep("mProjections"),
    mInfoTipStep("mProjections"),
    { id: "mProjections.year", anchor: "m-proj-year", side: "bottom" },
    { id: "mProjections.table", anchor: "m-proj-table", optional: true, side: "bottom" },
    { id: "mProjections.month", text: "m-proj-month.open", anchor: "m-proj-row", optional: true, clickToContinue: true, skipIf: "m-proj-month-close", side: "bottom" },
    { id: "mProjections.monthOpened", anchor: "m-proj-month-sheet", optional: true, later: true, side: "top" },
    { id: "mProjections.monthClose", anchor: "m-proj-month-close", optional: true, later: true, clickToContinue: true, side: "bottom" },
    { id: "mProjections.accuracy", anchor: "m-proj-accuracy", optional: true, side: "top" },
    { id: "mProjections.accuracyRow", anchor: "m-proj-accuracy-row", optional: true, clickToContinue: true, skipIf: "m-proj-month-close", side: "bottom" },
    { id: "mProjections.accuracyOpened", anchor: "m-proj-month-sheet", optional: true, later: true, side: "top" },
    { id: "mProjections.accuracyClose", text: "mProjections.monthClose", anchor: "m-proj-month-close", optional: true, later: true, clickToContinue: true, side: "bottom" },
    { id: "mProjections.sources", anchor: "m-proj-sources", optional: true, side: "top" },
    { id: "mProjections.baseline", anchor: "m-proj-baseline", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-proj-year": [{ id: "m-proj-year.what", anchor: "m-proj-year", side: "bottom" }],
    "m-proj-table": [{ id: "m-proj-table.what", anchor: "m-proj-table", side: "bottom" }],
    "m-proj-accuracy": [{ id: "m-proj-accuracy.what", anchor: "m-proj-accuracy", side: "bottom" }],
    "m-proj-sources": [
      { id: "m-proj-sources.what", anchor: "m-proj-sources", side: "bottom" },
      { id: "m-proj-sources.new", anchor: "m-proj-sources-new", clickToContinue: true, skipIf: "m-proj-sources-name", side: "bottom" },
      { id: "m-proj-sources.name", anchor: "m-proj-sources-name", later: true, side: "bottom" },
      { id: "m-proj-sources.amount", anchor: "m-proj-sources-amount", later: true, side: "bottom" },
      { id: "m-proj-sources.currency", anchor: "m-proj-sources-currency", later: true, side: "top" },
      { id: "m-proj-sources.recurrence", anchor: "m-proj-sources-recurrence", later: true, side: "top" },
      { id: "m-proj-sources.date", anchor: "m-proj-sources-date", later: true, side: "top" },
      { id: "m-proj-sources.save", anchor: "m-proj-sources-save", later: true, side: "top" },
    ],
    "m-proj-baseline": [
      { id: "m-proj-baseline.what", anchor: "m-proj-baseline", side: "bottom" },
      { id: "m-proj-baseline.new", anchor: "m-proj-baseline-new", clickToContinue: true, skipIf: "m-proj-baseline-amount", side: "bottom" },
      { id: "m-proj-baseline.from", anchor: "m-proj-baseline-from", later: true, side: "bottom" },
      { id: "m-proj-baseline.to", anchor: "m-proj-baseline-to", later: true, side: "bottom" },
      { id: "m-proj-baseline.amount", anchor: "m-proj-baseline-amount", later: true, side: "top" },
      { id: "m-proj-baseline.currency", anchor: "m-proj-baseline-currency", later: true, side: "top" },
      { id: "m-proj-baseline.save", anchor: "m-proj-baseline-save", later: true, side: "top" },
    ],
    // The month's own tutorial runs inside its window, which is already open: every card points at a control of that window. The
    // first card is the movements button, which is always there (so the count starts at 1 of N).
    "m-proj-month": [
      { id: "m-proj-month.movements", anchor: "m-proj-month-movements", side: "bottom" },
      { id: "m-proj-month.chart", anchor: "m-proj-month-chart", optional: true, side: "top" },
      { id: "m-proj-month.income", anchor: "m-proj-month-income", optional: true, side: "top" },
      { id: "m-proj-month.balance", anchor: "m-proj-month-balance", optional: true, side: "top" },
      { id: "m-proj-month.buffers", anchor: "m-proj-month-buffers", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
