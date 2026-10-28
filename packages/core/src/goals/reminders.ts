import { calculateGoalSchedule } from "./schedule";
import type { GoalDetails } from "./types";
import type { BudgetAlert } from "../budgets/budgetAlerts";
import type { TranslateFn } from "../i18n/translate";
import { formatMoneyMinor } from "../money/currencies";

const localDay = (date: Date, timeZone: string): string | null => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const value = (key: string) => parts.find((part) => part.type === key)?.value;
    const year = value("year");
    const month = value("month");
    const day = value("day");
    return year && month && day ? year + "-" + month + "-" + day : null;
  } catch {
    return null;
  }
};

/** In-app-only reminder for a declared savings schedule. It never implies a transfer happened. */
export function goalScheduleReminder(input: {
  budgetId: string;
  name: string;
  targetMinor: number;
  savedMinor: number;
  currency: string;
  details: GoalDetails;
  revision?: number;
  now?: Date;
  t: TranslateFn;
}): BudgetAlert | null {
  const { details } = input;
  if (!details.reminders.enabled || details.status !== "active" || !details.schedule || !details.targetDate) return null;
  const now = input.now ?? new Date();
  const today = localDay(now, details.timeZone);
  if (!today) return null;
  const horizon = new Date(today + "T00:00:00.000Z");
  horizon.setUTCDate(horizon.getUTCDate() + details.reminders.daysBefore);
  const horizonDay = horizon.getUTCFullYear() + "-" + String(horizon.getUTCMonth() + 1).padStart(2, "0") + "-" + String(horizon.getUTCDate()).padStart(2, "0");
  const schedule = calculateGoalSchedule({ targetMinor: input.targetMinor, savedMinor: input.savedMinor, today, details });
  if ((schedule.status !== "ready" && schedule.status !== "underfunded") || schedule.contributionMinor === null) return null;
  const nextDay = schedule.paymentDates.find((date) => date >= today && date <= horizonDay);
  if (!nextDay) return null;
  const planVersion = input.revision ?? [input.targetMinor, details.targetDate, details.schedule.mode, details.schedule.frequency, details.schedule.anchorDate].join("-");
  const key = input.budgetId + ":goal-reminder:" + nextDay + ":" + planVersion;
  return {
    key,
    level: 0,
    tone: "warning",
    title: input.t("goals.reminder.title", { p1: input.name }),
    message: input.t("goals.reminder.message", {
      p1: input.name,
      p2: formatMoneyMinor(schedule.contributionMinor, input.currency, { showCode: true }),
      p3: nextDay,
    }),
  };
}
