import type { DriveStep, Driver, PopoverDOM } from "driver.js";
import type { TranslateFn } from "@gastify/core/i18n/translate";
import {
  FULL_TOUR,
  isDemoPath,
  pageForPath,
  pathForPage,
  stepBodyKey,
  stepTitleKey,
  type SectionTourId,
  type TourId,
  type TourPage,
  type TourStep,
} from "@gastify/core/tour/tourSteps";
import type { ResumePoint } from "@gastify/core/tour/onboarding";
import { availableSteps, firstAnchorShown, isWideScreen, prefersReducedMotion, sideFor, stepElement, waitUntil } from "./tourDom";
import { clearRun, takePendingRun, writeRun } from "./tourRun";

// The tour, without React: it puts the spotlight over one element at a time and walks from page to page. driver.js draws the
// overlay and the card (placement, scrolling, keyboard); this decides which steps exist and what each button does. It lives
// outside the component so that its pieces can call each other freely and so it can be tested with a stand-in for driver.js.

export interface TourHost {
  translate: TranslateFn;
  // The path of the page now (read when it is needed, never kept).
  pathname: () => string;
  navigate: (path: string) => void;
  onRunningChange: (running: boolean) => void;
  // The card now on screen (the account remembers it to continue there).
  onProgress?: (tour: TourId, step: string) => void;
  // The walk through every section reached its last card.
  onComplete?: () => void;
}

export interface TourEngine {
  mount: () => void;
  unmount: () => void;
  // Runs the tour at `position` of `list`, starting at the card `startStep` (the first one when absent). A list of one is a single
  // tour; the full tour is a list of all of them.
  launch: (list: readonly TourId[], position: number, startStep?: string) => Promise<void>;
  stop: () => void;
  isRunning: () => boolean;
  // "Continue where I left off": runs the tour at the resume point, going to its page first when it is not the one on screen.
  resume: (point: ResumePoint) => void;
  // The page changed: a tour left open on the old page ends, and a walk that navigated here starts this page's tour.
  onPathChange: (pathname: string) => void;
  // Gives the engine the latest language, router and path (the component calls it after every render).
  setHost: (next: TourHost) => void;
}

// How long the first card inside a panel or window waits for it to open (ms).
const LATER_WAIT_MS = 3000;

// How long a page gets to draw the first thing its tour points at (screens render their data after the load).
const PAGE_READY_MS = 4000;

function isSectionTour(id: TourId): id is SectionTourId {
  return (FULL_TOUR as readonly TourId[]).includes(id);
}

// True for the list of every tour, in order: the walk through the whole app.
function isFullWalk(list: readonly TourId[]): boolean {
  return list.length === FULL_TOUR.length && list.every((id, index) => id === FULL_TOUR[index]);
}

// An element that takes most of the screen's height: the card cannot sit beside all of it.
function isTall(step: TourStep): boolean {
  const element = stepElement(step);
  return Boolean(element) && element!.getBoundingClientRect().height > window.innerHeight * 0.6;
}

export function createTourEngine(initialHost: TourHost): TourEngine {
  let host = initialHost;
  let active: Driver | null = null;
  // Every launch takes a new token; a slower, older launch sees it changed and gives up.
  let token = 0;
  let mounted = false;
  // The last card reported, so showing the same card again (Back, then Next) does not call the server again.
  let lastReported = "";

  function destroyActive(): void {
    active?.destroy();
    active = null;
    host.onRunningChange(false);
  }

  // Moves the walk to the tour after `position`: stays on the page when it already is the right one, goes there when it is not.
  function goToNext(list: readonly TourId[], position: number): void {
    const next = list[position + 1];
    if (!next) {
      clearRun();
      if (isFullWalk(list)) host.onComplete?.();
      return;
    }
    const here = host.pathname();
    const target = pathForPage(next as TourPage, isDemoPath(here));
    writeRun({ list: [...list], position: position + 1, pending: true });
    if (here === target) {
      const run = takePendingRun();
      if (run) void launch(run.list, run.position, run.step);
    } else {
      host.navigate(target);
    }
  }

  async function launch(list: readonly TourId[], position: number, startStep?: string): Promise<void> {
    const mine = ++token;
    if (active) destroyActive();
    const id = list[position];
    await waitUntil(() => firstAnchorShown(id), PAGE_READY_MS);
    const { driver } = await import("driver.js");
    if (mine !== token || !mounted) return;

    const steps = availableSteps(id);
    if (steps.length === 0) return;
    const { translate } = host;
    const wide = isWideScreen();
    const reduced = prefersReducedMotion();
    const hasMore = position < list.length - 1;
    const inFullTour = list.length > 1;

    // What Next does on a card: it presses the control a click-to-continue card asks for (that click moves on), else it moves on.
    const advanceFrom = (step: TourStep) => (element: Element | undefined, _step: unknown, options: { driver: Driver }) => {
      if (step.clickToContinue && element instanceof HTMLElement) element.click();
      else options.driver.moveNext();
    };

    const driveSteps: DriveStep[] = steps.map((step, index) => ({
      data: { id: step.id, click: Boolean(step.clickToContinue) },
      // Looked up when the step is shown, so it is whichever element is on screen then. A missing one is skipped.
      element: step.anchor ? () => stepElement(step) as Element : undefined,
      // A step inside a window that an earlier card opens: the first of them waits for the window; the ones after it do not (if the
      // window never came, they are skipped at once instead of one wait each). A card that presses something (clickToContinue) can
      // open a window in the same moment it moves on, so the card after it waits even when that card is itself a later one.
      ...(step.later ? { waitForElement: !steps[index - 1]?.later || steps[index - 1]?.clickToContinue ? step.waitMs ?? LATER_WAIT_MS : 0 } : {}),
      // A card that asks for a click leaves its element usable. Pressing it moves the tour on (see onHighlighted: the control opens a
      // panel or a window, and the next cards point inside it).
      ...(step.clickToContinue ? { disableActiveInteraction: false } : {}),
      popover: {
        title: translate(stepTitleKey(step)),
        description: translate(stepBodyKey(step)),
        side: sideFor(step, wide),
        // Next to a tall element the card starts at its top (where the eye lands) instead of floating at its middle.
        align: isTall(step) ? ("start" as const) : ("center" as const),
        ...(index === steps.length - 1
          ? // The last card leads on to the next section of the walk, or ends it.
            { doneBtnText: hasMore ? translate("tour.ui.nextSection") : translate("tour.ui.done") }
          : {
              // driver.js counts the cards whose element is not on screen yet (inside a panel or window a card will open) as not
              // there, so it can take a card that is not the last one for the last one: its button then says Done and runs the
              // Done hook. Both are set here so such a card still reads "Next" and moves on.
              doneBtnText: translate("tour.ui.next"),
              onDoneClick: advanceFrom(step),
            }),
        // A card that asks for a click: its Next presses the control for the person, which moves the tour on as if they had.
        ...(step.clickToContinue ? { onNextClick: advanceFrom(step) } : {}),
      },
    }));

    // Adds a button to the card's footer, before the Next button.
    const addFooterButton = (popover: PopoverDOM, label: string, onClick: () => void) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "driver-popover-footer-btn gf-tour-extra";
      button.textContent = label;
      button.addEventListener("click", onClick);
      popover.footerButtons.insertBefore(button, popover.nextButton);
    };

    let removeClickListener: (() => void) | null = null;
    const drive: Driver = driver({
      steps: driveSteps,
      showProgress: true,
      progressText: translate("tour.ui.progress", { p1: "{{current}}", p2: "{{total}}" }),
      nextBtnText: translate("tour.ui.next"),
      prevBtnText: translate("tour.ui.prev"),
      doneBtnText: translate("tour.ui.done"),
      closeBtnLabel: translate("tour.ui.close"),
      popoverClass: "gf-tour",
      animate: !reduced,
      smoothScroll: !reduced,
      allowClose: true,
      // A stray click on the dimmed page must not end the tutorial: it ends with the X, Esc or its last button.
      overlayClickBehavior: "none",
      disableActiveInteraction: true,
      stagePadding: 8,
      stageRadius: 14,
      popoverOffset: 12,
      overlayColor: "#0a0614",
      overlayOpacity: 0.72,
      skipMissingElement: true,
      waitForElement: 1500,
      onHighlighted: (element, step) => {
        // The click that a click-to-continue card asks for moves the tour on (driver.js would call the card's Next hook instead).
        removeClickListener?.();
        removeClickListener = null;
        if (step.data?.click && element) {
          const advance = () => {
            removeClickListener = null;
            drive.moveNext();
          };
          element.addEventListener("click", advance, { once: true });
          removeClickListener = () => element.removeEventListener("click", advance);
        }
        const stepId: unknown = step.data?.id;
        // Only the welcome and the page tours are remembered by the account (a component tutorial is not part of the walk).
        if (typeof stepId === "string" && stepId !== lastReported && isSectionTour(id)) {
          lastReported = stepId;
          host.onProgress?.(id, stepId);
        }
      },
      onPopoverRender: (popover, { index }) => {
        // The count only includes the cards that exist now. While a panel or a window that this card (or a later one) is about to
        // open is still closed, the cards inside it cannot be counted -the window may show fewer than the catalog lists, the
        // demo's for one- so the card only says which step it is ("Step 2"); once it is open the count is exact ("3 of 9").
        const current = index ?? 0;
        const present = steps.map((step, position) => position === index || !step.later || !step.anchor || Boolean(stepElement(step)));
        const opensLater = (position: number) => steps.some((earlier, before) => before >= current && before < position && earlier.clickToContinue);
        const pending = steps.some((step, position) => !present[position] && opensLater(position));
        const shown = present.slice(0, current + 1).filter(Boolean).length;
        const count = pending
          ? translate("tour.ui.progressOpen", { p1: shown })
          : translate("tour.ui.progress", { p1: shown, p2: present.filter(Boolean).length });
        popover.progress.textContent = inFullTour ? `${translate("tour.ui.sectionOf", { p1: position + 1, p2: list.length })} · ${count}` : count;
        // The welcome ends by offering the walk through every section.
        if (id === "intro" && !inFullTour && (index ?? 0) === driveSteps.length - 1) {
          addFooterButton(popover, translate("tour.ui.fullTour"), () => {
            destroyActive();
            goToNext(FULL_TOUR, 0);
          });
        }
        requestAnimationFrame(() => popover.nextButton.focus({ preventScroll: true }));
      },
      onDeselected: () => {
        removeClickListener?.();
        removeClickListener = null;
      },
      onDoneClick: () => {
        destroyActive();
        goToNext(list, position);
      },
      // Anything that closes the card before the last step (the X, Esc) ends the walk.
      onDestroyStarted: () => {
        destroyActive();
        clearRun();
      },
    });

    active = drive;
    host.onRunningChange(true);
    // Starting at a card the page no longer shows (or that does not exist) starts at the first one.
    const startIndex = startStep ? Math.max(0, steps.findIndex((step) => step.id === startStep)) : 0;
    drive.drive(startIndex);
  }

  return {
    setHost: (next) => {
      host = next;
    },
    mount: () => {
      mounted = true;
    },
    // The token is not touched here: React may unmount and remount at once (Strict Mode), and a launch in flight must survive it.
    unmount: () => {
      mounted = false;
      active?.destroy();
      active = null;
    },
    launch,
    stop: () => {
      token += 1;
      if (active) destroyActive();
    },
    isRunning: () => active !== null,
    resume: (point) => {
      const tour = point.list[point.position];
      const here = host.pathname();
      // The welcome points at the navigation bar, which every page has; a page's tour needs its own page.
      if (tour === "intro" || pageForPath(here) === tour) {
        void launch(point.list, point.position, point.step);
        return;
      }
      writeRun({ list: [...point.list], position: point.position, pending: true, step: point.step });
      host.navigate(pathForPage(tour as TourPage, isDemoPath(here)));
    },
    onPathChange: (pathname) => {
      if (active) {
        token += 1;
        destroyActive();
      }
      const run = takePendingRun();
      if (!run) return;
      if (pageForPath(pathname) !== run.list[run.position]) {
        clearRun();
        return;
      }
      void launch(run.list, run.position, run.step);
    },
  };
}
