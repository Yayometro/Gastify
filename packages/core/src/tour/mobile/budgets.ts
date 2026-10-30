import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The budget form's fields: the ones a kind does not show are optional, so the tutorial skips them. The detail shows the same form.
const budgetForm: TourStep[] = [
  { id: "m-budform.open", anchor: "m-budform-open", clickToContinue: true, skipIf: "m-budform-name", side: "bottom" },
  { id: "m-budform.name", anchor: "m-budform-name", later: true, side: "bottom" },
  { id: "m-budform.currency", anchor: "m-budform-currency", side: "top" },
  { id: "m-budform.goal", anchor: "m-budform-goal", side: "top" },
  { id: "m-budform.period", anchor: "m-budform-period", optional: true, side: "top" },
  { id: "m-budform.categories", anchor: "m-budform-categories", optional: true, side: "top" },
  { id: "m-budform.accounts", anchor: "m-budform-accounts", optional: true, side: "top" },
  { id: "m-budform.saved", anchor: "m-budform-saved", optional: true, side: "top" },
  { id: "m-budform.start", anchor: "m-budform-start", optional: true, side: "top" },
  { id: "m-budform.end", anchor: "m-budform-end", optional: true, side: "top" },
  { id: "m-budform.icon", anchor: "m-budform-icon", optional: true, side: "top" },
  { id: "m-budform.save", anchor: "m-budform-save", side: "top" },
];

// The detail repeats the form's steps under its own ids, and reads the same texts.
const formInDetail: TourStep[] = budgetForm.map((step) => ({ ...step, id: step.id.replace("m-budform.", "m-bud-detail.form."), text: step.id }));

// The budgets: create one, choose the period, the two totals and then one card per spending budget, saving and project.
// Its in-depth tutorials, one per component, are listed in `components`.
export const budgetsTours = {
  page: [
    mWelcome("mBudgets"),
    mTutorialTipStep("mBudgets"),
    mInfoTipStep("mBudgets"),
    { id: "mBudgets.new", anchor: "m-bud-new", side: "bottom" },
    { id: "mBudgets.period", anchor: "m-bud-period", side: "bottom" },
    { id: "mBudgets.summary", anchor: "m-bud-summary", side: "bottom" },
    { id: "mBudgets.order", anchor: "m-bud-order", side: "bottom" },
    { id: "mBudgets.spending", anchor: "m-bud-spending", optional: true, side: "bottom" },
    { id: "mBudgets.savings", anchor: "m-bud-savings", optional: true, side: "top" },
    { id: "mBudgets.projects", anchor: "m-bud-projects", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-bud-new": [{ id: "m-bud-new.what", anchor: "m-bud-new", side: "bottom" }],
    "m-bud-period": [{ id: "m-bud-period.what", anchor: "m-bud-period", side: "bottom" }],
    "m-bud-summary": [{ id: "m-bud-summary.what", anchor: "m-bud-summary", side: "bottom" }],
    "m-bud-order": [{ id: "m-bud-order.what", anchor: "m-bud-order", side: "bottom" }],
    "m-bud-spending": [{ id: "m-bud-spending.what", anchor: "m-bud-spending", side: "bottom" }],
    "m-bud-savings": [{ id: "m-bud-savings.what", anchor: "m-bud-savings", side: "bottom" }],
    "m-bud-projects": [{ id: "m-bud-projects.what", anchor: "m-bud-projects", side: "bottom" }],
    "m-bud-unbudgeted": [
      { id: "m-bud-unbudgeted.what", anchor: "m-bud-sheet-total", side: "bottom" },
      { id: "m-bud-unbudgeted.addAll", anchor: "m-bud-sheet-general-add", optional: true, side: "top" },
      // Opens the first category (Next presses it). Inside it, the total, the add button and the transactions are explained in place;
      // the back arrow is pressed by Next, so the list is shown again for "Listo" and the X.
      { id: "m-bud-unbudgeted.group", anchor: "m-bud-sheet-group", optional: true, clickToContinue: true, side: "top" },
      { id: "m-bud-unbudgeted.groupTotal", anchor: "m-bud-sheet-group-total", optional: true, later: true, side: "bottom" },
      { id: "m-bud-unbudgeted.add", anchor: "m-bud-sheet-add", optional: true, later: true, side: "top" },
      { id: "m-bud-unbudgeted.movement", anchor: "m-bud-sheet-movement", optional: true, later: true, side: "top" },
      { id: "m-bud-unbudgeted.back", anchor: "m-bud-sheet-back", optional: true, clickToContinue: true, side: "bottom" },
      { id: "m-bud-unbudgeted.done", anchor: "m-bud-sheet-done", optional: true, later: true, side: "top" },
      { id: "m-bud-unbudgeted.close", anchor: "m-bud-sheet-close", side: "bottom" },
    ],
    "m-budform": budgetForm,
    "m-bud-detail": [
      { id: "m-bud-detail.spent", anchor: "m-bud-detail-spent", side: "bottom" },
      { id: "m-bud-detail.distribution", anchor: "m-bud-detail-distribution", optional: true, side: "bottom" },
      { id: "m-bud-detail.movements", anchor: "m-bud-detail-movements", optional: true, side: "top" },
      ...formInDetail,
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
