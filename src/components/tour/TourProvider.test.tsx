// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nProvider } from "@/i18n/client";
import { catalogsFor, loadMessages } from "@gastify/core/i18n/catalogs";
import type { OnboardingReply } from "@gastify/core/tour/onboarding";
import { FULL_TOUR } from "@gastify/core/tour/tourSteps";
import { TourProvider, useTour } from "./TourProvider";
import { readRun } from "./tourRun";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Stand-ins: the router and path, the server, and driver.js.
const world = vi.hoisted(() => ({
  path: "/dashboard",
  pushed: [] as string[],
  calls: [] as unknown[],
  reply: null as unknown,
  drivers: [] as { config: Record<string, unknown>; drive: (index?: number) => void; destroy: () => void }[],
}));
vi.mock("next/navigation", () => ({ usePathname: () => world.path, useRouter: () => ({ push: (path: string) => world.pushed.push(path) }) }));
vi.mock("./tourApi", () => ({
  callOnboarding: async (body: unknown) => {
    world.calls.push(body);
    return world.reply as OnboardingReply | null;
  },
}));
vi.mock("driver.js", () => ({
  driver: (config: Record<string, unknown>) => {
    const instance = { config, drive: vi.fn(), destroy: vi.fn() };
    world.drivers.push(instance);
    return instance;
  },
}));

let container: HTMLDivElement;
let root: Root;

function Page() {
  const tour = useTour();
  return (
    <div>
      <div data-tour="nav-bar" />
      <div data-tour="nav-add" />
      <div data-tour="nav-profile" />
      <div data-tour="nav-tutorial" />
      <div data-tour="bud-period" />
      <div data-tour="bud-projects" />
      <div data-tour="bud-savings" />
      <button id="open-menu" onClick={tour.openMenu}>open</button>
      <span id="remembers">{String(tour.remembers)}</span>
    </div>
  );
}

const messages = await loadMessages("es", catalogsFor("es").filter((space) => space.startsWith("tour") || space === "navbar"));
const render = (account: boolean) =>
  act(async () => {
    root.render(
      <I18nProvider locale="es" messages={messages}>
        <TourProvider account={account}>
          <Page />
        </TourProvider>
      </I18nProvider>
    );
  });
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
const buttonWith = (text: string) => [...document.querySelectorAll("button")].find((button) => button.textContent?.includes(text));

beforeEach(() => {
  world.path = "/dashboard";
  world.pushed = [];
  world.calls = [];
  world.reply = null;
  world.drivers = [];
  sessionStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("min-width"), addEventListener() {}, removeEventListener() {} }));
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(() => [{}] as unknown as DOMRectList);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TourProvider in the signed-in app", () => {
  it("tells the server a session opened, once per tab, and starts the welcome for a new account", async () => {
    world.reply = { ok: true, onboarding: null, action: "welcome" } satisfies OnboardingReply;
    await render(true);
    await settle();
    expect(world.calls).toEqual([{ action: "visit" }]);
    expect(world.drivers).toHaveLength(1);
    expect(document.getElementById("remembers")?.textContent).toBe("true");

    // Another load in the same tab does not ask again.
    await act(async () => root.unmount());
    root = createRoot(container);
    await render(true);
    await settle();
    expect(world.calls.filter((call) => (call as { action: string }).action === "visit")).toHaveLength(1);
  });

  it("offers to continue, and going on takes the walk to the page where it was left", async () => {
    world.reply = { ok: true, onboarding: { sessions: 2, lastSessionId: "s", tutorial: "pending", progress: { tour: "budgets", step: "budgets.projects" } }, action: "resume" } satisfies OnboardingReply;
    await render(true);
    await settle();
    expect(document.querySelector("#gf-tour-resume-title")?.textContent).toBe("Sigamos con tu tutorial");
    expect(world.drivers).toHaveLength(0);

    await act(async () => buttonWith("Continuar donde me quedé")?.click());
    expect(world.pushed).toEqual(["/dashboard/budgets"]);
    expect(readRun()).toEqual({ list: [...FULL_TOUR], position: FULL_TOUR.indexOf("budgets"), pending: true, step: "budgets.projects" });
    expect(document.querySelector("#gf-tour-resume-title")).toBeNull();
  });

  it("starts over from the welcome when the person asks, and never again when they say so", async () => {
    world.reply = { ok: true, onboarding: { sessions: 2, lastSessionId: "s", tutorial: "pending", progress: { tour: "budgets", step: "budgets.projects" } }, action: "resume" } satisfies OnboardingReply;
    await render(true);
    await settle();
    await act(async () => buttonWith("Empezar de nuevo")?.click());
    await settle();
    expect(world.drivers).toHaveLength(1);

    sessionStorage.clear();
    world.calls = [];
    await act(async () => root.unmount());
    root = createRoot(container);
    await render(true);
    await settle();
    await act(async () => buttonWith("No volver a mostrar")?.click());
    expect(world.calls).toContainEqual({ action: "dismiss" });
  });

  it("closing the offer with Esc is \"not now\": nothing starts and nothing is saved", async () => {
    world.reply = { ok: true, onboarding: { sessions: 2, lastSessionId: "s", tutorial: "pending", progress: { tour: "budgets", step: "budgets.projects" } }, action: "resume" } satisfies OnboardingReply;
    await render(true);
    await settle();
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(document.querySelector("#gf-tour-resume-title")).toBeNull();
    expect(world.drivers).toHaveLength(0);
    expect(world.calls).toEqual([{ action: "visit" }]);
  });

  it("tells an account from before the tutorial once, and remembers that it was told", async () => {
    world.reply = { ok: true, onboarding: null, action: "announce" } satisfies OnboardingReply;
    await render(true);
    await settle();
    expect(document.body.textContent).toContain("Nuevo: tutorial guiado");
    await act(async () => buttonWith("Entendido")?.click());
    expect(document.body.textContent).not.toContain("Nuevo: tutorial guiado");
    expect(world.calls).toContainEqual({ action: "announce" });
    expect(world.drivers).toHaveLength(0);
  });

  it("starts the full tour from the announcement", async () => {
    world.reply = { ok: true, onboarding: null, action: "announce" } satisfies OnboardingReply;
    await render(true);
    await settle();
    await act(async () => buttonWith("Ver el recorrido completo")?.click());
    await settle();
    expect(world.calls).toContainEqual({ action: "announce" });
    expect(world.drivers).toHaveLength(1);
  });

  it("does nothing by itself when the server has nothing to say, or does not answer", async () => {
    world.reply = { ok: true, onboarding: { sessions: 5, lastSessionId: "s", tutorial: "done", progress: null }, action: "none" } satisfies OnboardingReply;
    await render(true);
    await settle();
    expect(world.drivers).toHaveLength(0);
    expect(document.body.textContent).not.toContain("Nuevo: tutorial guiado");

    sessionStorage.clear();
    world.reply = null;
    await act(async () => root.unmount());
    root = createRoot(container);
    await render(true);
    await settle();
    expect(world.drivers).toHaveLength(0);
  });

  it("tells the server which card is on screen, so the account can continue there", async () => {
    world.reply = { ok: true, onboarding: null, action: "welcome" } satisfies OnboardingReply;
    await render(true);
    await settle();
    const onHighlighted = world.drivers[0].config.onHighlighted as (element: undefined, step: { data: { id: string } }) => void;
    onHighlighted(undefined, { data: { id: "intro.bar" } });
    expect(world.calls).toContainEqual({ action: "progress", tour: "intro", step: "intro.bar" });
  });
});

describe("TourProvider in the demo", () => {
  it("never calls the server, and says the account keeps nothing", async () => {
    await render(false);
    await settle();
    expect(world.calls).toEqual([]);
    expect(document.getElementById("remembers")?.textContent).toBe("false");
  });

  it("opens the tutorial menu and starts a tour from it", async () => {
    await render(false);
    await act(async () => (document.getElementById("open-menu") as HTMLButtonElement).click());
    expect(document.querySelector("#gf-tour-menu-title")?.textContent).toBe("Tutorial");
    await act(async () => buttonWith("Cómo moverte")?.click());
    await settle();
    expect(world.drivers).toHaveLength(1);
    expect(document.querySelector("#gf-tour-menu-title")).toBeNull();
  });
});
