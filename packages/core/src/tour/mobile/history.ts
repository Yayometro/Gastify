import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The history: choose the period and what to compare it with; every card below follows that choice.
// Its in-depth tutorials, one per component, are listed in `components`.
export const historyTours = {
  // The screen from the top down, in the order of its cards: the period, the comparison, the summary, the period's facts, the second
  // summary (the phone shows it as its own card), the month by month, the spending and the income by category, the big expenses,
  // the recurring subscriptions, the budgets of the period, the projections and, last, the Top 6 (the list at the bottom).
  page: [
    mWelcome("mHistory"),
    mTutorialTipStep("mHistory"),
    mInfoTipStep("mHistory"),
    { id: "mHistory.period", anchor: "m-his-period", side: "bottom" },
    { id: "mHistory.compare", anchor: "m-his-compare", side: "bottom" },
    { id: "mHistory.summary", anchor: "m-his-summary", optional: true, side: "bottom" },
    { id: "mHistory.facts", anchor: "m-his-facts", optional: true, side: "bottom" },
    { id: "mHistory.months", anchor: "m-his-months", optional: true, side: "top" },
    { id: "mHistory.spending", text: "mHistory.categories", anchor: "m-his-spending", optional: true, side: "top" },
    { id: "mHistory.incomes", text: "mHistory.incomesCat", anchor: "m-his-incomes", optional: true, side: "top" },
    { id: "mHistory.big", text: "mHistory.bigOnly", anchor: "m-his-big", optional: true, side: "top" },
    { id: "mHistory.subs", anchor: "m-his-subs", optional: true, side: "top" },
    { id: "mHistory.budgets", anchor: "m-his-budgets", optional: true, side: "top" },
    { id: "mHistory.projections", anchor: "m-his-projections", optional: true, side: "top" },
    { id: "mHistory.top", text: "mHistory.top", anchor: "m-home-top", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-his-period": [{ id: "m-his-period.what", anchor: "m-his-period", side: "bottom" }],
    "m-his-compare": [{ id: "m-his-compare.what", anchor: "m-his-compare", side: "bottom" }],
    "m-his-summary": [{ id: "m-his-summary.what", anchor: "m-his-summary", side: "bottom" }],
    "m-his-facts": [{ id: "m-his-facts.what", anchor: "m-his-facts", side: "bottom" }],
    "m-his-months": [{ id: "m-his-months.what", anchor: "m-his-months", side: "bottom" }],
    "m-his-categories": [{ id: "m-his-categories.what", anchor: "m-his-categories", side: "bottom" }],
    "m-his-budgets": [{ id: "m-his-budgets.what", anchor: "m-his-budgets", side: "bottom" }],
    "m-his-big": [{ id: "m-his-big.what", anchor: "m-his-big", side: "bottom" }],
    "m-his-projections": [{ id: "m-his-projections.what", anchor: "m-his-projections", side: "bottom" }],
  } satisfies Record<string, readonly TourStep[]>,
};
