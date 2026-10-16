import { describe, it, expect } from "vitest";
import { assertOwnedOrDefault } from "./ownership";

const mine = { _id: "a", user: "u1", wallet: "w1" };

describe("assertOwnedOrDefault", () => {
  it("accepts a document of the same user and wallet", () => {
    expect(assertOwnedOrDefault(mine, "u1", "w1", "nope")).toBe(mine);
  });
  it("rejects a missing document and someone else's with the same message", () => {
    expect(() => assertOwnedOrDefault(null, "u1", "w1", "nope")).toThrow("nope");
    expect(() => assertOwnedOrDefault({ user: "u2", wallet: "w2" }, "u1", "w1", "nope")).toThrow("nope");
  });
  it("rejects a document of the same user but another wallet", () => {
    expect(() => assertOwnedOrDefault({ user: "u1", wallet: "w2" }, "u1", "w1", "nope")).toThrow("nope");
  });
  it("accepts a shared default only when the flag is named and set", () => {
    const shared = { user: "u2", wallet: "w2", isDefaultCatego: true };
    expect(assertOwnedOrDefault(shared, "u1", "w1", "nope", "isDefaultCatego")).toBe(shared);
    expect(() => assertOwnedOrDefault(shared, "u1", "w1", "nope")).toThrow("nope");
    expect(() => assertOwnedOrDefault({ user: "u2", wallet: "w2" }, "u1", "w1", "nope", "isDefaultCatego")).toThrow("nope");
  });
});
