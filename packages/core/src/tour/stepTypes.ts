// The shapes the step catalogs share. A step says which element it points at (by its data-tour value) and how the card behaves;
// the texts live in the "tour" i18n namespaces, keyed by the step id (tour.<id>.title and tour.<id>.body).

export type TourSide = "top" | "right" | "bottom" | "left";

export interface TourStep {
  // "<tour>.<name>": also the i18n key stem (tour.<id>.title and tour.<id>.body).
  id: string;
  // Another stem for the texts: the cards that say the same on every page (what the "?" is, what the compass is) share one text.
  text?: string;
  // The value of the element's data-tour attribute. A step without one is a centered card.
  anchor?: string;
  // Another data-tour value to use when the anchor is not on screen (the phone hides part of the navigation bar).
  fallback?: string;
  // Skipped when no anchor is on screen (for example, a button that only the signed-in view has).
  optional?: boolean;
  // Where the card goes relative to the element; `wide` is for screens from 768px up and `narrow` for the rest.
  side?: TourSide | { wide: TourSide; narrow: TourSide };
  // The card asks the person to press the highlighted control (a button that opens a window). Pressing it moves on, and the
  // card's own Next button presses it for them, so the steps that follow (inside that window) always find what they point at.
  clickToContinue?: boolean;
  // Skipped when an element with this data-tour value is already on screen (the step that opens a panel, when the panel is open).
  skipIf?: string;
  // The element does not exist yet when the tour starts: it appears after an earlier step (a panel or a window that card opens).
  // The step stays in the tour; the engine waits for its element when it gets there, and skips it if it never appears.
  later?: boolean;
  // How long to wait for the element to appear, in ms, when it is the first of a run of `later` steps. Absent: the engine's default.
  waitMs?: number;
}

// The first card of a tour that belongs to a page: a centered welcome without an anchor, so it opens by saying where the person is.
export const welcome = (tour: string): TourStep => ({ id: `${tour}.welcome` });

// The two cards that teach the help buttons. They come first on every page, because the explanations of the app live in them:
// the compass opens a step-by-step tutorial of a section, the question mark explains what a number or a section means.
export const tutorialTipStep = (tour: string): TourStep => ({ id: `${tour}.tutorialTip`, text: "common.tutorialTip", anchor: "tutorial-tip", optional: true, side: "bottom" });
export const infoTipStep = (tour: string): TourStep => ({ id: `${tour}.infoTip`, text: "common.infoTip", anchor: "info-tip", optional: true, side: "bottom" });

// The step that opens a collapsed panel: it points at the panel's title, and pressing it moves on. Skipped when the panel is open.
export const openPanelStep = (tour: string, header: string, body: string): TourStep => ({ id: `${tour}.open`, anchor: header, clickToContinue: true, skipIf: body, side: "bottom" });

export const stepTitleKey = (step: TourStep): string => `tour.${step.text ?? step.id}.title`;
export const stepBodyKey = (step: TourStep): string => `tour.${step.text ?? step.id}.body`;
