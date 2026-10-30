import { describe, it, expect } from "vitest";

import { categoryBreakdown, NO_SUBCATEGORY_NAME } from "@gastify/core/history/categoryBreakdown";
import { ROOT_ID, ownerKeys, pathId, rootNode, type RingNode } from "./breakdownRingNodes";

const food = { _id: "c1", name: "Comida", icon: "food", color: "#f97316" };
const car = { _id: "c2", name: "Auto", icon: "car", color: "#14b8a6" };
const tacos = { _id: "s1", name: "Tacos", icon: "taco", color: "#ea580c" };

const bill = (amount: number, category: unknown, subCategory?: unknown) => ({ amount, isBill: true, category, subCategory }) as never;

// Both categories have movements without a subcategory, so each gets its own "Sin subcategoría" slice (and its movements).
const slices = () => categoryBreakdown([bill(50, food), bill(30, car), bill(20, food, tacos)], "spending");

function allNodes(node: RingNode): RingNode[] {
  return [node, ...(node.children ?? []).flatMap(allNodes)];
}

describe("breakdown ring nodes", () => {
  it("gives every node a unique id, even when a name repeats under two categories", () => {
    const nodes = allNodes(rootNode("Gastos", slices(), 0));
    const ids = nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the name the person reads on both \"Sin subcategoría\" slices", () => {
    const nodes = allNodes(rootNode("Gastos", slices(), 0));
    expect(nodes.filter((node) => node.name === NO_SUBCATEGORY_NAME)).toHaveLength(2);
  });

  it("a tap on each \"Sin subcategoría\" opens its own category", () => {
    const root = rootNode("Gastos", slices(), 0);
    const owner = ownerKeys(slices());
    const owners = allNodes(root)
      .filter((node) => node.name === NO_SUBCATEGORY_NAME)
      .map((node) => owner.get(node.id));
    expect(owners.sort()).toEqual(["c1", "c2"]);
  });

  it("the root keeps its own id, so a tap on the centre still goes back up", () => {
    expect(rootNode("Gastos", slices(), 0).id).toBe(ROOT_ID);
  });

  it("escapes the separator, so two different paths never share an id", () => {
    expect(pathId(["a/b", "c"])).not.toBe(pathId(["a", "b/c"]));
  });
});
