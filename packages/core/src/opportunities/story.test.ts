import { describe, expect, it } from "vitest";

import { affordability, carAffordability, classifyWasteCategory, ILLUSTRATIVE_TRIPS, suggestWasteCategories } from "./story";

describe("affordability", () => {
  it("finds the best item paid in full and how close the next one is", () => {
    const result = affordability(110_000, ILLUSTRATIVE_TRIPS);
    expect(result.reachable?.id).toBe("tripJapan");
    expect(result.next).toBeNull();
    const smaller = affordability(40_000, ILLUSTRATIVE_TRIPS);
    expect(smaller.reachable?.id).toBe("tripColombia");
    expect(smaller.next?.id).toBe("tripCanada");
    expect(smaller.nextCoverage).toBeCloseTo(40_000 / 60_000);
  });

  it("reaches nothing with a very small or invalid amount", () => {
    const tiny = affordability(1_000, ILLUSTRATIVE_TRIPS);
    expect(tiny.reachable).toBeNull();
    expect(tiny.next?.id).toBe("tripWeekendMx");
    expect(tiny.nextCoverage).toBeCloseTo(1_000 / 6_000);
    expect(affordability(Number.NaN, ILLUSTRATIVE_TRIPS).reachable).toBeNull();
    expect(affordability(-5, ILLUSTRATIVE_TRIPS).reachable).toBeNull();
  });
});

describe("carAffordability", () => {
  it("separates paying in cash from covering a down payment", () => {
    const result = carAffordability(110_000);
    expect(result.cash?.id).toBe("carUsed2018");
    // 20% of 520,000 = 104,000 <= 110,000: the most expensive car whose down payment it covers.
    expect(result.downPayment?.id).toBe("carNewSuv");
    expect(result.nextDownPayment).toBeNull();
    const small = carAffordability(30_000);
    expect(small.cash).toBeNull();
    // 20% of 110,000 = 22,000 <= 30,000; 20% of 150,000 = 30,000 <= 30,000; 20% of 287,000 = 57,400 > 30,000.
    expect(small.downPayment?.id).toBe("carUsed2020");
    expect(small.nextDownPayment?.id).toBe("carNewHatchback");
    expect(small.nextDownPaymentCoverage).toBeCloseTo(30_000 / 57_400);
  });
});

describe("classifyWasteCategory", () => {
  it("recognizes vices and indulgences by the words of the name", () => {
    expect(classifyWasteCategory("Cigarros")).toBe("vice");
    expect(classifyWasteCategory("Bar y antros")).toBe("vice");
    expect(classifyWasteCategory("Restaurantes")).toBe("indulgence");
    expect(classifyWasteCategory("Comida rápida")).toBe("indulgence");
    expect(classifyWasteCategory("Café")).toBe("indulgence");
    expect(classifyWasteCategory("Vacaciones")).toBe("leisure");
    expect(classifyWasteCategory("Power drinks energizantes")).toBe("indulgence");
  });

  it("does not match inside other words", () => {
    expect(classifyWasteCategory("Barbería")).toBeNull();
    expect(classifyWasteCategory("Renta")).toBeNull();
    expect(classifyWasteCategory("Salud")).toBeNull();
    expect(classifyWasteCategory("")).toBeNull();
  });
});

describe("suggestWasteCategories", () => {
  const rows = [
    { id: "a", name: "Renta", amountMinor: 900_000 },
    { id: "b", name: "Restaurantes", amountMinor: 120_000 },
    { id: "c", name: "Cigarros", amountMinor: 50_000 },
    { id: "d", name: "Vacaciones", amountMinor: 200_000 },
    { id: "e", name: "Salud", amountMinor: 0 },
  ];
  it("puts the biggest look-alikes first, at most two", () => {
    expect(suggestWasteCategories(rows).map((row) => row.id)).toEqual(["d", "b"]);
    expect(suggestWasteCategories(rows, 3).map((row) => row.id)).toEqual(["d", "b", "c"]);
  });
  it("falls back to the category with the most spending, and to nothing", () => {
    expect(suggestWasteCategories([{ id: "a", name: "Renta", amountMinor: 10 }, { id: "z", name: "Luz", amountMinor: 30 }])).toEqual([{ id: "z", name: "Luz", amountMinor: 30, kind: "top" }]);
    expect(suggestWasteCategories([])).toEqual([]);
    expect(suggestWasteCategories([{ id: "a", name: "Renta", amountMinor: 0 }])).toEqual([]);
  });
});
