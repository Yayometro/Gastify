import { describe, it, expect } from "vitest";

import { packCircles, squarify } from "./layouts";

const nodes = [{ id: "a", value: 50 }, { id: "b", value: 30 }, { id: "c", value: 15 }, { id: "d", value: 5 }, { id: "z", value: 0 }];

describe("squarify", () => {
  it("fills the box exactly with areas proportional to the values, leaving out zeros", () => {
    const rects = squarify(nodes, 0, 0, 200, 100);
    expect(rects).toHaveLength(4);
    const total = rects.reduce((sum, r) => sum + r.width * r.height, 0);
    expect(total).toBeCloseTo(200 * 100, 4);
    const a = rects.find((r) => r.node.id === "a")!;
    expect(a.width * a.height).toBeCloseTo(0.5 * 200 * 100, 4);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.width).toBeLessThanOrEqual(200 + 1e-9);
      expect(r.y + r.height).toBeLessThanOrEqual(100 + 1e-9);
    }
  });
  it("returns nothing for an empty or zero-size case", () => {
    expect(squarify([], 0, 0, 10, 10)).toEqual([]);
    expect(squarify(nodes, 0, 0, 0, 10)).toEqual([]);
  });
});

describe("packCircles", () => {
  it("keeps every circle inside the box and never overlapping another", () => {
    const circles = packCircles(nodes, 300, 200);
    expect(circles).toHaveLength(4);
    for (const c of circles) {
      expect(c.x - c.r).toBeGreaterThanOrEqual(-1e-6);
      expect(c.y - c.r).toBeGreaterThanOrEqual(-1e-6);
      expect(c.x + c.r).toBeLessThanOrEqual(300 + 1e-6);
      expect(c.y + c.r).toBeLessThanOrEqual(200 + 1e-6);
    }
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        expect(Math.hypot(circles[i].x - circles[j].x, circles[i].y - circles[j].y)).toBeGreaterThanOrEqual(circles[i].r + circles[j].r - 1e-6);
      }
    }
  });
  it("gives a bigger value a bigger circle (area proportional)", () => {
    const [big, small] = packCircles([{ value: 4 }, { value: 1 }], 100, 100);
    expect((big.r * big.r) / (small.r * small.r)).toBeCloseTo(4, 3);
  });
  it("handles one item and none", () => {
    expect(packCircles([{ value: 3 }], 100, 60)).toHaveLength(1);
    expect(packCircles([], 100, 60)).toEqual([]);
  });
});
