import { describe, it, expect } from "vitest";

import type { BreakdownSlice } from "./categoryBreakdown";
import { backOne, drillView, openSlice } from "./categoryDrill";

const leaf = (key: string, value: number): BreakdownSlice => ({ key, name: key, icon: "", color: "#000", value, count: 1, children: [] });
const sub = (key: string, value: number, children: BreakdownSlice[] = []): BreakdownSlice => ({ key, name: key, icon: "", color: "#000", value, count: children.length || 1, children });

const tree: BreakdownSlice[] = [
  sub("House", 100, [sub("Renta", 80, [leaf("r1", 50), leaf("r2", 30)]), sub("Luz", 20, [leaf("l1", 20)])]),
  sub("Food", 40, [sub("Super", 40, [leaf("s1", 25), leaf("s2", 15)])]),
];

describe("categoryDrill", () => {
  it("starts at the categories", () => {
    const view = drillView(tree, { path: [] }, 140);
    expect(view.level).toBe(0);
    expect(view.slices.map((s) => s.key)).toEqual(["House", "Food"]);
    expect(view.total).toBe(140);
  });

  it("opens a category into its subcategories and a subcategory into its movements", () => {
    let state = openSlice({ path: [] }, "House");
    expect(drillView(tree, state, 140).slices.map((s) => s.key)).toEqual(["Renta", "Luz"]);
    state = openSlice(state, "Renta");
    const view = drillView(tree, state, 140);
    expect(view.level).toBe(2);
    expect(view.slices.map((s) => s.key)).toEqual(["r1", "r2"]);
    expect(view.total).toBe(80);
  });

  it("goes back one level at a time and closes a slice tapped twice", () => {
    const deep = { path: ["House", "Renta"] };
    expect(backOne(deep).path).toEqual(["House"]);
    expect(openSlice({ path: ["House"] }, "House").path).toEqual([]);
  });

  it("falls back to the top when the path points at something that is gone", () => {
    expect(drillView(tree, { path: ["Nope"] }, 140).level).toBe(0);
  });
});
