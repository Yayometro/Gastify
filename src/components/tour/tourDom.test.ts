// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TourStep } from "@gastify/core/tour/tourSteps";
import { availableSteps, findAnchor, firstAnchorShown, sideFor, stepElement, waitUntil } from "./tourDom";

// jsdom has no layout: an element counts as on screen unless it carries data-hidden.
beforeEach(() => {
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (this: Element) {
    return (this.closest("[data-hidden]") ? [] : [{}]) as unknown as DOMRectList;
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("findAnchor and stepElement", () => {
  it("takes the first element with the anchor that is on screen", () => {
    document.body.innerHTML = `<ul data-hidden><li id="a" data-tour="nav-add"></li></ul><div id="b" data-tour="nav-add"></div>`;
    expect(findAnchor("nav-add")?.id).toBe("b");
  });

  it("finds nothing for a missing anchor, or when every match is hidden", () => {
    document.body.innerHTML = `<div data-hidden><i data-tour="nav-theme"></i></div>`;
    expect(findAnchor("nav-theme")).toBeNull();
    expect(findAnchor("nope")).toBeNull();
    expect(findAnchor(undefined)).toBeNull();
  });

  it("uses the fallback when the anchor is not on screen", () => {
    document.body.innerHTML = `<div data-hidden><i data-tour="nav-tutorial"></i></div><button id="menu" data-tour="nav-menu"></button>`;
    const step: TourStep = { id: "intro.tutorial", anchor: "nav-tutorial", fallback: "nav-menu" };
    expect(stepElement(step)?.id).toBe("menu");
  });
});

describe("availableSteps and firstAnchorShown", () => {
  it("keeps the welcome card and the steps whose element is on screen", () => {
    document.body.innerHTML = `<div data-tour="mov-search"></div>`;
    expect(availableSteps("movements").map((step) => step.id)).toEqual(["movements.welcome", "movements.search"]);
  });

  it("keeps the steps that point inside a panel the tour opens, and skips the step that opens a panel that is already open", () => {
    document.body.innerHTML = `<div data-tour="prof-passkeys-header"></div>`;
    expect(availableSteps("profPasskeys").map((step) => step.id)).toEqual(["profPasskeys.what", "profPasskeys.open", "profPasskeys.list", "profPasskeys.add"]);
    document.body.innerHTML = `<div data-tour="prof-passkeys-header"></div><div data-tour="prof-passkeys-body"><ul data-tour="prof-passkeys-list"></ul></div>`;
    expect(availableSteps("profPasskeys").map((step) => step.id)).toEqual(["profPasskeys.what", "profPasskeys.list", "profPasskeys.add"]);
  });

  it("is ready once the first step that needs an element has one", () => {
    expect(firstAnchorShown("movements")).toBe(false);
    document.body.innerHTML = `<div data-tour="mov-list-title"></div>`;
    expect(firstAnchorShown("movements")).toBe(true);
  });

  it("does not wait for the button that opens a form when the form is already open", () => {
    // The category tour starts at the "List" tab and at "Create new", which their own skipIf skip once the list or the form is on
    // screen (as in the "+" window, over a page that has its tabs).
    document.body.innerHTML = `<div data-tour="cat-search"></div><form data-tour="cat-form"><div data-tour="cat-form-name"></div></form>`;
    expect(firstAnchorShown("catCreate")).toBe(true);
    document.body.innerHTML = `<div data-tour="cat-search"></div><div data-tour="cat-yours"></div>`;
    expect(firstAnchorShown("catCreate")).toBe(false);
  });

  it("does not wait for an optional first element", () => {
    // Budgets starts with a required period anchor; categories' first step is optional, then the search box.
    document.body.innerHTML = `<input data-tour="cat-search" />`;
    expect(firstAnchorShown("categories")).toBe(true);
  });
});

describe("sideFor", () => {
  it("returns the side, or the one for the screen's width", () => {
    expect(sideFor({ id: "x.y", side: "top" }, true)).toBe("top");
    expect(sideFor({ id: "x.y", side: { wide: "right", narrow: "top" } }, true)).toBe("right");
    expect(sideFor({ id: "x.y", side: { wide: "right", narrow: "top" } }, false)).toBe("top");
    expect(sideFor({ id: "x.y" }, true)).toBeUndefined();
  });
});

describe("waitUntil", () => {
  it("resolves at once when it is ready, and when it becomes ready in time", async () => {
    vi.useFakeTimers();
    await expect(waitUntil(() => true, 1000)).resolves.toBe(true);
    let ready = false;
    const pending = waitUntil(() => ready, 1000, 100);
    ready = true;
    await vi.advanceTimersByTimeAsync(150);
    await expect(pending).resolves.toBe(true);
  });

  it("gives up after the timeout", async () => {
    vi.useFakeTimers();
    const pending = waitUntil(() => false, 500, 100);
    await vi.advanceTimersByTimeAsync(700);
    await expect(pending).resolves.toBe(false);
  });
});
