import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The welcome: how to move around. It is not a page; it points at the navigation bar, which every page has. Right after the
// welcome it teaches the two help buttons, because the explanations of the app live in them.
export const introTour = [
  welcome("intro"),
  infoTipStep("intro"),
  tutorialTipStep("intro"),
    { id: "intro.bar", anchor: "nav-bar", side: { wide: "right", narrow: "top" } },
    { id: "intro.add", anchor: "nav-add", side: { wide: "right", narrow: "top" } },
    { id: "intro.notifications", anchor: "nav-notifications", optional: true, side: { wide: "right", narrow: "top" } },
    { id: "intro.profile", anchor: "nav-profile", side: { wide: "right", narrow: "top" } },
] satisfies readonly TourStep[];
