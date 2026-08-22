// Pure mapping helpers for building a Transaction's `money` sub-object. No
// Mongoose, no network calls - the DB/FX-aware enrichment lives in
// ./server/transactionMoneyService.js.

import { majorToMinor } from "./currencies";
import { deriveEffectiveRate } from "./conversion";

// The amount actually charged against the Account, in the Account's own
// native currency.
export function buildAccountMoney({ amount, currency }) {
  return { amountMinor: majorToMinor(Number(amount) || 0, currency), currency };
}

// Optional: what the merchant actually charged, when it differs from the
// Account's currency (e.g. a USD account charged in JPY abroad). Absent by
// default - most Transactions never set this.
export function buildMerchantMoney({ amount, currency }) {
  if (amount === undefined || amount === null || amount === "" || !currency) return null;
  return { amountMinor: majorToMinor(Number(amount), currency), currency };
}

// A manual/provider-asserted reporting value: the user (or a trusted import)
// states the exact Wallet-primary-currency equivalent, bypassing the ECB
// estimate. The effective rate is derived from the two amounts rather than
// looked up, so it reflects the rate actually used (e.g. a bank's real
// exchange rate), not the neutral reference rate.
export function buildManualReportingMoney({ amount, currency, accountMoney, effectiveDate, source = "manual" }) {
  const targetMoney = { amountMinor: majorToMinor(Number(amount), currency), currency };
  const rate = deriveEffectiveRate({ sourceMoney: accountMoney, targetMoney });
  return {
    amountMinor: targetMoney.amountMinor,
    currency,
    rate,
    source,
    effectiveDate: effectiveDate || new Date(),
    estimated: false,
  };
}

// The trivial case: Account currency already equals the currency being
// reported in, so the reporting snapshot is exact by construction - no FX
// lookup needed or possible to be wrong.
export function buildSameCurrencyReportingMoney({ accountMoney, effectiveDate }) {
  return {
    amountMinor: accountMoney.amountMinor,
    currency: accountMoney.currency,
    rate: "1",
    source: "same_currency",
    effectiveDate: effectiveDate || new Date(),
    estimated: false,
  };
}

// The MXN-rate-1 fallback for documents that predate money-aware writes and
// have never been re-saved since (`.lean()` reads never run Mongoose hooks
// or apply schema defaults for a missing subdocument, so a document written
// before Phase 5 - or not yet touched by the real migration - has no
// `money` field in the actual stored BSON at all). Shared between
// Transaction.js's pre-validate write-time hook and the read-side DTO
// builder so both derive an identical value for the same legacy document.
export function buildLegacyMoney({ amount, date }) {
  const legacyAmountMinor = Math.round(Math.abs(amount || 0) * 100);
  return {
    account: { amountMinor: legacyAmountMinor, currency: "MXN" },
    reporting: {
      amountMinor: legacyAmountMinor,
      currency: "MXN",
      rate: "1",
      source: "legacy_migration",
      effectiveDate: date || new Date(),
      estimated: false,
    },
  };
}
