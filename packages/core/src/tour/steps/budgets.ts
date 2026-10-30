import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The cards of the budget form, in the order of its form. The same cards serve the tutorial that starts at the "New budget" button
// and the one that starts inside the form (the texts are shared through `text`). Which of them show depends on the type chosen
// (spending, saving or project): the ones that do not exist for it are skipped.
const formSteps = (tour: string): TourStep[] => [
  { id: `${tour}.name`, text: "budCreate.name", anchor: "bud-form-name", later: true, side: "bottom" },
  { id: `${tour}.type`, text: "budCreate.type", anchor: "bud-form-type", later: true, side: "bottom" },
  { id: `${tour}.amount`, text: "budCreate.amount", anchor: "bud-form-amount", later: true, side: "bottom" },
  { id: `${tour}.savingManual`, text: "budCreate.savingManual", anchor: "bud-form-saving-manual", later: true, side: "top" },
  { id: `${tour}.savingLink`, text: "budCreate.savingLink", anchor: "bud-form-saving-link", later: true, side: "top" },
  { id: `${tour}.project`, text: "budCreate.project", anchor: "bud-form-project", later: true, side: "top" },
  // The project's dates and tags are inside its block, so each one has its own card. Absent for the other types: skipped there.
  { id: `${tour}.projectPeriod`, text: "budCreate.projectPeriod", anchor: "bud-form-project-period", optional: true, later: true, side: "top" },
  { id: `${tour}.projectTags`, text: "budCreate.projectTags", anchor: "bud-form-project-tags", optional: true, later: true, side: "top" },
  { id: `${tour}.period`, text: "budCreate.period", anchor: "bud-form-period", later: true, side: "top" },
  { id: `${tour}.categories`, text: "budCreate.categories", anchor: "bud-form-categories", later: true, side: "top" },
  // Edition only: the delete button, then the update button. In creation the same button is "bud-form-save" instead.
  { id: `${tour}.delete`, text: "budCreate.delete", anchor: "bud-form-delete", optional: true, later: true, side: "top" },
  { id: `${tour}.save`, text: "budCreate.save", anchor: "bud-form-save", optional: true, later: true, side: "top" },
  { id: `${tour}.update`, text: "budCreate.update", anchor: "bud-form-update", optional: true, later: true, side: "top" },
];

// The budgets page. Its own tour goes from the top down; the tutorials below explain each section in depth.
export const budgetsTours = {
  page: [
    welcome("budgets"),
    tutorialTipStep("budgets"),
    infoTipStep("budgets"),
    { id: "budgets.period", anchor: "bud-period", side: "bottom" },
    { id: "budgets.new", anchor: "bud-new", optional: true, side: "bottom" },
    { id: "budgets.spending", anchor: "bud-spending-title", side: "bottom" },
    { id: "budgets.summary", anchor: "bud-summary", optional: true, side: "bottom" },
    { id: "budgets.row", anchor: "bud-row", optional: true, side: "bottom" },
    { id: "budgets.projects", anchor: "bud-projects", side: "bottom" },
    { id: "budgets.savings", anchor: "bud-savings", side: "bottom" },
  ] satisfies readonly TourStep[],
  components: {
    budPeriod: [
      { id: "budPeriod.range", anchor: "bud-period", side: "bottom" },
      { id: "budPeriod.reset", anchor: "bud-period", side: "bottom" },
    ],
    budSummary: [
      { id: "budSummary.cards", anchor: "bud-summary", side: "bottom" },
      { id: "budSummary.detail", anchor: "bud-summary", side: "bottom" },
    ],
    budSpending: [
      { id: "budSpending.title", anchor: "bud-spending-title", side: "bottom" },
      { id: "budSpending.list", anchor: "bud-spending-list", optional: true, side: "top" },
      { id: "budSpending.row", anchor: "bud-row", optional: true, side: "bottom" },
    ],
    budProjects: [
      { id: "budProjects.card", anchor: "bud-projects", side: "bottom" },
      { id: "budProjects.detail", anchor: "bud-projects", side: "bottom" },
    ],
    budSavings: [
      { id: "budSavings.card", anchor: "bud-savings", side: "bottom" },
      { id: "budSavings.detail", anchor: "bud-savings", side: "bottom" },
    ],
    // From the "New budget" button: press it, then the form.
    budCreate: [
      { id: "budCreate.open", anchor: "bud-new", clickToContinue: true, skipIf: "bud-form", side: "bottom" },
      ...formSteps("budCreate"),
    ],
    // The form, when it is already open (also inside the "+" window).
    // Oportunidades de crecimiento (its own page): where the money went and what it could have been, from the top down.
    budOpportunities: [
      { id: "budOpportunities.title", anchor: "opp-title", side: "bottom" },
      { id: "budOpportunities.lead", anchor: "opp-lead", side: "bottom" },
      { id: "budOpportunities.period", anchor: "opp-period", side: "bottom" },
      { id: "budOpportunities.sources", anchor: "opp-sources", optional: true, side: "right" },
      { id: "budOpportunities.advanced", anchor: "opp-advanced", optional: true, side: "right" },
      { id: "budOpportunities.share", anchor: "opp-share", side: "top" },
      { id: "budOpportunities.results", anchor: "opp-results", side: "left" },
      { id: "budOpportunities.goal", anchor: "opp-goal", side: "left" },
      { id: "budOpportunities.invest", anchor: "opp-invest", side: "left" },
      { id: "budOpportunities.trip", anchor: "opp-trip", side: "left" },
      { id: "budOpportunities.car", anchor: "opp-car", side: "left" },
    ],
    // Objetivos de ahorro (its own page): what a goal is, how to create one and how to read a card.
    budGoals: [
      { id: "budGoals.title", anchor: "goals-title", side: "bottom" },
      { id: "budGoals.new", anchor: "goals-new", side: "bottom" },
      { id: "budGoals.list", anchor: "goals-list", optional: true, side: "top" },
      { id: "budGoals.opportunities", anchor: "goals-opportunities", side: "top" },
    ],
    budForm: formSteps("budForm"),
    // The forms of the "+" window, one per type: each one lists only the fields that type shows, from the top down. The compass of
    // each form is beside its title in the window, and the form is already open, so the cards point straight at its fields.
    addBudget: [
      { id: "addBudget.name", text: "budCreate.name", anchor: "bud-form-name", side: "bottom" },
      { id: "addBudget.type", text: "budCreate.type", anchor: "bud-form-type", side: "bottom" },
      { id: "addBudget.amount", anchor: "bud-form-amount", side: "bottom" },
      { id: "addBudget.period", text: "budCreate.period", anchor: "bud-form-period", side: "top" },
      { id: "addBudget.categories", text: "budCreate.categories", anchor: "bud-form-categories", side: "top" },
      { id: "addBudget.save", text: "budCreate.save", anchor: "bud-form-save", side: "top" },
    ],
    addSaving: [
      { id: "addSaving.name", text: "budCreate.name", anchor: "bud-form-name", side: "bottom" },
      { id: "addSaving.type", text: "budCreate.type", anchor: "bud-form-type", side: "bottom" },
      { id: "addSaving.amount", anchor: "bud-form-amount", side: "bottom" },
      { id: "addSaving.manual", text: "budCreate.savingManual", anchor: "bud-form-saving-manual", side: "top" },
      { id: "addSaving.link", text: "budCreate.savingLink", anchor: "bud-form-saving-link", side: "top" },
      { id: "addSaving.save", text: "budCreate.save", anchor: "bud-form-save", side: "top" },
    ],
    addProject: [
      { id: "addProject.name", text: "budCreate.name", anchor: "bud-form-name", side: "bottom" },
      { id: "addProject.type", text: "budCreate.type", anchor: "bud-form-type", side: "bottom" },
      { id: "addProject.amount", anchor: "bud-form-amount", side: "bottom" },
      { id: "addProject.project", text: "budCreate.project", anchor: "bud-form-project", side: "top" },
      { id: "addProject.save", anchor: "bud-form-save", side: "top" },
    ],
    // The information window of a spending budget or a saving (the same modal). Every element of it, from the top down: the savings
    // banners and the first transaction only exist for some budgets, so they are optional. Nothing here is pressed by the tour.
    budDetail: [
      { id: "budDetail.header", anchor: "bud-detail-header", side: "bottom" },
      { id: "budDetail.progress", anchor: "bud-detail-progress", optional: true, side: "bottom" },
      { id: "budDetail.dist", anchor: "bud-detail-dist", optional: true, side: "top" },
      { id: "budDetail.movs", anchor: "bud-detail-movs", optional: true, side: "top" },
      { id: "budDetail.saving", anchor: "bud-detail-saving", optional: true, side: "top" },
      { id: "budDetail.row", anchor: "bud-detail-row", optional: true, side: "top" },
      { id: "budDetail.rowEdit", anchor: "bud-detail-row-edit", optional: true, side: "top" },
      { id: "budDetail.rowDelete", anchor: "bud-detail-row-delete", optional: true, side: "top" },
      { id: "budDetail.edit", anchor: "bud-detail-edit", optional: true, side: "top" },
    ],
    // The information window of a project. Its "Add an existing movement" window is opened by the tour (Next presses the button) and
    // folded again at the end; "Edit project" and "Create movement" are only pointed at, and so are the linked movements' buttons.
    budProjectDetail: [
      { id: "budProjectDetail.header", anchor: "bud-pdet-header", side: "bottom" },
      { id: "budProjectDetail.cards", anchor: "bud-pdet-cards", side: "bottom" },
      { id: "budProjectDetail.bar", anchor: "bud-pdet-bar", side: "bottom" },
      { id: "budProjectDetail.tags", anchor: "bud-pdet-tags", optional: true, side: "top" },
      { id: "budProjectDetail.edit", anchor: "bud-pdet-edit", optional: true, side: "top" },
      { id: "budProjectDetail.addOpen", anchor: "bud-pdet-add", optional: true, clickToContinue: true, skipIf: "bud-pdet-add-panel", side: "top" },
      { id: "budProjectDetail.search", anchor: "bud-pdet-search", optional: true, later: true, side: "top" },
      { id: "budProjectDetail.tagFirst", anchor: "bud-pdet-tagfirst", optional: true, later: true, side: "top" },
      { id: "budProjectDetail.candidates", anchor: "bud-pdet-candidates", optional: true, later: true, side: "top" },
      { id: "budProjectDetail.candidate", anchor: "bud-pdet-candidate", optional: true, later: true, side: "top" },
      // Folds the window again (Next presses the same button), so the window is back in its normal state.
      { id: "budProjectDetail.addClose", anchor: "bud-pdet-add", optional: true, clickToContinue: true, side: "top" },
      { id: "budProjectDetail.create", anchor: "bud-pdet-create", optional: true, side: "top" },
      { id: "budProjectDetail.linked", anchor: "bud-pdet-linked", optional: true, side: "top" },
      { id: "budProjectDetail.linkedEdit", anchor: "bud-pdet-linked-edit", optional: true, side: "top" },
      { id: "budProjectDetail.linkedUnlink", anchor: "bud-pdet-linked-unlink", optional: true, side: "top" },
    ],
    // The "Gasto sin presupuesto" window, from the top down. The categories it lists are folded: the first one is opened and closed
    // by the tour (its Next presses the header), so its contents are explained in place. Every card that needs a category or a
    // budget is optional: a window without them (covered, read-only, uncategorized) skips them.
    budUnbudgeted: [
      { id: "budUnbudgeted.header", anchor: "bud-unb-header", side: "bottom" },
      { id: "budUnbudgeted.range", anchor: "bud-unb-range", side: "bottom" },
      { id: "budUnbudgeted.outside", anchor: "bud-unb-outside", side: "bottom" },
      { id: "budUnbudgeted.share", anchor: "bud-unb-share", side: "bottom" },
      { id: "budUnbudgeted.help", anchor: "bud-unb-help", side: "bottom" },
      { id: "budUnbudgeted.covered", anchor: "bud-unb-covered", optional: true, side: "bottom" },
      { id: "budUnbudgeted.groups", anchor: "bud-unb-groups", optional: true, side: "top" },
      // Opens the first category (the person's Next presses it). Skipped when it is open already.
      { id: "budUnbudgeted.groupOpen", anchor: "bud-unb-group", optional: true, clickToContinue: true, skipIf: "bud-unb-body", side: "top" },
      { id: "budUnbudgeted.movements", anchor: "bud-unb-movements", optional: true, later: true, side: "top" },
      { id: "budUnbudgeted.project", anchor: "bud-unb-project", optional: true, later: true, side: "top" },
      { id: "budUnbudgeted.create", anchor: "bud-unb-create", optional: true, later: true, side: "top" },
      { id: "budUnbudgeted.assign", anchor: "bud-unb-assign", optional: true, later: true, side: "top" },
      { id: "budUnbudgeted.assignFirst", anchor: "bud-unb-assign-first", optional: true, later: true, side: "top" },
      // Folds the category again (the person's Next presses its header), so the window is back to its list.
      { id: "budUnbudgeted.groupClose", anchor: "bud-unb-group", optional: true, clickToContinue: true, side: "top" },
      // The other categories: opened and folded by the tour, like the first category.
      { id: "budUnbudgeted.catalogOpen", anchor: "bud-unb-catalog", optional: true, clickToContinue: true, skipIf: "bud-unb-catalog-list", side: "top" },
      { id: "budUnbudgeted.catalogList", anchor: "bud-unb-catalog-list", optional: true, later: true, side: "top" },
      { id: "budUnbudgeted.catalogClose", anchor: "bud-unb-catalog", optional: true, clickToContinue: true, side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
