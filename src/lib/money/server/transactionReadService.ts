// Attaches the `displayMoney` DTO (native/merchant/primary/historicalReporting)
// to Transaction documents before they leave an API route, per section 9.2
// of the multi-currency plan. Works on both real Mongoose documents and
// `.lean()` plain objects - `.lean()` reads never run the model's
// pre-validate compatibility hook, so a document that predates money-aware
// writes has no `money` field in the stored BSON at all and needs the same
// legacy MXN-rate-1 fallback applied here at read time instead.

import { buildLegacyMoney } from "@/lib/money/transactionMoney";
import { convert } from "./fxRateService";

export interface DisplayNativeMoney {
  amountMinor: number;
  currency: string;
}

export interface DisplayMerchantMoney {
  amountMinor: number;
  currency: string;
}

export interface DisplayPrimaryMoney {
  amountMinor: number;
  currency: string;
  rate: string;
  source: string;
  effectiveDate: Date;
  estimated?: boolean;
  stale: boolean;
}

export interface DisplayHistoricalReportingMoney {
  amountMinor: number;
  currency: string;
  rate: string;
  source: string;
  effectiveDate: Date;
  estimated?: boolean;
  snapshot?: unknown;
}

export interface DisplayMoneyDTO {
  native: DisplayNativeMoney;
  merchant: DisplayMerchantMoney | null;
  primary: DisplayPrimaryMoney | null;
  historicalReporting: DisplayHistoricalReportingMoney | null;
}

export interface TransactionInputMoney {
  account?: {
    amountMinor: number;
    currency: string;
  };
  merchant?: {
    amountMinor: number;
    currency: string;
  } | null;
  reporting?: {
    amountMinor: number;
    currency: string;
    rate: string;
    source: string;
    effectiveDate: Date;
    estimated?: boolean;
    snapshot?: unknown;
  } | null;
}

export interface TransactionInput {
  money?: TransactionInputMoney | null;
  amount?: number | string | null;
  date?: Date | string | null;
}

export type WithDisplayMoney<T> = T & {
  displayMoney: DisplayMoneyDTO;
};

export async function attachDisplayMoney<T extends TransactionInput>(
  transaction: T,
  walletPrimaryCurrency: string
): Promise<WithDisplayMoney<T>> {
  const money: TransactionInputMoney = transaction.money?.account
    ? transaction.money
    : buildLegacyMoney({ amount: transaction.amount, date: transaction.date });

  const native: DisplayNativeMoney = {
    amountMinor: money.account.amountMinor,
    currency: money.account.currency,
  };
  const merchant: DisplayMerchantMoney | null = money.merchant || null;
  const reporting: DisplayHistoricalReportingMoney | null = money.reporting || null;

  let primary: DisplayPrimaryMoney | null;
  if (reporting && reporting.currency === walletPrimaryCurrency) {
    // Exact - the stored snapshot already targets the Wallet's current
    // primary currency, whatever its original source.
    primary = {
      amountMinor: reporting.amountMinor,
      currency: reporting.currency,
      rate: reporting.rate,
      source: reporting.source,
      effectiveDate: reporting.effectiveDate,
      estimated: reporting.estimated,
      stale: false,
    };
  } else {
    // The Wallet's primary currency has changed since this Transaction was
    // recorded (or written before the reporting currency was tracked) -
    // derive a fresh value from the historical ECB snapshot rather than
    // reinterpreting the exact stored pair as something it isn't.
    const quote = await convert({
      amountMinor: native.amountMinor,
      fromCurrency: native.currency,
      toCurrency: walletPrimaryCurrency,
      date: transaction.date,
    });
    primary = quote.available
      ? {
          amountMinor: quote.amountMinor,
          currency: walletPrimaryCurrency,
          rate: quote.rate,
          source: quote.source,
          effectiveDate: quote.effectiveDate,
          estimated: quote.estimated,
          stale: Boolean(quote.stale),
        }
      : null; // Never fake a rate - the UI omits the primary-currency value instead.
  }

  return {
    ...transaction,
    displayMoney: { native, merchant, primary, historicalReporting: reporting },
  };
}

export async function attachDisplayMoneyToList<T extends TransactionInput>(
  transactions: T[],
  walletPrimaryCurrency: string
): Promise<WithDisplayMoney<T>[]> {
  return Promise.all(transactions.map((t) => attachDisplayMoney(t, walletPrimaryCurrency)));
}
