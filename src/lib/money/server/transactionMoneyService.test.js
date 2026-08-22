import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks the FX service, not the DB directly - fxRateService already has its
// own mocked-model tests. Here we only verify buildTransactionMoney's own
// branching: same-currency, manual override, and auto ECB conversion.
vi.mock("./fxRateService", () => ({ convert: vi.fn() }));

import { convert } from "./fxRateService";
import { buildTransactionMoney } from "./transactionMoneyService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildTransactionMoney", () => {
  it("is exact and skips FX entirely when Account currency equals Wallet primary currency", async () => {
    const result = await buildTransactionMoney({
      accountAmount: 1250,
      accountCurrency: "MXN",
      walletPrimaryCurrency: "MXN",
      date: new Date("2026-08-21"),
    });

    expect(convert).not.toHaveBeenCalled();
    expect(result.account).toEqual({ amountMinor: 125000, currency: "MXN" });
    expect(result.reporting.source).toBe("same_currency");
    expect(result.reporting.rate).toBe("1");
    expect(result.reporting.amountMinor).toBe(125000);
    expect(result.merchant).toBeNull();
  });

  it("calls the FX service and uses its quote when currencies differ", async () => {
    convert.mockResolvedValue({
      available: true,
      amountMinor: 55763,
      currency: "MXN",
      rate: "16.898025",
      source: "ecb_reference",
      effectiveDate: new Date("2026-08-21"),
      estimated: true,
      stale: false,
    });

    const result = await buildTransactionMoney({
      accountAmount: 33,
      accountCurrency: "USD",
      walletPrimaryCurrency: "MXN",
      date: new Date("2026-08-21"),
    });

    expect(convert).toHaveBeenCalledWith({
      amountMinor: 3300,
      fromCurrency: "USD",
      toCurrency: "MXN",
      date: new Date("2026-08-21"),
    });
    expect(result.reporting).toEqual({
      amountMinor: 55763,
      currency: "MXN",
      rate: "16.898025",
      source: "ecb_reference",
      effectiveDate: new Date("2026-08-21"),
      estimated: true,
    });
  });

  it("prefers a manual reporting override over the FX service, and never calls it", async () => {
    const result = await buildTransactionMoney({
      accountAmount: 33,
      accountCurrency: "USD",
      walletPrimaryCurrency: "MXN",
      date: new Date("2026-08-21"),
      manualReportingAmount: 560,
    });

    expect(convert).not.toHaveBeenCalled();
    expect(result.reporting.source).toBe("manual");
    expect(result.reporting.estimated).toBe(false);
    expect(result.reporting.amountMinor).toBe(56000);
  });

  it("throws (never fakes rate 1) when the FX service is unavailable for a cross-currency Transaction", async () => {
    convert.mockResolvedValue({ available: false });

    await expect(
      buildTransactionMoney({
        accountAmount: 33,
        accountCurrency: "USD",
        walletPrimaryCurrency: "MXN",
        date: new Date("2026-08-21"),
      })
    ).rejects.toThrow(/Exchange-rate estimate unavailable/);
  });

  it("builds merchant money alongside account/reporting when provided", async () => {
    const result = await buildTransactionMoney({
      accountAmount: 33,
      accountCurrency: "USD",
      merchantAmount: 4500,
      merchantCurrency: "JPY",
      walletPrimaryCurrency: "USD",
      date: new Date("2026-08-21"),
    });

    expect(result.merchant).toEqual({ amountMinor: 4500, currency: "JPY" });
    expect(result.reporting.source).toBe("same_currency");
  });
});
