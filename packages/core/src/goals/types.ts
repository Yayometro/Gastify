export type GoalTemplate = "custom" | "car" | "home" | "travel" | "business" | "health" | "emergency";
export type GoalStatus = "active" | "paused" | "completed";
export type GoalFrequency = "monthly" | "semimonthly" | "biweekly" | "weekly";

export interface GoalMoney {
  amountMinor: number;
  currency: string;
}

export type GoalDetails = {
  schemaVersion: 1;
  template: GoalTemplate;
  status: GoalStatus;
  targetDate: string | null;
  timeZone: string;
  priority: number;
  purposeCompletedAt: string | null;
  targetMode: "full" | "down_payment";
  assetPriceMoney?: GoalMoney;
  downPaymentInput?: { mode: "percent"; basisPoints: number } | { mode: "amount" };
  context: {
    categoryIds: string[];
    subCategoryIds: string[];
    tagIds: string[];
    spendingBudgetIds: string[];
    projectBudgetIds: string[];
  };
  schedule: null | {
    mode: "required_by_date" | "fixed_contribution";
    frequency: GoalFrequency;
    anchorDate: string;
    monthDays?: (number | "last")[];
    incomeSourceId: string | null;
    fixedContributionMoney?: GoalMoney;
  };
  reminders: { enabled: boolean; daysBefore: number; localTime: string };
  manualSavedAsOf?: string;
};

export const GOAL_TEMPLATES: readonly GoalTemplate[] = ["custom", "car", "home", "travel", "business", "health", "emergency"];

export function emptyGoalDetails(template: GoalTemplate = "custom", timeZone = "UTC"): GoalDetails {
  return {
    schemaVersion: 1,
    template,
    status: "active",
    targetDate: null,
    timeZone,
    priority: 3,
    purposeCompletedAt: null,
    targetMode: "full",
    context: { categoryIds: [], subCategoryIds: [], tagIds: [], spendingBudgetIds: [], projectBudgetIds: [] },
    schedule: null,
    reminders: { enabled: false, daysBefore: 0, localTime: "09:00" },
  };
}
