import type { BudgetAlert } from "./budgetAlerts";

// How a notice is shown, in the app and on the web: a celebration (confetti and fireworks), an alarm (the edges of the
// screen flash: 70 to 90 % of a budget) or a fire (everything is burning: the budget is past its limit).
export type AlertMood = "celebrate" | "alarm" | "fire";

export function alertMood(alert: BudgetAlert): AlertMood {
  if (alert.tone === "celebrate") return "celebrate";
  return alert.level >= 1 ? "fire" : "alarm";
}

export const MOOD_COLOR: Record<AlertMood, string> = { celebrate: "#c084fc", alarm: "#f43f5e", fire: "#f97316" };
