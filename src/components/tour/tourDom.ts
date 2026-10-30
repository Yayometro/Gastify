import { TOUR_STEPS, type TourId, type TourSide, type TourStep } from "@gastify/core/tour/tourSteps";

// What the engine needs to know about the page. The screens mark what a step points at with data-tour="<anchor>"; the same
// anchor may appear twice (the desktop bar and the phone's bar), so a step takes the first one that is actually on screen.

export function isShown(element: Element): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

export function findAnchor(anchor: string | undefined, root: ParentNode = document): HTMLElement | null {
  if (!anchor) return null;
  for (const element of root.querySelectorAll<HTMLElement>(`[data-tour="${anchor}"]`)) {
    if (isShown(element)) return element;
  }
  return null;
}

// The element of a step: its anchor, or the fallback when the anchor is not on screen (the phone's hidden bar items).
export function stepElement(step: TourStep, root: ParentNode = document): HTMLElement | null {
  return findAnchor(step.anchor, root) ?? findAnchor(step.fallback, root);
}

export function isWideScreen(): boolean {
  return window.matchMedia("(min-width: 768px)").matches;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function sideFor(step: TourStep, wide: boolean): TourSide | undefined {
  if (!step.side) return undefined;
  return typeof step.side === "string" ? step.side : wide ? step.side.wide : step.side.narrow;
}

// The steps of a tour that can be shown right now: the cards without an anchor, the ones whose element is on screen, and the
// ones that point at something an earlier card opens (and
// that the screen does not make pointless: the step that opens a panel is skipped when the panel is already open).
export function availableSteps(id: TourId, root: ParentNode = document): TourStep[] {
  return TOUR_STEPS[id].filter((step) => (!step.anchor || step.later || stepElement(step, root)) && !(step.skipIf && findAnchor(step.skipIf, root)));
}

// Waits until `ready()` is true, checking every `interval` ms, and gives up after `timeout` ms. Resolves with whether it was ready.
export function waitUntil(ready: () => boolean, timeout: number, interval = 120): Promise<boolean> {
  return new Promise((resolve) => {
    if (ready()) return resolve(true);
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (ready()) {
        window.clearInterval(timer);
        resolve(true);
      } else if (Date.now() - started >= timeout) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
}

// A page is ready for its tour when the first element a step points at is on screen (screens render their data after the load).
// A step that its own skipIf already skips does not count: a form tour started while its form is open does not wait for the
// button that opens that form (the forms of the "+" window are open already, and have no such button).
export function firstAnchorShown(id: TourId, root: ParentNode = document): boolean {
  const first = TOUR_STEPS[id].find((step) => step.anchor && !step.optional && !(step.skipIf && findAnchor(step.skipIf, root)));
  return !first || Boolean(stepElement(first, root));
}
