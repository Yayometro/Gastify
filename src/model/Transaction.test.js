import { describe, it, expect } from "vitest";
import Transaction from "./Transaction";

// Regression coverage for the pre-validate backward-compatibility hook: old
// write routes (not yet updated for Phase 5) only set legacy fields
// (name/amount/isBill/isIncome) and know nothing about kind/direction/money.
// Mongoose schema validation (`.validate()`) runs entirely in-process and
// does not require a live database connection.
describe("Transaction legacy-compatibility hook", () => {
  it("derives kind=expense/direction=debit from isBill, and MXN money at rate 1", async () => {
    const doc = new Transaction({
      name: "Legacy-style expense",
      amount: 199.5,
      isBill: true,
      isIncome: false,
      date: new Date("2026-08-20"),
    });

    await expect(doc.validate()).resolves.toBeUndefined();

    expect(doc.kind).toBe("expense");
    expect(doc.direction).toBe("debit");
    expect(doc.state).toBe("completed");
    expect(doc.money.account.amountMinor).toBe(19950);
    expect(doc.money.account.currency).toBe("MXN");
    expect(doc.money.reporting.currency).toBe("MXN");
    expect(doc.money.reporting.rate).toBe("1");
    expect(doc.money.reporting.source).toBe("legacy_migration");
    expect(doc.money.reporting.estimated).toBe(false);
  });

  it("derives kind=income/direction=credit from isIncome", async () => {
    const doc = new Transaction({
      name: "Legacy-style income",
      amount: 5000,
      isBill: false,
      isIncome: true,
      date: new Date("2026-08-20"),
    });

    await doc.validate();

    expect(doc.kind).toBe("income");
    expect(doc.direction).toBe("credit");
    expect(doc.money.account.amountMinor).toBe(500000);
  });

  it("does not override explicitly-set kind/direction/money (Phase 5 write path)", async () => {
    const doc = new Transaction({
      name: "Money-aware write",
      amount: 33,
      isBill: true,
      kind: "expense",
      direction: "debit",
      date: new Date("2026-08-20"),
      money: {
        account: { amountMinor: 3300, currency: "USD" },
        reporting: {
          amountMinor: 55763,
          currency: "MXN",
          rate: "16.898025",
          source: "ecb_reference",
          effectiveDate: new Date("2026-08-20"),
          estimated: true,
        },
      },
    });

    await doc.validate();

    expect(doc.money.account.currency).toBe("USD");
    expect(doc.money.account.amountMinor).toBe(3300);
    expect(doc.money.reporting.source).toBe("ecb_reference");
  });

  it("does not change pre-existing behavior: `amount` uses `require` (not `required`), a schema typo Mongoose silently ignores - documented here, not fixed, since it's unrelated to this plan", async () => {
    const doc = new Transaction({
      name: "No amount",
      isBill: true,
    });
    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.amount).toBeUndefined();
    // The compat hook still runs and defaults the missing amount to 0 minor units.
    expect(doc.money.account.amountMinor).toBe(0);
  });
});
