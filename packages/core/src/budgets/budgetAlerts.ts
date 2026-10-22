// The notices the app gives about a budget, a saving goal or a project, from how far along it is. Pure: it only says
// WHICH notice applies; showing it (and remembering it was shown) is the app's job.

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

const SPENDING_STEPS: { at: number; tone: AlertTone; title: (name: string) => string; message: string }[] = [
  { at: 1, tone: "danger", title: (n) => `${n}: llegaste al límite`, message: "Ya superaste el 100 % de este presupuesto. Controla tu gasto." },
  { at: 0.9, tone: "danger", title: (n) => `${n}: casi en el límite`, message: "Llevas más del 90 %. Estás llegando casi al límite." },
  { at: 0.8, tone: "warning", title: (n) => `${n}: vas creciendo muy rápido`, message: "Llevas más del 80 % de este presupuesto. ¡Aguas!" },
  { at: 0.7, tone: "warning", title: (n) => `${n}: ¡aguas!`, message: "Llevas más del 70 % de este presupuesto." },
];

const SAVING_STEPS: { at: number; message: string }[] = [
  { at: 1, message: "¡Meta alcanzada! Lo lograste." },
  { at: 0.75, message: "Ya llevas el 75 % de tu meta. ¡Casi!" },
  { at: 0.5, message: "Llegaste a la mitad de tu meta. ¡Sigue así!" },
  { at: 0.25, message: "Ya llevas el 25 % de tu meta. ¡Buen comienzo!" },
];

// The highest notice that applies right now (a budget at 85 % only needs the 80 % one), or null when none does.
export function currentBudgetAlert(input: BudgetAlertInput): BudgetAlert | null {
  const { budgetId, name, kind, ratio, dayOfPeriod, periodKey } = input;
  const make = (level: number, tone: AlertTone, title: string, message: string): BudgetAlert => ({ key: `${budgetId}:${periodKey}:${level}`, level, tone, title, message });

  if (kind === "saving") {
    const step = SAVING_STEPS.find((s) => ratio >= s.at);
    return step ? make(step.at, "celebrate", `🎉 ${name}: ¡vas avanzando!`, `${step.message} Llevas ${Math.round(ratio * 100)} % de tu meta.`) : null;
  }

  const step = SPENDING_STEPS.find((s) => ratio >= s.at);
  if (step) return make(step.at, step.tone, step.title(name), step.message);

  // Under control for half the period: a pat on the back (fireworks in the app).
  if (dayOfPeriod >= 15 && ratio < 0.5) {
    const what = kind === "project" ? "este proyecto" : "este presupuesto";
    return make(0, "celebrate", `🎆 ${name}: ¡felicidades!`, `Notamos que ${what} ha estado controlado: vas en ${Math.round(ratio * 100)} %. Sigue así.`);
  }
  return null;
}
