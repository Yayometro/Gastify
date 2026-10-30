import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The movements list: the tools on top, then the period, the filters and, below, every movement grouped by day.
// Its in-depth tutorials, one per component, are listed in `components`.
export const movementsTours = {
  page: [
    mWelcome("mMovements"),
    mTutorialTipStep("mMovements"),
    mInfoTipStep("mMovements"),
    { id: "mMovements.export", anchor: "m-mov-export", optional: true, side: "bottom" },
    { id: "mMovements.import", anchor: "m-mov-import", side: "bottom" },
    { id: "mMovements.categorize", anchor: "m-mov-categorize", side: "bottom" },
    { id: "mMovements.period", anchor: "m-mov-period", side: "bottom" },
    { id: "mMovements.filters", anchor: "m-mov-filters", clickToContinue: true, skipIf: "m-mov-filters-panel", side: "bottom" },
    { id: "mMovements.filtersSearch", text: "m-mov-filters.search", anchor: "m-mov-filters-search", later: true, side: "bottom" },
    { id: "mMovements.filtersType", text: "m-mov-filters.type", anchor: "m-mov-filters-type", later: true, side: "bottom" },
    { id: "mMovements.filtersReadable", text: "m-mov-filters.readable", anchor: "m-mov-filters-readable", later: true, side: "bottom" },
    { id: "mMovements.filtersCategory", text: "m-mov-filters.category", anchor: "m-mov-filters-category", later: true, side: "bottom" },
    { id: "mMovements.filtersAccount", text: "m-mov-filters.account", anchor: "m-mov-filters-account", later: true, side: "top" },
    { id: "mMovements.filtersAmount", text: "m-mov-filters.amount", anchor: "m-mov-filters-amount", later: true, side: "top" },
    { id: "mMovements.filtersDuplicates", text: "m-mov-filters.duplicates", anchor: "m-mov-filters-duplicates", optional: true, later: true, side: "top" },
    { id: "mMovements.filtersClear", text: "m-mov-filters.clear", anchor: "m-mov-filters-clear", optional: true, later: true, side: "top" },
    { id: "mMovements.select", anchor: "m-mov-select", side: "bottom" },
    { id: "mMovements.totals", anchor: "m-mov-totals", optional: true, side: "bottom" },
    { id: "mMovements.list", anchor: "m-mov-list", optional: true, side: "top" },
    { id: "mMovements.daterail", anchor: "m-mov-daterail", optional: true, side: "left" },
  ] satisfies readonly TourStep[],
  components: {
    "m-tab-add": [{ id: "m-tab-add.what", anchor: "m-tab-add", side: "bottom" }],
    "m-mov-export": [{ id: "m-mov-export.what", anchor: "m-mov-export", side: "bottom" }],
    "m-mov-import": [{ id: "m-mov-import.what", anchor: "m-mov-import", side: "bottom" }],
    "m-mov-categorize": [{ id: "m-mov-categorize.what", anchor: "m-mov-categorize", side: "bottom" }],
    // The Import from Excel screen, from the top down: the template, its download, the upload and the import button, and the result
    // once a file has been imported. The phone has no file-type switch or duplicate cleaner on this screen, so the tour has none either.
    "m-import": [
      { id: "m-import.template", anchor: "m-import-template", side: "bottom" },
      { id: "m-import.download", anchor: "m-import-download", side: "top" },
      { id: "m-import.upload", anchor: "m-import-upload", side: "top" },
      { id: "m-import.pick", anchor: "m-import-pick", side: "top" },
      { id: "m-import.result", anchor: "m-import-result", optional: true, side: "top" },
    ],
    // The Transaction Categorizer window: its head, the empty message or the count, the first suggestion (its checkbox and its
    // current and suggested category), the Apply button and the X to leave. The rows exist only when there are suggestions.
    "m-categorizer": [
      { id: "m-categorizer.head", anchor: "m-categorizer-head", side: "bottom" },
      { id: "m-categorizer.empty", anchor: "m-categorizer-empty", optional: true, side: "bottom" },
      { id: "m-categorizer.count", anchor: "m-categorizer-count", optional: true, side: "bottom" },
      { id: "m-categorizer.row", anchor: "m-categorizer-row", optional: true, side: "bottom" },
      { id: "m-categorizer.chip", anchor: "m-categorizer-chip", optional: true, side: "top" },
      { id: "m-categorizer.apply", anchor: "m-categorizer-apply", optional: true, side: "top" },
      { id: "m-categorizer.close", anchor: "m-categorizer-close", side: "bottom" },
    ],
    "m-mov-filters": [
      { id: "m-mov-filters.open", anchor: "m-mov-filters", clickToContinue: true, skipIf: "m-mov-filters-panel", side: "bottom" },
      { id: "m-mov-filters.search", anchor: "m-mov-filters-search", later: true, side: "bottom" },
      { id: "m-mov-filters.type", anchor: "m-mov-filters-type", later: true, side: "bottom" },
      { id: "m-mov-filters.readable", anchor: "m-mov-filters-readable", later: true, side: "bottom" },
      { id: "m-mov-filters.category", anchor: "m-mov-filters-category", later: true, side: "bottom" },
      { id: "m-mov-filters.account", anchor: "m-mov-filters-account", later: true, side: "top" },
      { id: "m-mov-filters.amount", anchor: "m-mov-filters-amount", later: true, side: "top" },
      { id: "m-mov-filters.duplicates", anchor: "m-mov-filters-duplicates", optional: true, later: true, side: "top" },
      { id: "m-mov-filters.clear", anchor: "m-mov-filters-clear", optional: true, later: true, side: "top" },
    ],
    "m-mov-select": [{ id: "m-mov-select.what", anchor: "m-mov-select", side: "bottom" }],
    "m-mov-totals": [{ id: "m-mov-totals.what", anchor: "m-mov-totals", side: "bottom" }],
    "m-mov-list": [{ id: "m-mov-list.what", anchor: "m-mov-list", side: "bottom" }],
    "m-movform": [
      { id: "m-movform.type", anchor: "m-movform-type", side: "bottom" },
      { id: "m-movform.name", anchor: "m-movform-name", side: "bottom" },
      { id: "m-movform.amount", anchor: "m-movform-amount", side: "bottom" },
      { id: "m-movform.currency", anchor: "m-movform-currency", side: "top" },
      { id: "m-movform.account", anchor: "m-movform-account", side: "top" },
      { id: "m-movform.category", anchor: "m-movform-category", side: "top" },
      { id: "m-movform.budget", anchor: "m-movform-budget", side: "top" },
      { id: "m-movform.date", anchor: "m-movform-date", side: "top" },
      { id: "m-movform.recurring", anchor: "m-movform-recurring", optional: true, side: "top" },
      { id: "m-movform.tags", anchor: "m-movform-tags", side: "top" },
      { id: "m-movform.save", anchor: "m-movform-save", side: "top" },
    ],
    "m-transferform": [
      { id: "m-transferform.source", anchor: "m-transferform-source", side: "bottom" },
      { id: "m-transferform.dest", anchor: "m-transferform-dest", side: "bottom" },
      { id: "m-transferform.amount", anchor: "m-transferform-amount", side: "top" },
      { id: "m-transferform.amountDest", anchor: "m-transferform-amount-dest", optional: true, side: "top" },
      { id: "m-transferform.date", anchor: "m-transferform-date", side: "top" },
      { id: "m-transferform.name", anchor: "m-transferform-name", side: "top" },
      { id: "m-transferform.save", anchor: "m-transferform-save", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
