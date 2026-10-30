import { describe, expect, it } from "vitest";
import {
  AUTO_TUTORIAL_SESSIONS,
  applyComplete,
  applyDismiss,
  applyProgress,
  applyVisit,
  autoActionFor,
  freshOnboarding,
  isStepOf,
  readOnboarding,
  resumePoint,
  type Onboarding,
} from "./onboarding";
import { FULL_TOUR, TOUR_STEPS } from "./tourSteps";

const at = (overrides: Partial<Onboarding>): Onboarding => ({ ...freshOnboarding(), ...overrides });

describe("autoActionFor", () => {
  it("tells an account from before the tutorial about it", () => {
    expect(autoActionFor(null)).toBe("announce");
    expect(autoActionFor(undefined)).toBe("announce");
  });

  it("starts the welcome in the first session of a new account", () => {
    expect(autoActionFor(at({ sessions: 1 }))).toBe("welcome");
  });

  it("offers to continue in the second session when the tutorial was left half way, and starts the welcome if it was never seen", () => {
    expect(autoActionFor(at({ sessions: 2, progress: { tour: "budgets", step: "budgets.savings" } }))).toBe("resume");
    expect(autoActionFor(at({ sessions: 2 }))).toBe("welcome");
  });

  it("does nothing from the third session on", () => {
    expect(AUTO_TUTORIAL_SESSIONS).toBe(2);
    expect(autoActionFor(at({ sessions: 3, progress: { tour: "budgets", step: "budgets.savings" } }))).toBe("none");
    expect(autoActionFor(at({ sessions: 7 }))).toBe("none");
  });

  it("does nothing once the tutorial is done or was dismissed", () => {
    expect(autoActionFor(at({ sessions: 1, tutorial: "done" }))).toBe("none");
    expect(autoActionFor(at({ sessions: 2, tutorial: "dismissed" }))).toBe("none");
  });
});

describe("applyVisit", () => {
  it("counts a session once, however many times it opens", () => {
    const first = applyVisit(freshOnboarding(), "session-a");
    expect(first.isNewSession).toBe(true);
    expect(first.next).toMatchObject({ sessions: 1, lastSessionId: "session-a" });

    const again = applyVisit(first.next, "session-a");
    expect(again.isNewSession).toBe(false);
    expect(again.next).toBe(first.next);

    const second = applyVisit(first.next, "session-b");
    expect(second.isNewSession).toBe(true);
    expect(second.next.sessions).toBe(2);
  });

  it("walks a new account through the rules: welcome, resume, then nothing", () => {
    let state = freshOnboarding();
    state = applyVisit(state, "a").next;
    expect(autoActionFor(state)).toBe("welcome");
    state = applyProgress(state, { tour: "movements", step: "movements.list" });
    state = applyVisit(state, "b").next;
    expect(autoActionFor(state)).toBe("resume");
    state = applyVisit(state, "c").next;
    expect(autoActionFor(state)).toBe("none");
  });
});

describe("progress, completion and dismissal", () => {
  it("remembers the last card only while the tutorial is pending", () => {
    const progress = { tour: "budgets" as const, step: "budgets.period" };
    expect(applyProgress(freshOnboarding(), progress).progress).toEqual(progress);
    expect(applyProgress(at({ tutorial: "done" }), progress).progress).toBeNull();
    expect(applyProgress(at({ tutorial: "dismissed" }), progress).progress).toBeNull();
  });

  it("marks the tutorial done or dismissed and forgets where it was", () => {
    const midway = at({ sessions: 1, progress: { tour: "budgets", step: "budgets.period" } });
    expect(applyComplete(midway)).toMatchObject({ tutorial: "done", progress: null, sessions: 1 });
    expect(applyDismiss(midway)).toMatchObject({ tutorial: "dismissed", progress: null, sessions: 1 });
  });
});

describe("isStepOf", () => {
  it("accepts only a real card of its tour", () => {
    expect(isStepOf("budgets", "budgets.savings")).toBe(true);
    expect(isStepOf("budgets", "movements.list")).toBe(false);
    expect(isStepOf("nope", "budgets.savings")).toBe(false);
    expect(isStepOf("budgets", 3)).toBe(false);
    expect(isStepOf(undefined, undefined)).toBe(false);
  });
});

describe("readOnboarding", () => {
  it("reads a well-formed record, and drops a progress that names no real card", () => {
    expect(readOnboarding({ sessions: 2, lastSessionId: "x", tutorial: "pending", progress: { tour: "intro", step: "intro.bar" } })).toEqual({
      sessions: 2,
      lastSessionId: "x",
      tutorial: "pending",
      progress: { tour: "intro", step: "intro.bar" },
    });
    expect(readOnboarding({ sessions: 1, tutorial: "pending", progress: { tour: "intro", step: "gone" } })?.progress).toBeNull();
    expect(readOnboarding({ sessions: 1, tutorial: "pending" })?.lastSessionId).toBeNull();
  });

  it("treats anything else as no record", () => {
    for (const value of [null, undefined, "x", 3, {}, { sessions: -1, tutorial: "pending" }, { sessions: 1.5, tutorial: "pending" }, { sessions: 1, tutorial: "maybe" }]) {
      expect(readOnboarding(value)).toBeNull();
    }
  });
});

describe("resumePoint", () => {
  it("goes back to the card where the person was", () => {
    expect(resumePoint({ tour: "budgets", step: "budgets.projects" })).toEqual({ list: [...FULL_TOUR], position: FULL_TOUR.indexOf("budgets"), step: "budgets.projects" });
  });

  it("goes on to the next tour when the person had reached the last card of one", () => {
    const steps = TOUR_STEPS.intro;
    expect(resumePoint({ tour: "intro", step: steps[steps.length - 1].id })).toEqual({ list: [...FULL_TOUR], position: 1 });
  });

  it("has nothing to continue after the last card of the last tour, or without progress", () => {
    const steps = TOUR_STEPS.profile;
    expect(resumePoint({ tour: "profile", step: steps[steps.length - 1].id })).toBeNull();
    expect(resumePoint(null)).toBeNull();
    expect(resumePoint({ tour: "budgets", step: "gone" })).toBeNull();
  });
});
