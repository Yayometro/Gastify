// Recurring expenses: when a repeating charge falls due. Pure date maths, shared by the server (the catch-up that creates the
// charges) and by the screens (the next date shown in a form). Dates are calendar days kept at noon local time, so a change of
// clock (daylight saving) never moves a charge to the neighbouring day.

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly" | "bimonthly" | "quarterly" | "semiannual" | "yearly";

export const RECURRENCE_FREQUENCIES: readonly RecurrenceFrequency[] = ["weekly", "biweekly", "monthly", "bimonthly", "quarterly", "semiannual", "yearly"];

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  // The first occurrence: the date of the charge the person created the rule from.
  anchorDate: Date | string | number;
}

// How many months one step of each month-based frequency moves.
const MONTH_STEP: Partial<Record<RecurrenceFrequency, number>> = { monthly: 1, bimonthly: 2, quarterly: 3, semiannual: 6, yearly: 12 };
// How many days one step of each day-based frequency moves.
const DAY_STEP: Partial<Record<RecurrenceFrequency, number>> = { weekly: 7, biweekly: 14 };

export function isRecurrenceFrequency(value: unknown): value is RecurrenceFrequency {
  return typeof value === "string" && (RECURRENCE_FREQUENCIES as readonly string[]).includes(value);
}

// A calendar day at noon, so that adding days across a clock change keeps the same day.
export function atNoon(value: Date | string | number): Date {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// The anchor's day of the month moved `months` months on; a short month takes its last day (Jan 31 -> Feb 28 -> Mar 31).
function addMonthsClamped(anchor: Date, months: number): Date {
  const total = anchor.getFullYear() * 12 + anchor.getMonth() + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  return new Date(year, month, Math.min(anchor.getDate(), daysInMonth(year, month)), 12, 0, 0, 0);
}

// The occurrence number `index` (0 is the anchor itself).
export function occurrenceAt(rule: RecurrenceRule, index: number): Date {
  const anchor = atNoon(rule.anchorDate);
  const days = DAY_STEP[rule.frequency];
  if (days) return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + days * index, 12, 0, 0, 0);
  return addMonthsClamped(anchor, (MONTH_STEP[rule.frequency] ?? 1) * index);
}

// The index of the first occurrence strictly after the day `after` (an occurrence on that same day is not "after").
function firstIndexAfter(rule: RecurrenceRule, after: Date): number {
  const limit = atNoon(after).getTime();
  let index = 0;
  // A coarse jump first (a rule far in the past), then a short walk to the exact one.
  const anchor = atNoon(rule.anchorDate);
  if (limit > anchor.getTime()) {
    const days = DAY_STEP[rule.frequency];
    if (days) index = Math.max(0, Math.floor((limit - anchor.getTime()) / (days * 86_400_000)) - 1);
    else {
      const months = (atNoon(after).getFullYear() - anchor.getFullYear()) * 12 + (atNoon(after).getMonth() - anchor.getMonth());
      index = Math.max(0, Math.floor(months / (MONTH_STEP[rule.frequency] ?? 1)) - 1);
    }
  }
  while (occurrenceAt(rule, index).getTime() <= limit) index += 1;
  return index;
}

// The next occurrence strictly after the day `after`.
export function nextOccurrenceAfter(rule: RecurrenceRule, after: Date | string | number): Date {
  return occurrenceAt(rule, firstIndexAfter(rule, new Date(after)));
}

// The occurrences after the day `fromExclusive` up to and including `toInclusive`, oldest first, at most `max` (the newest ones).
export function occurrencesBetween(rule: RecurrenceRule, fromExclusive: Date | string | number, toInclusive: Date | string | number, max = 24): Date[] {
  const end = atNoon(toInclusive).getTime();
  const found: Date[] = [];
  for (let index = firstIndexAfter(rule, new Date(fromExclusive)); ; index += 1) {
    const day = occurrenceAt(rule, index);
    if (day.getTime() > end) break;
    found.push(day);
    // A safety net: no rule has this many occurrences between two dates a person would ever keep.
    if (found.length > 5000) break;
  }
  return found.length > max ? found.slice(found.length - max) : found;
}

export interface CatchUpPlan {
  // Charges to create by themselves (a fixed price): the due ones, newest `maxAuto`.
  autoCreate: Date[];
  // Charges that need the person to confirm the amount (a variable price): the newest `maxPending` due ones.
  pending: Date[];
  // Older due occurrences that are neither created nor asked about (a rule left unattended for long).
  skipped: number;
  // The day the rule has been processed up to: the next catch-up starts after it.
  processedUntil: Date | null;
}

export interface CatchUpInput {
  rule: RecurrenceRule;
  // The date of the last occurrence already created or answered (the anchor itself right after the rule is made).
  lastHandled: Date | string | number;
  today: Date | string | number;
  isVariable: boolean;
  active?: boolean;
  endDate?: Date | string | number | null;
  maxAuto?: number;
  maxPending?: number;
  // Occurrences already answered (created or left out) that are still waiting for an older one to be answered.
  handledKeys?: readonly string[];
}

// What is due today for one rule. A paused or finished rule has nothing due.
export function planCatchUp(input: CatchUpInput): CatchUpPlan {
  const { rule, lastHandled, today, isVariable, active = true, endDate = null, maxAuto = 12, maxPending = 3, handledKeys = [] } = input;
  const none: CatchUpPlan = { autoCreate: [], pending: [], skipped: 0, processedUntil: null };
  if (!active) return none;
  const stop = endDate ? Math.min(atNoon(today).getTime(), atNoon(endDate).getTime()) : atNoon(today).getTime();
  const due = occurrencesBetween(rule, lastHandled, new Date(stop), 5000);
  if (due.length === 0) return none;
  const keep = isVariable ? maxPending : maxAuto;
  const recentAll = due.slice(Math.max(0, due.length - keep));
  const recent = recentAll.filter((day) => !handledKeys.includes(occurrenceKey(day)));
  return {
    autoCreate: isVariable ? [] : recent,
    pending: isVariable ? recent : [],
    skipped: due.length - recentAll.length,
    processedUntil: due[due.length - 1],
  };
}

// The day an occurrence is stored under, as a stable text ("2026-10-15"), to tell a charge already created from a new one.
export function occurrenceKey(date: Date | string | number): string {
  const d = atNoon(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
