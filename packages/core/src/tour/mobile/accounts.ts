import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The account form's fields. The detail repeats them under its own ids and reads the same texts.
const accountForm: TourStep[] = [
  { id: "m-accform.name", anchor: "m-accform-name", side: "bottom" },
  { id: "m-accform.type", anchor: "m-accform-type", side: "bottom" },
  { id: "m-accform.currency", anchor: "m-accform-currency", side: "top" },
  { id: "m-accform.balance", anchor: "m-accform-balance", side: "top" },
  { id: "m-accform.bank", anchor: "m-accform-bank", side: "top" },
  { id: "m-accform.card", anchor: "m-accform-card", side: "top" },
  { id: "m-accform.save", anchor: "m-accform-save", side: "top" },
];
// In the detail the form appears when the person opens "Editar": its steps wait for it (later) and read the same texts.
const accountFormInDetail: TourStep[] = accountForm.map((step) => ({ ...step, id: step.id.replace("m-accform.", "m-acc-detail.form."), text: step.id, later: true }));

// The accounts: create one, the total and one card per account that opens its detail.
// Its in-depth tutorials, one per component, are listed in `components`.
export const accountsTours = {
  page: [
    mWelcome("mAccounts"),
    mTutorialTipStep("mAccounts"),
    mInfoTipStep("mAccounts"),
    { id: "mAccounts.new", anchor: "m-acc-new", side: "bottom" },
    { id: "mAccounts.total", anchor: "m-acc-total", optional: true, side: "bottom" },
    { id: "mAccounts.card", anchor: "m-acc-card", optional: true, side: "bottom" },
    { id: "mAccounts.reorder", anchor: "m-acc-reorder", optional: true, side: "left" },
  ] satisfies readonly TourStep[],
  components: {
    "m-acc-new": [{ id: "m-acc-new.what", anchor: "m-acc-new", side: "bottom" }],
    "m-acc-card": [{ id: "m-acc-card.what", anchor: "m-acc-card", side: "bottom" }],
    "m-acc-reorder": [{ id: "m-acc-reorder.what", anchor: "m-acc-reorder", side: "bottom" }],
    "m-accform": accountForm,
    // The detail of an account, from the top down: the whole card, then each part of it, the edition (opened by "Editar"), the period,
    // the summary, the Top of this account (its steps are the Top's own: a category opens its detail, which is explained and closed),
    // the account's movements and, last, the delete link, which is only pointed at.
    "m-acc-detail": [
      { id: "m-acc-detail.card", anchor: "m-acc-detail-card", side: "bottom" },
      { id: "m-acc-detail.bank", anchor: "m-acc-detail-part-bank", optional: true, side: "bottom" },
      { id: "m-acc-detail.name", anchor: "m-acc-detail-part-name", side: "bottom" },
      { id: "m-acc-detail.type", anchor: "m-acc-detail-part-type", side: "bottom" },
      { id: "m-acc-detail.currency", anchor: "m-acc-detail-part-currency", side: "bottom" },
      { id: "m-acc-detail.balance", anchor: "m-acc-detail-part-balance", side: "bottom" },
      { id: "m-acc-detail.number", anchor: "m-acc-detail-part-number", optional: true, side: "bottom" },
      { id: "m-acc-detail.activity", anchor: "m-acc-detail-part-activity", side: "top" },
      { id: "m-acc-detail.edit", anchor: "m-acc-detail-edit", clickToContinue: true, skipIf: "m-accform-name", side: "bottom" },
      { id: "m-acc-detail.color", anchor: "m-acc-detail-color", optional: true, later: true, side: "top" },
      ...accountFormInDetail,
      { id: "m-acc-detail.period", anchor: "m-acc-detail-period", side: "bottom" },
      { id: "m-acc-detail.summary", anchor: "m-home-breakdown", text: "m-home-breakdown.what", optional: true, side: "top" },
      { id: "m-acc-detail.top", anchor: "m-home-top", text: "m-acc-detail.top", optional: true, side: "bottom" },
      { id: "m-acc-detail.topSize", anchor: "m-home-top-size", text: "m-home-top.size", optional: true, side: "bottom" },
      { id: "m-acc-detail.topRow", anchor: "m-home-top-row", text: "m-ana-top.row", clickToContinue: true, skipIf: "m-catdetail-close", optional: true, side: "top" },
      { id: "m-acc-detail.topDetail", anchor: "m-catdetail-head", fallback: "m-catdetail-total", text: "m-ana-top.detail", optional: true, later: true, side: "bottom" },
      { id: "m-acc-detail.topClose", anchor: "m-catdetail-close", text: "m-ana-top.close", optional: true, later: true, clickToContinue: true, side: "bottom" },
      { id: "m-acc-detail.movements", anchor: "m-acc-detail-movements", side: "top" },
      { id: "m-acc-detail.delete", anchor: "m-acc-detail-delete", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
