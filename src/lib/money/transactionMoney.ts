// Pure mapping helpers for building a Transaction's `money` sub-object. No
// Mongoose, no network calls - the DB/FX-aware enrichment lives in
// ./server/transactionMoneyService.js.

import type { Types } from "mongoose";
import { majorToMinor } from "./currencies";
import { deriveEffectiveRate } from "./conversion";

export interface BuildAccountMoneyParams {
  amount?: number | string | null;
  currency: string;
}

export interface AccountMoneyResult {
  amountMinor: number;
  currency: string;
}

export interface BuildMerchantMoneyParams {
  amount?: number | string | null;
  currency?: string | null;
}

export interface MerchantMoneyResult {
  amountMinor: number;
  currency: string;
}

export interface AccountMoneyInput {
  amountMinor: number;
  currency: string;
}

export interface BuildManualReportingMoneyParams {
  amount?: number | string | null;
  currency: string;
  accountMoney: AccountMoneyInput;
  effectiveDate?: Date | null;
  source?: string;
}

export interface ReportingMoneyResult {
  amountMinor: number;
  currency: string;
  rate: string;
  source: string;
  effectiveDate: Date;
  estimated: boolean;
  snapshot?: Types.ObjectId | string | null;
}

export interface BuildSameCurrencyReportingMoneyParams {
  accountMoney: AccountMoneyInput;
  effectiveDate?: Date | null;
}

export interface BuildLegacyMoneyParams {
  amount?: number | string | null;
  date?: Date | string | null;
}

export interface LegacyMoneyResult {
  account: {
    amountMinor: number;
    currency: string;
  };
  reporting: {
    amountMinor: number;
    currency: string;
    rate: string;
    source: string;
    effectiveDate: Date;
    estimated: boolean;
  };
}

// The amount actually charged against the Account, in the Account's own
// native currency.
export function buildAccountMoney({ amount, currency }: BuildAccountMoneyParams): AccountMoneyResult {
  return { amountMinor: majorToMinor(Number(amount) || 0, currency), currency };
}

// Optional: what the merchant actually charged, when it differs from the
// Account's currency (e.g. a USD account charged in JPY abroad). Absent by
// default - most Transactions never set this.
export function buildMerchantMoney({ amount, currency }: BuildMerchantMoneyParams): MerchantMoneyResult | null {
  if (amount === undefined || amount === null || amount === "" || !currency) return null;
  return { amountMinor: majorToMinor(Number(amount), currency), currency };
}

// A manual/provider-asserted reporting value: the user (or a trusted import)
// states the exact Wallet-primary-currency equivalent, bypassing the ECB
// estimate. The effective rate is derived from the two amounts rather than
// looked up, so it reflects the rate actually used (e.g. a bank's real
// exchange rate), not the neutral reference rate.
export function buildManualReportingMoney({
  amount,
  currency,
  accountMoney,
  effectiveDate,
  source = "manual",
}: BuildManualReportingMoneyParams): ReportingMoneyResult {
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
export function buildSameCurrencyReportingMoney({
  accountMoney,
  effectiveDate,
}: BuildSameCurrencyReportingMoneyParams): ReportingMoneyResult {
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
export function buildLegacyMoney({ amount, date }: BuildLegacyMoneyParams): LegacyMoneyResult {
  const legacyAmountMinor = Math.round(Math.abs((amount || 0) as number) * 100);
  return {
    account: { amountMinor: legacyAmountMinor, currency: "MXN" },
    reporting: {
      amountMinor: legacyAmountMinor,
      currency: "MXN",
      rate: "1",
      source: "legacy_migration",
      effectiveDate: (date as Date) || new Date(),
      estimated: false,
    },
  };
}
