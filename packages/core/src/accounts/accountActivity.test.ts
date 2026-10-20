import { describe, it, expect } from "vitest";

import { accountActivity, accountGradient, nativeAmountOf } from "./accountActivity";

const range = { start: new Date(2026, 9, 1), end: new Date(2026, 9, 31, 23, 59, 59, 999) };
const day = (d: number) => new Date(2026, 9, d, 12).toISOString();

describe("accountActivity", () => {
  it("adds what came in and went out of each account, in its own currency, and skips transfers", () => {
    const rows = accountActivity(
      [
        { date: day(3), isBill: true, account: "a1", displayMoney: { native: { amountMinor: 15000, currency: "MXN" } } },
        { date: day(4), isBill: false, account: "a1", displayMoney: { native: { amountMinor: 50000, currency: "MXN" } } },
        { date: day(5), isBill: true, account: "a2", amount: 20 },
        { date: day(6), isBill: true, kind: "transfer", account: "a1", amount: 999 },
        { date: new Date(2026, 8, 20).toISOString(), isBill: true, account: "a1", amount: 77 },
      ],
      range
    );
    expect(rows.a1).toEqual({ incomes: 500, spending: 150, count: 2 });
    expect(rows.a2).toEqual({ incomes: 0, spending: 20, count: 1 });
  });

  it("reads the account of a populated movement", () => {
    expect(accountActivity([{ date: day(2), isBill: true, account: { _id: "a9" }, amount: 5 }], range).a9?.spending).toBe(5);
  });
});

describe("nativeAmountOf and accountGradient", () => {
  it("prefers the native money and falls back to the number", () => {
    expect(nativeAmountOf({ displayMoney: { native: { amountMinor: 12345, currency: "USD" } }, amount: 1 })).toBe(123.45);
    expect(nativeAmountOf({ amount: -8 })).toBe(8);
  });
  it("gives the same two colors for the same account and different ones for another", () => {
    expect(accountGradient("abc")).toEqual(accountGradient("abc"));
    expect(accountGradient("abc")).not.toEqual(accountGradient("xyz"));
    expect(accountGradient("abc")[0]).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
