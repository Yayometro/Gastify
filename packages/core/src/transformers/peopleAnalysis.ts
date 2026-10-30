import { idOf } from "../categories/categoryForm";
import { movementKind } from "../transactions/monthSummary";
import { movementTime } from "../transactions/historyWindow";
import { getPrimaryAmount } from "./transactionsChange";

// How the money spent around one person looks: how much, how often (the real days against the ones the person declared),
// whether the days with them go with a higher or lower total, and how it stands against the limit the person set. Pure: the
// screens only draw what this returns. A movement "is of" the person when its category, its sub-category, one of its tags or
// its account is one of the person's; a movement can be of several people (it counts whole in each, flagged as shared, and the
// general total never adds it twice). The wording around this data is always neutral: it describes spending, never judges.

export type ContactPattern = "weekdays" | "weekends" | "daily" | "random" | "custom";
export type ContactFrequency = "daily" | "few_per_week" | "weekly" | "biweekly" | "monthly" | "sporadic";

export interface PersonLike {
  id: string;
  categoryId?: string | null;
  subCategoryIds?: string[];
  tagNames?: string[];
  accountId?: string | null;
  contact?: { pattern?: ContactPattern; days?: number[]; frequency?: ContactFrequency; typicalMeetingsPerMonth?: number };
  limit?: { amount: number; period: "monthly" | "per_meeting" } | null;
}

export interface PeopleMovement {
  _id?: unknown;
  name?: string;
  date?: unknown;
  createdAt?: unknown;
  kind?: string;
  isBill?: boolean;
  amount?: number | string | null;
  category?: unknown;
  subCategory?: unknown;
  account?: unknown;
  tags?: unknown[];
  displayMoney?: unknown;
  [key: string]: unknown;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;
const DAY = 86_400_000;

function tagNameOf(tag: unknown): string {
  if (typeof tag === "string") return tag;
  const name = (tag as { name?: unknown } | null | undefined)?.name;
  return typeof name === "string" ? name : "";
}

export function belongsToPerson(person: PersonLike, movement: PeopleMovement): boolean {
  if (movementKind(movement as never) !== "expense") return false;
  if (person.categoryId && idOf(movement.category) === person.categoryId) return true;
  const sub = idOf(movement.subCategory);
  if (sub && person.subCategoryIds?.includes(sub)) return true;
  if (person.accountId && idOf(movement.account) === person.accountId) return true;
  const names = new Set((person.tagNames ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean));
  return names.size > 0 && (movement.tags ?? []).some((tag) => names.has(tagNameOf(tag).trim().toLowerCase()));
}

// Which people each movement belongs to, so a movement of two people can be flagged and counted once in the general total.
export function sharedMovementIds(people: PersonLike[], movements: PeopleMovement[]): Set<string> {
  const shared = new Set<string>();
  for (const movement of movements) {
    const id = idOf(movement._id);
    if (id && people.filter((person) => belongsToPerson(person, movement)).length > 1) shared.add(id);
  }
  return shared;
}

const dayKey = (time: number): string => {
  const date = new Date(time);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

export interface PersonAnalysis {
  totals: {
    total: number;
    count: number;
    // Days with at least one movement of the person ("outings") and the average spent on each.
    outings: number;
    avgPerOuting: number;
    avgPerMonth: number;
    shareOfSpending: number;
    // The last 3 months against the 3 before them (null when the earlier ones had nothing).
    trendPct: number | null;
  };
  contact: {
    // Outings per weekday, Sunday = 0.
    byWeekday: number[];
    weekendShare: number;
    perWeek: number;
    // "match" when the real days fit what the person declared, "different" when they do not, "unknown" when nothing was declared or it is random.
    declared: "match" | "different" | "unknown";
  };
  trigger: {
    enough: boolean;
    withDays: number;
    withoutDays: number;
    // How much higher (+) or lower (-) the day's total spending is on days with the person than on the same kind of day without, in %.
    liftPct: number | null;
  };
  limit: null | {
    amount: number;
    period: "monthly" | "per_meeting";
    spent: number;
    ratio: number;
    projected: number | null;
    remaining: number;
    outingsLeft: number | null;
  };
  subs: { id: string; name: string; total: number; share: number }[];
  monthly: { month: string; total: number }[];
  movements: { id: string; name: string; date: number; amount: number; shared: boolean }[];
}

export const MIN_TRIGGER_DAYS = 8;

export interface AnalyzePersonInput {
  person: PersonLike;
  movements: PeopleMovement[];
  // The range, in whole months ending in today's.
  months?: number;
  today?: Date;
  sharedIds?: Set<string>;
}

export function analyzePerson({ person, movements, months = 6, today = new Date(), sharedIds = new Set() }: AnalyzePersonInput): PersonAnalysis {
  const rangeStart = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1).getTime();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
  const threeStart = new Date(today.getFullYear(), today.getMonth() - 2, 1).getTime();
  const prevStart = new Date(today.getFullYear(), today.getMonth() - 5, 1).getTime();

  const dayTotals = new Map<string, number>();
  const personDays = new Set<string>();
  const monthTotals = new Map<string, number>();
  const subTotals = new Map<string, { name: string; total: number }>();
  const rows: PersonAnalysis["movements"] = [];
  let total = 0;
  let count = 0;
  let allSpending = 0;
  let last3 = 0;
  let prev3 = 0;

  for (const movement of movements) {
    if (movementKind(movement as never) !== "expense") continue;
    const time = movementTime(movement);
    if (time === null) continue;
    const amount = Math.abs(getPrimaryAmount(movement));
    const mine = belongsToPerson(person, movement);
    if (mine) {
      if (time >= threeStart && time <= todayEnd) last3 += amount;
      else if (time >= prevStart && time < threeStart) prev3 += amount;
    }
    if (time < rangeStart || time > todayEnd) continue;
    allSpending += amount;
    const key = dayKey(time);
    dayTotals.set(key, (dayTotals.get(key) ?? 0) + amount);
    if (!mine) continue;
    total += amount;
    count += 1;
    personDays.add(key);
    const date = new Date(time);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthTotals.set(month, (monthTotals.get(month) ?? 0) + amount);
    const subId = idOf(movement.subCategory) || "none";
    const subName = (movement.subCategory as { name?: string } | null | undefined)?.name ?? "";
    const sub = subTotals.get(subId) ?? { name: subName, total: 0 };
    sub.total += amount;
    if (!sub.name && subName) sub.name = subName;
    subTotals.set(subId, sub);
    const id = idOf(movement._id);
    rows.push({ id, name: typeof movement.name === "string" ? movement.name : "", date: time, amount: round2(amount), shared: sharedIds.has(id) });
  }

  // Calendar days of the range up to today, with what was spent on each (0 when nothing).
  const weekdayOf = (key: string): number => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12).getDay();
  };
  const outingsByWeekday = [0, 0, 0, 0, 0, 0, 0];
  for (const key of personDays) outingsByWeekday[weekdayOf(key)] += 1;
  const outings = personDays.size;
  const weekendOutings = outingsByWeekday[0] + outingsByWeekday[6];
  // Outings per week are measured from the first outing (not from the start of the range), so someone added recently is not diluted.
  const firstOuting = rows.reduce((first, row) => Math.min(first, row.date), todayEnd);
  const rangeDays = Math.max(7, Math.round((todayEnd - firstOuting) / DAY));
  const weekendShare = outings > 0 ? weekendOutings / outings : 0;
  const perWeek = outings / (rangeDays / 7);

  const declared = person.contact?.pattern;
  let declaredResult: PersonAnalysis["contact"]["declared"] = "unknown";
  if (outings > 0 && declared) {
    if (declared === "weekends") declaredResult = weekendShare >= 0.6 ? "match" : "different";
    else if (declared === "weekdays") declaredResult = weekendShare <= 0.4 ? "match" : "different";
    else if (declared === "daily") declaredResult = perWeek >= 4 ? "match" : "different";
    else if (declared === "custom" && person.contact?.days?.length) {
      const inDays = person.contact.days.reduce((sum, day) => sum + outingsByWeekday[day], 0);
      declaredResult = inDays / outings >= 0.6 ? "match" : "different";
    }
  }

  // Do the days with the person go with a different total? Each day with them is compared with the average of the days of
  // the same weekday without them, so weekends are never compared with weekdays.
  const withTotals: { weekday: number; total: number }[] = [];
  const withoutByWeekday: number[][] = [[], [], [], [], [], [], []];
  // Noon of each day, so a daylight-saving shift never moves a day to the one before.
  for (let time = rangeStart + DAY / 2; time <= todayEnd; time += DAY) {
    const key = dayKey(time);
    const dayTotal = dayTotals.get(key) ?? 0;
    const weekday = weekdayOf(key);
    if (personDays.has(key)) withTotals.push({ weekday, total: dayTotal });
    else withoutByWeekday[weekday].push(dayTotal);
  }
  const withoutAll = withoutByWeekday.flat();
  const mean = (list: number[]): number => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : 0);
  const overall = mean(withoutAll);
  const enough = withTotals.length >= MIN_TRIGGER_DAYS && withoutAll.length >= MIN_TRIGGER_DAYS;
  let liftPct: number | null = null;
  if (enough) {
    const expected = withTotals.reduce((sum, day) => sum + (withoutByWeekday[day.weekday].length >= 2 && mean(withoutByWeekday[day.weekday]) > 0 ? mean(withoutByWeekday[day.weekday]) : overall), 0);
    const actual = withTotals.reduce((sum, day) => sum + day.total, 0);
    liftPct = expected > 0 ? ((actual - expected) / expected) * 100 : null;
  }

  const avgPerOuting = outings > 0 ? total / outings : 0;
  let limit: PersonAnalysis["limit"] = null;
  if (person.limit && person.limit.amount > 0) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const spentMonth = rows.filter((row) => row.date >= monthStart).reduce((sum, row) => sum + row.amount, 0);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (person.limit.period === "monthly") {
      limit = {
        amount: person.limit.amount,
        period: "monthly",
        spent: round2(spentMonth),
        ratio: spentMonth / person.limit.amount,
        projected: round2((spentMonth / Math.max(1, today.getDate())) * daysInMonth),
        remaining: round2(person.limit.amount - spentMonth),
        outingsLeft: avgPerOuting > 0 ? Math.max(0, Math.floor((person.limit.amount - spentMonth) / avgPerOuting)) : null,
      };
    } else {
      limit = { amount: person.limit.amount, period: "per_meeting", spent: round2(avgPerOuting), ratio: avgPerOuting / person.limit.amount, projected: null, remaining: round2(person.limit.amount - avgPerOuting), outingsLeft: null };
    }
  }

  const monthKeys: string[] = [];
  for (let back = months - 1; back >= 0; back--) {
    const date = new Date(today.getFullYear(), today.getMonth() - back, 1);
    monthKeys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }

  return {
    totals: {
      total: round2(total),
      count,
      outings,
      avgPerOuting: round2(avgPerOuting),
      avgPerMonth: round2(total / Math.max(1, months)),
      shareOfSpending: allSpending > 0 ? total / allSpending : 0,
      trendPct: prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : null,
    },
    contact: { byWeekday: outingsByWeekday, weekendShare, perWeek, declared: declaredResult },
    trigger: { enough, withDays: withTotals.length, withoutDays: withoutAll.length, liftPct },
    limit,
    subs: [...subTotals.entries()].map(([id, sub]) => ({ id, name: sub.name, total: round2(sub.total), share: total > 0 ? sub.total / total : 0 })).sort((a, b) => b.total - a.total),
    monthly: monthKeys.map((month) => ({ month, total: round2(monthTotals.get(month) ?? 0) })),
    movements: rows.sort((a, b) => b.date - a.date),
  };
}
