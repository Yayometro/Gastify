import { describe, expect, it } from "vitest";
import { planCurrencyChange } from "./currencyChange";

const row = (id: string, accountCurrency: string | null) => ({ id, name: `mov ${id}`, accountCurrency });

describe("planCurrencyChange", () => {
  it("converts movements with no account, always", () => {
    const plan = planCurrencyChange([row("a", null), row("b", null)], "USD");
    expect(plan.ready).toEqual(["a", "b"]);
    expect(plan.blocked).toEqual([]);
  });

  it("allows a movement whose own account already has the target currency", () => {
    const plan = planCurrencyChange([row("a", "USD"), row("b", "MXN")], "USD");
    expect(plan.ready).toEqual(["a"]);
    expect(plan.blocked.map((item) => item.id)).toEqual(["b"]);
    expect(plan.blocked[0].reason).toContain("MXN");
  });

  it("with a destination account, checks that account instead of the current one", () => {
    const plan = planCurrencyChange([row("a", "MXN"), row("b", null)], "USD", { id: "usd-account", currency: "USD" });
    expect(plan.ready).toEqual(["a", "b"]);
    const blocked = planCurrencyChange([row("a", "USD")], "USD", { id: "mxn-account", currency: "MXN" });
    expect(blocked.ready).toEqual([]);
    expect(blocked.blocked[0].accountCurrency).toBe("MXN");
  });

  it("mixed selections do the compatible ones and list the rest", () => {
    const plan = planCurrencyChange([row("a", "USD"), row("b", "MXN"), row("c", null)], "USD");
    expect(plan.ready).toEqual(["a", "c"]);
    expect(plan.blocked.map((item) => item.id)).toEqual(["b"]);
  });
});
