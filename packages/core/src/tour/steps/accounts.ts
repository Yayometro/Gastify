import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The accounts page. Its own tour goes from the top down, one card per section; the tutorials below explain each section in depth.
// The form to create or edit an account opens in a window from the buttons under the account's name: its tutorial presses "New account".
export const accountsTours = {
  page: [
    welcome("accounts"),
    tutorialTipStep("accounts"),
    infoTipStep("accounts"),
    { id: "accounts.filters", anchor: "acc-filters", side: "bottom" },
    { id: "accounts.currency", anchor: "acc-currency", optional: true, side: "bottom" },
    { id: "accounts.cards", anchor: "acc-cards", side: "bottom" },
    { id: "accounts.detail", anchor: "acc-detail", side: "bottom" },
    { id: "accounts.actions", anchor: "acc-actions", optional: true, side: "bottom" },
    // The account's summary (the Wallet's breakdown, for this account's movements), its top, then its list of movements.
    { id: "accounts.summary", anchor: "acc-summary", side: "top" },
    { id: "accounts.top", anchor: "acc-top", side: "top" },
    { id: "accounts.list", anchor: "acc-list", side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    accPeriod: [
      { id: "accPeriod.select", anchor: "acc-period-select", side: "bottom" },
      { id: "accPeriod.range", anchor: "acc-period-range", side: "bottom" },
    ],
    accCards: [
      { id: "accCards.title", anchor: "dash-accounts-title", side: "bottom" },
      { id: "accCards.strip", anchor: "dash-accounts-cards", side: "bottom" },
      { id: "accCards.top", anchor: "acc-card-top", side: "bottom" },
      { id: "accCards.balance", anchor: "acc-card-balance", side: "right" },
      { id: "accCards.number", anchor: "acc-card-number", optional: true, side: "right" },
      { id: "accCards.flow", anchor: "acc-card-flow", side: "top" },
    ],
    accDetail: [
      { id: "accDetail.carousel", anchor: "acc-detail", side: "bottom" },
      { id: "accDetail.edit", anchor: "acc-edit", optional: true, side: "bottom" },
      { id: "accDetail.new", anchor: "acc-new", optional: true, side: "bottom" },
    ],
    // From the "New account" button: press it, then the form.
    accForm: [
      { id: "accForm.open", anchor: "acc-new", clickToContinue: true, skipIf: "acc-form", side: "bottom" },
      { id: "accForm.name", anchor: "acc-form-name", later: true, side: "left" },
      { id: "accForm.balance", anchor: "acc-form-balance", later: true, side: "left" },
      { id: "accForm.currency", anchor: "acc-form-currency", later: true, side: "left" },
      { id: "accForm.bank", anchor: "acc-form-bank", later: true, side: "left" },
      { id: "accForm.number", anchor: "acc-form-number", later: true, side: "left" },
      { id: "accForm.type", anchor: "acc-form-type", later: true, side: "left" },
      { id: "accForm.submit", anchor: "acc-form-submit", later: true, side: "left" },
    ],
    accSummary: [
      { id: "accSummary.what", anchor: "acc-summary", side: "top" },
      { id: "accSummary.filters", anchor: "acc-summary-filters", side: "bottom" },
    ],
    accList: [
      { id: "accList.what", anchor: "acc-list", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
