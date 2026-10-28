import { z } from "zod";
import type { GoalDetails } from "@gastify/core/goals/types";
import { isSupportedCurrency, majorToMinor } from "@gastify/core/money/currencies";

const ids = z.array(z.string().min(1).max(64)).max(100).default([]);
const money = z.object({ amountMinor: z.number().int().safe().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) });
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const isRealDay = (value: string): boolean => {
  const [year, month, date] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === date;
};

export const goalDetailsSchema = z.object({
  schemaVersion: z.literal(1),
  template: z.enum(["custom", "car", "home", "travel", "business", "health", "emergency"]),
  status: z.enum(["active", "paused", "completed"]),
  targetDate: day,
  timeZone: z.string().min(1).max(80),
  priority: z.number().int().min(1).max(5),
  purposeCompletedAt: z.string().datetime().nullable(),
  targetMode: z.enum(["full", "down_payment"]),
  assetPriceMoney: money.optional(),
  downPaymentInput: z.union([
    z.object({ mode: z.literal("percent"), basisPoints: z.number().int().min(1).max(10000) }),
    z.object({ mode: z.literal("amount") }),
  ]).optional(),
  context: z.object({
    categoryIds: ids,
    subCategoryIds: ids,
    tagIds: ids,
    spendingBudgetIds: ids,
    projectBudgetIds: ids,
  }).default({ categoryIds: [], subCategoryIds: [], tagIds: [], spendingBudgetIds: [], projectBudgetIds: [] }),
  schedule: z.union([
    z.object({
      mode: z.enum(["required_by_date", "fixed_contribution"]),
      frequency: z.enum(["monthly", "semimonthly", "biweekly", "weekly"]),
      anchorDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      monthDays: z.array(z.union([z.number().int().min(1).max(31), z.literal("last")])).max(2).optional(),
      incomeSourceId: z.string().max(64).nullable(),
      fixedContributionMoney: money.optional(),
    }),
    z.null(),
  ]),
  reminders: z.object({ enabled: z.boolean(), daysBefore: z.number().int().min(0).max(30), localTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/) }),
  manualSavedAsOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export function parseGoalDetails(value: unknown):
  | { success: true; data: GoalDetails }
  | { success: false; error: z.ZodError } {
  return goalDetailsSchema.safeParse(value) as unknown as
    | { success: true; data: GoalDetails }
    | { success: false; error: z.ZodError };
}

export function validateGoalDetailsDates(details: z.infer<typeof goalDetailsSchema>): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: details.timeZone });
  } catch {
    return false;
  }
  if (details.targetDate && !isRealDay(details.targetDate)) return false;
  if (details.schedule && !isRealDay(details.schedule.anchorDate)) return false;
  if (details.manualSavedAsOf && !isRealDay(details.manualSavedAsOf)) return false;
  return true;
}

export function validateGoalMoneyPair(goalAmount: number, currency: string, goalMoney?: { amountMinor: number; currency: string }): boolean {
  if (!Number.isFinite(goalAmount) || goalAmount <= 0 || !isSupportedCurrency(currency)) return false;
  let expectedMinor: number;
  try {
    expectedMinor = majorToMinor(goalAmount, currency);
  } catch {
    return false;
  }
  if (!Number.isSafeInteger(expectedMinor) || expectedMinor <= 0) return false;
  return !goalMoney || (
    goalMoney.currency === currency &&
    Number.isSafeInteger(goalMoney.amountMinor) &&
    goalMoney.amountMinor === expectedMinor
  );
}

export function validateGoalSavingMoneyPair(
  savingAmount: number,
  currency: string,
  savingMoney?: { amountMinor: number; currency: string },
): boolean {
  if (!Number.isFinite(savingAmount) || savingAmount < 0 || !isSupportedCurrency(currency)) return false;
  let expectedMinor: number;
  try {
    expectedMinor = majorToMinor(savingAmount, currency);
  } catch {
    return false;
  }
  if (!Number.isSafeInteger(expectedMinor) || expectedMinor < 0) return false;
  return !savingMoney || (
    savingMoney.currency === currency &&
    Number.isSafeInteger(savingMoney.amountMinor) &&
    savingMoney.amountMinor === expectedMinor
  );
}

/** Keep derived down-payment targets and their inputs consistent on the server. */
export function validateGoalFinancialDetails(goalAmount: number, currency: string, details: GoalDetails): boolean {
  if (!isSupportedCurrency(currency) || !Number.isFinite(goalAmount) || goalAmount <= 0) return false;
  let targetMinor: number;
  try {
    targetMinor = majorToMinor(goalAmount, currency);
  } catch {
    return false;
  }
  if (!Number.isSafeInteger(targetMinor) || targetMinor <= 0) return false;

  if (details.targetMode === "down_payment") {
    const price = details.assetPriceMoney;
    const downPayment = details.downPaymentInput;
    if (!price || price.currency !== currency || !Number.isSafeInteger(price.amountMinor) || price.amountMinor <= 0 || !downPayment) return false;
    if (downPayment.mode === "percent") {
      const expectedMinor = Math.round(price.amountMinor * downPayment.basisPoints / 10_000);
      if (!Number.isSafeInteger(expectedMinor) || targetMinor !== expectedMinor) return false;
    } else if (targetMinor <= 0 || targetMinor > price.amountMinor) return false;
  }

  const fixed = details.schedule?.mode === "fixed_contribution" ? details.schedule.fixedContributionMoney : undefined;
  if (details.schedule?.mode === "fixed_contribution" && (!fixed || fixed.currency !== currency || !Number.isSafeInteger(fixed.amountMinor) || fixed.amountMinor <= 0)) return false;
  if (details.assetPriceMoney && (details.assetPriceMoney.currency !== currency || details.assetPriceMoney.amountMinor <= 0)) return false;
  return true;
}
