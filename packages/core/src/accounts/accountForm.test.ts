import { describe, it, expect } from "vitest";

import { moveInList, validateAccount } from "./accountForm";

describe("validateAccount", () => {
  it("accepts a name and a balance, negative included", () => {
    expect(validateAccount({ name: "Tarjeta", amount: "-4,200", accountType: "credit", currency: "MXN" })).toEqual({});
  });

  it("refuses an empty name and a balance that is not a number", () => {
    const errors = validateAccount({ name: " ", amount: "mucho", accountType: "debit", currency: "MXN" });
    expect(Object.keys(errors).sort()).toEqual(["amount", "name"]);
  });
});

describe("moveInList", () => {
  it("swaps with the neighbour and keeps the list when the move is not possible", () => {
    expect(moveInList(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveInList(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(moveInList(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });
});
