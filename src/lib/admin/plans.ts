// The plans Gastify may sell. Nothing is billed yet: every account is on the free plan unless its stored `plan` field says
// otherwise (no field is written by the app today). The prices stay empty until they are decided, so revenue numbers show as
// "sin precio definido" instead of a guess.
export const PLANS = ["free", "pro"] as const;
export type PlanName = (typeof PLANS)[number];

export const PLAN_LABELS: Record<PlanName, string> = { free: "Gratis", pro: "Pro" };

// Monthly list price in MXN, or null while it is not decided.
export const LIST_PRICE_MXN: Record<PlanName, number | null> = { free: 0, pro: null };

// The plan of a stored account, with the free plan as the default.
export function planOf(stored: unknown): PlanName {
  return stored === "pro" ? "pro" : "free";
}

export interface PlanRevenue {
  plan: PlanName;
  label: string;
  accounts: number;
  // accounts * list price, or null when the price is not decided.
  monthlyMXN: number | null;
}

export function revenueByPlan(storedPlans: unknown[]): PlanRevenue[] {
  return PLANS.map((plan) => {
    const accounts = storedPlans.filter((stored) => planOf(stored) === plan).length;
    const price = LIST_PRICE_MXN[plan];
    return { plan, label: PLAN_LABELS[plan], accounts, monthlyMXN: price === null ? null : accounts * price };
  });
}
