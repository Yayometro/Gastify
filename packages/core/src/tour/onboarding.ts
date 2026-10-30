// What the account remembers about the tutorial, and what the app does by itself because of it. Pure rules, no database and no
// DOM: the server applies them to the user's document, and the tests cover every case.
import { FULL_TOUR, TOUR_STEPS, type SectionTourId, type TourId } from "./tourSteps";

// "pending": the tutorial still offers itself. "done": the full tour was finished. "dismissed": the person asked not to see it
// on its own (an account from before the tutorial is also saved as dismissed once it has been told about it).
export type TutorialStatus = "pending" | "done" | "dismissed";

export interface TourProgress {
  tour: SectionTourId;
  // The id of the last card shown (see TOUR_STEPS), so the tutorial can pick up there.
  step: string;
}

export interface Onboarding {
  // The sign-ins (sessions) this account has opened since the tutorial exists. Each session counts once.
  sessions: number;
  lastSessionId: string | null;
  tutorial: TutorialStatus;
  progress: TourProgress | null;
}

// The first and the second session get the tutorial on their own; from the third on it only opens when the person asks for it.
export const AUTO_TUTORIAL_SESSIONS = 2;

// A brand-new account: nothing seen yet.
export function freshOnboarding(): Onboarding {
  return { sessions: 0, lastSessionId: null, tutorial: "pending", progress: null };
}

// What the app does by itself when a session opens:
//   "welcome"  starts the welcome tour;
//   "resume"   offers to continue where the tutorial was left, or to start over;
//   "announce" tells an account from before the tutorial that it exists (once);
//   "none"     nothing.
export type AutoAction = "none" | "welcome" | "resume" | "announce";

// What the onboarding route answers (and what the screen reads).
export interface OnboardingReply {
  ok: boolean;
  message?: string;
  // The record after the action; null for an account from before the tutorial that has none yet.
  onboarding: Onboarding | null;
  // Only for `visit`: what the app does by itself in this session.
  action?: AutoAction;
}

export function autoActionFor(onboarding: Onboarding | null | undefined): AutoAction {
  // No record at all: the account is older than the tutorial.
  if (!onboarding) return "announce";
  if (onboarding.tutorial !== "pending") return "none";
  if (onboarding.sessions > AUTO_TUTORIAL_SESSIONS) return "none";
  return onboarding.progress ? "resume" : "welcome";
}

function isTourId(value: unknown): value is SectionTourId {
  return typeof value === "string" && (FULL_TOUR as readonly string[]).includes(value);
}

// True when `step` is a card of `tour`. The server refuses any other pair, so progress can only name real cards.
export function isStepOf(tour: unknown, step: unknown): boolean {
  return isTourId(tour) && typeof step === "string" && TOUR_STEPS[tour].some((entry) => entry.id === step);
}

// What the document holds, checked: anything that is not a well-formed record counts as no record.
export function readOnboarding(value: unknown): Onboarding | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Onboarding>;
  if (typeof raw.sessions !== "number" || !Number.isInteger(raw.sessions) || raw.sessions < 0) return null;
  if (raw.tutorial !== "pending" && raw.tutorial !== "done" && raw.tutorial !== "dismissed") return null;
  const progress = raw.progress && isStepOf(raw.progress.tour, raw.progress.step) ? ({ tour: raw.progress.tour, step: raw.progress.step } as TourProgress) : null;
  return { sessions: raw.sessions, lastSessionId: typeof raw.lastSessionId === "string" ? raw.lastSessionId : null, tutorial: raw.tutorial, progress };
}

// A session opens: it counts once, however many pages or tabs it loads.
export function applyVisit(onboarding: Onboarding, sessionId: string): { next: Onboarding; isNewSession: boolean } {
  if (onboarding.lastSessionId === sessionId) return { next: onboarding, isNewSession: false };
  return { next: { ...onboarding, sessions: onboarding.sessions + 1, lastSessionId: sessionId }, isNewSession: true };
}

// Only a tutorial that is still pending keeps track of where it is.
export function applyProgress(onboarding: Onboarding, progress: TourProgress): Onboarding {
  return onboarding.tutorial === "pending" ? { ...onboarding, progress } : onboarding;
}

export function applyComplete(onboarding: Onboarding): Onboarding {
  return { ...onboarding, tutorial: "done", progress: null };
}

export function applyDismiss(onboarding: Onboarding): Onboarding {
  return { ...onboarding, tutorial: "dismissed", progress: null };
}

// Where "continue where I left off" goes: the tour the person was in, starting at that card, or the next tour when that card was
// the last of its tour. Null when there is nothing left to continue.
export interface ResumePoint {
  list: TourId[];
  position: number;
  // The card to start at (absent: the first card of the tour).
  step?: string;
}

export function resumePoint(progress: TourProgress | null | undefined): ResumePoint | null {
  if (!progress || !isStepOf(progress.tour, progress.step)) return null;
  const position = FULL_TOUR.indexOf(progress.tour);
  const steps = TOUR_STEPS[progress.tour];
  const wasLast = steps[steps.length - 1].id === progress.step;
  if (!wasLast) return { list: [...FULL_TOUR], position, step: progress.step };
  return position < FULL_TOUR.length - 1 ? { list: [...FULL_TOUR], position: position + 1 } : null;
}
