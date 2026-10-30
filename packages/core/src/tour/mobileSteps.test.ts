import { describe, expect, it } from "vitest";
import { loadMessages } from "../i18n/catalogs";
import {
  MOBILE_COMPONENT_SCREEN,
  MOBILE_FULL_TOUR,
  MOBILE_SCREENS,
  MOBILE_SCREEN_NAME_KEY,
  MOBILE_TOUR_STEPS,
  SCREEN_TOUR_ID,
  isMobileComponentTour,
  mobileComponentToursFor,
  mobileScreenForPath,
  nextMobileTour,
  pathForMobileScreen,
  screenOfMobileTour,
  stepBodyKey,
  stepTitleKey,
  type MobileTourId,
} from "./mobileSteps";

const ALL = Object.keys(MOBILE_TOUR_STEPS) as MobileTourId[];
const SECTIONS = ["mIntro", ...MOBILE_SCREENS.map((screen) => SCREEN_TOUR_ID[screen])] as MobileTourId[];
const COMPONENTS = Object.keys(MOBILE_COMPONENT_SCREEN) as MobileTourId[];

describe("phone tour catalog", () => {
  it("has a tour for the welcome and for every screen, and the full tour visits them without the menu", () => {
    expect([...ALL].filter((id) => !isMobileComponentTour(id)).sort()).toEqual([...SECTIONS].sort());
    expect(MOBILE_FULL_TOUR[0]).toBe("mIntro");
    expect(MOBILE_FULL_TOUR).not.toContain("mMore");
    expect(MOBILE_FULL_TOUR.length).toBe(SECTIONS.length - 1);
  });

  it("starts the welcome and every screen with a welcome card, then the two help-button cards", () => {
    for (const tour of SECTIONS) {
      const [first, second, third] = MOBILE_TOUR_STEPS[tour];
      expect(first.id).toBe(`${tour}.welcome`);
      expect(first.anchor).toBeUndefined();
      if (tour === "mMore") {
        // The menu has no "?" of its own to teach, but it still points at the tutorial button.
        expect(second.text ?? third?.text).toBeDefined();
        continue;
      }
      expect([second.anchor, third.anchor].sort()).toEqual(["m-info-tip", "m-tutorial-tip"]);
    }
  });

  it("gives every component tutorial a screen, listed in the order of its screen", () => {
    for (const id of COMPONENTS) {
      const screen = MOBILE_COMPONENT_SCREEN[id as keyof typeof MOBILE_COMPONENT_SCREEN];
      expect(mobileComponentToursFor(screen)).toContain(id);
      const [first] = MOBILE_TOUR_STEPS[id];
      expect(first.anchor, id).toBeTruthy();
      expect(first.optional, id).toBeFalsy();
    }
  });

  it("keeps a month's tutorial on the controls of its own window, starting with the movements button", () => {
    // The month window is open when its tutorial starts: a card that points at the list behind it would be counted and skipped.
    const steps = MOBILE_TOUR_STEPS["m-proj-month"];
    expect(steps[0].id).toBe("m-proj-month.movements");
    for (const step of steps) {
      expect(step.anchor, step.id).toMatch(/^m-proj-month-/);
      expect(step.clickToContinue, step.id).toBeFalsy();
      expect(step.later, step.id).toBeFalsy();
    }
  });

  it("keeps the Excel import and the categorizer on the movements screen, each starting on a control that is always there", () => {
    expect(MOBILE_COMPONENT_SCREEN["m-import"]).toBe("movements");
    expect(MOBILE_COMPONENT_SCREEN["m-categorizer"]).toBe("movements");
    const imports = MOBILE_TOUR_STEPS["m-import"];
    const categorizer = MOBILE_TOUR_STEPS["m-categorizer"];
    expect(imports[0].anchor).toBe("m-import-template");
    expect(categorizer[0].anchor).toBe("m-categorizer-head");
    for (const step of imports) expect(step.anchor, step.id).toMatch(/^m-import-/);
    for (const step of categorizer) expect(step.anchor, step.id).toMatch(/^m-categorizer-/);
  });

  it("gives every step an id that starts with its tour, unique in the catalog", () => {
    const seen = new Set<string>();
    for (const tour of ALL) {
      for (const step of MOBILE_TOUR_STEPS[tour]) {
        expect(step.id.startsWith(`${tour}.`), step.id).toBe(true);
        expect(seen.has(step.id), step.id).toBe(false);
        seen.add(step.id);
      }
    }
  });

  it("only lets a fallback, an optional or a click-to-continue step exist next to an anchor", () => {
    for (const tour of ALL) {
      for (const step of MOBILE_TOUR_STEPS[tour]) {
        if (step.fallback || step.optional || step.clickToContinue) expect(step.anchor, step.id).toBeTruthy();
      }
    }
  });

  it.each(["es", "en"] as const)("has a title and a body for every step, and a name for every tutorial, in %s", async (locale) => {
    const messages = await loadMessages(locale, ["tourMobile", "mobile", "shared"]);
    for (const screen of MOBILE_SCREENS) expect(messages[MOBILE_SCREEN_NAME_KEY[screen]], MOBILE_SCREEN_NAME_KEY[screen]).toBeTruthy();
    for (const id of COMPONENTS) expect(messages[`tour.${id}.name`], `tour.${id}.name`).toBeTruthy();
    for (const tour of ALL) {
      for (const step of MOBILE_TOUR_STEPS[tour]) {
        expect(messages[stepTitleKey(step)], stepTitleKey(step)).toBeTruthy();
        expect(messages[stepBodyKey(step)], stepBodyKey(step)).toBeTruthy();
      }
    }
  });
});

describe("mobileScreenForPath and pathForMobileScreen", () => {
  it("reads the screen from the phone's router paths", () => {
    expect(mobileScreenForPath("/")).toBe("home");
    expect(mobileScreenForPath("/movements")).toBe("movements");
    expect(mobileScreenForPath("/more/accounts/")).toBe("accounts");
    expect(mobileScreenForPath("/more/projections?x=1")).toBe("projections");
  });

  it("has no screen for a detail, a form or anything else", () => {
    expect(mobileScreenForPath("/movements/abc")).toBeNull();
    expect(mobileScreenForPath("/more/accounts/new")).toBeNull();
    expect(mobileScreenForPath("/notifications")).toBeNull();
    expect(mobileScreenForPath(null)).toBeNull();
  });

  it("builds the path of every screen and reads it back", () => {
    for (const screen of MOBILE_SCREENS) expect(mobileScreenForPath(pathForMobileScreen(screen))).toBe(screen);
  });
});

describe("nextMobileTour and screenOfMobileTour", () => {
  it("walks the full tour and ends after the last one", () => {
    expect(nextMobileTour("mIntro")).toBe("mHome");
    expect(nextMobileTour(MOBILE_FULL_TOUR[MOBILE_FULL_TOUR.length - 1])).toBeNull();
  });

  it("tells the screen of a tour, and none for the welcome", () => {
    expect(screenOfMobileTour("mIntro")).toBeNull();
    expect(screenOfMobileTour("mBudgets")).toBe("budgets");
  });
});
