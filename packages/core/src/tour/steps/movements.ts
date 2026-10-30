import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The transactions page. Its own tour goes section by section in the order they appear (the tools on the left, then the list of
// transactions on the right); the tutorials below explain each component in depth.

// A step that opens a window or a panel by pressing a button: the button is skipped when the thing is already open.
const openedBy = (id: string, anchor: string, skipIf: string): TourStep => ({ id, anchor, clickToContinue: true, skipIf, side: "bottom" });

// The cards of the create window ("+") that are the same for every form: what the window is, its own tutorial button, the options,
// the "?" of each option and the tutorial button of the form that is open. None of them names a field: each form has its own tour
// (addTransaction, addTransfer, and the account, category and budget ones), started from the button beside the form's title. The
// same cards serve the tutorial that starts at the "+" button and the one that starts at the window's button: the texts are shared
// (`text`), the ids are not.
const windowSteps = (tour: string): TourStep[] => [
  { id: `${tour}.what`, text: "addModal.what", anchor: "add-title", later: true, side: "bottom" },
  { id: `${tour}.window`, text: "addModal.window", anchor: "add-window-tutorial", later: true, side: "bottom" },
  { id: `${tour}.options`, text: "addModal.options", anchor: "add-options", later: true, side: { wide: "right", narrow: "bottom" } },
  { id: `${tour}.help`, text: "addModal.help", anchor: "add-help", later: true, side: "bottom" },
  { id: `${tour}.form`, text: "addModal.form", anchor: "add-form-tutorial", later: true, side: "bottom" },
];

// The Excel import, from the top of the screen down, in the order its controls appear. The copy on the page and the copy in a window
// share the cards and texts (`text`) and have their own anchors (`prefix`, see ReadFileComp). The card for the dedupe tool opens it
// (the person's Next presses it, as the other cards that open something do), and the cards after it explain what is inside. The
// tool is left open when the tour ends: it shows no data until a file is chosen.
const importSteps = (tour: string, prefix: string): TourStep[] => [
  { id: `${tour}.card`, text: "movImport.card", anchor: `${prefix}-intro`, side: "bottom" },
  { id: `${tour}.type`, text: "movImport.type", anchor: `${prefix}-type`, side: "top" },
  { id: `${tour}.upload`, text: "movImport.upload", anchor: `${prefix}-upload`, side: "top" },
  { id: `${tour}.template`, text: "movImport.template", anchor: `${prefix}-template`, side: "top" },
  { id: `${tour}.dedupe`, text: "movImport.dedupe", anchor: `${prefix}-dedupe`, clickToContinue: true, skipIf: `${prefix}-dedupe-intro`, side: "top" },
  { id: `${tour}.dedupeIntro`, text: "movImport.dedupeIntro", anchor: `${prefix}-dedupe-intro`, later: true, side: "top" },
  { id: `${tour}.dedupeMode`, text: "movImport.dedupeMode", anchor: `${prefix}-dedupe-mode`, later: true, side: "top" },
  { id: `${tour}.dedupeUpload`, text: "movImport.dedupeUpload", anchor: `${prefix}-dedupe-upload`, later: true, side: "top" },
];

// The categorizer's window, from the top down: its title, the empty message or the count, the first suggestion (its checkbox, the
// movement, its edit and delete buttons, the before-and-after chip), the footer and the apply button. Every card is "later": the
// window may still be opening, and a card whose element is not there (the empty message when there are suggestions, and the
// reverse) is skipped. `firstWaitMs` is how long the first card waits for the window (the card's button opens it).
const categorizerWindowSteps = (tour: string, firstWaitMs: number): TourStep[] => [
  { id: `${tour}.title`, text: "toolsCategorizer.title", anchor: "tools-title", later: true, waitMs: firstWaitMs, side: "bottom" },
  { id: `${tour}.empty`, text: "toolsCategorizer.empty", anchor: "tools-empty", later: true, side: "bottom" },
  { id: `${tour}.count`, text: "toolsCategorizer.count", anchor: "tools-count", later: true, side: "bottom" },
  { id: `${tour}.check`, text: "toolsCategorizer.check", anchor: "tools-check", later: true, side: "right" },
  { id: `${tour}.movement`, text: "toolsCategorizer.movement", anchor: "tools-movement", later: true, side: "top" },
  { id: `${tour}.actions`, text: "toolsCategorizer.actions", anchor: "tools-actions", later: true, side: "top" },
  { id: `${tour}.chip`, text: "toolsCategorizer.chip", anchor: "tools-chip", later: true, side: "top" },
  { id: `${tour}.footer`, text: "toolsCategorizer.footer", anchor: "tools-footer", later: true, side: "top" },
  { id: `${tour}.apply`, text: "toolsCategorizer.apply", anchor: "tools-apply", later: true, side: "top" },
];

export const movementsTours = {
  page: [
    welcome("movements"),
    tutorialTipStep("movements"),
    infoTipStep("movements"),
    { id: "movements.import", anchor: "mov-import", fallback: "mov-tools", optional: true, side: "right" },
    { id: "movements.categorizer", anchor: "mov-categorizer", optional: true, side: "right" },
    { id: "movements.list", anchor: "mov-list-title", side: "bottom" },
    { id: "movements.filters", anchor: "mov-filter-period", side: "bottom" },
    { id: "movements.tools", anchor: "mov-dup-button", optional: true, side: "bottom" },
    { id: "movements.search", anchor: "mov-search", side: "bottom" },
    { id: "movements.totals", anchor: "mov-totals", side: "bottom" },
    { id: "movements.row", anchor: "mov-row", side: "top" },
    { id: "movements.add", anchor: "nav-add", side: { wide: "right", narrow: "top" } },
  ] satisfies readonly TourStep[],
  components: {
    // Importar desde Excel: the copy on the page, and the copy in a window (the "+" window and the Excel window).
    movImport: importSteps("movImport", "mov-import"),
    addImport: importSteps("addImport", "add-import"),
    // Categorizador de movimientos: the card, then its button, which opens the window (the person's Next presses it) and the
    // window's cards follow. With no suggestions there is no button and no window: those cards are skipped.
    movCategorizer: [
      { id: "movCategorizer.card", anchor: "mov-categorizer", side: "right" },
      { id: "movCategorizer.status", anchor: "mov-categorizer-status", side: "bottom" },
      { id: "movCategorizer.review", anchor: "mov-categorizer-review", clickToContinue: true, optional: true, side: "right" },
      ...categorizerWindowSteps("movCategorizer", 600),
    ],
    // The categorizer's window (the Tools window), opened from its own compass: the cards of the window, from the top down.
    toolsCategorizer: categorizerWindowSteps("toolsCategorizer", 3000),
    // Gastos recurrentes: the window that lists the rules (the card's button opens it; the person's Next presses it).
    movRecurring: [
      { id: "movRecurring.card", anchor: "mov-recurring", clickToContinue: true, skipIf: "mov-recurring-list", side: "bottom" },
      { id: "movRecurring.list", anchor: "mov-recurring-list", later: true, waitMs: 800, side: "bottom" },
      { id: "movRecurring.pause", anchor: "mov-recurring-pause", later: true, optional: true, side: "top" },
      { id: "movRecurring.edit", anchor: "mov-recurring-edit", later: true, optional: true, side: "top" },
      { id: "movRecurring.remove", anchor: "mov-recurring-remove", later: true, optional: true, side: "top" },
    ],
    // Detalle de movimientos: filtros, buscador, totales y filas.
    movList: [
      { id: "movList.title", anchor: "mov-list-title", side: "bottom" },
      { id: "movList.range", anchor: "mov-filter-range", side: "bottom" },
      // The toolbar, in the order it reads: Seleccionar, the filters, Buscar duplicados, Exportar datos, Quitar filtros. Each tool
      // opens a panel under the bar: its opener card opens it (the person's Next presses it), its cards explain the panel, and its
      // last card closes it again, so the screen is back to normal at the end. Cards of an open panel are "later": they are there
      // once the opener has run.
      { ...openedBy("movList.select", "mov-select-toggle", "mov-select-panel"), text: "movSelection.toggle" },
      { id: "movList.selectOff", anchor: "mov-select-off", later: true, side: "bottom" },
      { id: "movList.selectAll", anchor: "mov-select-all", later: true, side: "bottom" },
      { id: "movList.selectCount", anchor: "mov-select-count", later: true, side: "bottom" },
      { id: "movList.selectDelete", anchor: "mov-select-delete", later: true, side: "bottom" },
      { id: "movList.selectBulk", anchor: "mov-select-bulk", optional: true, later: true, text: "movSelection.bulk", side: "bottom" },
      // Presses "Apagar" for the person (or the toggle, when the selection bar is not on screen).
      { id: "movList.selectClose", anchor: "mov-select-off", fallback: "mov-select-toggle", clickToContinue: true, side: "bottom" },
      { id: "movList.period", anchor: "mov-filter-period", side: "bottom" },
      { id: "movList.type", anchor: "mov-filter-type", side: "bottom" },
      { id: "movList.readable", anchor: "mov-filter-readable", side: "bottom" },
      { id: "movList.amount", anchor: "mov-filter-amount", side: "bottom" },
      { id: "movList.category", anchor: "mov-filter-category", side: "bottom" },
      { ...openedBy("movList.dupOpen", "mov-dup-button", "mov-dup-panel"), text: "movDuplicates.open" },
      { id: "movList.dupCriteria", anchor: "mov-dup-criteria", later: true, text: "movDuplicates.criteria", side: "bottom" },
      { id: "movList.dupTolerance", anchor: "mov-dup-tolerance", later: true, text: "movDuplicates.tolerance", side: "bottom" },
      // The search and the refresh are always on screen once the panel is open (the bar's button stands in before that, so they
      // exist when the tour starts). The search only looks: it deletes nothing.
      { id: "movList.dupSearch", anchor: "mov-dup-search", fallback: "mov-dup-button", clickToContinue: true, side: "bottom" },
      { id: "movList.dupRefresh", anchor: "mov-dup-refresh", fallback: "mov-dup-button", side: "bottom" },
      // The results exist only after a search that found something; the cards for them are skipped otherwise.
      { id: "movList.dupMode", anchor: "mov-dup-mode", later: true, optional: true, waitMs: 800, side: "bottom" },
      { id: "movList.dupSelect", anchor: "mov-dup-select", later: true, optional: true, clickToContinue: true, side: "bottom" },
      { id: "movList.dupCompare", anchor: "mov-dup-compare", later: true, optional: true, waitMs: 1000, side: "bottom" },
      { id: "movList.dupDelete", anchor: "mov-dup-delete", later: true, optional: true, side: "bottom" },
      { id: "movList.dupSummary", anchor: "mov-dup-summary", later: true, optional: true, side: "bottom" },
      // Leaves the duplicates view (with the search's results) or, when nothing was searched, closes the tool.
      { id: "movList.dupClose", anchor: "mov-dup-exit", fallback: "mov-dup-button", clickToContinue: true, side: "bottom" },
      { ...openedBy("movList.exportOpen", "mov-export-button", "mov-export-panel"), text: "movExport.open" },
      { id: "movList.exportCount", anchor: "mov-export-count", later: true, side: "bottom" },
      // Opens the Excel confirmation window (the person's Next presses it); its button downloads, and the tour never presses it.
      { id: "movList.exportExcel", anchor: "mov-export-excel", later: true, clickToContinue: true, side: "bottom" },
      { id: "movList.exportModalTitle", anchor: "mov-export-modal", later: true, waitMs: 1000, side: "bottom" },
      { id: "movList.exportModalOk", anchor: "mov-export-ok", later: true, side: "bottom" },
      { id: "movList.exportModalCancel", anchor: "mov-export-cancel", later: true, clickToContinue: true, side: "bottom" },
      { id: "movList.exportJson", anchor: "mov-export-json", later: true, side: "bottom" },
      { id: "movList.exportClose", anchor: "mov-export-button", clickToContinue: true, side: "bottom" },
      { id: "movList.clear", anchor: "mov-clear-filters", side: "bottom" },
      { id: "movList.search", anchor: "mov-search", side: "bottom" },
      { id: "movList.totals", anchor: "mov-totals", side: "bottom" },
      { id: "movList.row", anchor: "mov-row", side: "top" },
      { id: "movList.rowCategory", anchor: "mov-row-category", optional: true, side: "right" },
      { id: "movList.amountCell", anchor: "mov-row-amount", side: "left" },
      { id: "movList.actions", anchor: "mov-row-actions", optional: true, side: "left" },
    ],
    // Seleccionar varios movimientos.
    movSelection: [
      openedBy("movSelection.toggle", "mov-select-toggle", "mov-select-panel"),
      { id: "movSelection.panel", anchor: "mov-select-panel", later: true, side: "bottom" },
      { id: "movSelection.bulk", anchor: "mov-select-bulk", optional: true, later: true, side: "bottom" },
    ],
    // Buscar duplicados.
    movDuplicates: [
      openedBy("movDuplicates.open", "mov-dup-button", "mov-dup-panel"),
      { id: "movDuplicates.criteria", anchor: "mov-dup-criteria", later: true, side: "bottom" },
      { id: "movDuplicates.tolerance", anchor: "mov-dup-tolerance", later: true, side: "bottom" },
      { id: "movDuplicates.actions", anchor: "mov-dup-actions", later: true, side: "bottom" },
      { id: "movDuplicates.results", anchor: "mov-dup-results", later: true, side: "bottom" },
    ],
    // Exportar datos.
    movExport: [
      openedBy("movExport.open", "mov-export-button", "mov-export-panel"),
      { id: "movExport.formats", anchor: "mov-export-panel", later: true, side: "bottom" },
    ],
    // The "+" button: it opens the create window, whatever is created. Pressing it moves the tour on.
    addMovement: [
      { id: "addMovement.plus", anchor: "nav-add-button", clickToContinue: true, skipIf: "add-modal", side: { wide: "right", narrow: "top" } },
      ...windowSteps("addMovement"),
    ],
    // The create window, when it is already open (the compass of the window starts this tour).
    addModal: windowSteps("addModal"),
    // The form of a transaction (income or expense), from the top down. Its compass is beside the form's title in the window.
    addTransaction: [
      { id: "addTransaction.name", anchor: "add-name", side: "bottom" },
      { id: "addTransaction.amount", anchor: "add-amount", side: "bottom" },
      { id: "addTransaction.charged", anchor: "add-charged", side: "bottom" },
      { id: "addTransaction.type", anchor: "add-type", side: "bottom" },
      { id: "addTransaction.date", anchor: "add-date", side: "top" },
      { id: "addTransaction.category", anchor: "add-category", side: "top" },
      { id: "addTransaction.tags", anchor: "add-tags", side: "top" },
      { id: "addTransaction.account", anchor: "add-account", side: "top" },
      { id: "addTransaction.recurring", anchor: "add-recurring", optional: true, side: "top" },
      { id: "addTransaction.project", anchor: "add-project", side: "top" },
      { id: "addTransaction.save", anchor: "add-save", side: "top" },
    ],
    // The form of a transfer or an exchange between two of the person's accounts, from the top down.
    addTransfer: [
      { id: "addTransfer.name", anchor: "trf-name", side: "bottom" },
      { id: "addTransfer.from", anchor: "trf-from", side: "bottom" },
      { id: "addTransfer.amount", anchor: "trf-amount", side: "bottom" },
      { id: "addTransfer.to", anchor: "trf-to", side: "top" },
      { id: "addTransfer.received", anchor: "trf-received", side: "top" },
      { id: "addTransfer.date", anchor: "trf-date", side: "top" },
      { id: "addTransfer.submit", anchor: "trf-submit", side: "top" },
    ],
    movEdit: [
      { id: "movEdit.title", anchor: "mov-edit-title", side: "bottom" },
      { id: "movEdit.name", anchor: "mov-edit-name", side: "bottom" },
      { id: "movEdit.amount", anchor: "mov-edit-amount", side: "bottom" },
      { id: "movEdit.date", anchor: "mov-edit-date", side: "top" },
      { id: "movEdit.category", anchor: "mov-edit-category", side: "top" },
      { id: "movEdit.tags", anchor: "mov-edit-tags", side: "top" },
      { id: "movEdit.account", anchor: "mov-edit-account", side: "top" },
      { id: "movEdit.budget", anchor: "mov-edit-budget", side: "top" },
      { id: "movEdit.save", anchor: "mov-edit-save", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
