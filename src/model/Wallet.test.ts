import { describe, it, expect } from "vitest";
import Wallet from "./Wallet";

describe("Wallet schema (bug 137)", () => {
  it("rejects a wallet with no user (the schema used to say `require`, which Mongoose ignores)", () => {
    const error = new Wallet({ name: "x" }).validateSync();
    expect(error?.errors?.user).toBeTruthy();
  });
  it("accepts one that has a user", () => {
    const error = new Wallet({ name: "x", user: "6abe5da215bbf2dc4c27ed3c" }).validateSync();
    expect(error?.errors?.user).toBeUndefined();
  });
});
