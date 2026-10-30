import { FULL_TOUR, type TourId } from "@gastify/core/tour/tourSteps";

// The tour that is in progress across pages. The full tour walks through several pages, and each page is a new load of the
// screen, so where it is lives in sessionStorage (it dies with the tab, which is the lifetime a walk through the app has).
// `pending` is set only by the tour itself right before it navigates: the next page reads it once and starts, so an old run left
// behind never starts a tour by surprise.
export interface TourRun {
  list: TourId[];
  position: number;
  pending: boolean;
  // The card to start at on the page that is loading ("continue where I left off"); absent: the first card.
  step?: string;
}

const KEY = "gf-tour-run";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function isRun(value: unknown): value is TourRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<TourRun>;
  return (
    Array.isArray(run.list) &&
    run.list.length > 0 &&
    run.list.every((id) => (FULL_TOUR as readonly unknown[]).includes(id)) &&
    Number.isInteger(run.position) &&
    (run.position as number) >= 0 &&
    (run.position as number) < run.list.length &&
    typeof run.pending === "boolean" &&
    (run.step === undefined || typeof run.step === "string")
  );
}

export function readRun(store: Store | null = browserStore()): TourRun | null {
  if (!store) return null;
  try {
    const raw = store.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRun(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeRun(run: TourRun, store: Store | null = browserStore()): void {
  try {
    store?.setItem(KEY, JSON.stringify(run));
  } catch {
    // Storage can be blocked (private windows): the tour then just does not continue across pages.
  }
}

export function clearRun(store: Store | null = browserStore()): void {
  try {
    store?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

// Reads the run and, if it is waiting to start, marks it as started so that no other load starts it again.
export function takePendingRun(store: Store | null = browserStore()): TourRun | null {
  const run = readRun(store);
  if (!run?.pending) return null;
  const started = { ...run, pending: false };
  writeRun(started, store);
  return started;
}
