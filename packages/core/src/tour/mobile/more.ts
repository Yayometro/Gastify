import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The "Más" menu: the sections that are not in the bottom bar.
// Its in-depth tutorials, one per component, are listed in `components`.
export const moreTours = {
  page: [
    mWelcome("mMore"),
    mTutorialTipStep("mMore"),
    mInfoTipStep("mMore"),
    { id: "mMore.menu", anchor: "m-more-menu", side: "bottom" },
    { id: "mMore.tutorial", anchor: "m-more-tutorial", side: "bottom" },
    { id: "mMore.appearance", anchor: "m-more-appearance", optional: true, side: "top" },
    { id: "mMore.signOut", anchor: "m-more-signout", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    // Gastos recurrentes: the list of the rules and what each one can do.
    // Personas: the button that adds one, then the cards.
    "m-people": [
      { id: "m-people.add", anchor: "m-people-add", side: "bottom" },
      { id: "m-people.what", anchor: "m-people-first", optional: true, side: "bottom" },
    ],
    "m-recurring": [
      { id: "m-recurring.list", anchor: "m-recurring-first", side: "bottom" },
      { id: "m-recurring.actions", anchor: "m-recurring-first", optional: true, side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
