// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTranslator } from "@gastify/core/i18n/translate";
import { catalogsFor, loadMessages } from "@gastify/core/i18n/catalogs";
import { FULL_TOUR, TOUR_STEPS, stepTitleKey, type TourId } from "@gastify/core/tour/tourSteps";
import { createTourEngine, type TourHost } from "./tourEngine";
import { readRun, writeRun } from "./tourRun";

// A stand-in for driver.js: it records how it was configured and what the person would press.
interface FakeStep {
  advanceOnClick?: boolean;
  waitForElement?: number;
  data?: { id?: string; click?: boolean };
  popover: { title: string; doneBtnText?: string; onDoneClick?: unknown; onNextClick?: (element: Element | undefined, step: unknown, options: { driver: { moveNext: () => void } }) => void };
  element?: () => Element | null;
}
interface FakePopover {
  footerButtons: HTMLElement;
  nextButton: HTMLElement;
  progress: HTMLElement;
}
interface FakeConfig {
  steps: FakeStep[];
  overlayClickBehavior: string;
  onDoneClick: () => void;
  onDestroyStarted: () => void;
  onHighlighted: (element: Element | undefined, step: { data?: { id?: unknown; click?: boolean } }) => void;
  onDeselected: () => void;
  onPopoverRender: (popover: FakePopover, options: { index: number }) => void;
}
const drivers = vi.hoisted(() => [] as { config: FakeConfig; drive: () => void; destroy: () => void; moveNext: () => void }[]);
vi.mock("driver.js", () => ({
  driver: (config: FakeConfig) => {
    const instance = { config, drive: vi.fn(), destroy: vi.fn(), moveNext: vi.fn() };
    drivers.push(instance);
    return instance;
  },
}));

// The texts of every tour namespace, as the app loads them.
const translate = createTranslator("es", await loadMessages("es", catalogsFor("es").filter((space) => space.startsWith("tour"))));
let path = "/dashboard";
let navigations: string[];
let running: boolean[];

function host(): TourHost {
  return { translate, pathname: () => path, navigate: (target) => navigations.push(target), onRunningChange: (value) => running.push(value) };
}

const anchors = (...names: string[]) => {
  document.body.innerHTML = names.map((name) => `<div data-tour="${name}"></div>`).join("");
};
// Every element a tour points at, on screen: all of its steps can be shown.
const showAll = (tour: TourId, ...extra: string[]) =>
  anchors(...TOUR_STEPS[tour].flatMap((step) => [step.anchor, step.fallback]).filter((name): name is string => Boolean(name)), ...extra);

beforeEach(() => {
  drivers.length = 0;
  navigations = [];
  running = [];
  path = "/dashboard";
  sessionStorage.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("min-width"), addEventListener() {}, removeEventListener() {} }));
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(() => [{}] as unknown as DOMRectList);
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("tour engine", () => {
  it("builds the steps that can be shown, in Spanish, and starts the tour", async () => {
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movements"], 0);

    expect(drivers).toHaveLength(1);
    const { config, drive } = drivers[0];
    expect(config.steps.map((step: FakeStep) => step.data?.id)).toEqual(TOUR_STEPS.movements.map((step) => step.id));
    expect(config.steps.map((step: FakeStep) => step.popover.title)).toEqual(TOUR_STEPS.movements.map((step) => translate(stepTitleKey(step))));
    expect(config.steps[0].popover.title).toBe("Tus movimientos");
    expect(config.steps[0].element).toBeUndefined();
    const firstAnchored = TOUR_STEPS.movements.findIndex((step) => step.anchor);
    expect(config.steps[firstAnchored].element?.()).toBe(document.querySelector(`[data-tour="${TOUR_STEPS.movements[firstAnchored].anchor}"]`));
    expect(config.overlayClickBehavior).toBe("none");
    expect(drive).toHaveBeenCalled();
    expect(running.at(-1)).toBe(true);
  });

  it("skips the steps whose element is not on screen", async () => {
    anchors("bud-period", "bud-projects");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["budgets"], 0);
    const shown = new Set(["bud-period", "bud-projects"]);
    const expected = TOUR_STEPS.budgets.filter((step) => !step.anchor || step.later || shown.has(step.anchor)).map((step) => step.id);
    expect(drivers[0].config.steps.map((step: FakeStep) => step.data?.id)).toEqual(expected);
    expect(expected).toContain("budgets.period");
    expect(expected).not.toContain("budgets.savings");
  });

  it("ends a single tour with Done and a walk's section with Next section", async () => {
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movements"], 0);
    expect(drivers[0].config.steps.at(-1)?.popover.doneBtnText).toBe("Listo");

    await engine.launch(["movements", "budgets"], 0);
    expect(drivers[1].config.steps.at(-1)?.popover.doneBtnText).toBe("Siguiente sección");
    expect(drivers[0].destroy).toHaveBeenCalled();
  });

  it("goes to the next page of a walk when its last card is done, and remembers where it is", async () => {
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movements", "budgets"], 0);
    drivers[0].config.onDoneClick();

    expect(drivers[0].destroy).toHaveBeenCalled();
    expect(navigations).toEqual(["/dashboard/budgets"]);
    expect(readRun()).toEqual({ list: ["movements", "budgets"], position: 1, pending: true });
  });

  it("goes to the demo's page when the walk is in the demo", async () => {
    path = "/demo/movements";
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movements", "budgets"], 0);
    drivers[0].config.onDoneClick();
    expect(navigations).toEqual(["/demo/budgets"]);
  });

  it("stays on the page when the next tour belongs to it", async () => {
    path = "/dashboard";
    anchors("nav-bar", "nav-add", "nav-profile", "nav-tutorial", "dash-header", "dash-filters");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(FULL_TOUR, 0);
    drivers[0].config.onDoneClick();
    await vi.waitFor(() => expect(drivers).toHaveLength(2));
    expect(navigations).toEqual([]);
    expect(drivers[1].config.steps[0].popover.title).toBe("Tu cartera");
  });

  it("ends the walk when the person closes the card", async () => {
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movements", "budgets"], 0);
    writeRun({ list: ["movements", "budgets"], position: 0, pending: false });
    drivers[0].config.onDestroyStarted();
    expect(drivers[0].destroy).toHaveBeenCalled();
    expect(readRun()).toBeNull();
    expect(running.at(-1)).toBe(false);
  });

  it("offers the full tour on the last card of the welcome", async () => {
    anchors("nav-bar", "nav-add", "nav-profile", "nav-tutorial", "dash-header");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["intro"], 0);
    const total = drivers[0].config.steps.length;

    const popover = (index: number) => {
      const footerButtons = document.createElement("span");
      const nextButton = document.createElement("button");
      footerButtons.appendChild(nextButton);
      return { index, popover: { footerButtons, nextButton, progress: document.createElement("span") } };
    };
    const middle = popover(0);
    drivers[0].config.onPopoverRender(middle.popover, { index: middle.index });
    expect(middle.popover.footerButtons.querySelectorAll(".gf-tour-extra")).toHaveLength(0);

    const last = popover(total - 1);
    drivers[0].config.onPopoverRender(last.popover, { index: last.index });
    const extra = last.popover.footerButtons.querySelector<HTMLButtonElement>(".gf-tour-extra");
    expect(extra?.textContent).toBe("Recorrido completo");

    extra?.click();
    await vi.waitFor(() => expect(drivers).toHaveLength(2));
    expect(drivers[1].config.steps[0].popover.title).toBe("Tu cartera");
  });

  it("starts the page's tour when a walk navigated there, and drops a walk that is for another page", async () => {
    anchors("bud-period", "bud-projects", "bud-savings");
    const engine = createTourEngine(host());
    engine.mount();
    writeRun({ list: ["movements", "budgets"], position: 1, pending: true });
    engine.onPathChange("/dashboard/budgets");
    await vi.waitFor(() => expect(drivers).toHaveLength(1));
    expect(drivers[0].config.steps[0].popover.title).toBe("Tus presupuestos");

    writeRun({ list: ["movements", "budgets"], position: 1, pending: true });
    engine.onPathChange("/dashboard/history");
    expect(readRun()).toBeNull();
    expect(drivers).toHaveLength(1);
  });

  it("ends an open tour when the page changes", async () => {
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movements"], 0);
    engine.onPathChange("/dashboard/budgets");
    expect(drivers[0].destroy).toHaveBeenCalled();
  });

  it("does not start after it is unmounted", async () => {
    showAll("movements");
    const engine = createTourEngine(host());
    engine.mount();
    const launching = engine.launch(["movements"], 0);
    engine.unmount();
    await launching;
    expect(drivers).toHaveLength(0);
  });

  it("starts at the card it is told to, and at the first one when that card is not on screen", async () => {
    anchors("bud-period", "bud-projects", "bud-savings");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["budgets"], 0, "budgets.projects");
    expect(drivers[0].drive).toHaveBeenCalledWith(2);
    await engine.launch(["budgets"], 0, "budgets.summary");
    expect(drivers[1].drive).toHaveBeenCalledWith(0);
    await engine.launch(["budgets"], 0);
    expect(drivers[2].drive).toHaveBeenCalledWith(0);
  });

  it("reports each card as it is shown, so the account can continue there", async () => {
    showAll("movements");
    const progress: [string, string][] = [];
    const engine = createTourEngine({ ...host(), onProgress: (tour, step) => progress.push([tour, step]) });
    engine.mount();
    await engine.launch(["movements"], 0);
    drivers[0].config.onHighlighted(undefined, { data: { id: "movements.list" } });
    drivers[0].config.onHighlighted(undefined, { data: {} });
    // The same card again (Back, then Next) is not reported twice.
    drivers[0].config.onHighlighted(undefined, { data: { id: "movements.list" } });
    drivers[0].config.onHighlighted(undefined, { data: { id: "movements.filters" } });
    expect(progress).toEqual([["movements", "movements.list"], ["movements", "movements.filters"]]);
  });

  it("reports the end of the walk through every section, and only of that", async () => {
    anchors("prof-header");
    const completed: string[] = [];
    const engine = createTourEngine({ ...host(), onComplete: () => completed.push("done") });
    engine.mount();
    await engine.launch(["profile"], 0);
    drivers[0].config.onDoneClick();
    expect(completed).toEqual([]);

    const last = FULL_TOUR.length - 1;
    await engine.launch(FULL_TOUR, last);
    drivers[1].config.onDoneClick();
    expect(completed).toEqual(["done"]);
    expect(navigations).toEqual([]);
  });

  it("continues at a card of a tour on another page by going there first", async () => {
    anchors("bud-period", "bud-projects", "bud-savings");
    const engine = createTourEngine(host());
    engine.mount();
    engine.resume({ list: [...FULL_TOUR], position: FULL_TOUR.indexOf("budgets"), step: "budgets.projects" });
    expect(navigations).toEqual(["/dashboard/budgets"]);
    expect(readRun()).toEqual({ list: [...FULL_TOUR], position: FULL_TOUR.indexOf("budgets"), pending: true, step: "budgets.projects" });

    // The page then loads and picks the walk up at that card.
    path = "/dashboard/budgets";
    engine.onPathChange("/dashboard/budgets");
    await vi.waitFor(() => expect(drivers).toHaveLength(1));
    expect(drivers[0].drive).toHaveBeenCalledWith(2);
  });

  it("continues at once when the tour belongs to the page on screen, or is the welcome", async () => {
    path = "/dashboard/budgets";
    anchors("bud-period", "bud-projects", "bud-savings", "nav-bar", "nav-add", "nav-profile", "nav-tutorial");
    const engine = createTourEngine(host());
    engine.mount();
    engine.resume({ list: [...FULL_TOUR], position: FULL_TOUR.indexOf("budgets"), step: "budgets.savings" });
    await vi.waitFor(() => expect(drivers).toHaveLength(1));
    expect(navigations).toEqual([]);
    engine.resume({ list: [...FULL_TOUR], position: 0 });
    await vi.waitFor(() => expect(drivers).toHaveLength(2));
    expect(navigations).toEqual([]);
  });

  it("makes the card that opens a panel press it, and waits for the panel only on the first card inside it", async () => {
    anchors("prof-passkeys-header");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["profPasskeys"], 0);
    const steps = drivers[0].config.steps as (FakeStep & { advanceOnClick?: boolean; waitForElement?: number })[];
    expect(steps.map((step) => step.data?.id)).toEqual(["profPasskeys.what", "profPasskeys.open", "profPasskeys.list", "profPasskeys.add"]);
    // A card that is not the last reads Next even when driver.js takes it for the last (the cards after it are not on screen yet).
    expect(steps[1].popover.doneBtnText).toBe("Siguiente");
    expect(steps[1].popover.onDoneClick).toBeTypeOf("function");
    expect(steps[3].popover.doneBtnText).toBe("Listo");
    expect(steps[1].data?.click).toBe(true);
    expect(steps[0].data?.click).toBe(false);
    expect(steps[2].waitForElement).toBe(3000);
    expect(steps[3].waitForElement).toBe(0);
    expect(steps[0].waitForElement).toBeUndefined();
  });

  it("makes a card that waits for what a pressing card opens wait, even when it is a later card; a later card after a later card does not", async () => {
    showAll("movList");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["movList"], 0);
    const steps = drivers[0].config.steps as (FakeStep & { waitForElement?: number })[];
    const byId = (id: string) => steps.find((step) => step.data?.id === id);
    // The compare button appears in the moment "Seleccionar posibles duplicados" presses: it waits for it (1000 ms).
    expect(byId("movList.dupSelect")?.data?.click).toBe(true);
    expect(byId("movList.dupCompare")?.waitForElement).toBe(1000);
    // After a later card that does not press anything, the next later card does not wait again.
    expect(byId("movList.dupDelete")?.waitForElement).toBe(0);
    expect(byId("movList.dupSummary")?.waitForElement).toBe(0);
    // The results block is the first card after a non-later one: it waits for its own time (800 ms).
    expect(byId("movList.dupMode")?.waitForElement).toBe(800);
  });

  it("moves on when the person presses the control a card asks for, once, and not after the card is left", async () => {
    anchors("prof-passkeys-header");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["profPasskeys"], 0);
    const header = document.querySelector('[data-tour="prof-passkeys-header"]') as HTMLElement;
    const { config, moveNext } = drivers[0];

    config.onHighlighted(header, { data: { id: "profPasskeys.open", click: true } });
    header.click();
    header.click();
    expect(moveNext).toHaveBeenCalledTimes(1);

    config.onHighlighted(header, { data: { id: "profPasskeys.open", click: true } });
    config.onDeselected();
    header.click();
    expect(moveNext).toHaveBeenCalledTimes(1);
  });

  it("makes the card's own Next press the control, which moves the tour on", async () => {
    anchors("prof-passkeys-header");
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["profPasskeys"], 0);
    const header = document.querySelector('[data-tour="prof-passkeys-header"]') as HTMLElement;
    const { config, moveNext } = drivers[0];
    const pressed = vi.fn();
    header.addEventListener("click", pressed);

    config.onHighlighted(header, { data: { id: "profPasskeys.open", click: true } });
    const next = config.steps[1].popover.onNextClick;
    next?.(header, config.steps[1], { driver: { moveNext } });
    expect(pressed).toHaveBeenCalledTimes(1);
    expect(moveNext).toHaveBeenCalledTimes(1);
    // Without an element, Next just moves on.
    next?.(undefined, config.steps[1], { driver: { moveNext } });
    expect(moveNext).toHaveBeenCalledTimes(2);
  });

  it("covers every step of the catalog it is given", async () => {
    // Every anchor of every tour on screen: all the steps become cards.
    const every = new Set<string>();
    for (const steps of Object.values(TOUR_STEPS)) for (const step of steps) if (step.anchor) every.add(step.anchor);
    anchors(...every);
    const engine = createTourEngine(host());
    engine.mount();
    await engine.launch(["analyzer"], 0);
    expect(drivers[0].config.steps).toHaveLength(TOUR_STEPS.analyzer.length);
  });
});
