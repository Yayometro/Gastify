import type { BreakdownSlice } from "./categoryBreakdown";

// Drill-down through a breakdown, level by level: the whole (level 0 = categories), a category (level 1 = its
// subcategories) and a subcategory (level 2 = its movements, shown as slices of their own). Pure: the screen only
// keeps the path of keys the person has opened and asks here what to draw.
export interface DrillState {
  // The keys of the opened slices, outermost first. Empty = the top level.
  path: string[];
}

export interface DrillView {
  // Slices to draw at the current level (the chart and the table use the same list).
  slices: BreakdownSlice[];
  // The slice opened last, or null at the top level.
  current: BreakdownSlice | null;
  // The total of what is shown (the opened slice's value, or the whole).
  total: number;
  // 0 at the top, 1 inside a category, 2 inside a subcategory.
  level: number;
}

// The slice found by following the path from the top.
function follow(slices: BreakdownSlice[], path: string[]): BreakdownSlice | null {
  let current: BreakdownSlice | null = null;
  let list = slices;
  for (const key of path) {
    const next = list.find((slice) => slice.key === key);
    if (!next) return null;
    current = next;
    list = next.children;
  }
  return current;
}

// The movements of a subcategory, one slice each (its value is the amount of the movement).
export function movementSlices(sub: BreakdownSlice): BreakdownSlice[] {
  return sub.children;
}

// The key that, pushed after a category, opens every movement of that category at once (level 2).
export const ALL_MOVEMENTS = "__all__";

export function drillView(all: BreakdownSlice[], state: DrillState, total: number): DrillView {
  if (state.path.length === 2 && state.path[1] === ALL_MOVEMENTS) {
    const category = follow(all, state.path.slice(0, 1));
    if (category) {
      const movements = category.children.flatMap((sub) => sub.children);
      return { slices: movements, current: { ...category, key: ALL_MOVEMENTS, name: `${category.name} · todas`, children: movements }, total: category.value, level: 2 };
    }
  }
  const current = follow(all, state.path);
  if (!current) return { slices: all, current: null, total, level: 0 };
  const level = state.path.length;
  // Inside a category: its subcategories. Inside a subcategory: its movements, when it has them.
  const slices = level === 1 ? current.children : current.children;
  return { slices, current, total: current.value, level };
}

// Opening a slice pushes its key; a slice of the current level that is already the last one of the path closes it.
export function openSlice(state: DrillState, key: string): DrillState {
  if (state.path[state.path.length - 1] === key) return { path: state.path.slice(0, -1) };
  return { path: [...state.path, key] };
}

// Going back one level (or to the top from the first one).
export function backOne(state: DrillState): DrillState {
  return { path: state.path.slice(0, -1) };
}
