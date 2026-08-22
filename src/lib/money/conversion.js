// Pure decimal-arithmetic conversion helpers. No Mongoose, no network calls -
// takes a rates map (currency units per EUR, as ECB publishes them) and does
// the cross-rate math. Server code is responsible for fetching/caching rates;
// this file only does the math, so it's trivially unit-testable.

import Decimal from "decimal.js";
import { assertSupportedCurrency, getMinorUnits } from "./currencies";

// ECB publishes "units of X per 1 EUR". Cross rate from -> to is:
//   rate(from -> to) = rates[to] / rates[from]
// because both sides are already expressed per-EUR.
export function crossRate(rates, fromCurrency, toCurrency) {
  assertSupportedCurrency(fromCurrency);
  assertSupportedCurrency(toCurrency);

  if (fromCurrency === toCurrency) return new Decimal(1);

  const fromRate = fromCurrency === "EUR" ? new Decimal(1) : rates?.[fromCurrency];
  const toRate = toCurrency === "EUR" ? new Decimal(1) : rates?.[toCurrency];

  if (fromRate === undefined || fromRate === null || toRate === undefined || toRate === null) {
    throw new Error(`crossRate: missing rate for ${fromCurrency} or ${toCurrency}`);
  }

  const from = new Decimal(fromRate);
  const to = new Decimal(toRate);
  if (from.isZero()) {
    throw new Error(`crossRate: rate for ${fromCurrency} is zero`);
  }

  // Never round this intermediate value - only the final converted amount
  // gets rounded, at the target currency's minor unit.
  return to.dividedBy(from);
}

// Converts an integer minor-unit amount from one currency to another using a
// rates map. Rounds once, at the very end, to the target currency's minor
// units, half-up (away from zero for negative amounts).
export function convertMinor({ amountMinor, fromCurrency, toCurrency, rates, roundingMode = Decimal.ROUND_HALF_UP }) {
  assertSupportedCurrency(fromCurrency);
  assertSupportedCurrency(toCurrency);

  if (!Number.isFinite(amountMinor)) {
    throw new Error(`convertMinor: amountMinor is not a finite number: ${amountMinor}`);
  }

  const rate = crossRate(rates, fromCurrency, toCurrency);

  const fromMinorUnits = getMinorUnits(fromCurrency);
  const toMinorUnits = getMinorUnits(toCurrency);

  // Convert the source minor amount to a "major" decimal, apply the rate,
  // then convert to the target's minor units - all in decimal space.
  const majorSource = new Decimal(amountMinor).dividedBy(new Decimal(10).pow(fromMinorUnits));
  const majorTarget = majorSource.times(rate);
  const minorTarget = majorTarget.times(new Decimal(10).pow(toMinorUnits));

  const roundedMinor = minorTarget.toDecimalPlaces(0, roundingMode);

  return {
    amountMinor: roundedMinor.toNumber(),
    currency: toCurrency,
    rate: rate.toString(),
  };
}

// Given a source money value and the target money value it was actually
// converted to (e.g. a manual/provider-supplied equivalent), derive the
// effective rate actually used - which may differ from the neutral ECB rate.
export function deriveEffectiveRate({ sourceMoney, targetMoney }) {
  assertSupportedCurrency(sourceMoney.currency);
  assertSupportedCurrency(targetMoney.currency);

  const sourceMinorUnits = getMinorUnits(sourceMoney.currency);
  const targetMinorUnits = getMinorUnits(targetMoney.currency);

  const sourceMajor = new Decimal(sourceMoney.amountMinor).dividedBy(new Decimal(10).pow(sourceMinorUnits));
  const targetMajor = new Decimal(targetMoney.amountMinor).dividedBy(new Decimal(10).pow(targetMinorUnits));

  if (sourceMajor.isZero()) {
    throw new Error("deriveEffectiveRate: source amount is zero, cannot derive a rate");
  }

  return targetMajor.dividedBy(sourceMajor).toString();
}

// Percentage difference between two rate values (e.g. comparing a manual
// bank rate against the neutral ECB reference). Positive means rateA is
// higher than rateB.
export function percentageDifference(rateA, rateB) {
  const a = new Decimal(rateA);
  const b = new Decimal(rateB);
  if (b.isZero()) {
    throw new Error("percentageDifference: rateB is zero");
  }
  return a.minus(b).dividedBy(b).times(100).toNumber();
}
