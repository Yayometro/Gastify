import { describe, it, expect } from "vitest";
import { nextOccurrenceAfter, occurrenceAt, occurrenceKey, occurrencesBetween, planCatchUp, type RecurrenceRule } from "./recurrence";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const monthly = (y: number, m: number, d: number): RecurrenceRule => ({ frequency: "monthly", anchorDate: day(y, m, d) });

describe("occurrenceAt", () => {
  it("keeps the anchor's day and uses the last day of a short month", () => {
    const rule = monthly(2026, 1, 31);
    expect(occurrenceKey(occurrenceAt(rule, 0))).toBe("2026-01-31");
    expect(occurrenceKey(occurrenceAt(rule, 1))).toBe("2026-02-28");
    expect(occurrenceKey(occurrenceAt(rule, 2))).toBe("2026-03-31");
    expect(occurrenceKey(occurrenceAt(rule, 13))).toBe("2027-02-28");
  });
  it("handles a leap day in a yearly rule", () => {
    const rule: RecurrenceRule = { frequency: "yearly", anchorDate: day(2028, 2, 29) };
    expect(occurrenceKey(occurrenceAt(rule, 1))).toBe("2029-02-28");
    expect(occurrenceKey(occurrenceAt(rule, 4))).toBe("2032-02-29");
  });
  it("steps quarterly, semiannual and bimonthly by their months", () => {
    expect(occurrenceKey(occurrenceAt({ frequency: "quarterly", anchorDate: day(2026, 11, 15) }, 1))).toBe("2027-02-15");
    expect(occurrenceKey(occurrenceAt({ frequency: "semiannual", anchorDate: day(2026, 8, 10) }, 1))).toBe("2027-02-10");
    expect(occurrenceKey(occurrenceAt({ frequency: "bimonthly", anchorDate: day(2026, 12, 1) }, 1))).toBe("2027-02-01");
  });
  it("steps weekly and biweekly by days across a month and a year", () => {
    expect(occurrenceKey(occurrenceAt({ frequency: "weekly", anchorDate: day(2026, 12, 28) }, 1))).toBe("2027-01-04");
    expect(occurrenceKey(occurrenceAt({ frequency: "biweekly", anchorDate: day(2026, 10, 30) }, 2))).toBe("2026-11-27");
  });
});

describe("nextOccurrenceAfter / occurrencesBetween", () => {
  it("the next one is strictly after the given day", () => {
    const rule = monthly(2026, 1, 15);
    expect(occurrenceKey(nextOccurrenceAfter(rule, day(2026, 3, 15)))).toBe("2026-04-15");
    expect(occurrenceKey(nextOccurrenceAfter(rule, day(2026, 3, 14)))).toBe("2026-03-15");
    expect(occurrenceKey(nextOccurrenceAfter(rule, day(2025, 1, 1)))).toBe("2026-01-15");
  });
  it("lists the due ones, oldest first, and caps at the newest ones", () => {
    const rule = monthly(2026, 1, 10);
    const all = occurrencesBetween(rule, day(2026, 1, 10), day(2026, 6, 20));
    expect(all.map(occurrenceKey)).toEqual(["2026-02-10", "2026-03-10", "2026-04-10", "2026-05-10", "2026-06-10"]);
    expect(occurrencesBetween(rule, day(2026, 1, 10), day(2026, 6, 20), 2).map(occurrenceKey)).toEqual(["2026-05-10", "2026-06-10"]);
  });
  it("works for a rule far in the past without walking one by one", () => {
    const rule: RecurrenceRule = { frequency: "weekly", anchorDate: day(2000, 1, 3) };
    expect(occurrenceKey(nextOccurrenceAfter(rule, day(2026, 10, 30)))).toBe("2026-11-02");
  });
  it("is not moved by a change of clock", () => {
    const rule: RecurrenceRule = { frequency: "weekly", anchorDate: day(2026, 3, 1) };
    // The weeks around the clock changes in March and November keep their calendar day.
    expect(occurrenceKey(occurrenceAt(rule, 2))).toBe("2026-03-15");
    expect(occurrenceKey(occurrenceAt(rule, 35))).toBe("2026-11-01");
  });
});

describe("planCatchUp", () => {
  const base = { rule: monthly(2026, 1, 15), lastHandled: day(2026, 1, 15), isVariable: false } as const;
  it("has nothing due before the next date", () => {
    expect(planCatchUp({ ...base, today: day(2026, 2, 14) })).toEqual({ autoCreate: [], pending: [], skipped: 0, processedUntil: null });
  });
  it("creates by itself the charges of a fixed price that fell due, each once", () => {
    const plan = planCatchUp({ ...base, today: day(2026, 4, 20) });
    expect(plan.autoCreate.map(occurrenceKey)).toEqual(["2026-02-15", "2026-03-15", "2026-04-15"]);
    expect(plan.pending).toEqual([]);
    expect(occurrenceKey(plan.processedUntil as Date)).toBe("2026-04-15");
    // After handling them, the same day has nothing more.
    expect(planCatchUp({ ...base, lastHandled: plan.processedUntil as Date, today: day(2026, 4, 20) }).autoCreate).toEqual([]);
  });
  it("asks about the newest 3 of a variable price and reports the older ones as skipped", () => {
    const plan = planCatchUp({ ...base, isVariable: true, today: day(2026, 8, 20) });
    expect(plan.autoCreate).toEqual([]);
    expect(plan.pending.map(occurrenceKey)).toEqual(["2026-06-15", "2026-07-15", "2026-08-15"]);
    expect(plan.skipped).toBe(4);
  });
  it("caps the automatic ones at 12 and counts the rest as skipped", () => {
    const plan = planCatchUp({ ...base, today: day(2028, 12, 31) });
    expect(plan.autoCreate).toHaveLength(12);
    // From Feb 2026 to Dec 2028 there are 35 due charges: the newest 12 are created and 23 are left out.
    expect(plan.skipped).toBe(23);
  });
  it("leaves out the occurrences already answered while an older one still waits", () => {
    const plan = planCatchUp({ ...base, isVariable: true, today: day(2026, 4, 20), handledKeys: ["2026-04-15"] });
    expect(plan.pending.map(occurrenceKey)).toEqual(["2026-02-15", "2026-03-15"]);
  });
  it("does nothing for a paused rule and stops at its end date", () => {
    expect(planCatchUp({ ...base, today: day(2026, 6, 1), active: false }).autoCreate).toEqual([]);
    const plan = planCatchUp({ ...base, today: day(2026, 8, 1), endDate: day(2026, 4, 1) });
    expect(plan.autoCreate.map(occurrenceKey)).toEqual(["2026-02-15", "2026-03-15"]);
  });
});
