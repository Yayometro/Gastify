import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Mongoose model and the ECB client so these tests never touch a
// real database or the network - pure cache-aside logic under test.
vi.mock("@/model/FxRateSnapshot", () => {
  return { default: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } };
});
vi.mock("./ecbClient", () => ({ fetchEcbRates: vi.fn() }));

import FxRateSnapshot from "@/model/FxRateSnapshot";
import { fetchEcbRates } from "./ecbClient";
import { getLatestSnapshot, getSnapshotOnOrBefore, getRate, convert } from "./fxRateService";

function mockSort(returnValue) {
  return { sort: vi.fn().mockResolvedValue(returnValue) };
}

const SAMPLE_RATES = { EUR: "1", USD: "1.1699", MXN: "19.7690", JPY: "185.66" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLatestSnapshot", () => {
  it("reuses today's cached snapshot without calling ECB (cache hit avoids network)", async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    FxRateSnapshot.findOne.mockReturnValue(
      mockSort({ source: "ecb", baseCurrency: "EUR", effectiveDate: today, rates: SAMPLE_RATES, fetchedAt: today, rawSourceDate: "today" })
    );

    const result = await getLatestSnapshot();

    expect(result.stale).toBe(false);
    expect(result.snapshot.rates).toEqual(SAMPLE_RATES);
    expect(fetchEcbRates).not.toHaveBeenCalled();
  });

  it("fetches and caches when no snapshot exists for today (cache miss)", async () => {
    FxRateSnapshot.findOne.mockReturnValue(mockSort(null));
    fetchEcbRates.mockResolvedValue({ rates: SAMPLE_RATES, rawSourceDate: "2026-08-21" });
    FxRateSnapshot.findOneAndUpdate.mockResolvedValue({
      source: "ecb", baseCurrency: "EUR", effectiveDate: new Date("2026-08-21"), rates: SAMPLE_RATES, fetchedAt: new Date(), rawSourceDate: "2026-08-21",
    });

    const result = await getLatestSnapshot();

    expect(fetchEcbRates).toHaveBeenCalledTimes(1);
    expect(FxRateSnapshot.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(result.stale).toBe(false);
    expect(result.snapshot.rates).toEqual(SAMPLE_RATES);
  });

  it("falls back to the newest cached snapshot and marks stale when ECB fails", async () => {
    const staleDate = new Date("2026-08-15");
    // First call (checking for today) returns an old cached snapshot.
    FxRateSnapshot.findOne.mockReturnValue(
      mockSort({ source: "ecb", baseCurrency: "EUR", effectiveDate: staleDate, rates: SAMPLE_RATES, fetchedAt: staleDate, rawSourceDate: "2026-08-15" })
    );
    fetchEcbRates.mockRejectedValue(new Error("ECB unreachable"));

    const result = await getLatestSnapshot();

    expect(result.stale).toBe(true);
    expect(result.snapshot.rates).toEqual(SAMPLE_RATES);
    expect(result.fetchError).toMatch(/ECB unreachable/);
  });

  it("returns snapshot: null (never rate 1) when there is no cache and ECB fails", async () => {
    FxRateSnapshot.findOne.mockReturnValue(mockSort(null));
    fetchEcbRates.mockRejectedValue(new Error("network down"));

    const result = await getLatestSnapshot();

    expect(result.snapshot).toBeNull();
    expect(result.stale).toBe(true);
  });
});

describe("getSnapshotOnOrBefore (weekend/holiday fallback)", () => {
  it("reuses the most recent earlier business-day snapshot for a weekend date", async () => {
    const friday = new Date("2026-08-21");
    FxRateSnapshot.findOne.mockReturnValue(
      mockSort({ source: "ecb", baseCurrency: "EUR", effectiveDate: friday, rates: SAMPLE_RATES, fetchedAt: friday, rawSourceDate: "2026-08-21" })
    );

    const sunday = new Date("2026-08-23");
    const result = await getSnapshotOnOrBefore(sunday);

    expect(result.snapshot.effectiveDate).toEqual(friday);
    expect(fetchEcbRates).not.toHaveBeenCalled();
  });
});

describe("getRate / convert", () => {
  it("computes the USD -> MXN rate from a cached snapshot", async () => {
    FxRateSnapshot.findOne.mockReturnValue(
      mockSort({ source: "ecb", baseCurrency: "EUR", effectiveDate: new Date("2026-08-21"), rates: SAMPLE_RATES, fetchedAt: new Date(), rawSourceDate: "2026-08-21" })
    );

    const result = await getRate({ fromCurrency: "USD", toCurrency: "MXN", date: new Date("2026-08-21") });

    expect(result.available).toBe(true);
    expect(Number(result.rate)).toBeCloseTo(16.898025, 4);
    expect(result.source).toBe("ecb_reference");
    expect(result.estimated).toBe(true);
  });

  it("converts an amount and marks it stale when using a fallback snapshot", async () => {
    FxRateSnapshot.findOne.mockReturnValue(mockSort(null));
    fetchEcbRates.mockRejectedValue(new Error("down"));

    const result = await convert({ amountMinor: 10000, fromCurrency: "USD", toCurrency: "MXN", date: new Date("2026-08-21") });

    expect(result.available).toBe(false);
    expect(result.stale).toBe(true);
  });
});
