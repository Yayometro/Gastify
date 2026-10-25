import { describe, it, expect } from "vitest";

import {
  buildMovementBody,
  buildTransferBody,
  dateText,
  parseDateText,
  parseMoneyText,
  parseSignedMoneyText,
  validateMovement,
  validateTransfer,
} from "./movementForm";

const base = { type: "expense" as const, amount: "250", name: "", accountId: "acc1", categoryId: "cat1", subCategoryId: "", budgetId: "", date: "2026-10-15", chargedElsewhere: false, merchantAmount: "", merchantCurrency: "USD", tags: "" };

describe("parseMoneyText", () => {
  it("reads what a person types", () => {
    expect(parseMoneyText("1,234.50")).toBe(1234.5);
    expect(parseMoneyText("80")).toBe(80);
    expect(parseMoneyText(" 12.5 ")).toBe(12.5);
  });

  it("rejects zero, negatives, empty text and more than two decimals", () => {
    expect(parseMoneyText("0")).toBeNull();
    expect(parseMoneyText("-5")).toBeNull();
    expect(parseMoneyText("")).toBeNull();
    expect(parseMoneyText("1.234")).toBeNull();
    expect(parseMoneyText("abc")).toBeNull();
  });

  it("accepts negative numbers only in the signed reader", () => {
    expect(parseSignedMoneyText("-4,200")).toBe(-4200);
    expect(parseSignedMoneyText("0")).toBe(0);
    expect(parseSignedMoneyText("--1")).toBeNull();
  });
});

describe("dates", () => {
  it("round-trips the local day", () => {
    expect(dateText(parseDateText("2026-02-28") as Date)).toBe("2026-02-28");
  });

  it("refuses dates that do not exist", () => {
    expect(parseDateText("2026-02-30")).toBeNull();
    expect(parseDateText("19/10/2026")).toBeNull();
  });
});

describe("validateMovement", () => {
  it("passes a complete movement", () => {
    expect(validateMovement(base)).toEqual({});
  });

  it("names every missing piece", () => {
    const errors = validateMovement({ ...base, amount: "", accountId: "", categoryId: "", date: "mañana" });
    expect(Object.keys(errors).sort()).toEqual(["accountId", "amount", "categoryId", "date"]);
  });

  it("asks for the merchant's amount only when charged in another currency", () => {
    expect(validateMovement({ ...base, chargedElsewhere: true, merchantAmount: "" }).merchantAmount).toBeDefined();
    expect(validateMovement({ ...base, chargedElsewhere: false, merchantAmount: "" }).merchantAmount).toBeUndefined();
  });
});

describe("buildMovementBody", () => {
  const now = new Date(2026, 9, 19, 10, 30);

  it("sends an expense as a bill with the ids the API expects", () => {
    const body = buildMovementBody(base, "Comida", now);
    expect(body).toMatchObject({ name: "Comida", amount: 250, isBill: true, isIncome: false, account: "acc1", category: "cat1", subCategory: null, budget: null });
  });

  it("marks an income as not a bill and keeps the typed name", () => {
    const body = buildMovementBody({ ...base, type: "income", name: " Nómina " }, "Ingreso", now);
    expect(body).toMatchObject({ name: "Nómina", isIncome: true, isBill: false });
  });

  it("sends the merchant amount and currency only when charged in another currency, and the tags as a list", () => {
    const plain = buildMovementBody({ ...base, tags: "viaje, trabajo , " }, "x", now);
    expect(plain.tags).toEqual(["viaje", "trabajo"]);
    expect(plain.merchantAmount).toBeUndefined();
    const abroad = buildMovementBody({ ...base, chargedElsewhere: true, merchantAmount: "40", merchantCurrency: "USD" }, "x", now);
    expect(abroad).toMatchObject({ merchantAmount: "40", merchantCurrency: "USD" });
  });

  it("uses the current time for today and noon for an earlier day", () => {
    expect(buildMovementBody({ ...base, date: "2026-10-19" }, "x", now).date).toBe(now.toISOString());
    const earlier = new Date(buildMovementBody({ ...base, date: "2026-10-15" }, "x", now).date as string);
    expect(earlier.getHours()).toBe(12);
  });
});

describe("transfers", () => {
  const sameCurrency = { acc1: "MXN", acc2: "MXN" };
  const crossCurrency = { acc1: "MXN", acc2: "USD" };
  const values = { sourceAccountId: "acc1", destinationAccountId: "acc2", sourceAmount: "500", destinationAmount: "", name: "", date: "2026-10-15" };

  it("refuses the same account on both sides", () => {
    expect(validateTransfer({ ...values, destinationAccountId: "acc1" }, sameCurrency).destinationAccountId).toBeDefined();
  });

  it("asks what arrives only across currencies", () => {
    expect(validateTransfer(values, sameCurrency)).toEqual({});
    expect(validateTransfer(values, crossCurrency).destinationAmount).toBeDefined();
  });

  it("builds a transfer for the same currency and an exchange across currencies, in minor units", () => {
    const names = { exchange: "Cambio de moneda", transfer: "Transferencia" };
    expect(buildTransferBody(values, sameCurrency, names)).toMatchObject({ kind: "transfer", sourceAmountMinor: 50000, destinationAmountMinor: 50000 });
    expect(buildTransferBody({ ...values, destinationAmount: "27.5" }, crossCurrency, names)).toMatchObject({
      kind: "exchange",
      sourceAmountMinor: 50000,
      destinationAmountMinor: 2750,
      name: "Cambio de moneda",
    });
  });
});
