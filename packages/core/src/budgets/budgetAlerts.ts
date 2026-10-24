// The notices the app gives about a budget, a saving goal or a project, from how far along it is. Pure: it only says
// WHICH notice applies; showing it (and remembering it was shown) is the app's job. The title and the message come in the
// language of the person: the translator is passed in (the texts are in the "budgets" catalog).
import type { TranslateFn } from "../i18n/translate";

export type BudgetAlertKind = "spending" | "saving" | "project";
export type AlertTone = "warning" | "danger" | "celebrate";

export interface BudgetAlert {
  // Stable id for "this notice, for this budget, in this period": the app stores it so the notice is shown once.
  key: string;
  level: number;
  tone: AlertTone;
  title: string;
  message: string;
}

export interface BudgetAlertInput {
  budgetId: string;
  name: string;
  kind: BudgetAlertKind;
  // Spent (or saved) against the goal, as a fraction: 0.7 = 70 %.
  ratio: number;
  // Day of the period we are in and how many days it has (a month: 21 of 31).
  dayOfPeriod: number;
  periodKey: string;
}

// Each step: the fraction it starts at, its tone, and the catalog keys of its title and message.
const SPENDING_STEPS: { at: number; tone: AlertTone; title: string; message: string }[] = [
  { at: 1, tone: "danger", title: "budgets.alert.reached.title", message: "budgets.alert.reached.message" },
  { at: 0.9, tone: "danger", title: "budgets.alert.almost.title", message: "budgets.alert.almost.message" },
  { at: 0.8, tone: "warning", title: "budgets.alert.fast.title", message: "budgets.alert.fast.message" },
  { at: 0.7, tone: "warning", title: "budgets.alert.watch.title", message: "budgets.alert.watch.message" },
];

const SAVING_STEPS: { at: number; message: string }[] = [
  { at: 1, message: "budgets.alert.saving.reached" },
  { at: 0.75, message: "budgets.alert.saving.75" },
  { at: 0.5, message: "budgets.alert.saving.50" },
  { at: 0.25, message: "budgets.alert.saving.25" },
];

// The highest notice that applies right now (a budget at 85 % only needs the 80 % one), or null when none does.
export function currentBudgetAlert(input: BudgetAlertInput, t: TranslateFn): BudgetAlert | null {
  const { budgetId, name, kind, ratio, dayOfPeriod, periodKey } = input;
  const make = (level: number, tone: AlertTone, title: string, message: string): BudgetAlert => ({ key: `${budgetId}:${periodKey}:${level}`, level, tone, title, message });
  const pct = Math.round(ratio * 100);

  if (kind === "saving") {
    const step = SAVING_STEPS.find((s) => ratio >= s.at);
    return step
      ? make(step.at, "celebrate", t("budgets.alert.savingTitle", { p1: name }), t("budgets.alert.savingProgress", { p1: t(step.message), p2: pct }))
      : null;
  }

  const step = SPENDING_STEPS.find((s) => ratio >= s.at);
  if (step) return make(step.at, step.tone, t(step.title, { p1: name }), t(step.message));

  // Under control for half the period: a pat on the back (fireworks in the app).
  if (dayOfPeriod >= 15 && ratio < 0.5) {
    const what = t(kind === "project" ? "budgets.alert.thisProject" : "budgets.alert.thisBudget");
    return make(0, "celebrate", t("budgets.alert.controlledTitle", { p1: name }), t("budgets.alert.controlledMessage", { p1: what, p2: pct }));
  }
  return null;
}
