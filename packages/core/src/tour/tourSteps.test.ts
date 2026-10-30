import { describe, expect, it } from "vitest";
import { catalogsFor, loadMessages } from "../i18n/catalogs";
import {
  COMPONENT_PAGE,
  FULL_TOUR,
  TOUR_PAGE_NAME_KEY,
  TOUR_PAGES,
  TOUR_STEPS,
  componentToursFor,
  isComponentTour,
  isDemoPath,
  nextTour,
  pageForPath,
  pathForPage,
  stepBodyKey,
  stepTitleKey,
  type SectionTourId,
  type TourId,
  type TourPage,
} from "./tourSteps";

const ALL_TOURS = Object.keys(TOUR_STEPS) as TourId[];
const COMPONENT_PAGES: Record<string, TourPage> = COMPONENT_PAGE;
const COMPONENTS = Object.keys(COMPONENT_PAGE) as TourId[];
const SECTIONS: SectionTourId[] = ["intro", ...TOUR_PAGES];

// The namespaces that hold the texts of the web tours: the general "tour" one and one per page.
const TOUR_NAMESPACES = catalogsFor("es").filter((space) => space.startsWith("tour"));

describe("tour catalog", () => {
  it("has a tour for the welcome and for every page, and the full tour visits them in order", () => {
    expect([...ALL_TOURS].filter((id) => !isComponentTour(id)).sort()).toEqual([...SECTIONS].sort());
    expect(FULL_TOUR).toEqual(SECTIONS);
  });

  it("gives every component tutorial a page, listed in the order of its page, and never repeats an id", () => {
    expect(new Set(COMPONENTS).size).toBe(COMPONENTS.length);
    for (const id of COMPONENTS) {
      expect(SECTIONS.includes(id as SectionTourId)).toBe(false);
      expect(componentToursFor(COMPONENT_PAGES[id])).toContain(id);
    }
    expect(COMPONENTS.length).toBe(TOUR_PAGES.reduce((sum, page) => sum + componentToursFor(page).length, 0));
  });

  it("starts the welcome and every page with a welcome card that has no anchor, then the two help-button cards", () => {
    for (const tour of SECTIONS) {
      const [first, second, third] = TOUR_STEPS[tour];
      expect(first.id).toBe(`${tour}.welcome`);
      expect(first.anchor).toBeUndefined();
      expect(second.text).toBeDefined();
      expect(third.text).toBeDefined();
      expect([second.anchor, third.anchor].sort()).toEqual(["info-tip", "tutorial-tip"]);
    }
  });

  it("opens a component tutorial on the control it explains, not on a welcome card", () => {
    for (const id of COMPONENTS) {
      const [first] = TOUR_STEPS[id];
      expect(first.anchor, id).toBeTruthy();
      expect(first.optional, id).toBeFalsy();
    }
  });

  it("gives every step an id that starts with its tour, unique in the catalog", () => {
    const seen = new Set<string>();
    for (const tour of ALL_TOURS) {
      for (const step of TOUR_STEPS[tour]) {
        expect(step.id.startsWith(`${tour}.`), step.id).toBe(true);
        expect(seen.has(step.id), step.id).toBe(false);
        seen.add(step.id);
      }
    }
  });

  it("only lets a fallback, an optional or a click-to-continue step exist next to an anchor", () => {
    for (const tour of ALL_TOURS) {
      for (const step of TOUR_STEPS[tour]) {
        if (step.fallback || step.optional || step.clickToContinue) expect(step.anchor, step.id).toBeTruthy();
      }
    }
  });

  it.each(["es", "en"] as const)("has a title and a body for every step, and a name for every section and tutorial, in %s", async (locale) => {
    const messages = await loadMessages(locale, ["navbar", ...TOUR_NAMESPACES]);
    for (const tour of SECTIONS) expect(messages[TOUR_PAGE_NAME_KEY[tour]], TOUR_PAGE_NAME_KEY[tour]).toBeTruthy();
    for (const id of COMPONENTS) expect(messages[`tour.${id}.name`], `tour.${id}.name`).toBeTruthy();
    for (const tour of ALL_TOURS) {
      for (const step of TOUR_STEPS[tour]) {
        expect(messages[stepTitleKey(step)], stepTitleKey(step)).toBeTruthy();
        expect(messages[stepBodyKey(step)], stepBodyKey(step)).toBeTruthy();
      }
    }
  });
});

describe("pageForPath and pathForPage", () => {
  it("reads the page from the app's paths and from the demo's", () => {
    expect(pageForPath("/dashboard")).toBe("dashboard");
    expect(pageForPath("/dashboard/")).toBe("dashboard");
    expect(pageForPath("/dashboard/budgets")).toBe("budgets");
    expect(pageForPath("/dashboard/profile?x=1")).toBe("profile");
    expect(pageForPath("/demo")).toBe("dashboard");
    expect(pageForPath("/demo/analyzer")).toBe("analyzer");
    expect(pageForPath("/demo/history#top")).toBe("history");
  });

  it("has no page for anything else", () => {
    expect(pageForPath("/")).toBeNull();
    expect(pageForPath("/login")).toBeNull();
    expect(pageForPath("/dashboard/icons-preview")).toBeNull();
    expect(pageForPath("/dashboard/dashboard")).toBeNull();
    expect(pageForPath("/demonstration")).toBeNull();
    expect(pageForPath(null)).toBeNull();
    expect(pageForPath(undefined)).toBeNull();
  });

  it("builds the path of a page in the app and in the demo, and reads it back", () => {
    for (const page of TOUR_PAGES) {
      expect(pageForPath(pathForPage(page, false))).toBe(page);
      expect(pageForPath(pathForPage(page, true))).toBe(page);
    }
    expect(pathForPage("dashboard", false)).toBe("/dashboard");
    expect(pathForPage("dashboard", true)).toBe("/demo");
    expect(pathForPage("movements", true)).toBe("/demo/movements");
  });

  it("tells the demo from the app", () => {
    expect(isDemoPath("/demo")).toBe(true);
    expect(isDemoPath("/demo/budgets")).toBe(true);
    expect(isDemoPath("/dashboard")).toBe(false);
    expect(isDemoPath("/demonstration")).toBe(false);
    expect(isDemoPath(null)).toBe(false);
  });
});

describe("nextTour", () => {
  it("walks the full tour and ends after the last one", () => {
    expect(nextTour("intro")).toBe("dashboard");
    expect(nextTour("history")).toBe("categories");
    expect(nextTour("profile")).toBeNull();
  });

  it("works on a list of its own", () => {
    expect(nextTour("budgets", ["budgets", "history"])).toBe("history");
    expect(nextTour("movements", ["budgets", "history"])).toBeNull();
  });
});
