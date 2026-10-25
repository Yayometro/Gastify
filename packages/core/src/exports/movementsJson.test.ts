import { describe, it, expect } from "vitest";

import { movementsToJson } from "./movementsJson";

const row = { date: "2026-10-19", name: "Súper", category: "Comida", subCategory: "", type: "Gasto", amount: 250.499, currency: "MXN", account: "General" };

describe("movementsToJson", () => {
  it("wraps the movements with the count and the generation time", () => {
    const parsed = JSON.parse(movementsToJson([row], new Date("2026-10-20T12:00:00Z")));
    expect(parsed.app).toBe("Gastify");
    expect(parsed.generatedAt).toBe("2026-10-20T12:00:00.000Z");
    expect(parsed.count).toBe(1);
  });

  it("uses English keys, a type code and the amount rounded to cents", () => {
    const [movement] = JSON.parse(movementsToJson([row], new Date(0))).movements;
    expect(movement).toEqual({ date: "2026-10-19", name: "Súper", category: "Comida", subCategory: "", type: "expense", amount: 250.5, currency: "MXN", account: "General" });
  });

  it("keeps an unknown type as it came and handles an empty list", () => {
    expect(JSON.parse(movementsToJson([{ ...row, type: "Otro" }], new Date(0))).movements[0].type).toBe("Otro");
    expect(JSON.parse(movementsToJson([], new Date(0))).movements).toEqual([]);
  });
});
