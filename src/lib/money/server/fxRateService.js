import FxRateSnapshot from "@/model/FxRateSnapshot";
import { fetchEcbRates } from "./ecbClient";
import { crossRate, convertMinor } from "@/lib/money/conversion";

const SOURCE = "ecb";
const BASE_CURRENCY = "EUR";
const LOOKBACK_DAYS_ON_FETCH = 10; // covers weekends + a short holiday run

function startOfUtcDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toSnapshotDTO(doc) {
  if (!doc) return null;
  return {
    source: doc.source,
    baseCurrency: doc.baseCurrency,
    effectiveDate: doc.effectiveDate,
    rates: doc.rates,
    fetchedAt: doc.fetchedAt,
    rawSourceDate: doc.rawSourceDate,
  };
}

// Fetches a fresh ECB window ending at `date` and upserts every observed date
// into the cache (idempotent - unique index on source+baseCurrency+effectiveDate).
async function fetchAndCacheWindow(date) {
  const endDate = startOfUtcDay(date);
  const startDate = new Date(endDate.getTime() - LOOKBACK_DAYS_ON_FETCH * 24 * 60 * 60 * 1000);

  const { rates, rawSourceDate } = await fetchEcbRates({ startDate, endDate });
  const effectiveDate = startOfUtcDay(new Date(rawSourceDate));
  const fetchedAt = new Date();

  const doc = await FxRateSnapshot.findOneAndUpdate(
    { source: SOURCE, baseCurrency: BASE_CURRENCY, effectiveDate },
    { $set: { rates, fetchedAt, rawSourceDate, schemaVersion: 1 } },
    { upsert: true, new: true }
  );

  return toSnapshotDTO(doc);
}

// Latest cached snapshot with effectiveDate <= `date` (weekend/holiday
// fallback: reuses the most recent earlier business-day rate).
async function findCachedOnOrBefore(date) {
  const doc = await FxRateSnapshot.findOne({
    source: SOURCE,
    baseCurrency: BASE_CURRENCY,
    effectiveDate: { $lte: startOfUtcDay(date) },
  }).sort({ effectiveDate: -1 });
  return toSnapshotDTO(doc);
}

// Today's valuation snapshot. Fetches ECB at most once for the current
// effective date; reuses Mongo afterward. On ECB failure, falls back to the
// newest cached snapshot and marks the result stale.
export async function getLatestSnapshot() {
  const today = startOfUtcDay(new Date());
  const cached = await findCachedOnOrBefore(today);
  if (cached && startOfUtcDay(cached.effectiveDate).getTime() === today.getTime()) {
    return { snapshot: cached, stale: false };
  }

  try {
    const fetched = await fetchAndCacheWindow(today);
    return { snapshot: fetched, stale: false };
  } catch (err) {
    if (cached) {
      return { snapshot: cached, stale: true, fetchError: err.message };
    }
    return { snapshot: null, stale: true, fetchError: err.message };
  }
}

// Historical snapshot for a specific transaction date. Cache-aside: Mongo
// first, ECB only when nothing usable is cached yet.
export async function getSnapshotOnOrBefore(date) {
  const target = startOfUtcDay(date);
  const cached = await findCachedOnOrBefore(target);
  if (cached) return { snapshot: cached, stale: false };

  try {
    const fetched = await fetchAndCacheWindow(target);
    return { snapshot: fetched, stale: false };
  } catch (err) {
    return { snapshot: null, stale: true, fetchError: err.message };
  }
}

// Returns a structured unavailable result rather than ever defaulting to
// rate 1 - callers must handle `available: false` explicitly.
function unavailable(fetchError) {
  return { available: false, rate: null, effectiveDate: null, estimated: true, stale: true, fetchError: fetchError || null };
}

export async function getRate({ fromCurrency, toCurrency, date }) {
  const { snapshot, stale, fetchError } = date
    ? await getSnapshotOnOrBefore(date)
    : await getLatestSnapshot();

  if (!snapshot) return unavailable(fetchError);

  const rate = crossRate(snapshot.rates, fromCurrency, toCurrency);
  return {
    available: true,
    rate: rate.toString(),
    effectiveDate: snapshot.effectiveDate,
    source: "ecb_reference",
    estimated: true,
    stale: Boolean(stale),
  };
}

export async function convert({ amountMinor, fromCurrency, toCurrency, date }) {
  const { snapshot, stale, fetchError } = date
    ? await getSnapshotOnOrBefore(date)
    : await getLatestSnapshot();

  if (!snapshot) return unavailable(fetchError);

  const converted = convertMinor({ amountMinor, fromCurrency, toCurrency, rates: snapshot.rates });
  return {
    available: true,
    amountMinor: converted.amountMinor,
    currency: converted.currency,
    rate: converted.rate,
    effectiveDate: snapshot.effectiveDate,
    source: "ecb_reference",
    estimated: true,
    stale: Boolean(stale),
  };
}
