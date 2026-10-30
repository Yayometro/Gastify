import { describe, expect, it } from "vitest";
import { progressFor } from "./progress";
import type { TourStep } from "./stepTypes";

const plain = (id: string): TourStep => ({ id });
const opener: TourStep = { id: "t.open", anchor: "a", clickToContinue: true };
const inside = (id: string): TourStep => ({ id, anchor: id, later: true });

describe("progressFor", () => {
  it("counts the cards that exist and ignores the ones that do not", () => {
    const steps = [plain("t.a"), { id: "t.b", anchor: "b", optional: true }, plain("t.c")];
    expect(progressFor(steps, [true, false, true], 0)).toEqual({ shown: 1, total: 2, open: false });
    expect(progressFor(steps, [true, false, true], 2)).toEqual({ shown: 2, total: 2, open: false });
  });

  it("stays open while the cards behind a pending opener do not exist yet", () => {
    const steps = [plain("t.a"), opener, inside("t.x"), inside("t.y")];
    expect(progressFor(steps, [true, true, false, false], 0).open).toBe(true);
    expect(progressFor(steps, [true, true, false, false], 1).open).toBe(true);
  });

  it("is exact once the window is open, even if some of its cards are missing", () => {
    const steps = [plain("t.a"), opener, inside("t.x"), inside("t.y")];
    expect(progressFor(steps, [true, true, true, false], 2)).toEqual({ shown: 3, total: 3, open: false });
  });

  it("is exact when there is no opener, even for cards that are later and missing", () => {
    const steps = [plain("t.a"), inside("t.x"), inside("t.y")];
    expect(progressFor(steps, [true, true, false], 0)).toEqual({ shown: 1, total: 2, open: false });
  });
});
