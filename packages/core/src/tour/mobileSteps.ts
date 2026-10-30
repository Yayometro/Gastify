// The phone's guided tutorial, as data (the web's is in tourSteps.ts). No React here: the phone's engine (apps/mobile/src/components/tour)
// turns these steps into the highlighted tour, and the texts live in the "tourMobile" i18n namespace keyed by the step id.
// The kinds of tour are the web's: the welcome ("mIntro"), one tour per screen (a card for each section, from the top down) and one
// in-depth tutorial per component. Every anchor is the id a screen gives to a control with <TourTarget id="..."> (or the `tour` prop
// of a Card); a step whose anchor is not on screen is skipped, so the same catalog serves the phone and the tablet.
import type { TourStep } from "./stepTypes";
import { stepBodyKey, stepTitleKey } from "./stepTypes";
import { mIntroTour } from "./mobile/intro";
import { homeTours } from "./mobile/home";
import { movementsTours } from "./mobile/movements";
import { budgetsTours } from "./mobile/budgets";
import { projectionsTours } from "./mobile/projections";
import { analyzerTours } from "./mobile/analyzer";
import { accountsTours } from "./mobile/accounts";
import { historyTours } from "./mobile/history";
import { categoriesTours } from "./mobile/categories";
import { profileTours } from "./mobile/profile";
import { moreTours } from "./mobile/more";

export { stepBodyKey, stepTitleKey, type TourStep };

// The screens that have a tour of their own, in the order the full tour visits them.
export const MOBILE_SCREENS = ["home", "movements", "budgets", "projections", "analyzer", "accounts", "history", "categories", "profile", "more"] as const;
export type MobileScreen = (typeof MOBILE_SCREENS)[number];

const SCREEN_TOURS = {
  home: homeTours,
  movements: movementsTours,
  budgets: budgetsTours,
  projections: projectionsTours,
  analyzer: analyzerTours,
  accounts: accountsTours,
  history: historyTours,
  categories: categoriesTours,
  profile: profileTours,
  more: moreTours,
} as const;

// The id of each screen's own tour.
export const SCREEN_TOUR_ID = {
  home: "mHome",
  movements: "mMovements",
  budgets: "mBudgets",
  projections: "mProjections",
  analyzer: "mAnalyzer",
  accounts: "mAccounts",
  history: "mHistory",
  categories: "mCategories",
  profile: "mProfile",
  more: "mMore",
} as const satisfies Record<MobileScreen, string>;
export type MobileScreenTourId = (typeof SCREEN_TOUR_ID)[MobileScreen];

// The tutorials of the components, by id. Each id belongs to one screen (see MOBILE_COMPONENT_SCREEN).
export type MobileComponentTourId = { [S in MobileScreen]: keyof (typeof SCREEN_TOURS)[S]["components"] }[MobileScreen];

// "mIntro" is the welcome. It is not a screen; it points at the bottom bar, which every screen has.
export type MobileTourId = "mIntro" | MobileScreenTourId | MobileComponentTourId;

// The tours the full tour runs, in order: the welcome and then every screen but the menu ("Más"). Component tutorials are not part of it.
export type MobileSectionTourId = "mIntro" | MobileScreenTourId;
export const MOBILE_FULL_TOUR: readonly MobileSectionTourId[] = ["mIntro", ...MOBILE_SCREENS.filter((screen) => screen !== "more").map((screen) => SCREEN_TOUR_ID[screen])];

export const MOBILE_TOUR_STEPS: Record<MobileTourId, readonly TourStep[]> = (() => {
  const steps: Record<string, readonly TourStep[]> = { mIntro: mIntroTour };
  for (const screen of MOBILE_SCREENS) {
    steps[SCREEN_TOUR_ID[screen]] = SCREEN_TOURS[screen].page;
    Object.assign(steps, SCREEN_TOURS[screen].components);
  }
  return steps as Record<MobileTourId, readonly TourStep[]>;
})();

// The screen each component tutorial belongs to.
export const MOBILE_COMPONENT_SCREEN: Record<MobileComponentTourId, MobileScreen> = (() => {
  const screens: Record<string, MobileScreen> = {};
  for (const screen of MOBILE_SCREENS) {
    for (const id of Object.keys(SCREEN_TOURS[screen].components)) screens[id] = screen;
  }
  return screens as Record<MobileComponentTourId, MobileScreen>;
})();

// The component tutorials of a screen, in the order their components appear on it.
export function mobileComponentToursFor(screen: MobileScreen): MobileComponentTourId[] {
  return Object.keys(SCREEN_TOURS[screen].components) as MobileComponentTourId[];
}

// True when a component of some screen has a tutorial of its own under this id. The id is also the anchor of the component's first card,
// so a Card with `tour="<id>"` can show the compass that starts it.
export function hasMobileComponentTour(id: string | undefined): id is MobileComponentTourId {
  return Boolean(id) && Object.prototype.hasOwnProperty.call(MOBILE_COMPONENT_SCREEN, id as string);
}

export function isMobileComponentTour(id: MobileTourId): id is MobileComponentTourId {
  return id !== "mIntro" && !(Object.values(SCREEN_TOUR_ID) as string[]).includes(id);
}

// The label each screen's tutorial is listed under: the phone's own names for its screens (see the "mobile" namespace).
export const MOBILE_SCREEN_NAME_KEY: Record<MobileScreen, string> = {
  home: "shared.start",
  movements: "mobile.movimientos",
  budgets: "mobile.presupuestos",
  projections: "mobile.proyecciones",
  analyzer: "mobile.analizador.de.cartera",
  accounts: "mobile.cuentas",
  history: "mobile.historial",
  categories: "mobile.categorias",
  profile: "mobile.perfil",
  more: "mobile.mas",
};

// The screen a path of the phone's router belongs to (null for a detail, a form or any screen with no tour).
export function mobileScreenForPath(pathname: string | null | undefined): MobileScreen | null {
  if (!pathname) return null;
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  switch (clean) {
    case "/":
      return "home";
    case "/movements":
      return "movements";
    case "/budgets":
      return "budgets";
    case "/more":
      return "more";
    case "/more/accounts":
      return "accounts";
    case "/more/categories":
      return "categories";
    case "/more/analyzer":
      return "analyzer";
    case "/more/history":
      return "history";
    case "/more/projections":
      return "projections";
    case "/more/profile":
      return "profile";
    default:
      return null;
  }
}

export function pathForMobileScreen(screen: MobileScreen): string {
  return screen === "home" ? "/" : screen === "movements" || screen === "budgets" || screen === "more" ? `/${screen}` : `/more/${screen}`;
}

// The tour that comes after `id` in a list of tours, or null at the end.
export function nextMobileTour(id: MobileTourId, order: readonly MobileTourId[] = MOBILE_FULL_TOUR): MobileTourId | null {
  const index = order.indexOf(id);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
}

// The screen a section tour belongs to (null for the welcome, which points at the bottom bar and works from any screen).
export function screenOfMobileTour(id: MobileTourId): MobileScreen | null {
  if (id === "mIntro") return null;
  for (const screen of MOBILE_SCREENS) {
    if (SCREEN_TOUR_ID[screen] === id) return screen;
  }
  return isMobileComponentTour(id) ? MOBILE_COMPONENT_SCREEN[id] : null;
}
