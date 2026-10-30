import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The wallet analyzer: one month in depth. Everything is calculated for the month chosen on top.
// Its in-depth tutorials, one per component, are listed in `components`.
export const analyzerTours = {
  page: [
    mWelcome("mAnalyzer"),
    mTutorialTipStep("mAnalyzer"),
    mInfoTipStep("mAnalyzer"),
    { id: "mAnalyzer.month", anchor: "m-ana-month", side: "bottom" },
    { id: "mAnalyzer.compare", anchor: "m-ana-compare", optional: true, side: "bottom" },
    { id: "mAnalyzer.averages", anchor: "m-ana-averages", optional: true, side: "bottom" },
    { id: "mAnalyzer.trend", anchor: "m-ana-trend", optional: true, side: "bottom" },
    { id: "mAnalyzer.top", anchor: "m-ana-top", optional: true, side: "bottom" },
    { id: "mAnalyzer.subs", anchor: "m-ana-subs", optional: true, side: "top" },
    { id: "mAnalyzer.pace", anchor: "m-ana-pace", optional: true, side: "top" },
    { id: "mAnalyzer.accounts", anchor: "m-ana-accounts", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-ana-month": [
      { id: "m-ana-month.arrows", anchor: "m-ana-month", side: "bottom" },
    ],
    "m-ana-accounts": [
      { id: "m-ana-accounts.what", anchor: "m-ana-accounts", side: "bottom" },
      { id: "m-ana-accounts.tiles", anchor: "m-ana-accounts-tiles", optional: true, side: "bottom" },
      { id: "m-ana-accounts.flow", anchor: "m-ana-accounts-flow", optional: true, side: "top" },
      { id: "m-ana-accounts.history", anchor: "m-ana-accounts-history", optional: true, side: "top" },
    ],
    "m-ana-trend": [
      { id: "m-ana-trend.what", anchor: "m-ana-trend", side: "bottom" },
      { id: "m-ana-trend.chart", anchor: "m-ana-trend-chart", optional: true, side: "top" },
    ],
    // The Top card, from the top down: how many, the first category (its press opens the detail), the detail itself (its head, total
    // and groups, the same steps as the category's own tutorial), its close, and then the whole lists of the Top.
    "m-ana-top": [
      { id: "m-ana-top.what", anchor: "m-ana-top", side: "bottom" },
      { id: "m-ana-top.size", anchor: "m-ana-top-size", optional: true, side: "bottom" },
      { id: "m-ana-top.row", anchor: "m-ana-top-row", clickToContinue: true, skipIf: "m-catdetail-close", side: "top" },
      { id: "m-ana-top.detail", anchor: "m-catdetail-head", fallback: "m-catdetail-total", later: true, side: "bottom" },
      { id: "m-ana-top.total", text: "m-catdetail.total", anchor: "m-catdetail-total", optional: true, side: "bottom" },
      { id: "m-ana-top.group", text: "m-catdetail.group", anchor: "m-catdetail-group", optional: true, later: true, side: "top" },
      { id: "m-ana-top.close", anchor: "m-catdetail-close", optional: true, later: true, clickToContinue: true, side: "bottom" },
      { id: "m-ana-top.cats", anchor: "m-ana-top-cats", side: "top" },
      { id: "m-ana-top.txs", anchor: "m-ana-top-txs", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
