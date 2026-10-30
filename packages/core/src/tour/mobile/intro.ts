import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The welcome: how to move around the phone's app. The bottom bar is on every screen (on a tablet it is the column at the left), so it
// works from wherever it starts. The wide bar of the biggest phones also holds Proyecciones and the Analizador; those cards are skipped
// when the bar does not have them.
export const mIntroTour: readonly TourStep[] = [
  mWelcome("mIntro"),
  mInfoTipStep("mIntro"),
  mTutorialTipStep("mIntro"),
  { id: "mIntro.home", anchor: "m-tab-home", side: "top" },
  { id: "mIntro.movements", anchor: "m-tab-movements", side: "top" },
  { id: "mIntro.projections", anchor: "m-tab-projections", optional: true, side: "top" },
  { id: "mIntro.add", anchor: "m-tab-add", side: "top" },
  { id: "mIntro.budgets", anchor: "m-tab-budgets", side: "top" },
  { id: "mIntro.analyzer", anchor: "m-tab-analyzer", optional: true, side: "top" },
  { id: "mIntro.more", anchor: "m-tab-more", side: "top" },
  { id: "mIntro.bell", anchor: "m-bell", optional: true, side: "bottom" },
  { id: "mIntro.again" },
];
