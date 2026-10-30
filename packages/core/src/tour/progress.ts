import type { TourStep } from "./stepTypes";

// What a card says about where the person is in its tour: "3 of 9", or just "Step 3" while the count cannot be known yet. The count only
// includes the cards that exist now (`present[i]`: the card has no anchor or its control is on screen). The cards inside a panel or a
// window that this card (or a later one) is about to open do not exist yet, so while one is pending the count stays open ("Step 2") and
// becomes exact once the window is there ("3 of 9"): it never jumps from "2 of 2" to "3 of 11".
export interface Progress {
  // The position of the current card among the cards that exist.
  shown: number;
  // How many cards exist now; meaningless while `open`.
  total: number;
  // True while a card that a click-to-continue card opens is still pending.
  open: boolean;
}

export function progressFor(steps: readonly TourStep[], present: readonly boolean[], index: number): Progress {
  const exists = steps.map((_, position) => position === index || present[position]);
  const opensLater = (position: number) => steps.some((earlier, before) => before >= index && before < position && earlier.clickToContinue);
  const open = steps.some((step, position) => step.later && !exists[position] && opensLater(position));
  const shown = exists.slice(0, index + 1).filter(Boolean).length;
  const total = exists.filter(Boolean).length;
  return { shown, total, open };
}
