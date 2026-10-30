// The guided tutorial, as data: which steps each tour has and which element each one points at. No React and no DOM here, so the
// catalog can be tested on its own. The web engine (src/components/tour) turns these steps into the highlighted tour; the texts
// live in the "tour" i18n namespaces, keyed by the step id. There are three kinds of tour:
//   - the welcome ("intro"): how to move around;
//   - one tour per page: a card for each section of the page, in the order the sections appear on screen;
//   - one tutorial per component (a section of a page): what each of its controls does and how to use it, in detail. They start
//     from the compass button next to the component's title, and are also listed in the tutorial menu of their page.
import type { TourStep } from "./stepTypes";
import { introTour } from "./steps/intro";
import { dashboardTours } from "./steps/dashboard";
import { movementsTours } from "./steps/movements";
import { budgetsTours } from "./steps/budgets";
import { projectionsTours } from "./steps/projections";
import { analyzerTours } from "./steps/analyzer";
import { accountsTours } from "./steps/accounts";
import { historyTours } from "./steps/history";
import { categoriesTours } from "./steps/categories";
import { profileTours } from "./steps/profile";

export { stepBodyKey, stepTitleKey, type TourSide, type TourStep } from "./stepTypes";

// The pages that have a tour of their own, in the order the full tour visits them.
export const TOUR_PAGES = ["dashboard", "movements", "budgets", "projections", "analyzer", "accounts", "history", "categories", "profile"] as const;
export type TourPage = (typeof TOUR_PAGES)[number];

const PAGE_TOURS = {
  dashboard: dashboardTours,
  movements: movementsTours,
  budgets: budgetsTours,
  projections: projectionsTours,
  analyzer: analyzerTours,
  accounts: accountsTours,
  history: historyTours,
  categories: categoriesTours,
  profile: profileTours,
} as const;

// The tutorials of the components, by id. Each id belongs to one page (see COMPONENT_PAGE).
export type ComponentTourId = { [P in TourPage]: keyof (typeof PAGE_TOURS)[P]["components"] }[TourPage];

// "intro" is the welcome. It is not a page; it points at the navigation bar, which every page has.
export type TourId = "intro" | TourPage | ComponentTourId;

// The tours the full tour runs, in order: the welcome and then every page. (Component tutorials are not part of it.)
export type SectionTourId = "intro" | TourPage;
export const FULL_TOUR: readonly SectionTourId[] = ["intro", ...TOUR_PAGES];

export const TOUR_STEPS: Record<TourId, readonly TourStep[]> = (() => {
  const steps: Record<string, readonly TourStep[]> = { intro: introTour };
  for (const page of TOUR_PAGES) {
    steps[page] = PAGE_TOURS[page].page;
    Object.assign(steps, PAGE_TOURS[page].components);
  }
  return steps as Record<TourId, readonly TourStep[]>;
})();

// The page each component tutorial belongs to.
export const COMPONENT_PAGE: Record<ComponentTourId, TourPage> = (() => {
  const pages: Record<string, TourPage> = {};
  for (const page of TOUR_PAGES) {
    for (const id of Object.keys(PAGE_TOURS[page].components)) pages[id] = page;
  }
  return pages as Record<ComponentTourId, TourPage>;
})();

// The component tutorials of a page, in the order their components appear on it.
export function componentToursFor(page: TourPage): ComponentTourId[] {
  return Object.keys(PAGE_TOURS[page].components) as ComponentTourId[];
}

export function isComponentTour(id: TourId): id is ComponentTourId {
  return id !== "intro" && !(TOUR_PAGES as readonly string[]).includes(id);
}

// The navbar's own label for each section, so the tour names sections the way the bar does.
export const TOUR_PAGE_NAME_KEY: Record<SectionTourId, string> = {
  intro: "tour.page.intro",
  dashboard: "navbar.wallet",
  movements: "navbar.movements",
  budgets: "navbar.budgets",
  projections: "navbar.projections",
  analyzer: "navbar.analyzer",
  accounts: "navbar.accounts",
  history: "navbar.history",
  categories: "navbar.categories",
  profile: "navbar.profile",
};

const DASHBOARD_ROOT = "/dashboard";
const DEMO_ROOT = "/demo";

// True on the public demo (/demo and its sections), where the same screens run with sample data.
export function isDemoPath(pathname: string | null | undefined): boolean {
  return pathname === DEMO_ROOT || Boolean(pathname?.startsWith(`${DEMO_ROOT}/`));
}

// The page a path belongs to, in the app and in the demo, or null when it has no tour (or is not a page at all).
export function pageForPath(pathname: string | null | undefined): TourPage | null {
  if (!pathname) return null;
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const root = clean === DEMO_ROOT || clean.startsWith(`${DEMO_ROOT}/`) ? DEMO_ROOT : clean === DASHBOARD_ROOT || clean.startsWith(`${DASHBOARD_ROOT}/`) ? DASHBOARD_ROOT : null;
  if (!root) return null;
  const section = clean.slice(root.length).replace(/^\//, "");
  if (section === "") return "dashboard";
  return (TOUR_PAGES as readonly string[]).includes(section) && section !== "dashboard" ? (section as TourPage) : null;
}

export function pathForPage(page: TourPage, demo: boolean): string {
  const root = demo ? DEMO_ROOT : DASHBOARD_ROOT;
  return page === "dashboard" ? root : `${root}/${page}`;
}

// The tour that comes after `id` in a list of tours, or null at the end.
export function nextTour(id: TourId, order: readonly TourId[] = FULL_TOUR): TourId | null {
  const index = order.indexOf(id);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
}
