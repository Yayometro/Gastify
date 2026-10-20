// The duplicate finder's settings, with the web's defaults: name, date and amount must match; category and
// sub-category do not count unless asked; no tolerance (exact day and amount).
export interface DuplicateCriteria {
  name: boolean;
  date: boolean;
  amount: boolean;
  category: boolean;
  subcategory: boolean;
  // The shared finder reads criteria by name, so the index signature keeps the two types compatible.
  [key: string]: boolean | undefined;
}

export interface DuplicateSettings {
  criteria: DuplicateCriteria;
  dateTolerance: number;
  amountTolerance: number;
}

export const DUPLICATE_DEFAULTS: DuplicateSettings = {
  criteria: { name: true, date: true, amount: true, category: false, subcategory: false },
  dateTolerance: 0,
  amountTolerance: 0,
};

// The criteria labels in the order the web lists them.
export const DUPLICATE_CRITERIA_LABELS: { key: keyof DuplicateCriteria; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "date", label: "Fecha" },
  { key: "amount", label: "Monto" },
  { key: "category", label: "Categoría" },
  { key: "subcategory", label: "Subcategoría" },
];

// A tolerance typed by hand: never negative, never NaN (an empty box counts as 0).
export function toleranceFrom(text: string): number {
  const value = Number(String(text).replace(/,/g, "."));
  return Number.isFinite(value) && value > 0 ? value : 0;
}
