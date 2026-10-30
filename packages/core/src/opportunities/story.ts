import { normalizeText } from "../search/normalizeText";

// The plain-language side of "Growth opportunities": what a given amount could have bought (a car, a trip), and which
// categories are likely the ones a person would like to spend less on. The numbers here are ROUGH, ROUNDED reference prices
// in Mexican pesos (2026), written as examples to make an amount tangible: they are not quotes, never fetched, and the
// screens say so. Pure and tested; the screens only draw what this returns.

export type IllustrativeKind = "car" | "trip";

export interface IllustrativeItem {
  // The id is also the key of its name in the messages: `opportunities.item.<id>`.
  id: string;
  kind: IllustrativeKind;
  priceMxn: number;
}

export const ILLUSTRATIVE_REFERENCE_YEAR = 2026;
// A car's down payment, as a share of its price, for the "enganche" example (a comparison, not a credit offer).
export const DOWN_PAYMENT_FRACTION = 0.2;

export const ILLUSTRATIVE_CARS: readonly IllustrativeItem[] = [
  { id: "carUsed2018", kind: "car", priceMxn: 110_000 },
  { id: "carUsed2020", kind: "car", priceMxn: 150_000 },
  { id: "carNewHatchback", kind: "car", priceMxn: 287_000 },
  { id: "carNewSedan", kind: "car", priceMxn: 380_000 },
  { id: "carNewSuv", kind: "car", priceMxn: 520_000 },
];

export const ILLUSTRATIVE_TRIPS: readonly IllustrativeItem[] = [
  { id: "tripWeekendMx", kind: "trip", priceMxn: 6_000 },
  { id: "tripFiveStates", kind: "trip", priceMxn: 25_000 },
  { id: "tripColombia", kind: "trip", priceMxn: 38_000 },
  { id: "tripCanada", kind: "trip", priceMxn: 60_000 },
  { id: "tripEurope", kind: "trip", priceMxn: 95_000 },
  { id: "tripJapan", kind: "trip", priceMxn: 110_000 },
];

export interface Affordability {
  // The most expensive item the amount pays in full (null when it pays none).
  reachable: IllustrativeItem | null;
  // The cheapest item it does not reach, and how much of it the amount covers (0..1).
  next: IllustrativeItem | null;
  nextCoverage: number;
}

// What `amountMxn` reaches in a list: the best item it pays in full and the next one up with how close it gets.
export function affordability(amountMxn: number, items: readonly IllustrativeItem[], costOf: (item: IllustrativeItem) => number = (item) => item.priceMxn): Affordability {
  const amount = Number.isFinite(amountMxn) && amountMxn > 0 ? amountMxn : 0;
  const sorted = [...items].sort((a, b) => costOf(a) - costOf(b));
  let reachable: IllustrativeItem | null = null;
  let next: IllustrativeItem | null = null;
  for (const item of sorted) {
    if (costOf(item) <= amount) reachable = item;
    else {
      next = item;
      break;
    }
  }
  return { reachable, next, nextCoverage: next ? Math.min(1, amount / costOf(next)) : 0 };
}

export interface CarAffordability {
  // A car it pays in cash, a car whose 20 % down payment it covers, and the next car up with the share of its down payment covered.
  cash: IllustrativeItem | null;
  downPayment: IllustrativeItem | null;
  nextDownPayment: IllustrativeItem | null;
  nextDownPaymentCoverage: number;
}

export function carAffordability(amountMxn: number, cars: readonly IllustrativeItem[] = ILLUSTRATIVE_CARS): CarAffordability {
  const cash = affordability(amountMxn, cars).reachable;
  const down = affordability(amountMxn, cars, (car) => car.priceMxn * DOWN_PAYMENT_FRACTION);
  return { cash, downPayment: down.reachable, nextDownPayment: down.next, nextDownPaymentCoverage: down.nextCoverage };
}

// --- Which categories are probably the ones to spend less on --------------------------------------------------------

export type WasteKind = "vice" | "indulgence" | "leisure";

// Word stems (matched at the start of a word of the category's name). Short ones must match the whole word.
const STEMS: Record<WasteKind, { stems: string[]; whole: string[] }> = {
  vice: {
    stems: ["cigarr", "tabac", "vapeo", "alcohol", "cerveza", "licor", "casino", "apuesta", "loteri", "cigar", "smok", "beer", "liquor", "betting", "gambl", "tequila", "whisk"],
    whole: ["bar", "bares", "antro", "antros", "vape", "vapes", "vicio", "vicios", "vino"],
  },
  indulgence: {
    stems: ["restaur", "delivery", "rappi", "starbuck", "antoj", "refresc", "energi", "postre", "helado", "dulce", "snack", "takeout", "taqueri", "pizzer", "hambur", "fastfood"],
    whole: ["cafe", "cafes", "comida", "comidas", "soda", "sodas", "food", "fast"],
  },
  leisure: { stems: ["vacaci", "viaje", "turism", "hotel", "entreten", "streaming", "holiday", "vacation", "travel"], whole: ["ocio", "juegos", "games"] },
};

// The kind of "could spend less" a category name suggests, or null. It looks only at the name: a hint to start from, not a verdict.
export function classifyWasteCategory(name: string): WasteKind | null {
  const words = normalizeText(name).split(/[^a-z0-9ñ]+/).filter(Boolean);
  if (words.length === 0) return null;
  const order: WasteKind[] = ["vice", "indulgence", "leisure"];
  for (const kind of order) {
    const { stems, whole } = STEMS[kind];
    if (words.some((word) => whole.includes(word) || stems.some((stem) => word.startsWith(stem)))) return kind;
  }
  return null;
}

export interface WasteCandidateInput {
  id: string;
  name: string;
  amountMinor: number;
}

export interface WasteCandidate extends WasteCandidateInput {
  // "top" is the plain fallback: the category with the most spending, when none looks like an indulgence.
  kind: WasteKind | "top";
}

// Up to `max` categories to put in front of the person: the ones that look like vices or indulgences by name (the largest
// first), and, when none does, the category with the most spending.
export function suggestWasteCategories(rows: readonly WasteCandidateInput[], max = 2): WasteCandidate[] {
  const spending = rows.filter((row) => row.amountMinor > 0);
  const rank: Record<WasteKind, number> = { vice: 0, indulgence: 1, leisure: 2 };
  const classified = spending
    .map((row) => ({ ...row, kind: classifyWasteCategory(row.name) }))
    .filter((row): row is WasteCandidateInput & { kind: WasteKind } => row.kind !== null)
    .sort((a, b) => b.amountMinor - a.amountMinor || rank[a.kind] - rank[b.kind])
    .slice(0, max);
  if (classified.length > 0) return classified;
  const top = [...spending].sort((a, b) => b.amountMinor - a.amountMinor)[0];
  return top ? [{ ...top, kind: "top" }] : [];
}
