import { describe, it, expect } from "vitest";

import { categoryBreakdown, donutArcs, groupSmallSlices, NO_CATEGORY_NAME, NO_SUBCATEGORY_NAME } from "./categoryBreakdown";

const food = { _id: "c1", name: "Comida", icon: "food", color: "#f97316" };
const car = { _id: "c2", name: "Auto", icon: "car", color: "#14b8a6" };
const tacos = { _id: "s1", name: "Tacos", icon: "taco", color: "#ea580c" };

const bill = (amount: number, category: unknown, subCategory?: unknown) => ({ amount, isBill: true, category, subCategory }) as never;
const income = (amount: number, category: unknown) => ({ amount, isBill: false, category }) as never;

describe("categoryBreakdown", () => {
  it("adds spending per category and per subcategory, biggest first", () => {
    const rows = categoryBreakdown([bill(100, food, tacos), bill(50, food), bill(300, car), income(999, food)], "spending");
    expect(rows.map((row) => [row.name, row.value, row.count])).toEqual([["Auto", 300, 1], ["Comida", 150, 2]]);
    const comida = rows[1];
    expect(comida.children.map((child) => [child.name, child.value])).toEqual([["Tacos", 100], [NO_SUBCATEGORY_NAME, 50]]);
  });

  it("gives a subcategory without color or icon the look of its category", () => {
    const [row] = categoryBreakdown([bill(10, food, { _id: "s2", name: "Cena" })], "spending");
    expect(row.children[0]).toMatchObject({ name: "Cena", color: "#f97316", icon: "food" });
  });

  it("splits incomes the same way and puts movements without category together", () => {
    const rows = categoryBreakdown([income(500, null), income(200, null), income(100, car)], "incomes");
    expect(rows.map((row) => [row.name, row.value])).toEqual([[NO_CATEGORY_NAME, 700], ["Auto", 100]]);
  });

  it("leaves out transfers and zero amounts", () => {
    const rows = categoryBreakdown([{ amount: 80, kind: "transfer", isBill: false } as never, bill(0, food)], "spending");
    expect(rows).toEqual([]);
  });
});

describe("groupSmallSlices", () => {
  const slice = (key: string, value: number) => ({ key, name: key, icon: "", color: "#000", value, count: 1, children: [] });
  it("keeps the biggest and merges the rest into Otras", () => {
    const grouped = groupSmallSlices([slice("a", 50), slice("b", 30), slice("c", 15), slice("d", 5)], 3);
    expect(grouped.map((item) => [item.name, item.value])).toEqual([["a", 50], ["b", 30], ["Otras", 20]]);
    expect(grouped[2].children.map((child) => child.key)).toEqual(["c", "d"]);
  });
  it("returns the list as is when it is short enough", () => {
    const list = [slice("a", 1), slice("b", 1)];
    expect(groupSmallSlices(list, 5)).toBe(list);
  });
});

describe("donutArcs", () => {
  it("covers 360 degrees in proportion, leaving a small gap between arcs", () => {
    const arcs = donutArcs([{ key: "a", value: 75 }, { key: "b", value: 25 }], 2);
    expect(arcs[0]).toEqual({ key: "a", startAngle: 1, endAngle: 269 });
    expect(arcs[1]).toEqual({ key: "b", startAngle: 271, endAngle: 359 });
  });
  it("draws a single slice as an almost full circle and nothing for an empty list", () => {
    expect(donutArcs([{ key: "a", value: 10 }])).toEqual([{ key: "a", startAngle: 0, endAngle: 359.99 }]);
    expect(donutArcs([])).toEqual([]);
  });
});
