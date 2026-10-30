import { describe, expect, it } from "vitest";

import { analyzePerson, belongsToPerson, sharedMovementIds, type PeopleMovement, type PersonLike } from "./peopleAnalysis";

// Thursday 2026-10-29 (a weekday): the range of 2 months starts on 2026-09-01.
const today = new Date(2026, 9, 29, 12);
const at = (month: number, day: number) => new Date(2026, month, day, 12).toISOString();
const cat = { _id: "pc", name: "Novia" };
const sub = { _id: "ps", name: "Citas" };
const spend = (id: string, amount: number, month: number, day: number, extra: Partial<PeopleMovement> = {}): PeopleMovement => ({ _id: id, name: id, amount, isBill: true, kind: "expense", date: at(month, day), category: { _id: "other" }, ...extra });
const person: PersonLike = { id: "p1", categoryId: "pc", subCategoryIds: ["ps"], tagNames: ["Novia"], contact: { pattern: "weekends" } };

describe("belongsToPerson", () => {
  it("matches by category, sub-category, tag and account, and only for spending", () => {
    expect(belongsToPerson(person, spend("a", 1, 9, 1, { category: cat }))).toBe(true);
    expect(belongsToPerson(person, spend("b", 1, 9, 1, { subCategory: sub }))).toBe(true);
    expect(belongsToPerson(person, spend("c", 1, 9, 1, { tags: [{ _id: "t", name: " novia " }] }))).toBe(true);
    expect(belongsToPerson({ id: "p", accountId: "acc" }, spend("d", 1, 9, 1, { account: { _id: "acc" } }))).toBe(true);
    expect(belongsToPerson(person, spend("e", 1, 9, 1))).toBe(false);
    expect(belongsToPerson(person, { ...spend("f", 1, 9, 1, { category: cat }), isBill: false, kind: "income" })).toBe(false);
  });
});

describe("sharedMovementIds", () => {
  it("flags a movement that belongs to two people", () => {
    const other: PersonLike = { id: "p2", tagNames: ["amigos"] };
    const both = spend("x", 10, 9, 1, { category: cat, tags: ["amigos"] });
    const one = spend("y", 10, 9, 2, { category: cat });
    expect([...sharedMovementIds([person, other], [both, one])]).toEqual(["x"]);
  });
});

describe("analyzePerson", () => {
  // Saturdays of September and October with the person (5, 12, 19, 26 Sep; 3, 10, 17, 24 Oct), 500 each + 100 of other spending.
  const saturdays = [[8, 5], [8, 12], [8, 19], [8, 26], [9, 3], [9, 10], [9, 17], [9, 24]];
  const movements: PeopleMovement[] = [
    ...saturdays.flatMap(([m, d], i) => [spend(`w${i}`, 500, m, d, { category: cat }), spend(`o${i}`, 100, m, d)]),
    // Ordinary weekdays without the person: 100 on Mondays and Wednesdays.
    ...[[8, 7], [8, 9], [8, 14], [8, 16], [8, 21], [8, 23], [9, 5], [9, 7], [9, 12], [9, 14], [9, 19], [9, 21]].map(([m, d], i) => spend(`n${i}`, 100, m, d)),
  ];
  const result = analyzePerson({ person, movements, months: 2, today });

  it("totals, outings and average per outing", () => {
    expect(result.totals.total).toBe(4000);
    expect(result.totals.count).toBe(8);
    expect(result.totals.outings).toBe(8);
    expect(result.totals.avgPerOuting).toBe(500);
    expect(result.totals.avgPerMonth).toBe(2000);
    expect(result.totals.shareOfSpending).toBeCloseTo(4000 / (4000 + 800 + 1200));
  });

  it("compares the real days with the declared ones", () => {
    expect(result.contact.byWeekday[6]).toBe(8);
    expect(result.contact.weekendShare).toBe(1);
    expect(result.contact.declared).toBe("match");
    expect(analyzePerson({ person: { ...person, contact: { pattern: "weekdays" } }, movements, months: 2, today }).contact.declared).toBe("different");
    expect(analyzePerson({ person: { ...person, contact: undefined }, movements, months: 2, today }).contact.declared).toBe("unknown");
  });

  it("measures the lift against the same weekday without the person", () => {
    // 8 Saturdays with the person; the other Saturdays of the range are 0, so there are no Saturdays to compare: it falls back to the overall mean of days without.
    expect(result.trigger.withDays).toBe(8);
    expect(result.trigger.enough).toBe(true);
    expect(result.trigger.liftPct).not.toBeNull();
    expect(result.trigger.liftPct as number).toBeGreaterThan(0);
  });

  it("says there is not enough data with few days", () => {
    const few = analyzePerson({ person, movements: movements.slice(0, 4), months: 2, today });
    expect(few.trigger.enough).toBe(false);
    expect(few.trigger.liftPct).toBeNull();
  });

  it("measures the limit, monthly and per outing", () => {
    const monthly = analyzePerson({ person: { ...person, limit: { amount: 2000, period: "monthly" } }, movements, months: 2, today });
    expect(monthly.limit?.spent).toBe(2000);
    expect(monthly.limit?.ratio).toBe(1);
    expect(monthly.limit?.remaining).toBe(0);
    const perMeeting = analyzePerson({ person: { ...person, limit: { amount: 400, period: "per_meeting" } }, movements, months: 2, today });
    expect(perMeeting.limit?.ratio).toBeCloseTo(1.25);
    expect(perMeeting.limit?.remaining).toBe(-100);
  });

  it("splits by sub-category and ranks the months", () => {
    const withSub = analyzePerson({ person, movements: [spend("s1", 300, 9, 3, { category: cat, subCategory: sub }), spend("s2", 100, 9, 4, { category: cat })], months: 2, today });
    expect(withSub.subs.map((row) => [row.id, row.total])).toEqual([["ps", 300], ["none", 100]]);
    expect(withSub.monthly.map((row) => row.month)).toEqual(["2026-09", "2026-10"]);
  });

  it("handles a person with no movements", () => {
    const empty = analyzePerson({ person, movements: [], months: 2, today });
    expect(empty.totals.total).toBe(0);
    expect(empty.totals.avgPerOuting).toBe(0);
    expect(empty.contact.declared).toBe("unknown");
    expect(empty.trigger.enough).toBe(false);
  });

  it("flags shared movements", () => {
    const shared = analyzePerson({ person, movements: [spend("z", 50, 9, 3, { category: cat })], months: 2, today, sharedIds: new Set(["z"]) });
    expect(shared.movements[0].shared).toBe(true);
  });
});
