import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The phone's Inicio, from the top down: the period, the totals, the accounts, the highlights, the breakdown, the top, the budgets and
// the latest movements. Each section has its own tutorial (its id is the anchor of its first card), listed in the tutorial menu.
export const homeTours = {
  page: [
    mWelcome("mHome"),
    mTutorialTipStep("mHome"),
    mInfoTipStep("mHome"),
    { id: "mHome.period", anchor: "m-home-period", side: "bottom" },
    { id: "mHome.summary", anchor: "m-home-summary", optional: true, side: "bottom" },
    { id: "mHome.accounts", anchor: "m-home-accounts", optional: true, side: "bottom" },
    { id: "mHome.insights", anchor: "m-home-insights", optional: true, side: "bottom" },
    { id: "mHome.breakdown", anchor: "m-home-breakdown", optional: true, side: "bottom" },
    { id: "mHome.top", anchor: "m-home-top", optional: true, side: "bottom" },
    { id: "mHome.budgets", anchor: "m-home-budgets", optional: true, side: "top" },
    { id: "mHome.latest", anchor: "m-home-latest", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-home-period": [{ id: "m-home-period.what", anchor: "m-home-period", side: "bottom" }],
    "m-home-summary": [{ id: "m-home-summary.what", anchor: "m-home-summary", side: "bottom" }],
    "m-home-accounts": [
      { id: "m-home-accounts.what", anchor: "m-home-accounts", side: "bottom" },
      { id: "m-home-accounts.cards", anchor: "m-home-accounts-carousel", optional: true, side: "top" },
    ],
    "m-home-insights": [
      { id: "m-home-insights.link", anchor: "m-home-insights-link", side: "bottom" },
      { id: "m-home-insights.info", anchor: "m-home-insights-info", optional: true, side: "bottom" },
      { id: "m-home-insights.cards", anchor: "m-home-insights-cards", side: "top" },
    ],
    "m-home-breakdown": [
      { id: "m-home-breakdown.what", anchor: "m-home-breakdown", side: "top" },
      { id: "m-home-breakdown.time", anchor: "m-home-breakdown-time", optional: true, side: "bottom" },
      { id: "m-home-breakdown.kind", anchor: "m-home-breakdown-kind", optional: true, side: "bottom" },
      { id: "m-home-breakdown.chart", anchor: "m-home-breakdown-chart-type", optional: true, side: "bottom" },
      { id: "m-home-breakdown.table", anchor: "m-home-breakdown-table", optional: true, side: "top" },
      { id: "m-home-breakdown.more", anchor: "m-home-breakdown-more", optional: true, side: "top" },
    ],
    // The Top card (Home and the history), in the order of the card: what it is, how many, the first category (its press opens the
    // detail), the detail with its total and groups, its close, the whole category list, and then the movements (the card's tab
    // is pressed for the person, since the list shows one of the two at a time).
    "m-home-top": [
      { id: "m-home-top.what", anchor: "m-home-top", side: "bottom" },
      { id: "m-home-top.size", anchor: "m-home-top-size", side: "bottom" },
      { id: "m-home-top.row", text: "m-ana-top.row", anchor: "m-home-top-row", clickToContinue: true, skipIf: "m-catdetail-close", side: "top" },
      { id: "m-home-top.detail", anchor: "m-catdetail-head", fallback: "m-catdetail-total", later: true, text: "m-ana-top.detail", side: "bottom" },
      { id: "m-home-top.total", text: "m-catdetail.total", anchor: "m-catdetail-total", optional: true, side: "bottom" },
      { id: "m-home-top.group", text: "m-catdetail.group", anchor: "m-catdetail-group", optional: true, later: true, side: "top" },
      { id: "m-home-top.close", text: "m-ana-top.close", anchor: "m-catdetail-close", optional: true, later: true, clickToContinue: true, side: "bottom" },
      { id: "m-home-top.cats", text: "m-ana-top.cats", anchor: "m-home-top-cats", optional: true, side: "top" },
      { id: "m-home-top.tabTxs", anchor: "m-home-top-tab-movements", clickToContinue: true, skipIf: "m-home-top-txs", side: "top" },
      { id: "m-home-top.txs", text: "m-ana-top.txs", anchor: "m-home-top-txs", optional: true, later: true, side: "top" },
    ],
    "m-home-latest": [
      { id: "m-home-latest.all", anchor: "m-home-latest-all", side: "bottom" },
      { id: "m-home-latest.list", anchor: "m-home-latest-list", optional: true, side: "top" },
    ],
    "m-notif": [
      { id: "m-notif.what", anchor: "m-notif-list", side: "bottom" },
      { id: "m-notif.item", anchor: "m-notif-item", optional: true, side: "bottom" },
      { id: "m-notif.clear", anchor: "m-notif-clear", optional: true, side: "bottom" },
    ],
    "m-catdetail": [
      { id: "m-catdetail.total", anchor: "m-catdetail-total", side: "bottom" },
      { id: "m-catdetail.sort", anchor: "m-catdetail-sort", optional: true, side: "bottom" },
      { id: "m-catdetail.group", anchor: "m-catdetail-group", optional: true, side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
