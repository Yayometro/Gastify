import type { GoalDetails, GoalFrequency } from "./types";

export interface GoalScheduleResult {
  remainingMinor: number;
  paymentDates: string[];
  paymentAmountsMinor: number[];
  contributionMinor: number | null;
  totalPlannedMinor: number;
  status: "ready" | "underfunded" | "no_date" | "past_due" | "no_payments" | "already_funded" | "invalid";
}

const isoDay = (date: Date): string => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
const parseDay = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
};
const addDays = (date: Date, count: number): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + count));
const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

function datesForMonthly(from: Date, to: Date, monthDays: (number | "last")[]): string[] {
  const days: (number | "last")[] = monthDays.length ? monthDays : ["last"];
  const out: string[] = [];
  for (let y = from.getUTCFullYear(), m = from.getUTCMonth(); y < to.getUTCFullYear() || (y === to.getUTCFullYear() && m <= to.getUTCMonth());) {
    const last = daysInMonth(y, m);
    for (const requested of days) {
      const day = requested === "last" ? last : Math.min(Math.max(Math.floor(requested), 1), last);
      const date = new Date(Date.UTC(y, m, day));
      if (date >= from && date <= to) out.push(isoDay(date));
    }
    m += 1;
    if (m === 12) { y += 1; m = 0; }
  }
  return [...new Set(out)].sort();
}

export function goalPaymentDates({ frequency, anchorDate, monthDays }: { frequency: GoalFrequency; anchorDate: string; monthDays?: (number | "last")[] }, today: string, targetDate: string): string[] {
  const start = parseDay(anchorDate);
  const todayDate = parseDay(today);
  const end = parseDay(targetDate);
  if (!start || !todayDate || !end || end < todayDate) return [];
  const from = start > todayDate ? start : todayDate;
  if (frequency === "monthly") return datesForMonthly(from, end, [start.getUTCDate()]);
  if (frequency === "semimonthly") return datesForMonthly(from, end, monthDays?.length === 2 ? monthDays : [15, "last"]);

  const step = frequency === "weekly" ? 7 : 14;
  let cursor = start;
  if (cursor < from) {
    const delta = Math.ceil((from.getTime() - cursor.getTime()) / 86_400_000);
    cursor = addDays(cursor, Math.ceil(delta / step) * step);
  }
  const dates: string[] = [];
  while (cursor <= end) {
    dates.push(isoDay(cursor));
    cursor = addDays(cursor, step);
  }
  return dates;
}

export function calculateGoalSchedule(input: {
  targetMinor: number;
  savedMinor: number;
  today: string;
  details: GoalDetails;
}): GoalScheduleResult {
  const remainingMinor = Math.max(0, Math.trunc(input.targetMinor) - Math.trunc(input.savedMinor));
  const base = { remainingMinor, paymentDates: [] as string[], paymentAmountsMinor: [] as number[], contributionMinor: null as number | null, totalPlannedMinor: 0 };
  if (!Number.isSafeInteger(input.targetMinor) || !Number.isSafeInteger(input.savedMinor) || input.targetMinor < 0 || input.savedMinor < 0) return { ...base, status: "invalid" };
  if (remainingMinor === 0) return { ...base, status: "already_funded" };
  const target = input.details.targetDate;
  const today = parseDay(input.today);
  if (!today) return { ...base, status: "invalid" };
  if (!target) return { ...base, status: "no_date" };
  const targetDay = parseDay(target);
  if (!targetDay) return { ...base, status: "invalid" };
  if (targetDay < today) return { ...base, status: "past_due" };
  if (!input.details.schedule) return { ...base, status: "no_payments" };
  const dates = goalPaymentDates(input.details.schedule, isoDay(today), target);
  if (dates.length === 0) return { ...base, status: "no_payments" };
  if (input.details.schedule.mode === "fixed_contribution") {
    const fixed = input.details.schedule.fixedContributionMoney?.amountMinor;
    if (!Number.isSafeInteger(fixed) || Number(fixed) <= 0) return { ...base, paymentDates: dates, status: "invalid" };
    const requiredPayments = Math.ceil(remainingMinor / Number(fixed));
    const paymentDates = dates.slice(0, requiredPayments);
    const paymentAmountsMinor: number[] = [];
    let totalPlannedMinor = 0;
    for (let index = 0; index < paymentDates.length; index += 1) {
      const amount = Math.min(Number(fixed), remainingMinor - totalPlannedMinor);
      if (amount <= 0) break;
      paymentAmountsMinor.push(amount);
      totalPlannedMinor += amount;
    }
    if (!Number.isSafeInteger(totalPlannedMinor)) return { ...base, paymentDates: dates, status: "invalid" };
    return {
      remainingMinor,
      paymentDates: paymentDates.slice(0, paymentAmountsMinor.length),
      paymentAmountsMinor,
      contributionMinor: paymentAmountsMinor[0] ?? null,
      totalPlannedMinor,
      status: totalPlannedMinor >= remainingMinor ? "ready" : "underfunded",
    };
  }
  const contributionMinor = Math.ceil(remainingMinor / dates.length);
  const paymentAmountsMinor = dates.map((_, index) => index === dates.length - 1
    ? remainingMinor - contributionMinor * (dates.length - 1)
    : contributionMinor);
  return { remainingMinor, paymentDates: dates, paymentAmountsMinor, contributionMinor, totalPlannedMinor: remainingMinor, status: "ready" };
}
