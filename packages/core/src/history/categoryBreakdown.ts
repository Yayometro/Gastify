import { filterBillsOrIncomes, getPrimaryAmount, type TransactionLike } from "../transformers/transactionsChange";

// How a period's spending (or income) splits across categories and, inside each, subcategories: the data
// behind the donut chart (the web's sunburst). Amounts are in the primary currency; transfers are left out.
export interface BreakdownSlice {
  // Stable key: the id when there is one, else the name.
  key: string;
  name: string;
  icon: string;
  color: string;
  value: number;
  count: number;
  children: BreakdownSlice[];
}

export const NO_CATEGORY_NAME = "Sin categoría";
export const NO_SUBCATEGORY_NAME = "Sin subcategoría";
const NO_CATEGORY_COLOR = "#9ca3af";

function addTo(map: Map<string, BreakdownSlice>, key: string, name: string, icon: string, color: string, value: number): BreakdownSlice {
  const found = map.get(key);
  if (found) {
    found.value += value;
    found.count += 1;
    return found;
  }
  const created: BreakdownSlice = { key, name, icon, color, value, count: 1, children: [] };
  map.set(key, created);
  return created;
}

const bySize = (a: BreakdownSlice, b: BreakdownSlice) => b.value - a.value;

export function categoryBreakdown(movements: TransactionLike[], kind: "spending" | "incomes"): BreakdownSlice[] {
  const { incomes, bills } = filterBillsOrIncomes(movements);
  const source = kind === "spending" ? bills : incomes;
  const categories = new Map<string, BreakdownSlice>();
  const subsByCategory = new Map<string, Map<string, BreakdownSlice>>();

  for (const movement of source) {
    const value = Math.abs(getPrimaryAmount(movement));
    if (!(value > 0)) continue;
    const category = movement.category;
    const categoryKey = category?._id || category?.name || NO_CATEGORY_NAME;
    const slice = addTo(categories, categoryKey, category?.name || NO_CATEGORY_NAME, category?.icon || "", category?.color || NO_CATEGORY_COLOR, value);

    const subs = subsByCategory.get(categoryKey) ?? new Map<string, BreakdownSlice>();
    subsByCategory.set(categoryKey, subs);
    const sub = movement.subCategory;
    const subKey = sub?._id || sub?.name || NO_SUBCATEGORY_NAME;
    // A subcategory without its own color or icon looks like its category.
    addTo(subs, subKey, sub?.name || NO_SUBCATEGORY_NAME, sub?.icon || slice.icon, sub?.color || slice.color, value);
  }

  return [...categories.values()]
    .map((slice) => ({ ...slice, children: [...(subsByCategory.get(slice.key)?.values() ?? [])].sort(bySize) }))
    .sort(bySize);
}

// The slices that get their own arc: the biggest `max`, and the rest merged into "Otras" so the donut stays readable.
export function groupSmallSlices(slices: BreakdownSlice[], max: number): BreakdownSlice[] {
  if (slices.length <= max) return slices;
  const head = slices.slice(0, max - 1);
  const tail = slices.slice(max - 1);
  const other: BreakdownSlice = {
    key: "__other__",
    name: "Otras",
    icon: "",
    color: "#9ca3af",
    value: tail.reduce((sum, slice) => sum + slice.value, 0),
    count: tail.reduce((sum, slice) => sum + slice.count, 0),
    children: tail,
  };
  return [...head, other];
}

export interface Arc {
  key: string;
  // Start and end angle in degrees, clockwise from 12 o'clock.
  startAngle: number;
  endAngle: number;
}

// The arcs of a donut for the given slices. One slice that is the whole total gets a full circle (359.99
// degrees, since a 360 arc has the same start and end point and draws nothing).
export function donutArcs(slices: { key: string; value: number }[], gapDegrees = 1.5): Arc[] {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!(total > 0)) return [];
  const gap = slices.length > 1 ? gapDegrees : 0;
  let cursor = 0;
  return slices.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const arc = { key: slice.key, startAngle: cursor + gap / 2, endAngle: Math.min(cursor + sweep - gap / 2, cursor + 359.99) };
    cursor += sweep;
    return arc;
  });
}
